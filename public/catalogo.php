<?php header('Content-Type: text/html; charset=utf-8'); ?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Catálogo - Wooden House</title>
  <link rel="stylesheet" href="./assets/css/variables.css">
  <link rel="stylesheet" href="./assets/css/styles.css">
  <link rel="stylesheet" href="./assets/css/catalogo.css">
  <link rel="stylesheet" href="./assets/css/modal-auth.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <!-- Bootstrap 5 JS - Solo componentes interactivos (modales, dropdowns). CSS propio de Wooden House tiene prioridad -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous" defer></script>
</head>
<body>

  <!-- Header Navigation -->
  <div class="header-nav">
    <div class="logo">
      <img src="/assets/img/logo-header.png" alt="Wooden House" style="height:80px;">
    </div>
    <div class="nav-links" id="navLinks">
      <a href="/inicio">Inicio</a>
      <a href="/solicitudes">Solicitudes</a>
      <a href="/carrito" class="cart-icon" id="cartIcon">
        <i class="fa-solid fa-cart-shopping"></i> <span class="cart-badge" id="cartCount">0</span>
      </a>
      <button class="btn-cuenta-nav" onclick="AuthModal.open()">
        <i class="fa-solid fa-user"></i> Mi cuenta
      </button>
    </div>
  </div>

  <div class="container">
    <h1 class="page-title">Catálogo de Muebles de Baño</h1>

    <div class="catalog-header">
      <div class="search-bar">
        <input type="text" id="buscar-producto" placeholder="Buscar por nombre, características...">
        <button id="btn-buscar" class="btn-buscar"><i class="fa-solid fa-magnifying-glass"></i> Buscar</button>
      </div>

      <div class="filters-row">
        <div id="categorias-filtro" class="filters">
          <button class="filter-btn active" onclick="filtrarPorCategoria(null, this)">Todos</button>
        </div>
        <select id="ordenar-por" class="select-ordenar">
          <option value="recientes">Más recientes</option>
          <option value="precio-asc">Precio: menor a mayor</option>
          <option value="precio-desc">Precio: mayor a menor</option>
          <option value="nombre">Nombre A-Z</option>
        </select>
      </div>
    </div>

    <div class="catalogo-meta">
      <span id="productos-count">Cargando productos...</span>
    </div>

    <!-- Product Grid (dinámico) -->
    <div class="product-grid" id="productos-grid">
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Cargando productos...</p>
      </div>
    </div>

    <!-- Paginación -->
    <div id="paginacion-container" class="paginacion"></div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>&copy; 2026 Wooden House. Todos los derechos reservados.</p>
    <p style="margin-top:10px;">Muebles de madera a medida en Guadalajara, Jalisco</p>
    <p style="margin-top:10px; font-size:14px;">
      <a href="mailto:ventas@muebleswh.com" style="color:#8b7355;">ventas@muebleswh.com</a> |
      <a href="tel:3317054017" style="color:#8b7355;">33 1705 4017</a>
    </p>
  </div>

  <!-- Barra de navegación fija móvil -->
  <nav class="mobile-bottom-nav" aria-label="Navegación rápida">
    <div class="mobile-bottom-nav-inner">
      <a href="/inicio" class="mbn-item"><i class="fa-solid fa-house"></i><span>Inicio</span></a>
      <a href="/catalogo" class="mbn-item mbn-item--active"><i class="fa-solid fa-store"></i><span>Catálogo</span></a>
      <a href="/solicitudes" class="mbn-item"><i class="fa-solid fa-file-invoice"></i><span>Cotización</span></a>
      <a href="/carrito" class="mbn-item"><i class="fa-solid fa-cart-shopping"></i><span>Carrito</span></a>
      <button class="mbn-item" onclick="AuthModal.open()"><i class="fa-solid fa-user"></i><span>Mi cuenta</span></button>
    </div>
  </nav>

  <script src="./assets/js/firebase-config.js"></script>
  <script src="./assets/js/modal-auth.js?v=7"></script>
  <script src="./assets/js/catalogo.js"></script>
</body>
</html>