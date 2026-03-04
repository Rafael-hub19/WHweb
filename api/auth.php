<?php
/**
 * api/auth.php - Endpoints de autenticación
 * 
 * POST /api/auth.php?action=login      → login con Firebase token
 * POST /api/auth.php?action=logout     → cerrar sesión
 * GET  /api/auth.php?action=verificar  → verificar sesión activa
 * GET  /api/auth.php?action=perfil     → datos del usuario autenticado
 */

require_once __DIR__ . '/_helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($action) {

    // ── Login ─────────────────────────────────────────────────────
    case 'login':
        if ($method !== 'POST') jsonError('Método no permitido', 405);

        // Rate limit: máximo 10 intentos de login por minuto por IP
        checkRateLimit('auth_login', 10, 60);

        $body = getJsonBody();

        // ── ANTI-BOT: Honeypot ────────────────────────────────────
        if (!empty($body['_hp']) || !empty($body['website'])) {
            jsonError('Credenciales inválidas', 401);
        }

        $firebaseToken = trim($body['firebase_token'] ?? '');
        if (empty($firebaseToken)) {
            jsonError('firebase_token requerido', 422);
        }

        // Verificar token contra las claves públicas de Google
        $payload = verificarTokenFirebase($firebaseToken);
        if (!$payload) {
            // Log del intento fallido (sin el token completo, solo parte)
            error_log('Login fallido - token inválido desde IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
            jsonError('Token de Firebase inválido o expirado', 401);
        }

        $uid = $payload['uid'] ?? '';
        if (empty($uid)) {
            jsonError('Token sin identificador de usuario', 401);
        }

        // Buscar en MySQL - aquí es donde se valida que el usuario
        // esté registrado en el sistema y tenga rol asignado
        $usuario = obtenerUsuarioPorFirebaseUid($uid);
        if (!$usuario) {
            jsonError('Tu cuenta no tiene acceso al panel. Contacta al administrador.', 403);
        }

        // Crear sesión PHP segura
        _crearSesion($usuario);

        $redirect = $usuario['rol'] === 'administrador'
            ? '/admin'
            : '/empleado';

        jsonSuccess([
            'usuario' => [
                'id'     => $usuario['id'],
                'nombre' => $usuario['nombre_completo'],
                'correo' => $usuario['correo'],
                'rol'    => $usuario['rol'],
            ],
            'redirect' => $redirect,
            'csrf'     => getCsrfToken(),   // El frontend debe guardar esto
        ]);
        break;

    // ── Logout ────────────────────────────────────────────────────
    case 'logout':
        if ($method !== 'POST') jsonError('Método no permitido', 405);
        cerrarSesion();
        jsonSuccess(['mensaje' => 'Sesión cerrada']);
        break;

    // ── Verificar sesión ──────────────────────────────────────────
    case 'verificar':
        $usuario = sesionActiva();
        if ($usuario) {
            jsonSuccess(['autenticado' => true, 'usuario' => $usuario, 'csrf' => getCsrfToken()]);
        }

        // Intentar con Bearer token (para SPAs)
        $token = getBearerToken();
        if ($token) {
            $payload = verificarTokenFirebase($token);
            if ($payload) {
                $uid = $payload['uid'] ?? '';
                $u   = $uid ? obtenerUsuarioPorFirebaseUid($uid) : null;
                if ($u) {
                    _crearSesion($u);
                    jsonSuccess(['autenticado' => true, 'usuario' => $u, 'csrf' => getCsrfToken()]);
                }
            }
        }

        jsonSuccess(['autenticado' => false]);
        break;

    // ── Perfil ────────────────────────────────────────────────────
    case 'perfil':
        $usuario = requerirAutenticacion();
        jsonSuccess(['usuario' => $usuario]);
        break;

    default:
        jsonError('Acción no válida. Opciones: login, logout, verificar, perfil', 400);
}
