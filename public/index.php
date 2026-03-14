<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wooden House - Muebles de Madera a Medida en Guadalajara</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="./assets/css/index.css">
  <link rel="stylesheet" href="./assets/css/modal-auth.css">
  <!-- Bootstrap 5 JS - Solo componentes interactivos (modales, dropdowns). CSS propio de Wooden House tiene prioridad -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous" defer></script>
</head>

<body>

  <!-- Header Navigation -->
  <div class="header-nav">
    <div class="logo">
      <a href="/" aria-label="Wooden House – inicio">
        <img src="/assets/img/logo-header.png" alt="Wooden House" style="height:80px;">
      </a>
    </div>

    <button class="menu-toggle" id="menuToggle" aria-label="Abrir menú" aria-expanded="false">
      <i class="fa-solid fa-bars" id="menuIcon"></i>
    </button>

    <nav class="nav-links" id="navLinks" aria-label="Navegación principal">

      <!-- Inicio con submenú desplegable -->
      <div class="nav-item nav-dropdown" id="navDropdown">
        <button class="nav-dropdown-btn" id="dropdownBtn"
                aria-haspopup="true" aria-expanded="false"
                aria-controls="dropdownMenu">
          Inicio <i class="fa-solid fa-chevron-down nav-chevron"></i>
        </button>
        <div class="dropdown-menu" id="dropdownMenu" role="menu">
          <a href="#servicios" class="dropdown-item" role="menuitem">
            <i class="fa-solid fa-screwdriver-wrench"></i> Servicios
          </a>
          <a href="#proyectos" class="dropdown-item" role="menuitem">
            <i class="fa-solid fa-images"></i> Proyectos
          </a>
          <a href="#contacto" class="dropdown-item" role="menuitem">
            <i class="fa-solid fa-phone"></i> Contacto
          </a>
        </div>
      </div>

      <a href="/catalogo" class="nav-link-item">Catálogo</a>
      <a href="/solicitudes" class="nav-link-item">Solicitudes</a>

      <a href="/carrito" class="cart-icon" id="cartIcon" aria-label="Ver carrito">
        <i class="fa-solid fa-cart-shopping"></i>
        <span class="cart-badge" id="cartCount">0</span>
      </a>

      <!-- Dropdown Mi cuenta: clientes + acceso personal -->
      <div class="nav-item nav-dropdown cuenta-dropdown" id="cuentaDropdown">
        <button class="nav-dropdown-btn" id="cuentaDropdownBtn"
                aria-haspopup="true" aria-expanded="false">
          <span><i class="fa-solid fa-user"></i> Mi cuenta</span>
          <i class="fa-solid fa-chevron-down nav-chevron"></i>
        </button>
        <div class="dropdown-menu cuenta-menu" id="cuentaDropdownMenu" role="menu">
          <a href="#" class="dropdown-item" id="btnAbrirAuth"
             onclick="AuthModal.open(); return false;">
            <i class="fa-solid fa-user-circle"></i> Clientes
          </a>
          <div class="dropdown-divider"></div>
          <a href="/login" class="dropdown-item">
            <i class="fa-solid fa-id-badge"></i> Personal
          </a>
        </div>
      </div>

    </nav>
  </div>

  <!-- Hero Section -->
  <div class="hero" id="inicio">
    <h1>WOODEN HOUSE</h1>
    <p class="tagline">Muebles de Madera a Medida | Calidad Artesanal en Guadalajara</p>
    <p style="color:#666; font-size:16px; margin-top:10px;">
      <i class="fa-solid fa-location-dot"></i> Guadalajara, Jalisco | Servicio en toda la ZMG
    </p>
    <div class="hero-buttons">
      <a href="/solicitudes" class="btn-primary"><i class="fa-solid fa-tag"></i> Solicitar Cotización</a>
      <a href="#servicios" class="btn-secondary"><i class="fa-solid fa-screwdriver-wrench"></i> Ver Servicios</a>
    </div>
  </div>

  <!-- Container principal -->
  <div class="container">

    <!-- About Section -->
    <div class="about-box">
      <h2>¿Quiénes Somos?</h2>
      <p>
        En <strong>Wooden House</strong> nos especializamos en la fabricación de muebles de madera de alta calidad,
        diseñados y construidos a medida para transformar tus espacios. Con más de 10 años de experiencia,
        combinamos tradición artesanal con diseño moderno para crear piezas únicas que se adaptan perfectamente
        a tus necesidades y estilo.
      </p>
      <p>
        Desde cocinas integrales hasta clósets personalizados, cada proyecto es único y refleja nuestra pasión
        por la carpintería de excelencia.
      </p>
    </div>

    <!-- Services Section -->
    <div id="servicios">
      <h2 class="section-title"><i class="fa-solid fa-screwdriver-wrench"></i> Nuestros Servicios</h2>
      <div class="services-grid">
        <div class="service-card">
          <div class="service-icon"><i class="fa-solid fa-utensils"></i></div>
          <h3>Cocinas Integrales</h3>
          <p>Diseño y fabricación de cocinas funcionales y elegantes, adaptadas a tu espacio y necesidades. Incluye gabinetes, barras y acabados personalizados.</p>
        </div>
        <div class="service-card">
          <div class="service-icon"><i class="fa-solid fa-shirt"></i></div>
          <h3>Clósets a Medida</h3>
          <p>Maximiza tu espacio con clósets diseñados específicamente para ti. Múltiples compartimentos, cajones y opciones de organización.</p>
        </div>
        <div class="service-card">
          <div class="service-icon"><i class="fa-solid fa-bath"></i></div>
          <h3>Muebles de Baño</h3>
          <p>Muebles resistentes a la humedad con diseños modernos y clásicos. Incluye lavabo, espejo y almacenamiento optimizado.</p>
        </div>
      </div>
    </div>

    <!-- Why Choose Us -->
    <div>
      <h2 class="section-title"><i class="fa-solid fa-star"></i> ¿Por Qué Elegirnos?</h2>
      <div class="reasons-grid">
        <div class="reason-card">
          <h4><i class="fa-solid fa-palette"></i> Diseño Personalizado</h4>
          <p>Cada mueble es único y diseñado específicamente para ti. Trabajamos contigo desde el concepto hasta la instalación.</p>
        </div>
        <div class="reason-card">
          <h4><i class="fa-solid fa-tree"></i> Materiales de Calidad</h4>
          <p>Utilizamos maderas nobles y materiales de primera calidad que garantizan durabilidad y belleza.</p>
        </div>
        <div class="reason-card">
          <h4><i class="fa-solid fa-wrench"></i> Instalación Profesional</h4>
          <p>Equipo técnico especializado se encarga de la instalación perfecta en tu hogar.</p>
        </div>
        <div class="reason-card">
          <h4><i class="fa-solid fa-bolt"></i> Entrega Puntual</h4>
          <p>Cumplimos con los tiempos de entrega acordados. Tu proyecto es nuestra prioridad.</p>
        </div>
        <div class="reason-card">
          <h4><i class="fa-solid fa-tag"></i> Precios Justos</h4>
          <p>Cotizaciones transparentes y competitivas sin costos ocultos. Calidad al mejor precio.</p>
        </div>
        <div class="reason-card">
          <h4><i class="fa-solid fa-shield-halved"></i> Garantía Total</h4>
          <p>1 año de garantía contra defectos de fabricación y 30 días de garantía de satisfacción.</p>
        </div>
      </div>
    </div>

    <!-- Process -->
    <div>
      <h2 class="section-title"><i class="fa-solid fa-clipboard-list"></i> Proceso de Trabajo</h2>
      <div class="process-grid">
        <div class="process-step">
          <div class="process-number">1</div>
          <h4>Consulta Inicial</h4>
          <p>Conversamos sobre tu proyecto, necesidades y presupuesto</p>
        </div>
        <div class="process-step">
          <div class="process-number">2</div>
          <h4>Medición y Diseño</h4>
          <p>Visitamos tu hogar para tomar medidas exactas y crear el diseño</p>
        </div>
        <div class="process-step">
          <div class="process-number">3</div>
          <h4>Cotización</h4>
          <p>Recibes propuesta detallada con renders 3D y precios claros</p>
        </div>
        <div class="process-step">
          <div class="process-number">4</div>
          <h4>Fabricación</h4>
          <p>Elaboramos tu mueble con materiales de primera calidad</p>
        </div>
        <div class="process-step">
          <div class="process-number">5</div>
          <h4>Instalación</h4>
          <p>Entregamos e instalamos profesionalmente en tu hogar</p>
        </div>
      </div>
    </div>

    <!-- Projects Gallery -->
    <div id="proyectos">
      <h2 class="section-title"><i class="fa-solid fa-sparkles"></i> Proyectos Realizados</h2>

      <div class="work-grid">

        <div class="work-card video-card">
          <video muted loop playsinline preload="none">
            <source data-src="https://firebasestorage.googleapis.com/v0/b/woodenhouse-898de.firebasestorage.app/o/proyectos%2Fproyecto1.mp4?alt=media&token=27da66f5-8a7a-4b2f-aa97-2475947c5cb6" type="video/mp4">
          </video>
        </div>

        <div class="work-card video-card">
          <video muted loop playsinline preload="none">
            <source data-src="https://firebasestorage.googleapis.com/v0/b/woodenhouse-898de.firebasestorage.app/o/proyectos%2Fproyecto2.mp4?alt=media&token=ba5e5413-3bb3-407c-845b-afc6e113cf50" type="video/mp4">
          </video>
        </div>

        <div class="work-card video-card">
          <video muted loop playsinline preload="none">
            <source data-src="https://firebasestorage.googleapis.com/v0/b/woodenhouse-898de.firebasestorage.app/o/proyectos%2Fproyecto3.mp4?alt=media&token=859c8549-0c19-4a60-936e-45d1989c0f78" type="video/mp4">
          </video>
        </div>

        <div class="work-card video-card">
          <video muted loop playsinline preload="none">
            <source data-src="https://firebasestorage.googleapis.com/v0/b/woodenhouse-898de.firebasestorage.app/o/proyectos%2Fproyecto4.mp4?alt=media&token=f513e173-9386-4cfc-b98f-195abd566efd" type="video/mp4">
          </video>
        </div>

        <div class="work-card video-card">
          <video muted loop playsinline preload="none">
            <source data-src="https://firebasestorage.googleapis.com/v0/b/woodenhouse-898de.firebasestorage.app/o/proyectos%2Fproyecto5.mp4?alt=media&token=a75ea48f-eb33-4b67-969d-6a0c1b3c9dd5" type="video/mp4">
          </video>
        </div>

        <div class="work-card video-card">
          <video muted loop playsinline preload="none">
            <source data-src="https://firebasestorage.googleapis.com/v0/b/woodenhouse-898de.firebasestorage.app/o/proyectos%2Fproyecto6.mp4?alt=media&token=cf9d54fe-9299-43dd-b79f-3def076921d0" type="video/mp4">
          </video>
        </div>

      </div>
    </div>

    <!-- Call to Action -->
    <div class="cta-section">
      <h2><i class="fa-solid fa-house"></i> ¿Listo para Transformar tu Espacio?</h2>
      <p>Contáctanos hoy y recibe una cotización personalizada sin compromiso</p>
      <div class="cta-buttons">
        <a href="/solicitudes" class="btn-primary"><i class="fa-solid fa-tag"></i> Solicitar Cotización Gratis</a>
        <a href="#contacto" class="btn-secondary"><i class="fa-solid fa-phone"></i> Contactar Ahora</a>
      </div>
    </div>

    <!-- FAQ Section -->
    <div class="faq-section">
      <h2 class="section-title"><i class="fa-solid fa-circle-question"></i> Preguntas Frecuentes</h2>

      <div class="faq-item" onclick="toggleFAQ(this)">
        <div class="faq-question">¿Hacen entregas a domicilio?<span class="faq-icon"><i class="fa-solid fa-chevron-down"></i></span></div>
        <div class="faq-answer">Sí, realizamos entregas en toda la Zona Metropolitana de Guadalajara. El costo de envío varía según la ubicación y tamaño del mueble. El tiempo de entrega es de 5-7 días hábiles después de la confirmación del pedido.</div>
      </div>

      <div class="faq-item" onclick="toggleFAQ(this)">
        <div class="faq-question">¿Incluyen instalación profesional?<span class="faq-icon"><i class="fa-solid fa-chevron-down"></i></span></div>
        <div class="faq-answer">Sí, todos nuestros proyectos incluyen instalación profesional. Nuestro equipo técnico especializado se encargará de instalar tu mueble de manera segura, profesional y dejando todo limpio.</div>
      </div>

      <div class="faq-item" onclick="toggleFAQ(this)">
        <div class="faq-question">¿Qué garantía tienen los muebles?<span class="faq-icon"><i class="fa-solid fa-chevron-down"></i></span></div>
        <div class="faq-answer">Todos nuestros muebles cuentan con garantía de 1 año contra defectos de fabricación. Además, ofrecemos 30 días de garantía de satisfacción: si no estás conforme con tu compra, trabajaremos contigo para resolver cualquier inconformidad.</div>
      </div>

      <div class="faq-item" onclick="toggleFAQ(this)">
        <div class="faq-question">¿Puedo ver ejemplos antes de decidir?<span class="faq-icon"><i class="fa-solid fa-chevron-down"></i></span></div>
        <div class="faq-answer">Sí, puedes agendar una cita para visitar nuestro showroom o solicitar que uno de nuestros asesores visite tu hogar con muestras de materiales, acabados y fotos de proyectos anteriores.</div>
      </div>

      <div class="faq-item" onclick="toggleFAQ(this)">
        <div class="faq-question">¿Cuánto tiempo tarda la fabricación?<span class="faq-icon"><i class="fa-solid fa-chevron-down"></i></span></div>
        <div class="faq-answer">Los tiempos varían según la complejidad del proyecto. Generalmente, los muebles personalizados tienen un tiempo de fabricación de 2-4 semanas. Te proporcionaremos un cronograma específico en tu cotización.</div>
      </div>

      <div class="faq-item" onclick="toggleFAQ(this)">
        <div class="faq-question">¿Aceptan pagos en parcialidades?<span class="faq-icon"><i class="fa-solid fa-chevron-down"></i></span></div>
        <div class="faq-answer">Sí, aceptamos pagos a meses sin intereses con tarjetas de crédito participantes: 3, 6, 9 y 12 meses sin intereses en compras mayores a $5,000. También manejamos esquemas de pago: 50% anticipo y 50% al recibir.</div>
      </div>

      <div class="faq-item" onclick="toggleFAQ(this)">
        <div class="faq-question">¿Qué tipo de maderas utilizan?<span class="faq-icon"><i class="fa-solid fa-chevron-down"></i></span></div>
        <div class="faq-answer">Trabajamos con diversas maderas de calidad: pino, encino, cedro, MDF, triplay y melamina. Durante la consulta inicial te asesoraremos sobre el mejor material para tu proyecto según uso, presupuesto y estilo.</div>
      </div>

      <div class="faq-item" onclick="toggleFAQ(this)">
        <div class="faq-question">¿La cotización tiene costo?<span class="faq-icon"><i class="fa-solid fa-chevron-down"></i></span></div>
        <div class="faq-answer">No, la cotización es completamente gratuita y sin compromiso. Incluye visita a domicilio, toma de medidas, diseño preliminar y propuesta detallada con precios transparentes.</div>
      </div>

    </div>

    <!-- Contact Section -->
    <div id="contacto">
      <h2 class="section-title"><i class="fa-solid fa-phone"></i> Información de Contacto</h2>
      <div class="contact-grid">
        <div class="contact-card">
          <div class="contact-icon"><i class="fa-solid fa-mobile-screen"></i></div>
          <h4>WhatsApp</h4>
          <p><a href="https://wa.me/5213317054017" target="_blank">33 1705 4017</a></p>
          <small>Lun - Sáb: 9:00 AM - 7:00 PM</small>
        </div>
        <div class="contact-card">
          <div class="contact-icon"><i class="fa-solid fa-envelope"></i></div>
          <h4>Email</h4>
          <p><a href="mailto:ventas@muebleswh.com">ventas@muebleswh.com</a></p>
          <small>Respuesta en 24 hrs</small>
        </div>
        <div class="contact-card">
          <div class="contact-icon"><i class="fa-solid fa-location-dot"></i></div>
          <h4>Ubicación</h4>
          <p>Guadalajara, Jalisco</p>
          <small>Servicio en toda la ZMG</small>
        </div>
        <div class="contact-card">
          <div class="contact-icon"><i class="fa-solid fa-clock"></i></div>
          <h4>Horario</h4>
          <p>Lunes a Sábado</p>
          <small>9:00 AM - 7:00 PM</small>
        </div>
      </div>
    </div>

    <!-- Map Section -->
    <div class="map-section">
      <h2><i class="fa-solid fa-location-dot"></i> Nuestra Ubicación</h2>
      <p>Servicio de entrega e instalación en toda la Zona Metropolitana de Guadalajara</p>
      <div style="width:100%; height:450px; border-radius:15px; overflow:hidden; margin-top:20px;">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3734.6659935791336!2d-103.4240335!3d20.601693400000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8428acf1f7ece931%3A0xcf2ad0ecc9c0376c!2sIgnacio%20Zaragoza%2C%20Zapopan%2C%20Jal.!5e0!3m2!1ses-419!2smx!4v1771103624242!5m2!1ses-419!2smx"
          width="100%" height="100%" style="border:0;"
          allowfullscreen="" loading="lazy"
          referrerpolicy="no-referrer-when-downgrade">
        </iframe>
      </div>
    </div>

    <!-- Social Media -->
    <div class="social-section">
      <h3><i class="fa-solid fa-globe"></i> Síguenos en Redes Sociales</h3>
      <p style="color:#a0a0a0; margin-bottom:20px;">Mantente al día con nuestros proyectos más recientes</p>
      <div class="social-links">
        <a href="https://www.facebook.com/wh020" class="social-link facebook" title="Facebook" target="_blank">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </a>
        <a href="https://www.instagram.com/pablowooden_" class="social-link instagram" title="Instagram" target="_blank">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </a>
        <a href="https://wa.me/5213317054017?text=Hola%2C%20me%20interesa%20una%20cotización" class="social-link whatsapp" title="WhatsApp" target="_blank">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      </div>
    </div>

  </div><!-- /container -->

  <!-- Footer -->
  <div class="footer">
    <p>&copy; 2025 Wooden House. Todos los derechos reservados.</p>
    <p style="margin-top:10px;">Muebles de madera a medida en Guadalajara, Jalisco</p>
    <p style="margin-top:10px; font-size:14px;">
      <a href="mailto:ventas@muebleswh.com" style="color:#8b7355; text-decoration:none;">ventas@muebleswh.com</a>
    </p>
  </div>

  <script src="./assets/js/firebase-config.js"></script>
  <script src="./assets/js/modal-auth.js?v=3"></script>
  <script src="./assets/js/index.js"></script>

</body>
</html>