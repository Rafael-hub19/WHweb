<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Detalle del Producto - Wooden House</title>

  
  <link rel="stylesheet" href="./assets/css/detalle_producto.css">
</head>

<body>
  <div class="header-nav">
    <div class="logo">WOODEN HOUSE</div>

    <!-- Hamburguesa -->
    <button class="menu-toggle" id="menuToggle" aria-label="Abrir menú" aria-expanded="false">☰</button>

    <div class="nav-links" id="navLinks">
      <a href="index.html">Inicio</a>
      <a href="solicitudes.html">Solicitudes</a>
      <a href="catalogo.html">Catálogo</a>

      <a href="carrito.html" class="cart-icon" id="cartIcon" aria-label="Ver carrito">
        🛒
        <span class="cart-badge" id="cartCount">0</span>
      </a>
    </div>
  </div>

  <div class="container" id="page">
    <div class="product-detail" id="productDetail">
      <div class="gallery">
        <div class="main-image" id="mainImageBox">
          <span id="mainImageText">[Imagen Principal]</span>
          <img id="mainImage" alt="Imagen principal">
        </div>

        <div class="thumbnails" id="thumbs"></div>
      </div>

      <div class="product-info">
        <div>
          <div class="product-title" id="pNombre">Producto</div>
          <div class="rating" id="pRating">⭐⭐⭐⭐⭐ <span>(0 reseñas)</span></div>
        </div>

        <div class="price-large" id="pPrecio">$0</div>

        <div class="stock-indicator" id="pStock">
          <span style="font-size: 20px;">✅</span>
          <span><strong>En Stock</strong> - Fabricación bajo pedido</span>
        </div>

        <div class="description" id="pDesc"></div>

        <div class="features-box">
          <h3>Características Principales</h3>
          <div id="pFeatures"></div>
        </div>

        <div class="cart-section">
          <h3>Agregar al Carrito</h3>

          <div class="quantity-selector">
            <span style="color: #a0a0a0;">Cantidad:</span>
            <button class="quantity-btn" id="btnMinus" type="button">-</button>
            <span class="quantity-display" id="qty">1</span>
            <button class="quantity-btn" id="btnPlus" type="button">+</button>
          </div>

          <button class="btn-add-cart" id="btnAddCart" type="button">🛒 Agregar al Carrito</button>
          <div class="shipping-note">🚚 Envíos en ZMG | 5-7 días hábiles</div>
        </div>
      </div>
    </div>

    <div class="tabs">
      <div class="tabs-header">
        <button class="tab-btn active" type="button">📋 Especificaciones</button>
        <button class="tab-btn" type="button" disabled>💬 Reseñas</button>
      </div>

      <div class="tab-content">
        <h3>Especificaciones Técnicas</h3>
        <div id="specTable"></div>
      </div>
    </div>
  </div>

  
  <script src="./assets/js/detalle_producto.js"></script>
</body>
</html>
