<?php
// login.php — Redirige al inicio; AuthModal maneja el login en todas las páginas
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!empty($_GET['logout'])) {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 86400,
            $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

header('Location: /inicio');
exit;
