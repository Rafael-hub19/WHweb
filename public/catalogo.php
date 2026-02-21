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
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body>

  <!-- Header Navigation -->
  <div class="header-nav">
    <div class="logo">
    <img src="/assets/img/logo-header.png" alt="Wooden House" style="height: 48px;">
    </div>
    <button class="menu-toggle" id="menuToggle" aria-label="Abrir menú" aria-expanded="false"><i class="fa-solid fa-bars"></i></button>
    <div class="nav-links" id="navLinks">
      <a href="/inicio">Inicio</a>
      <a href="/solicitudes">Solicitudes</a>
      <a href="/carrito" class="cart-icon" id="cartIcon">
        <i class="fa-solid fa-cart-shopping"></i> <span class="cart-badge" id="cartCount">0</span>
      </a>
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
      <a href="mailto:contacto@woodenhouse.com" style="color:#8b7355;">contacto@woodenhouse.com</a> |
      <a href="tel:3317054017" style="color:#8b7355;">33 1705 4017</a>
    </p>
  </div>

  <script src="./assets/js/catalogo.js"></script>
</body>
</html>