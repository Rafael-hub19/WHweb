<?php
// Iniciar sesión y destruir cualquier sesión anterior al cargar el login
// Esto previene que sesiones viejas permitan acceso sin credenciales
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
// Si viene con ?logout=1 o flag de logout, destruir sesión PHP activa
if (!empty($_GET['logout']) || !empty($_SESSION['_just_logged_out'])) {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 86400, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - Wooden House</title>
  <link rel="stylesheet" href="./assets/css/variables.css">
  <link rel="stylesheet" href="./assets/css/login.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

  <!-- Firebase SDK v9 compat -->
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
  <!-- Bootstrap 5 JS - Solo componentes interactivos (modales, dropdowns). CSS propio de Wooden House tiene prioridad -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous" defer></script>
</head>

<body>
  <div class="login-container">
    <div class="logo">
      <img src="/assets/img/logo-login.png" alt="Wooden House" style="height:140px;">
      <p>Panel Administrativo</p>
    </div>

    <div id="alertBox" class="alert" style="display:none;"></div>

    <form id="loginForm" autocomplete="on">
      <div class="form-group">
        <label for="email">Correo Electrónico</label>
        <input id="email" name="email" type="email" placeholder="correo@woodenhouse.com" required autocomplete="username">
      </div>

      <div class="form-group">
        <label for="password">Contraseña</label>
        <div class="password-wrap">
          <input id="password" name="password" type="password" placeholder="••••••••" required autocomplete="current-password">
          <button type="button" class="toggle-pass" id="togglePass" aria-label="Mostrar contraseña"><i class="fa-solid fa-eye"></i></button>
        </div>
      </div>

      <div class="remember-forgot">
        <label class="remember-me">
          <input type="checkbox" id="rememberMe">
          <span>Recordarme</span>
        </label>
        <a href="#" class="forgot-password" id="forgotLink">¿Olvidaste tu contraseña?</a>
      </div>

      <button type="submit" class="btn-login" id="btnLogin">Iniciar Sesión</button>
    </form>

    <div class="divider">Solo para personal autorizado</div>

    <div class="back-to-site">
      <a href="index.php">← Volver al sitio web</a>
    </div>
  </div>

  <!-- Firebase config -->
  <script src="./assets/js/firebase-config.js"></script>
  <script src="./assets/js/login.js"></script>
</body>
</html>