<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solicitudes - Wooden House</title>
  
  <link rel="stylesheet" href="./assets/css/solicitudes.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <!-- Bootstrap 5 - Framework CSS responsivo -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc4s9bIOgUxi8T/jzmGl3t0IAu4/eXnidvIoqX7l4=" crossorigin="anonymous" defer></script>
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
        <div class="form-section">
          <h3 class="section-title"><i class="fa-solid fa-phone"></i> Información de Contacto</h3>
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Nombre Completo <span class="required">*</span></label>
              <input type="text" name="nombre" placeholder="Ej: Juan Pérez López" required>
            </div>
            <div class="form-group">
              <label>Teléfono <span class="required">*</span></label>
              <input type="tel" name="telefono" placeholder="33 1234 5678" required>
              <div class="help-text">Usaremos este número para contactarte</div>
            </div>
            <div class="form-group">
              <label>Correo Electrónico <span class="required">*</span></label>
              <input type="email" name="email" placeholder="correo@ejemplo.com" required>
              <div class="help-text">Te enviaremos la cotización detallada aquí</div>
            </div>
            <div class="form-group full-width">
              <label>Ciudad o Zona</label>
              <input type="text" name="ciudad" placeholder="Ej: Guadalajara, Zapopan, Tlaquepaque">
              <div class="help-text">Opcional: Nos ayuda a calcular costos de envío/instalación</div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title"><i class="fa-solid fa-ruler-combined"></i> Especificaciones del Proyecto</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Tipo de Mueble <span class="required">*</span></label>
              <select name="tipoMueble" required>
                <option value="">Selecciona una opción</option>
                <option value="cocina">Mueble Milano</option>
                <option value="closet">Mueble Venecia </option>
                <option value="bano">Mueble Toscana</option>
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
                <option value="no">No tengo medidas aún</option>
              </select>
            </div>

            <div class="form-group full-width" id="medidasField">
              <label>Medidas del Mueble</label>
              <input type="text" name="medidas" placeholder="Ej: Ancho 2.5m x Alto 2.4m x Profundidad 0.6m">
              <div class="help-text">Proporciona las medidas disponibles (alto, ancho, profundidad)</div>
            </div>

            <div class="form-group full-width">
              <label>Descripción y Características Deseadas <span class="required">*</span></label>
              <textarea name="descripcion" placeholder="Describe tu proyecto: estilo, colores, materiales, funcionalidades (cajones, puertas, iluminación), etc." required></textarea>
              <div class="help-text">Entre más detalles proporciones, más precisa será la cotización</div>
            </div>

            <div class="form-group">
              <label>Presupuesto Estimado</label>
              <select name="presupuesto">
                <option value="">Selecciona un rango</option>
                <option value="5-10">$5,000 - $10,000</option>
                <option value="10-20">$10,000 - $20,000</option>
                <option value="20-30">$20,000 - $30,000</option>
                <option value="30-50">$30,000 - $50,000</option>
                <option value="50+">Más de $50,000</option>
                <option value="flexible">Presupuesto flexible</option>
              </select>
              <div class="help-text">Opcional: Nos ayuda a orientar mejor la propuesta</div>
            </div>

            <div class="form-group">
              <label>Tiempo estimado de necesidad</label>
              <select name="urgencia">
                <option value="">Selecciona un plazo</option>
                <option value="urgente">Menos de 1 mes</option>
                <option value="1-2meses">1-2 meses</option>
                <option value="2-3meses">2-3 meses</option>
                <option value="flexible">Sin prisa, evaluando opciones</option>
              </select>
            </div>

            <div class="form-group">
              <label>¿Necesitas instalación?</label>
              <select name="instalacion">
                <option value="">Selecciona una opción</option>
                <option value="si">Sí, incluir instalación</option>
                <option value="no">No, solo el mueble</option>
                <option value="nose">No estoy seguro</option>
              </select>
            </div>

            <div class="form-group">
              <label>¿Cómo nos conociste?</label>
              <select name="referencia">
                <option value="">Selecciona una opción</option>
                <option value="facebook">Facebook / Instagram</option>
                <option value="google">Búsqueda en Google</option>
                <option value="referido">Recomendación de conocido</option>
                <option value="sitio">Navegando el sitio web</option>
                <option value="otro">Otro</option>
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
        <div class="form-section">
          <h3 class="section-title"><i class="fa-solid fa-user"></i> Información de Contacto</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Nombre Completo <span class="required">*</span></label>
              <input type="text" name="nombre" placeholder="Ej: Juan Pérez" required>
            </div>
            <div class="form-group">
              <label>Teléfono <span class="required">*</span></label>
              <input type="tel" name="telefono" placeholder="33 1234 5678" required>
            </div>
            <div class="form-group full-width">
              <label>Correo Electrónico <span class="required">*</span></label>
              <input type="email" name="email" placeholder="correo@ejemplo.com" required>
            </div>

            <div class="form-group full-width">
              <label>Dirección Completa <span class="required">*</span></label>
              <input type="text" name="direccion" placeholder="Calle, Número, Colonia, Ciudad">
              <div class="help-text">Solo para visitas a domicilio</div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title"><i class="fa-solid fa-calendar-days"></i> Fecha y Hora</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Fecha Preferida <span class="required">*</span></label>
              <input type="date" name="fecha" id="fechaCita" required>
            </div>

            <div class="form-group full-width">
              <label>Horarios Disponibles <span class="required">*</span></label>
              <div class="time-slots" id="timeSlots">
                <div class="time-slot" onclick="selectTime(this)">9:00 AM</div>
                <div class="time-slot" onclick="selectTime(this)">10:00 AM</div>
                <div class="time-slot unavailable">11:00 AM</div>
                <div class="time-slot" onclick="selectTime(this)">12:00 PM</div>
                <div class="time-slot" onclick="selectTime(this)">2:00 PM</div>
                <div class="time-slot" onclick="selectTime(this)">3:00 PM</div>
                <div class="time-slot" onclick="selectTime(this)">4:00 PM</div>
                <div class="time-slot" onclick="selectTime(this)">5:00 PM</div>
              </div>
              <div class="help-text">Los horarios en gris no están disponibles</div>
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
    </div>

    <!-- TAB 3: SEGUIMIENTO -->
    <div id="tab-seguimiento" class="tab-content">
      <div class="tracking-section">
        <h2 style="color:#8b7355; font-size:28px; margin-bottom:15px;"><i class="fa-solid fa-magnifying-glass"></i> Consultar Estado de Solicitud</h2>
        <p style="color:#a0a0a0; margin-bottom:30px;">
          Ingresa tu número de pedido o referencia para ver el estado actual de tu solicitud
        </p>

        <div class="tracking-input-group">
          <input type="text" id="trackingNumber" placeholder="Ej: WH-2025-001234" maxlength="20">
          <button class="btn-track" onclick="trackOrder()">Buscar</button>
        </div>

        <div class="info-box">
          <h4><i class="fa-solid fa-thumbtack"></i> ¿Dónde encuentro mi número de seguimiento?</h4>
          <p>Tu número fue enviado a tu correo electrónico al realizar tu solicitud. Formato: WH-YYYY-NNNNNN</p>
        </div>

        <div id="trackingResult" class="tracking-result">
          <div class="form-section">
            <h3 class="section-title"><i class="fa-solid fa-box"></i> Información de la Solicitud</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>Número de Pedido</label>
                <input type="text" id="resultOrderNumber" readonly value="WH-2025-001234">
              </div>
              <div class="form-group">
                <label>Fecha de Solicitud</label>
                <input type="text" id="resultOrderDate" readonly value="25 de Enero, 2025">
              </div>
              <div class="form-group">
                <label>Tipo</label>
                <input type="text" id="resultOrderType" readonly value="Cotización">
              </div>
              <div class="form-group">
                <label>Estado</label>
                <input type="text" id="resultOrderStatus" readonly value="En Proceso" style="color:#27ae60; font-weight:bold;">
              </div>
              <div class="form-group full-width">
                <label>Descripción</label>
                <textarea id="resultDescription" readonly rows="2">Cocina integral de madera con acabado natural, 3.5m lineales</textarea>
              </div>
            </div>

            <div class="status-timeline">
              <h4 style="color:#8b7355; margin-bottom:20px; font-size:20px;"><i class="fa-solid fa-chart-bar"></i> Línea de Tiempo</h4>

              <div class="status-item completed">
                <div class="status-icon"><i class="fa-solid fa-check"></i></div>
                <div class="status-content">
                  <h4>Solicitud Recibida</h4>
                  <p>Tu solicitud ha sido registrada exitosamente</p>
                  <div class="status-date">25 Ene, 2025 - 10:30 AM</div>
                </div>
              </div>

              <div class="status-item completed">
                <div class="status-icon"><i class="fa-solid fa-check"></i></div>
                <div class="status-content">
                  <h4>Revisión Inicial</h4>
                  <p>Nuestro equipo ha revisado los detalles</p>
                  <div class="status-date">25 Ene, 2025 - 2:15 PM</div>
                </div>
              </div>

              <div class="status-item current">
                <div class="status-icon"><i class="fa-solid fa-hourglass-half"></i></div>
                <div class="status-content">
                  <h4>Preparando Propuesta</h4>
                  <p>Elaborando cotización y renders</p>
                  <div class="status-date">En progreso...</div>
                </div>
              </div>

              <div class="status-item">
                <div class="status-icon"><i class="fa-solid fa-envelope"></i></div>
                <div class="status-content">
                  <h4>Envío de Cotización</h4>
                  <p>Recibirás la propuesta por correo</p>
                  <div class="status-date">Pendiente</div>
                </div>
              </div>

              <div class="status-item">
                <div class="status-icon"><i class="fa-solid fa-sparkles"></i></div>
                <div class="status-content">
                  <h4>Listo para Producción</h4>
                  <p>Una vez aprobado, comenzamos fabricación</p>
                  <div class="status-date">Pendiente</div>
                </div>
              </div>
            </div>

            <div class="info-box success">
              <h4><i class="fa-solid fa-comments"></i> ¿Necesitas ayuda?</h4>
              <p>
                Contáctanos por correo a
                <strong>contacto@woodenhouse.com</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>&copy; 2025 Wooden House. Todos los derechos reservados.</p>
    <p style="margin-top: 10px;">Muebles de madera a medida en Guadalajara, Jalisco</p>
    <p style="margin-top: 10px; font-size: 14px;">
      <a href="mailto:contacto@juan432.jpml.com" style="color: #8b7355;">contacto@juan432.jpml.com</a> | 
      <a href="tel:3317054017" style="color: #8b7355;">33 1705 4017</a>
    </p>
  </div>

  <script src="./assets/js/solicitudes.js"></script>
</body>
</html>