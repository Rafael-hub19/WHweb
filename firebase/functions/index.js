/**
 * Firebase Cloud Functions — Wooden House
 *
 * Funciones serverless para:
 *  1. Notificaciones en tiempo real al admin (Firestore trigger)
 *  2. Correos automáticos de confirmación de pedidos (HTTP callable)
 *  3. Correos automáticos de confirmación de cotizaciones
 *  4. Correos automáticos de confirmación de citas
 *  5. Limpieza de notificaciones antiguas (programado)
 */

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError }  = require('firebase-functions/v2/https');
const { onSchedule }          = require('firebase-functions/v2/scheduler');
const { initializeApp }       = require('firebase-admin/app');
const { getFirestore }        = require('firebase-admin/firestore');
const nodemailer              = require('nodemailer');

initializeApp();
const db = getFirestore();

// ── Secrets compartidos por todas las funciones ───────────────────
const SECRETS = [
  'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS',
  'EMAIL_PEDIDOS', 'EMAIL_VENTAS', 'EMAIL_SOPORTE',
  'EMAIL_FROM', 'ADMIN_EMAIL',
];

// ── Config SMTP (Brevo) ───────────────────────────────────────────
function getTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ── Remitentes por tipo de correo (leídos en tiempo de ejecución) ─
function getEmails() {
  return {
    pedidos: process.env.EMAIL_PEDIDOS || 'pedidos@muebleswh.com',
    ventas:  process.env.EMAIL_VENTAS  || 'ventas@muebleswh.com',
    soporte: process.env.EMAIL_SOPORTE || 'soporte@muebleswh.com',
    from:    process.env.EMAIL_FROM    || 'noreply@muebleswh.com',
    admin:   process.env.ADMIN_EMAIL   || 'ventas@muebleswh.com',
  };
}

// ── Plantilla base de email ───────────────────────────────────────
function emailBase(titulo, contenido) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background:#1a1a1a;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#2d2d2d;border-radius:12px;overflow:hidden;max-width:600px;">
        <!-- Header -->
        <tr>
          <td style="background:#8b7355;padding:30px 40px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:26px;letter-spacing:2px;">WOODEN HOUSE</h1>
            <p style="color:#f0e0c0;margin:6px 0 0;font-size:13px;">Muebles de Madera a Medida · Guadalajara</p>
          </td>
        </tr>
        <!-- Contenido -->
        <tr>
          <td style="padding:36px 40px;color:#e0e0e0;">
            ${contenido}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#1a1a1a;padding:20px 40px;text-align:center;">
            <p style="color:#666;font-size:12px;margin:0;">
              Wooden House · Guadalajara, Jalisco · México<br>
              <a href="mailto:ventas@muebleswh.com" style="color:#8b7355;">ventas@muebleswh.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ================================================================
// 1. TRIGGER: Nuevo documento en /notificaciones → notificar admin
// ================================================================
exports.onNuevaNotificacion = onDocumentCreated(
  {
    document: 'notificaciones/{notifId}',
    secrets: SECRETS,
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const tiposImportantes = ['nuevo_pedido', 'nueva_cita', 'nueva_cotizacion', 'pago_recibido'];
    if (!tiposImportantes.includes(data.tipo)) return;

    const emails = getEmails();

    const iconos = {
      nuevo_pedido:     '🛒',
      nueva_cotizacion: '📋',
      nueva_cita:       '📅',
      pago_recibido:    '💳',
    };

    const icono = iconos[data.tipo] || '🔔';

    const html = emailBase(
      data.titulo,
      `
      <h2 style="color:#8b7355;margin:0 0 20px;">${icono} ${data.titulo}</h2>
      <p style="color:#ccc;line-height:1.7;margin:0 0 16px;">${data.mensaje}</p>
      ${data.referencia ? `<p style="color:#8b7355;font-size:13px;margin:0;">Referencia: <strong>${data.referencia}</strong></p>` : ''}
      <div style="margin:28px 0 0;">
        <a href="https://muebleswh.com/admin"
           style="background:#8b7355;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
          Ver en Panel Admin
        </a>
      </div>
      `
    );

    try {
      await getTransporter().sendMail({
        from:    `"Wooden House Pedidos" <${emails.pedidos}>`,
        to:      emails.admin,
        subject: `${icono} ${data.titulo} — Wooden House`,
        html,
        text:    `${data.titulo}\n\n${data.mensaje}\n\nReferencia: ${data.referencia || 'N/A'}`,
      });
      console.log(`[Cloud Function] Email admin enviado: ${data.tipo} - ${data.referencia}`);
    } catch (err) {
      console.error('[Cloud Function] Error enviando email admin:', err.message);
    }
  }
);

// ================================================================
// 2. HTTP CALLABLE: Enviar confirmación de pedido al cliente
//    Remitente: pedidos@muebleswh.com
// ================================================================
exports.enviarConfirmacionPedido = onCall(
  { secrets: SECRETS },
  async (request) => {
    const { pedido, cliente } = request.data;
    const emails = getEmails();

    if (!pedido?.numero_pedido || !cliente?.correo) {
      throw new HttpsError('invalid-argument', 'Datos de pedido o cliente incompletos');
    }

    const itemsHtml = (pedido.items || []).map(item => `
      <tr>
        <td style="padding:10px 12px;color:#ccc;border-bottom:1px solid #3d3d3d;">${item.nombre_producto}</td>
        <td style="padding:10px 12px;color:#ccc;border-bottom:1px solid #3d3d3d;text-align:center;">${item.cantidad}</td>
        <td style="padding:10px 12px;color:#8b7355;border-bottom:1px solid #3d3d3d;text-align:right;">
          $${Number(item.precio_unitario * item.cantidad).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </td>
      </tr>`).join('');

    const html = emailBase(
      `Confirmación de Pedido ${pedido.numero_pedido}`,
      `
      <h2 style="color:#8b7355;margin:0 0 8px;">¡Tu pedido fue confirmado! ✅</h2>
      <p style="color:#aaa;margin:0 0 24px;font-size:14px;">Hola <strong style="color:#e0e0e0;">${cliente.nombre}</strong>, recibimos tu pedido correctamente.</p>

      <div style="background:#3d3d3d;border-radius:8px;padding:20px 24px;margin:0 0 24px;">
        <p style="margin:0 0 8px;color:#aaa;font-size:13px;">Número de pedido</p>
        <p style="margin:0;color:#8b7355;font-size:22px;font-weight:bold;letter-spacing:1px;">${pedido.numero_pedido}</p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        <thead>
          <tr style="background:#3d3d3d;">
            <th style="padding:10px 12px;color:#8b7355;text-align:left;font-size:13px;">Producto</th>
            <th style="padding:10px 12px;color:#8b7355;text-align:center;font-size:13px;">Cant.</th>
            <th style="padding:10px 12px;color:#8b7355;text-align:right;font-size:13px;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:14px 12px;color:#aaa;text-align:right;font-size:13px;">Total pagado:</td>
            <td style="padding:14px 12px;color:#8b7355;font-size:18px;font-weight:bold;text-align:right;">
              $${Number(pedido.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
            </td>
          </tr>
        </tfoot>
      </table>

      <div style="background:#3d3d3d;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
        <p style="margin:0 0 6px;color:#aaa;font-size:13px;">📦 Fecha estimada de entrega</p>
        <p style="margin:0;color:#e0e0e0;font-weight:bold;">${pedido.fecha_estimada || 'Se confirmará pronto'}</p>
      </div>

      <div style="text-align:center;">
        <a href="https://muebleswh.com/solicitudes?pedido=${pedido.numero_pedido}"
           style="background:#8b7355;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
          Ver estado de mi pedido
        </a>
      </div>
      `
    );

    try {
      await getTransporter().sendMail({
        from:    `"Wooden House Pedidos" <${emails.pedidos}>`,
        to:      cliente.correo,
        subject: `✅ Pedido confirmado ${pedido.numero_pedido} — Wooden House`,
        html,
        text:    `Pedido ${pedido.numero_pedido} confirmado. Total: $${pedido.total} MXN. Fecha estimada: ${pedido.fecha_estimada || 'Por confirmar'}.`,
      });
      return { success: true };
    } catch (err) {
      console.error('[Cloud Function] Error enviando confirmación pedido:', err.message);
      throw new HttpsError('internal', 'Error al enviar correo de confirmación');
    }
  }
);

// ================================================================
// 3. HTTP CALLABLE: Confirmación de cotización al cliente
//    Remitente: ventas@muebleswh.com
// ================================================================
exports.enviarConfirmacionCotizacion = onCall(
  { secrets: SECRETS },
  async (request) => {
    const { cotizacion, cliente } = request.data;
    const emails = getEmails();

    if (!cotizacion?.numero_cotizacion || !cliente?.correo) {
      throw new HttpsError('invalid-argument', 'Datos incompletos');
    }

    const html = emailBase(
      `Cotización ${cotizacion.numero_cotizacion} Recibida`,
      `
      <h2 style="color:#8b7355;margin:0 0 8px;">¡Cotización recibida! 📋</h2>
      <p style="color:#aaa;margin:0 0 24px;font-size:14px;">
        Hola <strong style="color:#e0e0e0;">${cliente.nombre}</strong>, recibimos tu solicitud de cotización.
        La revisaremos y te contactaremos en un plazo de <strong style="color:#e0e0e0;">24-48 horas hábiles</strong>.
      </p>

      <div style="background:#3d3d3d;border-radius:8px;padding:20px 24px;margin:0 0 24px;">
        <p style="margin:0 0 8px;color:#aaa;font-size:13px;">Número de cotización</p>
        <p style="margin:0;color:#8b7355;font-size:22px;font-weight:bold;">${cotizacion.numero_cotizacion}</p>
      </div>

      ${cotizacion.descripcion ? `
      <div style="background:#3d3d3d;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
        <p style="margin:0 0 6px;color:#aaa;font-size:13px;">Tu solicitud:</p>
        <p style="margin:0;color:#e0e0e0;line-height:1.6;">${cotizacion.descripcion}</p>
      </div>` : ''}

      <div style="text-align:center;">
        <a href="https://muebleswh.com/solicitudes?cotizacion=${cotizacion.numero_cotizacion}"
           style="background:#8b7355;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
          Ver estado de cotización
        </a>
      </div>
      `
    );

    try {
      await getTransporter().sendMail({
        from:    `"Wooden House Ventas" <${emails.ventas}>`,
        to:      cliente.correo,
        subject: `📋 Cotización ${cotizacion.numero_cotizacion} recibida — Wooden House`,
        html,
        text:    `Cotización ${cotizacion.numero_cotizacion} recibida. Te contactaremos en 24-48 horas hábiles.`,
      });
      return { success: true };
    } catch (err) {
      console.error('[Cloud Function] Error enviando confirmación cotización:', err.message);
      throw new HttpsError('internal', 'Error al enviar correo de cotización');
    }
  }
);

// ================================================================
// 4. HTTP CALLABLE: Confirmación de cita al cliente
//    Remitente: soporte@muebleswh.com
// ================================================================
exports.enviarConfirmacionCita = onCall(
  { secrets: SECRETS },
  async (request) => {
    const { cita, cliente } = request.data;
    const emails = getEmails();

    if (!cita?.numero_cita || !cliente?.correo) {
      throw new HttpsError('invalid-argument', 'Datos incompletos');
    }

    const html = emailBase(
      `Cita ${cita.numero_cita} Confirmada`,
      `
      <h2 style="color:#8b7355;margin:0 0 8px;">¡Cita agendada! 📅</h2>
      <p style="color:#aaa;margin:0 0 24px;font-size:14px;">
        Hola <strong style="color:#e0e0e0;">${cliente.nombre}</strong>, tu cita ha sido agendada exitosamente.
      </p>

      <div style="background:#3d3d3d;border-radius:8px;padding:20px 24px;margin:0 0 16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="color:#aaa;font-size:13px;padding-bottom:10px;">📅 Fecha y hora</td>
            <td style="color:#e0e0e0;font-weight:bold;text-align:right;padding-bottom:10px;">${cita.fecha_cita || 'Por confirmar'}</td>
          </tr>
          <tr>
            <td style="color:#aaa;font-size:13px;padding-bottom:10px;">📍 Tipo</td>
            <td style="color:#e0e0e0;text-align:right;padding-bottom:10px;">${cita.tipo_cita === 'medicion' ? 'Medición en domicilio' : 'Instalación'}</td>
          </tr>
          <tr>
            <td style="color:#aaa;font-size:13px;">🔖 Referencia</td>
            <td style="color:#8b7355;font-weight:bold;text-align:right;">${cita.numero_cita}</td>
          </tr>
        </table>
      </div>

      <p style="color:#aaa;font-size:13px;margin:0 0 20px;line-height:1.6;">
        Nuestro equipo llegará puntualmente. Si necesitas reagendar, contáctanos con al menos
        <strong style="color:#e0e0e0;">24 horas de anticipación</strong>.
      </p>
      `
    );

    try {
      await getTransporter().sendMail({
        from:    `"Wooden House Soporte" <${emails.soporte}>`,
        to:      cliente.correo,
        subject: `📅 Cita confirmada — Wooden House`,
        html,
        text:    `Cita ${cita.numero_cita} agendada para ${cita.fecha_cita}. Tipo: ${cita.tipo_cita}.`,
      });
      return { success: true };
    } catch (err) {
      console.error('[Cloud Function] Error enviando confirmación cita:', err.message);
      throw new HttpsError('internal', 'Error al enviar correo de cita');
    }
  }
);

// ================================================================
// 5. SCHEDULED: Limpiar notificaciones leídas de más de 30 días
// ================================================================
exports.limpiarNotificacionesAntiguas = onSchedule('every 24 hours', async () => {
  const hace30dias = new Date();
  hace30dias.setDate(hace30dias.getDate() - 30);
  const cutoff = hace30dias.toISOString();

  try {
    const snapshot = await db.collection('notificaciones')
      .where('leida', '==', true)
      .where('fecha', '<', cutoff)
      .limit(200)
      .get();

    if (snapshot.empty) {
      console.log('[Scheduled] No hay notificaciones antiguas para limpiar.');
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    console.log(`[Scheduled] Eliminadas ${snapshot.size} notificaciones antiguas.`);
  } catch (err) {
    console.error('[Scheduled] Error limpiando notificaciones:', err.message);
  }
});