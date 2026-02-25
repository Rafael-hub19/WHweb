<?php
/**
 * _helpers.php - Bootstrap de la API + Headers de seguridad
 * Se incluye al inicio de cada archivo en /api/
 */

// Marcar que esto es una petición de API para que config.php
// NO envíe el header Content-Type: text/html (las APIs lo envían ellas mismas)
if (!defined('WH_API_REQUEST')) {
    define('WH_API_REQUEST', true);
}

if (!defined('WH_LOADED')) {
    require_once dirname(__DIR__) . '/includes/config.php';
}
require_once dirname(__DIR__) . '/includes/db.php';
require_once dirname(__DIR__) . '/includes/functions.php';
require_once dirname(__DIR__) . '/includes/auth.php';
require_once dirname(__DIR__) . '/includes/notifications.php';

// ── CORS ──────────────────────────────────────────────────────────
// Solo permitir peticiones desde tu propio dominio
// En desarrollo puedes agregar http://localhost:8080 etc.
$allowedOrigins = array_filter(array_map('trim', explode(',',
    env('CORS_ALLOWED_ORIGINS', APP_URL)
)));

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Vary: Origin');
} elseif (empty($origin)) {
    // Petición sin origen (ej. curl, Postman) - solo en desarrollo
    if (APP_DEBUG) {
        header('Access-Control-Allow-Origin: *');
    }
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
header('Access-Control-Max-Age: 86400');

// Preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Content-Type ──────────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');

// ── Headers de seguridad HTTP ─────────────────────────────────────
// Evita que el navegador ejecute contenido de forma inesperada
header('X-Content-Type-Options: nosniff');

// Evita que tu sitio sea embebido en iframes de otros dominios (clickjacking)
header('X-Frame-Options: SAMEORIGIN');

// Habilita protección XSS del navegador
header('X-XSS-Protection: 1; mode=block');

// Evita exponer información del servidor
header_remove('X-Powered-By');
header_remove('Server');

// Solo HTTPS (activar cuando tengas SSL):
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');

// No cachear respuestas de la API (datos sensibles)
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');

// ── Rate limiting simple por IP ───────────────────────────────────
// Previene fuerza bruta en endpoints de autenticación
function checkRateLimit(string $key, int $maxRequests = 60, int $windowSec = 60): void {
    $ip      = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $file    = sys_get_temp_dir() . '/wh_rl_' . md5($key . $ip) . '.json';
    $now     = time();
    $data    = file_exists($file) ? json_decode(file_get_contents($file), true) : [];

    // Limpiar timestamps fuera de la ventana
    $data = array_filter($data ?? [], fn($t) => ($now - $t) < $windowSec);

    if (count($data) >= $maxRequests) {
        http_response_code(429);
        echo json_encode(['success' => false, 'error' => 'Demasiadas solicitudes. Intenta en un momento.']);
        exit;
    }

    $data[] = $now;
    file_put_contents($file, json_encode(array_values($data)), LOCK_EX);
}
