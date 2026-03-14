<?php header('Content-Type: text/html; charset=utf-8'); ?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mi Cuenta – Wooden House</title>
  <link rel="stylesheet" href="./assets/css/variables.css">
  <link rel="stylesheet" href="./assets/css/styles.css">
  <link rel="stylesheet" href="./assets/css/modal-auth.css">
  <link rel="stylesheet" href="./assets/css/mi-cuenta.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous" defer></script>
</head>
<body>

<!-- ── Header ──────────────────────────────────────────────────── -->
<div class="header-nav">
  <div class="logo">
    <img src="/assets/img/logo-header.png" alt="Wooden House" style="height:80px;">
  </div>
  <button class="menu-toggle" id="menuToggle" aria-label="Menú" aria-expanded="false">
    <i class="fa-solid fa-bars"></i>
  </button>
  <div class="nav-links" id="navLinks">
    <a href="/inicio">Inicio</a>
    <a href="/catalogo">Catálogo</a>
    <a href="/solicitudes">Solicitudes</a>
    <a href="/carrito" class="cart-icon" aria-label="Ver carrito">
      <i class="fa-solid fa-cart-shopping"></i>
    </a>
    <button class="btn-cuenta-nav autenticado" onclick="AuthModal.open()">
      <i class="fa-solid fa-user-circle"></i> Mi cuenta
    </button>
  </div>
</div>

<!-- ── Main ────────────────────────────────────────────────────── -->
<div class="mc-container" id="mcContainer">

  <!-- Estado: cargando / no autenticado -->
  <div id="mcLoading" class="mc-loading">
    <div class="mc-spinner"></div>
    <p>Verificando sesión…</p>
  </div>

  <!-- Estado: no autenticado -->
  <div id="mcNoAuth" style="display:none;" class="mc-noauth">
    <div class="mc-noauth-icon"><i class="fa-solid fa-user-lock"></i></div>
    <h2>Inicia sesión para ver tu cuenta</h2>
    <p>Accede a tu historial de pedidos, cotizaciones y datos personales.</p>
    <button class="btn-mc-primary" onclick="AuthModal.open(() => location.reload())">
      <i class="fa-solid fa-right-to-bracket"></i> Iniciar sesión
    </button>
  </div>

  <!-- Contenido: autenticado -->
  <div id="mcContent" style="display:none;">

    <!-- Encabezado del perfil -->
    <div class="mc-profile-header">
      <div class="mc-avatar" id="mcAvatar">U</div>
      <div class="mc-profile-info">
        <h1 class="mc-nombre" id="mcNombre">—</h1>
        <p class="mc-correo" id="mcCorreo">—</p>
        <span class="mc-badge">Cliente registrado</span>
      </div>
    </div>

    <!-- Tabs de contenido -->
    <div class="mc-tabs">
      <button class="mc-tab active" data-tab="pedidos" onclick="mcShowTab('pedidos')">
        <i class="fa-solid fa-box"></i> Mis pedidos
      </button>
      <button class="mc-tab" data-tab="perfil" onclick="mcShowTab('perfil')">
        <i class="fa-solid fa-user-pen"></i> Mi perfil
      </button>
    </div>

    <!-- Tab: Pedidos -->
    <div id="mcTabPedidos" class="mc-tab-content active">
      <div class="mc-section-title">
        <i class="fa-solid fa-box"></i> Historial de pedidos
      </div>
      <div id="mcPedidosList">
        <div class="mc-loading-inline"><div class="mc-spinner-sm"></div> Cargando pedidos…</div>
      </div>
    </div>

    <!-- Tab: Perfil -->
    <div id="mcTabPerfil" class="mc-tab-content" style="display:none;">
      <div class="mc-section-title">
        <i class="fa-solid fa-user-pen"></i> Editar perfil
      </div>
      <div id="mcPerfilAlert" class="mc-alert"></div>
      <form id="mcPerfilForm" class="mc-form" onsubmit="mcGuardarPerfil(event)">
        <div class="mc-form-row">
          <div class="mc-form-group">
            <label>Nombre completo <span class="mc-req">*</span></label>
            <input type="text" id="pfNombre" name="nombre" required minlength="2" maxlength="120">
          </div>
          <div class="mc-form-group">
            <label>Teléfono</label>
            <input type="tel" id="pfTelefono" name="telefono" maxlength="20">
          </div>
        </div>
        <div class="mc-form-group">
          <label>Dirección</label>
          <input type="text" id="pfDireccion" name="direccion" maxlength="255" placeholder="Calle, número, colonia">
        </div>
        <div class="mc-form-row">
          <div class="mc-form-group">
            <label>Ciudad</label>
            <input type="text" id="pfCiudad" name="ciudad" maxlength="100">
          </div>
          <div class="mc-form-group">
            <label>Código postal</label>
            <input type="text" id="pfCP" name="cp" maxlength="10">
          </div>
        </div>
        <div class="mc-form-actions">
          <button type="submit" class="btn-mc-primary" id="btnGuardarPerfil">
            <i class="fa-solid fa-floppy-disk"></i> Guardar cambios
          </button>
        </div>
      </form>
    </div>

  </div><!-- /mcContent -->
</div>

<!-- Footer -->
<div class="footer">
  <p>© 2026 Wooden House · Guadalajara, Jalisco</p>
  <p style="margin-top:8px;font-size:14px;">
    <a href="mailto:ventas@muebleswh.com" style="color:var(--color-primary)">ventas@muebleswh.com</a> |
    <a href="tel:3317054017" style="color:var(--color-primary)">33 1705 4017</a>
  </p>
</div>

<script src="./assets/js/firebase-config.js"></script>
<script src="./assets/js/modal-auth.js?v=3"></script>
<script src="./assets/js/mi-cuenta.js"></script>
</body>
</html>
