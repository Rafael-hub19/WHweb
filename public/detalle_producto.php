<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title id="pageTitle">Producto - Wooden House</title>
  <link rel="stylesheet" href="/assets/css/variables.css">
  <link rel="stylesheet" href="/assets/css/styles.css">
  <link rel="stylesheet" href="/assets/css/detalle_producto.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body>

  <div class="header-nav">
    <div class="logo">
      <img src="/assets/img/logo-header.png" alt="Wooden House" style="height:60px;">
    </div>
    <button class="menu-toggle" id="menuToggle" aria-label="Abrir menú" aria-expanded="false"><i class="fa-solid fa-bars"></i></button>
    <div class="nav-links" id="navLinks">
      <a href="/inicio">Inicio</a>
      <a href="/solicitudes">Solicitudes</a>
      <a href="/catalogo">Catálogo</a>
      <a href="/carrito" class="cart-icon" id="cartIcon">
        <i class="fa-solid fa-cart-shopping"></i> <span class="cart-badge" id="cartCount">0</span>
      </a>
    </div>
  </div>

  <!-- Breadcrumb -->
  <div class="breadcrumb-bar">
    <div class="container">
      <a href="/inicio">Inicio</a> › <a href="/catalogo">Catálogo</a> › <span id="breadcrumbNombre">Cargando...</span>
    </div>
  </div>

  <!-- Estado de carga -->
  <div id="loadingState" class="container" style="text-align:center; padding:60px 20px;">
    <div class="spinner-large"></div>
    <p>Cargando producto...</p>
  </div>

  <!-- Error -->
  <div id="errorState" class="container" style="display:none; text-align:center; padding:60px 20px;">
    <p><i class="fa-solid fa-triangle-exclamation"></i> Producto no encontrado o no disponible.</p>
    <a href="/catalogo" class="btn-primary" style="display:inline-block;margin-top:15px;">← Volver al catálogo</a>
  </div>

  <!-- Producto -->
  <div id="page" class="container" style="display:none;">
    <div class="product-detail" id="productDetail">
      <!-- Galería -->
      <div class="gallery">
        <div class="main-image" id="mainImageBox">
          <div class="placeholder-img" id="imgPlaceholder"><i class="fa-solid fa-tree"></i></div>
          <img id="mainImage" alt="Imagen principal" style="display:none;" onerror="this.style.display='none';document.getElementById('imgPlaceholder').style.display='flex'">
        </div>
        <div class="thumbnails" id="thumbs"></div>
      </div>

      <!-- Info del producto -->
      <div class="product-info">
        <div class="product-header">
          <span id="pCategoria" class="product-category-badge"></span>
          <div class="product-title" id="pNombre"></div>
          <span id="pEtiqueta" class="product-etiqueta" style="display:none;"></span>
        </div>

        <div class="price-large" id="pPrecio">$0</div>

        <div class="stock-indicator" id="pStockIndicador">
          <span id="pStockIcon"><i class="fa-solid fa-circle-check"></i></span>
          <span id="pStockText"><strong>Disponible</strong> - Fabricación bajo pedido</span>
        </div>

        <div class="description" id="pDesc"></div>

        <!-- Especificaciones rápidas -->
        <div class="features-box" id="featuresBox" style="display:none;">
          <h3>Características Principales</h3>
          <div id="pFeatures"></div>
        </div>

        <!-- Agregar al carrito -->
        <div class="cart-section">
          <div class="quantity-selector">
            <span>Cantidad:</span>
            <button class="quantity-btn" id="btnMinus" type="button" onclick="cambiarCantidad(-1)">−</button>
            <input type="number" class="quantity-input" id="cantidad" value="1" min="1" max="99">
            <button class="quantity-btn" id="btnPlus" type="button" onclick="cambiarCantidad(1)">+</button>
          </div>
          <button class="btn-add-cart" id="btnAddCart" type="button"><i class="fa-solid fa-cart-shopping"></i> Agregar al Carrito</button>
          <a href="/carrito" class="btn-ver-carrito" style="display:none;" id="btnVerCarrito">Ver Carrito →</a>
          <div class="shipping-note"><i class="fa-solid fa-truck"></i> Envíos en ZMG · Instalación profesional disponible</div>
        </div>
      </div>
    </div>

    <!-- Tabs: Especificaciones / más info -->
    <div class="tabs">
      <div class="tabs-header">
        <button class="tab-button active" data-tab="tab-especificaciones" type="button"><i class="fa-solid fa-clipboard-list"></i> Especificaciones</button>
        <button class="tab-button" data-tab="tab-delivery" type="button"><i class="fa-solid fa-truck"></i> Entrega e Instalación</button>
      </div>

      <div id="tab-especificaciones" class="tab-pane active">
        <h3>Especificaciones Técnicas</h3>
        <div id="specTable" class="spec-table"></div>
      </div>

      <div id="tab-delivery" class="tab-pane">
        <h3>Información de Entrega</h3>
        <ul>
          <li><strong>Tiempo de fabricación:</strong> 10-15 días hábiles</li>
          <li><strong>Entrega a domicilio:</strong> Zona Metropolitana de Guadalajara (costo adicional)</li>
          <li><strong>Recogida en sucursal:</strong> Sin costo adicional</li>
          <li><strong>Instalación profesional:</strong> Disponible con costo adicional</li>
          <li><strong>Garantía:</strong> 1 año en defectos de fabricación</li>
        </ul>
        <p>¿Tienes dudas? <a href="/solicitudes">Solicita una cotización personalizada</a></p>
      </div>
    </div>

    <!-- Más productos -->
    <div class="related-section">
      <h2>Más Productos</h2>
      <div class="related-grid" id="relacionados"></div>
    </div>
  </div>

  <script src="/assets/js/detalle_producto.js"></script>
</body>
</html>