<?php
require_once dirname(__DIR__) . '/includes/config.php';
?><!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proceso de Pago - Wooden House</title>

  <!-- Credenciales inyectadas desde .env (nunca hardcodeadas) -->
  <script>
    window.STRIPE_PK  = "<?= htmlspecialchars(STRIPE_PUBLISHABLE_KEY, ENT_QUOTES, 'UTF-8') ?>";
    window.PAYPAL_ENV = "<?= htmlspecialchars(PAYPAL_MODE, ENT_QUOTES, 'UTF-8') ?>";
  </script>

  <!-- Stripe JS SDK v3 (oficial) -->
  <script src="https://js.stripe.com/v3/"></script>

  <!-- PayPal JS SDK — Client ID inyectado desde .env -->
  <script
    src="https://www.paypal.com/sdk/js?client-id=<?= urlencode(PAYPAL_CLIENT_ID) ?>&currency=MXN&locale=es_MX&components=buttons&intent=capture"
    id="paypalScript">
  </script>

  <link rel="stylesheet" href="./assets/css/pago.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body>

  <div class="header-nav">
    <div class="logo">WOODEN HOUSE</div>
  </div>

  <!-- Progress Steps -->
  <div class="steps-indicator">
    <div class="step completed">
      <div class="step-number"><i class="fa-solid fa-check"></i></div><span>Carrito</span>
    </div>
    <div class="step active">
      <div class="step-number">2</div><span>Pago</span>
    </div>
    <div class="step">
      <div class="step-number">3</div><span>Confirmación</span>
    </div>
  </div>

  <div class="container">
    <div class="page-header">
      <h1 class="page-title"><i class="fa-solid fa-credit-card"></i> Proceso de Pago</h1>
      <p class="page-subtitle">Completa tu compra de forma segura y protegida</p>
    </div>

    <div class="payment-container">
      <!-- Columna izquierda: métodos de pago -->
      <div class="payment-section">

        <div class="notice" id="noticeBox" style="display:none;">
          <strong><i class="fa-solid fa-triangle-exclamation"></i> No hay datos del carrito.</strong><br>
          <a href="/catalogo">Regresa al catálogo</a> para seleccionar productos.
        </div>

        <h2 class="section-title"><span><i class="fa-solid fa-credit-card"></i></span> Método de Pago</h2>

        <div class="payment-methods">
          <!-- STRIPE -->
          <div class="payment-option selected" data-method="card" id="opt-card">
            <div class="payment-icon"><i class="fa-solid fa-credit-card"></i></div>
            <h3>Tarjeta de Crédito/Débito</h3>
            <p>Pago seguro con Stripe · Visa, Mastercard, Amex</p>
          </div>

          <!-- PAYPAL -->
          <div class="payment-option" data-method="paypal" id="opt-paypal">
            <div class="payment-icon"><i class="fab fa-paypal"></i></div>
            <h3>PayPal</h3>
            <p>Paga con tu cuenta PayPal o tarjeta sin registrarte</p>
          </div>
        </div>

        <!-- STRIPE FORM -->
        <div id="stripe-section" class="payment-form-section">
          <h3>Datos de Tarjeta</h3>
          <div class="stripe-card-container">
            <label class="stripe-label">Número de tarjeta, vencimiento y CVV</label>
            <div id="card-element" class="stripe-element">
              <!-- Stripe Elements se monta aquí -->
            </div>
            <div id="card-errors" class="card-error" role="alert"></div>
          </div>
          <button id="btnStripe" class="btn-pay btn-stripe" disabled>
            <span id="stripeSpinner" class="spinner" style="display:none;"></span>
            <i class="fa-solid fa-lock"></i> Pagar con Tarjeta
          </button>
        </div>

        <!-- PAYPAL FORM -->
        <div id="paypal-section" class="payment-form-section" style="display:none;">
          <h3>Pago con PayPal</h3>
          <div id="paypal-button-container"></div>
        </div>

        <div class="security-badges">
          <span><i class="fa-solid fa-lock"></i> SSL 256-bit</span>
          <span><i class="fa-solid fa-circle-check"></i> PCI DSS</span>
          <span><i class="fa-solid fa-shield-halved"></i> Datos protegidos</span>
        </div>
      </div>

      <!-- Columna derecha: resumen del pedido -->
      <div class="order-summary">
        <h2 class="section-title"><i class="fa-solid fa-clipboard-list"></i> Resumen del Pedido</h2>
        <div id="cart-items-summary"></div>
        <div class="totals">
          <div class="total-row"><span>Subtotal</span><span id="subtotalDisplay">$0</span></div>
          <div class="total-row" id="shippingLine"><span>Envío</span><span id="shippingDisplay">$0</span></div>
          <div class="total-row" id="installationLine" style="display:none;"><span>Instalación</span><span id="installationDisplay">$0</span></div>
          <div class="total-row" id="discountLine" style="display:none;"><span>Descuento</span><span id="discountDisplay">-$0</span></div>
          <div class="total-row total-final"><span><strong>TOTAL</strong></span><span id="totalDisplay"><strong>$0</strong></span></div>
        </div>
      </div>
    </div>
  </div>

  <script src="./assets/js/pago.js"></script>
</body>
</html>