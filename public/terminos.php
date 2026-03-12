<?php header('Content-Type: text/html; charset=utf-8'); ?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Términos y Condiciones – Wooden House</title>
  <link rel="stylesheet" href="./assets/css/variables.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', Tahoma, sans-serif;
      background: var(--color-bg, #1a1a1a);
      color: var(--color-text, #e0e0e0);
      line-height: 1.7;
    }

    /* ── Header ── */
    .header-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      background: var(--color-surface, #242424);
      border-bottom: 1px solid #2e2e2e;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-nav .logo img { height: 70px; display: block; }
    .nav-links { display: flex; align-items: center; gap: 24px; }
    .nav-links a {
      color: var(--color-text-muted, #a0a0a0);
      text-decoration: none;
      font-size: 14px;
      transition: color .2s;
    }
    .nav-links a:hover { color: var(--color-primary, #8b7355); }

    /* ── Contenido ── */
    .page-wrap {
      max-width: 860px;
      margin: 0 auto;
      padding: 48px 24px 80px;
    }

    .page-header {
      text-align: center;
      margin-bottom: 48px;
      padding-bottom: 28px;
      border-bottom: 1px solid #2e2e2e;
    }
    .page-header h1 {
      font-size: 28px;
      font-weight: 700;
      color: var(--color-primary, #8b7355);
      margin-bottom: 8px;
    }
    .page-header p {
      color: var(--color-text-muted, #a0a0a0);
      font-size: 14px;
    }

    .section {
      margin-bottom: 40px;
    }
    .section h2 {
      font-size: 17px;
      font-weight: 600;
      color: var(--color-primary, #8b7355);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 9px;
    }
    .section h2 i {
      font-size: 14px;
      opacity: .8;
    }
    .section p, .section li {
      font-size: 14px;
      color: var(--color-text-muted, #b0b0b0);
      margin-bottom: 8px;
    }
    .section ul {
      padding-left: 20px;
    }
    .section ul li { margin-bottom: 6px; }

    .highlight-box {
      background: #242424;
      border-left: 3px solid var(--color-primary, #8b7355);
      border-radius: 0 8px 8px 0;
      padding: 14px 18px;
      margin: 14px 0;
      font-size: 13px;
      color: var(--color-text-muted, #a0a0a0);
    }

    /* ── Footer ── */
    .footer {
      background: #141414;
      text-align: center;
      padding: 28px 24px;
      color: #666;
      font-size: 13px;
      border-top: 1px solid #2a2a2a;
    }
    .footer a { color: var(--color-primary, #8b7355); text-decoration: none; }
  </style>
</head>
<body>

<!-- Header -->
<div class="header-nav">
  <div class="logo">
    <a href="/inicio"><img src="/assets/img/logo-header.png" alt="Wooden House"></a>
  </div>
  <div class="nav-links">
    <a href="/inicio"><i class="fa-solid fa-house"></i> Inicio</a>
    <a href="/catalogo">Catálogo</a>
    <a href="/solicitudes">Solicitudes</a>
  </div>
</div>

<!-- Contenido -->
<div class="page-wrap">

  <div class="page-header">
    <h1><i class="fa-solid fa-file-contract"></i> Términos y Condiciones</h1>
    <p>Última actualización: marzo de 2026 &nbsp;·&nbsp; Wooden House, Guadalajara, Jalisco</p>
  </div>

  <!-- 1. Información de la empresa -->
  <div class="section">
    <h2><i class="fa-solid fa-building"></i> 1. Datos de la empresa</h2>
    <p>
      <strong>Wooden House</strong> es una empresa dedicada a la fabricación y comercialización de muebles de madera a medida,
      con domicilio en Av. Chapultepec #1234, Col. Americana, Guadalajara, Jalisco, C.P. 44160.
    </p>
    <p>Contacto: <a href="mailto:ventas@muebleswh.com">ventas@muebleswh.com</a> &nbsp;|&nbsp; <a href="tel:3317054017">33 1705 4017</a></p>
  </div>

  <!-- 2. Aceptación -->
  <div class="section">
    <h2><i class="fa-solid fa-circle-check"></i> 2. Aceptación de los términos</h2>
    <p>
      Al crear una cuenta, realizar un pedido o utilizar cualquier servicio de este sitio web, el usuario acepta
      los presentes Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguno de ellos,
      te pedimos que no uses nuestros servicios.
    </p>
  </div>

  <!-- 3. Proceso de compra -->
  <div class="section">
    <h2><i class="fa-solid fa-cart-shopping"></i> 3. Proceso de compra</h2>
    <p>Todos nuestros muebles son <strong>fabricados bajo pedido</strong>. Al confirmar tu compra:</p>
    <ul>
      <li>Recibirás un correo de confirmación con tu número de pedido.</li>
      <li>El tiempo estimado de fabricación y entrega es de <strong>2 días hábiles</strong> a partir del pago confirmado.</li>
      <li>Los pedidos no incluyen instalación salvo que se haya contratado el servicio adicional durante el proceso de compra.</li>
      <li>Wooden House se reserva el derecho de cancelar pedidos en caso de error de precio o falta de disponibilidad de materiales, notificando al cliente de inmediato con reembolso completo.</li>
    </ul>
  </div>

  <!-- 4. Precios y pagos -->
  <div class="section">
    <h2><i class="fa-solid fa-credit-card"></i> 4. Precios y métodos de pago</h2>
    <p>Todos los precios se expresan en <strong>pesos mexicanos (MXN)</strong> e incluyen IVA.</p>
    <p>Aceptamos los siguientes métodos de pago:</p>
    <ul>
      <li><strong>Stripe</strong> — tarjeta de crédito o débito (Visa, Mastercard, American Express)</li>
      <li><strong>PayPal</strong> — cuenta PayPal o tarjeta a través de PayPal</li>
    </ul>
    <div class="highlight-box">
      El cargo a tu tarjeta o cuenta se realiza en el momento en que confirmas el pago. Wooden House no almacena
      datos de tarjetas; el procesamiento es gestionado de forma segura por Stripe y PayPal.
    </div>
  </div>

  <!-- 5. Envío e instalación -->
  <div class="section">
    <h2><i class="fa-solid fa-truck"></i> 5. Envío e instalación</h2>
    <ul>
      <li><strong>Recoger en sucursal:</strong> sin costo adicional en nuestro local de Av. Chapultepec #1234, Guadalajara.</li>
      <li><strong>Envío a domicilio:</strong> disponible en Guadalajara y Zona Metropolitana con costo de $500 MXN.</li>
      <li><strong>Instalación profesional:</strong> servicio adicional de $1,500 MXN por mueble, incluye conexión de lavabo y ajustes finales.</li>
    </ul>
    <p>
      Wooden House no se hace responsable de daños ocasionados por terceros durante el transporte una vez
      que el producto ha sido entregado y firmado de conformidad por el cliente.
    </p>
  </div>

  <!-- 6. Garantías -->
  <div class="section">
    <h2><i class="fa-solid fa-shield-halved"></i> 6. Garantías</h2>
    <p>Nuestros muebles cuentan con <strong>garantía de 6 meses</strong> contra defectos de fabricación, que cubre:</p>
    <ul>
      <li>Fallas en herrajes, bisagras y correderas por defecto de fabricación.</li>
      <li>Desprendimiento de acabados aplicado en taller bajo condiciones normales de uso.</li>
      <li>Estructuras con deformaciones causadas por defecto del material.</li>
    </ul>
    <p>La garantía <strong>no cubre</strong> daños por mal uso, humedad excesiva, golpes, instalación incorrecta por el cliente
    o desgaste natural del material.</p>
    <div class="highlight-box">
      La madera es un material natural — pueden existir variaciones de tono, veta y textura entre el producto
      mostrado en imágenes y el producto final. Esto no constituye un defecto de fabricación.
    </div>
  </div>

  <!-- 7. Cancelaciones y devoluciones -->
  <div class="section">
    <h2><i class="fa-solid fa-rotate-left"></i> 7. Cancelaciones y devoluciones</h2>
    <ul>
      <li>Puedes cancelar tu pedido <strong>dentro de las primeras 24 horas</strong> después de confirmado, siempre que la producción no haya iniciado. Se realizará el reembolso completo.</li>
      <li>Una vez iniciada la fabricación, no se aceptan cancelaciones ni cambios de especificaciones.</li>
      <li>En caso de defecto de fabricación comprobado, el cliente deberá reportarlo en un plazo máximo de <strong>72 horas</strong> tras la entrega, enviando fotografías a <a href="mailto:ventas@muebleswh.com">ventas@muebleswh.com</a>.</li>
      <li>Los costos de flete por devolución por defecto de fabricación corren a cargo de Wooden House. Devoluciones por cambio de opinión corren a cargo del cliente.</li>
    </ul>
  </div>

  <!-- 8. Cuentas de usuario -->
  <div class="section">
    <h2><i class="fa-solid fa-user-lock"></i> 8. Cuentas de usuario</h2>
    <p>
      Al crear una cuenta en Wooden House, el usuario es responsable de mantener la confidencialidad
      de su contraseña y de todas las actividades realizadas bajo su cuenta.
    </p>
    <ul>
      <li>No compartas tu contraseña con terceros.</li>
      <li>Notifícanos de inmediato si sospechas acceso no autorizado a tu cuenta.</li>
      <li>Nos reservamos el derecho de suspender cuentas con actividad sospechosa o que incumplan estos términos.</li>
    </ul>
  </div>

  <!-- 9. Privacidad y datos personales -->
  <div class="section">
    <h2><i class="fa-solid fa-user-shield"></i> 9. Privacidad y datos personales</h2>
    <p>
      Wooden House recopila los siguientes datos personales: nombre completo, correo electrónico,
      teléfono y dirección de entrega. Estos datos se utilizan exclusivamente para:
    </p>
    <ul>
      <li>Procesar y gestionar tus pedidos, cotizaciones y citas.</li>
      <li>Enviarte confirmaciones y actualizaciones sobre tu compra.</li>
      <li>Mejorar tu experiencia en el sitio.</li>
    </ul>
    <p>
      No vendemos ni compartimos tus datos personales con terceros, salvo con los proveedores
      de pago (Stripe, PayPal) y servicios de autenticación (Firebase de Google)
      necesarios para operar el servicio, quienes cuentan con sus propias políticas de privacidad.
    </p>
    <div class="highlight-box">
      Conforme a la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong>,
      tienes derecho a Acceder, Rectificar, Cancelar u Oponerte (derechos ARCO) al uso de tus datos.
      Ejércelos escribiendo a <a href="mailto:ventas@muebleswh.com">ventas@muebleswh.com</a>.
    </div>
  </div>

  <!-- 10. Limitación de responsabilidad -->
  <div class="section">
    <h2><i class="fa-solid fa-triangle-exclamation"></i> 10. Limitación de responsabilidad</h2>
    <p>Wooden House no será responsable por:</p>
    <ul>
      <li>Retrasos causados por fuerza mayor (desastres naturales, huelgas, contingencias sanitarias, etc.).</li>
      <li>Daños indirectos o pérdida de ingresos del cliente derivados del retraso en la entrega.</li>
      <li>Incompatibilidad del mueble con instalaciones hidráulicas o eléctricas preexistentes no informadas al momento del pedido.</li>
    </ul>
  </div>

  <!-- 11. Modificaciones -->
  <div class="section">
    <h2><i class="fa-solid fa-pen-to-square"></i> 11. Modificaciones a los términos</h2>
    <p>
      Wooden House se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento.
      Los cambios entrarán en vigor a partir de su publicación en este sitio. Te recomendamos revisarlos periódicamente.
    </p>
  </div>

  <!-- 12. Legislación aplicable -->
  <div class="section">
    <h2><i class="fa-solid fa-scale-balanced"></i> 12. Legislación aplicable</h2>
    <p>
      Estos términos se rigen por las leyes vigentes de los <strong>Estados Unidos Mexicanos</strong>.
      Para cualquier controversia, las partes se someten a la jurisdicción de los tribunales competentes
      de la ciudad de <strong>Guadalajara, Jalisco</strong>.
    </p>
  </div>

</div>

<!-- Footer -->
<div class="footer">
  <p>&copy; 2026 Wooden House · Guadalajara, Jalisco</p>
  <p style="margin-top:8px;">
    <a href="mailto:ventas@muebleswh.com">ventas@muebleswh.com</a> &nbsp;|&nbsp;
    <a href="tel:3317054017">33 1705 4017</a>
  </p>
</div>

</body>
</html>
