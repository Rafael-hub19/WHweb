<?php
/**
 * auth.php - Autenticación Firebase + MySQL
 * 
 * Flujo:
 * 1. Frontend hace signIn con Firebase → recibe ID Token (JWT firmado por Google)
 * 2. Backend verifica el JWT contra las CLAVES PÚBLICAS de Google (no las nuestras)
 * 3. Si es válido, busca el firebase_uid en usuarios_personal de MySQL
 * 4. Si existe y está activo → crea sesión PHP
 */

if (!defined('WH_LOADED')) {
    require_once __DIR__ . '/config.php';
    require_once __DIR__ . '/db.php';
    require_once __DIR__ . '/functions.php';
}

// ── Extraer Bearer token del header ──────────────────────────────
function getBearerToken(): ?string {
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/^Bearer\s+(.+)$/i', trim($auth), $m)) {
        $token = trim($m[1]);
        // Validación básica de formato JWT (3 partes base64url)
        if (substr_count($token, '.') === 2 && strlen($token) < 4096) {
            return $token;
        }
    }
    return null;
}

/**
 * Obtener las claves públicas de Firebase desde Google
 * Firebase firma sus ID tokens con RSA-256 usando rotación de claves
 * Esta función las obtiene con caché de archivo para no llamar Google en cada request
 */
function obtenerClavesPublicasFirebase(): array {
    $cacheFile = sys_get_temp_dir() . '/wh_firebase_keys.json';
    $cacheAge  = file_exists($cacheFile) ? (time() - filemtime($cacheFile)) : PHP_INT_MAX;

    // Renovar si tiene más de 1 hora (las claves rotan cada 6h aprox)
    if ($cacheAge < 3600 && file_exists($cacheFile)) {
        $cached = json_decode(file_get_contents($cacheFile), true);
        if (!empty($cached)) return $cached;
    }

    $url = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
    $ch  = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $res  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code !== 200 || !$res) return [];

    $keys = json_decode($res, true) ?: [];
    file_put_contents($cacheFile, json_encode($keys), LOCK_EX);
    return $keys;
}

/**
 * Verificar un ID Token de Firebase con las claves públicas de Google
 * Esta es la forma CORRECTA y SEGURA (sin SDK)
 * 
 * @return array|null  El payload decodificado, o null si es inválido
 */
function verificarTokenFirebase(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    // Decodificar header y payload
    $headerRaw  = base64_decode(strtr($parts[0], '-_', '+/') . '==');
    $payloadRaw = base64_decode(strtr($parts[1], '-_', '+/') . '==');
    $sigRaw     = base64_decode(strtr($parts[2], '-_', '+/') . '==');

    if (!$headerRaw || !$payloadRaw || !$sigRaw) return null;

    $header  = json_decode($headerRaw,  true);
    $payload = json_decode($payloadRaw, true);

    if (!is_array($header) || !is_array($payload)) return null;

    // ── Validaciones básicas del payload ─────────────────────────
    $now = time();

    // Expiración
    if (($payload['exp'] ?? 0) < $now) return null;

    // No usar antes de (issued at) - tolerancia de 60 segundos por desfase de reloj
    if (($payload['iat'] ?? 0) > $now + 60) return null;

    // Audience debe ser el Project ID de Firebase
    $aud = $payload['aud'] ?? '';
    if ($aud !== FIREBASE_PROJECT_ID) return null;

    // Issuer debe ser el endpoint de Firebase
    $iss = $payload['iss'] ?? '';
    if ($iss !== 'https://securetoken.google.com/' . FIREBASE_PROJECT_ID) return null;

    // Subject (= firebase uid) debe existir y no estar vacío
    $sub = $payload['sub'] ?? '';
    if (empty($sub)) return null;

    // ── Verificar firma RSA con clave pública de Google ──────────
    $kid  = $header['kid'] ?? '';     // Key ID: qué clave usó Firebase para firmar
    $keys = obtenerClavesPublicasFirebase();

    if (empty($kid) || !isset($keys[$kid])) {
        // Clave no encontrada (puede ser rotación reciente) - fallback a tokeninfo
        return verificarTokenFirebaseViaAPI($token);
    }

    $cert    = $keys[$kid];
    $pubKey  = openssl_pkey_get_public($cert);
    if (!$pubKey) return null;

    $data      = $parts[0] . '.' . $parts[1];
    $resultado = openssl_verify($data, $sigRaw, $pubKey, OPENSSL_ALGO_SHA256);

    if ($resultado !== 1) return null;  // Firma inválida

    $payload['uid'] = $sub;
    return $payload;
}

/**
 * Fallback: verificar via Google tokeninfo endpoint
 * Más lento pero útil cuando las claves están rotando
 */
function verificarTokenFirebaseViaAPI(string $token): ?array {
    $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($token);
    $ch  = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $res  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code !== 200 || !$res) return null;

    $payload = json_decode($res, true);
    if (!is_array($payload)) return null;

    if (($payload['aud'] ?? '') !== FIREBASE_PROJECT_ID) return null;
    if (($payload['exp'] ?? 0) < time()) return null;

    $sub = $payload['sub'] ?? '';
    if (empty($sub)) return null;

    $payload['uid'] = $sub;
    return $payload;
}

// ── Consulta MySQL ────────────────────────────────────────────────

/**
 * Buscar usuario por firebase_uid en MySQL
 * Solo devuelve usuarios activos con los campos necesarios (sin exponer todo)
 */
function obtenerUsuarioPorFirebaseUid(string $uid): ?array {
    // Validar que el UID tenga formato Firebase válido (alfanumérico, 28 chars)
    if (!preg_match('/^[a-zA-Z0-9]{20,128}$/', $uid)) return null;

    return dbRow(
        "SELECT id, firebase_uid, nombre_completo, correo, rol, activo
         FROM usuarios_personal
         WHERE firebase_uid = ? AND activo = 1
         LIMIT 1",
        [$uid]
    );
}

// ── Middlewares de autenticación ──────────────────────────────────

function requerirAutenticacion(): array {
    // 1. ¿Hay sesión PHP válida?
    if (!empty($_SESSION['usuario_id']) && !empty($_SESSION['_csrf'])) {
        $usuario = dbRow(
            "SELECT id, firebase_uid, nombre_completo, correo, rol
             FROM usuarios_personal
             WHERE id = ? AND activo = 1 LIMIT 1",
            [$_SESSION['usuario_id']]
        );
        if ($usuario) return $usuario;
        // Sesión corrupta o usuario desactivado
        _destruirSesion();
    }

    // 2. ¿Hay Bearer token (llamadas desde JS)?
    $token = getBearerToken();
    if (!$token) {
        jsonError('No autenticado', 401);
    }

    $payload = verificarTokenFirebase($token);
    if (!$payload) {
        jsonError('Token inválido o expirado', 401);
    }

    $uid     = $payload['uid'] ?? '';
    $usuario = $uid ? obtenerUsuarioPorFirebaseUid($uid) : null;

    if (!$usuario) {
        jsonError('Usuario no autorizado en el sistema', 403);
    }

    // Crear sesión
    _crearSesion($usuario);
    return $usuario;
}

function requerirAdmin(): array {
    $usuario = requerirAutenticacion();
    if ($usuario['rol'] !== 'administrador') {
        jsonError('Acceso denegado: se requiere rol administrador', 403);
    }
    return $usuario;
}

function requerirEmpleado(): array {
    $usuario = requerirAutenticacion();
    if (!in_array($usuario['rol'], ['administrador', 'empleado'], true)) {
        jsonError('Acceso denegado', 403);
    }
    return $usuario;
}

function sesionActiva(): ?array {
    if (!empty($_SESSION['usuario_id'])) {
        return dbRow(
            "SELECT id, nombre_completo, correo, rol
             FROM usuarios_personal
             WHERE id = ? AND activo = 1 LIMIT 1",
            [$_SESSION['usuario_id']]
        );
    }
    return null;
}

// ── Helpers de sesión ─────────────────────────────────────────────

function _crearSesion(array $usuario): void {
    session_regenerate_id(true);   // Previene session fixation
    $_SESSION['usuario_id']  = $usuario['id'];
    $_SESSION['usuario_rol'] = $usuario['rol'];
    $_SESSION['_csrf']       = bin2hex(random_bytes(32));
    $_SESSION['_login_time'] = time();
}

function _destruirSesion(): void {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 86400,
            $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

function cerrarSesion(): void {
    _destruirSesion();
}

// ── Generar y validar token CSRF ──────────────────────────────────

function getCsrfToken(): string {
    if (empty($_SESSION['_csrf'])) {
        $_SESSION['_csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['_csrf'];
}

function verificarCsrfToken(string $token): bool {
    $esperado = $_SESSION['_csrf'] ?? '';
    // hash_equals previene timing attacks
    return !empty($esperado) && hash_equals($esperado, $token);
}
