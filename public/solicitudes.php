<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solicitudes - Wooden House</title>
  
  <link rel="stylesheet" href="./assets/css/variables.css">
  <link rel="stylesheet" href="./assets/css/solicitudes.css">
  <link rel="stylesheet" href="./assets/css/modal-auth.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <!-- Bootstrap 5 JS - Solo componentes interactivos (modales, dropdowns). CSS propio de Wooden House tiene prioridad -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous" defer></script>
</head>
<body>

  <!-- ========== HEADER (UNIFICADO) ========== -->
  <div class="header-nav">
    <div class="logo">
      <img src="/assets/img/logo-header.png" alt="Wooden House" style="height:80px;">
    </div>

    <button class="menu-toggle" id="menuToggle" aria-label="Abrir menú" aria-expanded="false"><i class="fa-solid fa-bars"></i></button>

    <div class="nav-links" id="navLinks">
      <a href="/inicio">Inicio</a>
      <a href="/catalogo">Catálogo</a>
      <a href="/carrito" class="cart-icon" aria-label="Ver carrito">
        <i class="fa-solid fa-cart-shopping"></i> <span class="cart-badge" id="cartCount">0</span>
      </a>
      <button class="btn-cuenta-nav" onclick="AuthModal.open()">
        <i class="fa-solid fa-user"></i> Mi cuenta
      </button>
    </div>
  </div>

  <div class="container">
    <h1 class="page-title"><i class="fa-solid fa-clipboard-list"></i> Centro de Solicitudes</h1>
    <p class="page-subtitle">
      Solicita asesoría y cotización personalizada o agenda una visita técnica para medición de tu proyecto
    </p>

    <!-- Alert Messages -->
    <div id="alertMessage" class="alert"></div>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button class="tab-btn active" data-tab="cotizacion">
        <span class="tab-icon"><i class="fa-solid fa-tag"></i></span>
        <span>Cotización</span>
      </button>
      <button class="tab-btn" data-tab="cita">
        <span class="tab-icon"><i class="fa-solid fa-calendar-days"></i></span>
        <span>Agendar Cita</span>
      </button>
      <button class="tab-btn" data-tab="seguimiento">
        <span class="tab-icon"><i class="fa-solid fa-magnifying-glass"></i></span>
        <span>Seguimiento</span>
      </button>
    </div>

    <!-- TAB 1: COTIZACIÓN -->
    <div id="tab-cotizacion" class="tab-content active">
      <div class="info-box">
        <h4><i class="fa-solid fa-bullseye"></i> ¿Qué incluye nuestra asesoría de cotización?</h4>
        <p>Si ya tienes las medidas y una idea clara de lo que necesitas, podemos ayudarte con:</p>
        <ul>
          <li>Asesoría profesional sobre materiales y acabados ideales</li>
          <li>Recomendaciones de diseño y optimización de espacios</li>
          <li>Orientación sobre estilos que se adapten a tu proyecto</li>
          <li>Cotización detallada basada en tus especificaciones</li>
          <li>Renders 3D conceptuales de tu proyecto (opcional)</li>
          <li>Propuesta de presupuesto sin compromiso</li>
        </ul>
      </div>

      <form id="formCotizacion" autocomplete="off">
        <!-- ANTI-BOT: Campo trampa oculto - los bots llenarán esto, los humanos no -->
        <div style="position:absolute;left:-9999px;top:-9999px;opacity:0;height:0;overflow:hidden;" aria-hidden="true">
          <label>No llenar este campo <input type="text" name="website" tabindex="-1" autocomplete="off"></label>
        </div>
        <div class="form-section">
          <h3 class="section-title"><i class="fa-solid fa-phone"></i> Información de Contacto</h3>
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Nombre Completo <span class="required">*</span></label>
              <input type="text" name="nombre" placeholder="Ej: Juan Pérez López" required maxlength="100" autocomplete="name" spellcheck="false">
            </div>
            <div class="form-group">
              <label>Teléfono <span class="required">*</span></label>
              <input type="tel" name="telefono" placeholder="33 1234 5678" autocomplete="tel" required maxlength="20" >
              <div class="help-text">Usaremos este número para contactarte</div>
            </div>
            <div class="form-group">
              <label>Correo Electrónico <span class="required">*</span></label>
              <input type="email" name="email" placeholder="correo@ejemplo.com" autocomplete="email" required maxlength="150">
              <div class="help-text">Te enviaremos la cotización detallada aquí</div>
            </div>
            <div class="form-group">
              <label>Confirmar Correo Electrónico <span class="required">*</span></label>
              <input type="email" name="emailConfirm" placeholder="correo@ejemplo.com" required maxlength="150" autocomplete="off" autocorrect="off" spellcheck="false">
              <div class="help-text">Escribe tu correo nuevamente para confirmarlo</div>
            </div>
            <div class="form-group full-width">
              <label>Ciudad o Zona</label>
              <input type="text" name="ciudad" placeholder="Ej: Guadalajara, Zapopan, Tlaquepaque" maxlength="100" autocomplete="address-level2">
              <div class="help-text">Opcional: Nos ayuda a calcular costos de envío/instalación</div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title"><i class="fa-solid fa-ruler-combined"></i> Especificaciones del Proyecto</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Modelo de Mueble <span class="required">*</span></label>
              <select name="modeloMueble" required>
                <option value="">Selecciona una opción</option>
                <option value="baño">Modelo Sevilla</option>
                <option value="baño">Modelo Roma</option>
                <option value="baño">Modelo Edinburgo</option>
                <option value="baño">Modelo Singapur</option>
                <option value="baño">Modelo Sydney</option>
                <option value="baño">Modelo Palermo</option>
                <option value="baño">Modelo Budapest</option>
                <option value="baño">Modelo Quebec</option>
                <option value="baño">Modelo Toronto</option>
                <option value="baño">Modelo Amsterdam</option>
                <option value="sala">Mueble Oslo</option>
                <option value="recamara">Muebles Paris</option>
                <option value="estudio">Mueble Tokio</option>
                <option value="personalizado">Diseño Personalizado</option>
              </select>
            </div>

            <div class="form-group">
              <label>¿Tienes las medidas?</label>
              <select name="tieneMedidas" id="tieneMedidas">
                <option value="si">Sí, tengo las medidas</option>
                <option value="aproximadas">Tengo medidas aproximadas</option>
              </select>
            </div>

            <div class="form-group full-width" id="medidasField">
              <label>Medidas del Mueble</label>
              <input type="text" name="medidas" placeholder="Ej: Ancho 2.5m x Alto 2.4m x Profundidad 0.6m" maxlength="300">
              <div class="help-text">Proporciona las medidas disponibles (alto, ancho, profundidad)</div>
            </div>

            <div class="form-group full-width">
              <label>Descripción y Características Deseadas <span class="required">*</span></label>
              <textarea name="descripcion" placeholder="Describe tu proyecto: estilo, colores, materiales, funcionalidades (cajones, puertas, iluminación), etc." required maxlength="1000"></textarea>
              <div class="help-text">Entre más detalles proporciones, más precisa será la cotización</div>
            </div>

            <div class="form-group">
              <label>Presupuesto Estimado</label>
              <select name="presupuesto">
                <option value="">Selecciona un rango</option>
                <option value="5-20">$5,000 - $20,000</option>
                <option value="20-50">$20,000 - $50,000</option>
                <option value="50+">Más de $50,000</option>
              </select>
              <div class="help-text">Opcional: Nos ayuda a orientar mejor la propuesta</div>
            </div>

            <div class="form-group">
              <label>Tiempo estimado de necesidad</label>
              <select name="urgencia">
                <option value="">Selecciona un plazo</option>
                <option value="urgente">Menos de 1 mes</option>
                <option value="1-3meses">1 a 3 meses</option>
                <option value="flexible">Sin prisa, evaluando opciones</option>
              </select>
            </div>

            <div class="form-group">
              <label>¿Necesitas instalación?</label>
              <select name="instalacion">
                <option value="">Selecciona una opción</option>
                <option value="si">Sí, requiero instalación</option>
                <option value="no">No requiero instalación</option>
              </select>
            </div>
          </div>
        </div>

        <div class="info-box success">
          <h4><i class="fa-solid fa-circle-check"></i> Asesoría personalizada en 24 horas</h4>
          <p>Revisaremos tu solicitud y nos pondremos en contacto contigo dentro de las próximas 24 horas con una cotización personalizada.</p>
        </div>

        <button type="submit" class="btn-submit"><i class="fa-solid fa-clipboard-list"></i> Solicitar Asesoría y Cotización</button>
      </form>
      <div class="tab-nav-bottom">
        <a href="/inicio" class="btn-tab-nav btn-tab-back"><i class="fa-solid fa-arrow-left"></i> Volver al inicio</a>
        <button type="button" class="btn-tab-nav btn-tab-next" onclick="document.querySelector('.tab-btn[data-tab=cita]').click()">Agendar Cita <i class="fa-solid fa-arrow-right"></i></button>
      </div>
    </div>

    <!-- TAB 2: AGENDAR CITA -->
    <div id="tab-cita" class="tab-content">
      <div class="info-box">
        <h4><i class="fa-solid fa-building-construction"></i> Visita Técnica Profesional</h4>
        <p>Agenda una visita de nuestros expertos a tu domicilio para:</p>
        <ul>
          <li>Toma de medidas exactas y profesionales en el lugar</li>
          <li>Análisis del espacio y estudio de viabilidad</li>
          <li>Evaluación de instalaciones (luz, contactos, estructuras)</li>
          <li>Recomendaciones personalizadas de diseño y materiales</li>
          <li>Asesoría técnica sobre la mejor solución para tu espacio</li>
        </ul>
        <p style="margin-top: 15px;"><strong>Nota:</strong> Después de la visita, recibirás una cotización detallada con especificaciones y renders.</p>
      </div>

      <form id="formCita" autocomplete="off">
        <!-- ANTI-BOT: Campo trampa oculto - los bots llenarán esto, los humanos no -->
        <div style="position:absolute;left:-9999px;top:-9999px;opacity:0;height:0;overflow:hidden;" aria-hidden="true">
          <label>No llenar este campo <input type="text" name="website" tabindex="-1" autocomplete="off"></label>
        </div>
        <div class="form-section">
          <h3 class="section-title"><i class="fa-solid fa-user"></i> Información de Contacto</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Nombre Completo <span class="required">*</span></label>
              <input type="text" name="nombre" placeholder="Ej: Juan Pérez" required maxlength="100" autocomplete="name" spellcheck="false">
            </div>
            <div class="form-group">
              <label>Teléfono <span class="required">*</span></label>
              <input type="tel" name="telefono" placeholder="33 1234 5678" autocomplete="tel" required maxlength="20" >
            </div>
            <div class="form-group">
              <label>Correo Electrónico <span class="required">*</span></label>
              <input type="email" name="email" placeholder="correo@ejemplo.com" autocomplete="email" required maxlength="150">
            </div>
            <div class="form-group">
              <label>Confirmar Correo Electrónico <span class="required">*</span></label>
              <input type="email" name="emailConfirm" placeholder="correo@ejemplo.com" required maxlength="150" autocomplete="off" autocorrect="off" spellcheck="false">
              <div class="help-text">Escribe tu correo nuevamente para confirmarlo</div>
            </div>

            <div class="form-group full-width">
              <label>Dirección Completa <span class="required">*</span></label>
              <input type="text" name="direccion" placeholder="Calle, Número, Colonia, Ciudad" maxlength="200" autocomplete="street-address">
              <div class="help-text">Solo para visitas a domicilio</div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title"><i class="fa-solid fa-calendar-days"></i> Fecha y Hora</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Fecha Preferida <span class="required">*</span></label>
              <input type="date" name="fecha" id="fechaCita" required onchange="cargarSlotsDisponibles(this.value)">
            </div>

            <div class="form-group full-width">
              <label>Horarios Disponibles <span class="required">*</span></label>
              <div class="time-slots" id="timeSlots">
                <div style="color:var(--muted,#888);font-size:14px;padding:10px;grid-column:1/-1;">
                  Selecciona una fecha para ver horarios disponibles
                </div>
              </div>
              <div class="help-text">Los horarios en gris ya están ocupados para esa fecha</div>
            </div>
          </div>
        </div>

        <div class="info-box success">
          <h4><i class="fa-solid fa-circle-check"></i> Confirmación y Preparación</h4>
          <p>Recibirás confirmación inmediata por correo electrónico.</p>
        </div>

        <div class="info-box warning">
          <h4><i class="fa-solid fa-clipboard-list"></i> Después de la Visita</h4>
          <p>En 2-3 días hábiles recibirás: cotización, renders 3D, especificaciones, y timeline.</p>
        </div>

        <button type="submit" class="btn-submit"><i class="fa-solid fa-calendar-days"></i> Agendar Visita Técnica</button>
      </form>
      <div class="tab-nav-bottom">
        <button type="button" class="btn-tab-nav btn-tab-back" onclick="document.querySelector('.tab-btn[data-tab=cotizacion]').click()"><i class="fa-solid fa-arrow-left"></i> Cotización</button>
        <button type="button" class="btn-tab-nav btn-tab-next" onclick="document.querySelector('.tab-btn[data-tab=seguimiento]').click()">Seguimiento <i class="fa-solid fa-arrow-right"></i></button>
      </div>
    </div>

    <!-- TAB 3: SEGUIMIENTO -->
    <div id="tab-seguimiento" class="tab-content">
      <div class="tracking-section">

        <!-- Encabezado -->
        <div class="tracking-header">
          <div class="tracking-icon-circle">
            <i class="fa-solid fa-magnifying-glass"></i>
          </div>
          <h2 class="tracking-title">Consultar Estado de Solicitud</h2>
          <p class="tracking-subtitle">
            Ingresa el número de tu pedido, cotización o cita para ver su estado en tiempo real
          </p>
        </div>

        <!-- Input de búsqueda -->
        <div class="tracking-search-box">
          <div class="tracking-input-wrap">
            <i class="fa-solid fa-hashtag tracking-search-icon"></i>
            <input type="text" id="trackingNumber"
              placeholder="WH-2026-000001 · CIT-2026-000001 · COT-2026-000001"
              maxlength="25" autocomplete="off" autocapitalize="characters">
          </div>
          <button class="btn-track" onclick="trackOrder()">
            <i class="fa-solid fa-search"></i> Buscar
          </button>
        </div>

        <!-- Tipos de número aceptados -->
        <div class="tracking-types-row">
          <div class="tracking-type-chip">
            <i class="fa-solid fa-box" style="color:#8b7355;"></i>
            <span><strong>WH-</strong> Pedido</span>
          </div>
          <div class="tracking-type-chip">
            <i class="fa-solid fa-calendar-days" style="color:#5b9aad;"></i>
            <span><strong>CIT-</strong> Cita</span>
          </div>
          <div class="tracking-type-chip">
            <i class="fa-solid fa-briefcase" style="color:#6aad7a;"></i>
            <span><strong>COT-</strong> Cotización</span>
          </div>
        </div>

        <!-- Info box -->
        <div class="tracking-hint-box">
          <i class="fa-solid fa-envelope-open-text" style="color:#8b7355;font-size:20px;flex-shrink:0;"></i>
          <div>
            <strong style="color:#e0e0e0;">¿Dónde encuentro mi número?</strong>
            <p style="color:#a0a0a0;margin:4px 0 0;font-size:13px;">
              Te lo enviamos automáticamente por correo al registrar tu pedido, cita o cotización.
            </p>
          </div>
        </div>

        <!-- Resultado dinámico — lo llena trackOrder() desde el JS -->
        <div id="trackingResult"></div>

      </div>
      <div class="tab-nav-bottom">
        <button type="button" class="btn-tab-nav btn-tab-back" onclick="document.querySelector('.tab-btn[data-tab=cita]').click()"><i class="fa-solid fa-arrow-left"></i> Agendar Cita</button>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>&copy; 2026 Wooden House. Todos los derechos reservados.</p>
    <p style="margin-top: 10px;">Muebles de madera a medida en Guadalajara, Jalisco</p>
    <p style="margin-top: 10px; font-size: 14px;">
      <a href="mailto:ventas@muebleswh.com" style="color: #8b7355;">ventas@muebleswh.com</a> |
      <a href="tel:3317054017" style="color: #8b7355;">33 1705 4017</a>
    </p>
  </div>

  <script src="./assets/js/firebase-config.js"></script>
  <script src="./assets/js/modal-auth.js?v=4"></script>
  <script src="./assets/js/solicitudes.js"></script>
</body>
</html>