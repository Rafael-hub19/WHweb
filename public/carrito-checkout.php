<?php header('Content-Type: text/html; charset=utf-8'); ?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Carrito – Wooden House</title>
    <link rel="stylesheet" href="./assets/css/variables.css">
    <link rel="stylesheet" href="./assets/css/carrito.css">
    <link rel="stylesheet" href="./assets/css/modal-auth.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <!-- Bootstrap 5 JS - Solo componentes interactivos (modales, dropdowns). CSS propio de Wooden House tiene prioridad -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous" defer></script>
</head>
<body>

<!-- ── Header ───────────────────────────────────────────────────── -->
<div class="header-nav">
    <div class="logo">
      <img src="/assets/img/logo-header.png" alt="Wooden House" style="height:80px;">
    </div>
    <button class="menu-toggle" id="menuToggle" aria-label="Menú" aria-expanded="false"><i class="fa-solid fa-bars"></i></button>
    <div class="nav-links" id="navLinks">
        <a href="/inicio">Inicio</a>
        <a href="/solicitudes">Solicitudes</a>
        <a href="/catalogo">Catálogo</a>
        <button class="btn-cuenta-nav" onclick="AuthModal.open()">
            <i class="fa-solid fa-user"></i> Mi cuenta
        </button>
    </div>
</div>

<!-- ── Pasos ─────────────────────────────────────────────────────── -->
<div class="steps-indicator">
    <div class="step active"><div class="step-number">1</div><span>Carrito</span></div>
    <div class="step"><div class="step-number">2</div><span>Pago</span></div>
    <div class="step"><div class="step-number">3</div><span>Confirmación</span></div>
</div>

<!-- ── Main ──────────────────────────────────────────────────────── -->
<div class="container">
    <div class="page-header">
        <h1 class="page-title"><i class="fa-solid fa-cart-shopping"></i> Tu Carrito de Compras</h1>
        <p class="page-subtitle">Revisa tu pedido, elige opciones de entrega y selecciona tu fecha</p>
    </div>

    <div class="cart-container">
        <!-- ── Columna izquierda ───────────────────────────────── -->
        <div class="cart-items">

            <!-- Productos -->
            <div class="section-card">
                <h3 class="section-title"><span class="section-icon"><i class="fa-solid fa-bath"></i></span> Productos en tu carrito</h3>
                <div id="carritoItems">
                    <div class="fecha-loading">Cargando carrito</div>
                </div>
            </div>

            <!-- Tipo de entrega -->
            <div class="section-card">
                <h3 class="section-title"><span class="section-icon"><i class="fa-solid fa-truck"></i></span> Tipo de entrega</h3>
                <div class="delivery-options">
                    <div class="option-card selected" id="optionRecoger" onclick="seleccionarEntrega('recoger')">
                        <input type="radio" name="tipoEntrega" value="recoger" checked>
                        <div class="option-content">
                            <div class="option-header">
                                <span class="option-title">Recoger en sucursal</span>
                                <span class="option-price">GRATIS</span>
                            </div>
                            <div class="option-description">
                                <i class="fa-solid fa-location-dot"></i> Av. Chapultepec #1234, Col. Americana, Guadalajara
                            </div>
                        </div>
                    </div>

                    <div class="option-card" id="optionEnvio" onclick="seleccionarEntrega('envio')">
                        <input type="radio" name="tipoEntrega" value="envio">
                        <div class="option-content">
                            <div class="option-header">
                                <span class="option-title">Envío a domicilio</span>
                                <span class="option-price" id="precioEnvioLabel">$500</span>
                            </div>
                            <div class="option-description">
                                Entregamos en tu domicilio en Guadalajara y área metropolitana.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Instalación -->
            <div class="section-card">
                <h3 class="section-title"><span class="section-icon"><i class="fa-solid fa-wrench"></i></span> Servicios adicionales</h3>
                <div class="delivery-options">

                    <div class="option-card selected" id="optionSinInstalacion" onclick="seleccionarInstalacion(false)">
                        <input type="radio" name="tipoInstalacion" value="sin_instalacion" checked>
                        <div class="option-content">
                            <div class="option-header">
                                <span class="option-title">Sin instalación</span>
                                <span class="option-price">GRATIS</span>
                            </div>
                            <div class="option-description">
                                Solo entrega del mueble, tú te encargas de la instalación.
                            </div>
                        </div>
                    </div>

                    <div class="option-card" id="optionConInstalacion" onclick="seleccionarInstalacion(true)">
                        <input type="radio" name="tipoInstalacion" value="con_instalacion">
                        <div class="option-content">
                            <div class="option-header">
                                <span class="option-title">Instalación profesional</span>
                                <span class="option-price" id="precioInstalacionLabel">+ $1,500</span>
                            </div>
                            <div class="option-description">
                                Instalación por expertos, incluye conexión de lavabo y ajustes finales.
                                <span id="notaInstalacion" style="display:block;margin-top:6px;color:#8b7355;font-size:12px;font-weight:600;">
                                    <i class="fa-solid fa-circle-info"></i> $1,500 por mueble
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <!-- ── SELECTOR DE FECHA ──────────────────────────── -->
            <div class="section-card">
                <h3 class="section-title"><span class="section-icon"><i class="fa-solid fa-calendar-days"></i></span> Fecha de entrega</h3>

                <div class="date-info">
                    <strong><i class="fa-solid fa-clock"></i> Fabricación bajo pedido — entrega estimada en 2 días hábiles</strong>
                    <p>
                        Selecciona el día que prefieres recibir tu mueble.
                        La disponibilidad se actualiza en tiempo real según la carga del taller.
                    </p>
                </div>

                <!-- Leyenda -->
                <div class="disponibilidad-indicator">
                    <span class="dot dot-ok"></span><span>Lugares disponibles</span>
                    <span class="dot dot-medio" style="margin-left:12px"></span><span>Casi lleno</span>
                    <span class="dot dot-lleno" style="margin-left:12px"></span><span>Sin lugares</span>
                </div>

                <!-- Grid de días (se llena desde la API) -->
                <div id="semanasGrid" class="semanas-grid">
                    <div class="fecha-loading">Consultando disponibilidad en tiempo real</div>
                </div>

                <input type="hidden" id="semanaSeleccionada" value="">
                <input type="hidden" id="fechaSugerida"      value="">

                <div class="info-box">
                    <p>
                        <i class="fa-solid fa-lightbulb"></i> <strong>Nota:</strong> La fecha seleccionada es tu día de entrega estimado.
                        Recibirás confirmación por correo electrónico.
                    </p>
                </div>
            </div>

            <!-- Datos de contacto -->
            <div class="section-card">
                <h3 class="section-title"><span class="section-icon"><i class="fa-solid fa-user"></i></span> Datos de contacto</h3>
                <form id="formularioCliente" novalidate>
                  <!-- Anti-bot honeypot: invisible para humanos, bots lo llenan -->
                  <div style="position:absolute;left:-9999px;top:-9999px;opacity:0;height:0;overflow:hidden;" aria-hidden="true">
                    <label>No llenar este campo <input type="text" name="website" tabindex="-1" autocomplete="off"></label>
                    <label>URL <input type="text" name="url" tabindex="-1" autocomplete="off"></label>
                    <input type="text" name="_hp" tabindex="-1" autocomplete="off">
                  </div>
                    <div class="form-group">
                        <label>Nombre completo <span class="required">*</span></label>
                        <input type="text" id="clienteNombre" placeholder="Juan Pérez López" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Teléfono de contacto <span class="required">*</span></label>
                            <input type="tel" id="clienteTelefono" placeholder="33 1234 5678" required>
                        </div>
                        <div class="form-group">
                            <label>Correo electrónico <span class="required">*</span></label>
                            <input type="email" id="clienteCorreo" placeholder="correo@ejemplo.com" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Confirmar correo electrónico <span class="required">*</span></label>
                            <input type="email" id="clienteCorreoConfirm" placeholder="correo@ejemplo.com" required autocomplete="off" autocorrect="off" spellcheck="false">
                            <div class="help-text">Escribe tu correo nuevamente para confirmarlo</div>
                        </div>
                    </div>

                    <!-- Dirección (solo si es envío) -->
                    <div id="seccionDireccion">
                        <div class="form-group">
                            <label>Dirección de entrega <span class="required">*</span></label>
                            <input type="text" id="clienteDireccion" placeholder="Calle, Número, Colonia" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Ciudad <span class="required">*</span></label>
                                <input type="text" id="clienteCiudad" placeholder="Guadalajara" required>
                            </div>
                            <div class="form-group">
                                <label>Código Postal <span class="required">*</span></label>
                                <input type="text" id="clienteCP" placeholder="45000" required maxlength="5">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Referencias adicionales</label>
                            <textarea id="clienteNotas" rows="3"
                                placeholder="Entre calles X y Y, portón negro…"></textarea>
                            <div class="help-text">Ayúdanos a encontrar tu domicilio</div>
                        </div>
                    </div>
                </form>
            </div>
        </div><!-- /cart-items -->

        <!-- ── Columna derecha: resumen ───────────────────────── -->
        <div class="cart-summary">
            <h3 class="summary-title"><i class="fa-solid fa-clipboard-list"></i> Resumen del pedido</h3>

            <div id="resumenItems">
                <!-- Se llena dinámicamente -->
            </div>

            <div class="summary-item" id="lineaEnvio">
                <span>Envío a domicilio</span>
                <span id="totalEnvio">$500</span>
            </div>
            <div class="summary-item" id="lineaInstalacion" style="display:none">
                <span>Instalación profesional <span id="labelInstalacionQty" style="color:#a0a0a0;font-size:12px;"></span></span>
                <span id="costoInstalacionTotal">$1,500</span>
            </div>
            <div class="summary-total">
                <span>Total a pagar</span>
                <span id="totalFinal">$0</span>
            </div>

            <!-- Semana elegida en el resumen -->
            <div class="fecha-resumen-box" id="fechaResumenBox">
                <strong><i class="fa-solid fa-calendar-days"></i> Semana de entrega elegida</strong>
                <span id="fechaResumenTexto">—</span>
            </div>

            <button class="btn-checkout" id="btnCheckout" onclick="procederAlPago()">
                Proceder al pago <i class="fa-solid fa-credit-card"></i>
            </button>

            <button class="btn-vaciar-carrito" id="btnVaciarCarrito" onclick="confirmarVaciarCarrito()">
                <i class="fa-solid fa-trash"></i> Vaciar carrito
            </button>

            <p class="secure-note">
                <i class="fa-solid fa-lock"></i> Pago 100% seguro · Stripe &amp; PayPal<br>
                <i class="fa-solid fa-box"></i> Garantía de satisfacción incluida
            </p>
        </div>
    </div>
</div>

<!-- Footer -->
<div class="footer">
    <p>© 2026 Wooden House · Guadalajara, Jalisco</p>
    <p style="margin-top:8px;font-size:14px;">
        <a href="mailto:ventas@muebleswh.com" style="color:#8b7355">ventas@muebleswh.com</a> |
        <a href="tel:3317054017" style="color:#8b7355">33 1705 4017</a>
    </p>
</div>

<script src="./assets/js/utils.js"></script>
<script src="./assets/js/firebase-config.js"></script>
<script src="./assets/js/modal-auth.js?v=3"></script>
<script src="./assets/js/carrito.js"></script>
<script src="./assets/js/checkout.js"></script>
</body>
</html>