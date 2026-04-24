<?php
/**
 * login.php — Redirige al inicio.
 * El inicio de sesión (clientes y personal) ahora se hace desde el
 * AuthModal unificado disponible en todas las páginas del sitio.
 */
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Destruir sesión si viene de un logout explícito
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
