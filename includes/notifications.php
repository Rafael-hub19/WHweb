<?php
/**
 * notifications.php - Notificaciones por email y Firestore
 * Wooden House - Muebles de madera finos
 */

if (!defined('WH_LOADED')) {
    require_once __DIR__ . '/config.php';
    require_once __DIR__ . '/functions.php';
}

// ================================================================
// EMAIL - Envío con PHP mail() + soporte SMTP básico
// ================================================================

/**
 * Enviar email HTML
 */
function enviarEmail(string $to, string $subject, string $bodyHtml, string $bodyText = ''): bool {
    $from     = EMAIL_FROM;
    $fromName = EMAIL_FROM_NAME;

    $boundary = md5(uniqid());
    $headers  = implode("\r\n", [
        "MIME-Version: 1.0",
        "Content-Type: multipart/alternative; boundary=\"{$boundary}\"",
        "From: {$fromName} <{$from}>",
        "Reply-To: {$from}",
        "X-Mailer: WoodenHouse/1.0",
    ]);

    if (empty($bodyText)) {
        $bodyText = strip_tags($bodyHtml);
    }

    $message = "--{$boundary}\r\n"
             . "Content-Type: text/plain; charset=UTF-8\r\n"
             . "Content-Transfer-Encoding: quoted-printable\r\n\r\n"
             . quoted_printable_encode($bodyText) . "\r\n\r\n"
             . "--{$boundary}\r\n"
             . "Content-Type: text/html; charset=UTF-8\r\n"
             . "Content-Transfer-Encoding: quoted-printable\r\n\r\n"
             . quoted_printable_encode($bodyHtml) . "\r\n\r\n"
             . "--{$boundary}--";

    $ok = @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $message, $headers);

    if (!$ok) {
        logError("Email failed to {$to}: " . error_get_last()['message'] ?? 'unknown');
    }
    return (bool)$ok;
}

// ================================================================
// PLANTILLAS DE EMAIL
// ================================================================

function _emailWrapper(string $titulo, string $contenido): string {
    $year  = date('Y');
    $color = '#8B6914';
    return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{$titulo}</title>
</head>
<body style="margin:0;padding:0;font-family:Georgia,serif;background:#f5f0eb;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:30px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
      <!-- Header -->
      <tr><td style="background:{$color};padding:30px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:26px;letter-spacing:2px;">🌲 WOODEN HOUSE</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Muebles de madera finos</p>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:40px 50px;">
        {$contenido}
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#f9f5f0;padding:20px;text-align:center;border-top:1px solid #e8dcc8;">
        <p style="margin:0;color:#888;font-size:12px;">
          © {$year} Wooden House — Guadalajara, Jalisco, México<br>
          Este correo fue generado automáticamente, por favor no respondas a él.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
HTML;
}

/**
 * Email: Confirmación de pedido
 */
function emailPedidoConfirmado(array $pedido): bool {
    $folio    = htmlspecialchars($pedido['numero_pedido']);
    $nombre   = htmlspecialchars($pedido['nombre_cliente']);
    $total    = formatMoney($pedido['total']);
    $fecha    = $pedido['fecha_estimada'] ?? 'Por confirmar';
    $tracking = $pedido['token_seguimiento'] ?? '';
    $trackUrl = APP_URL . "/public/seguimiento.php?token={$tracking}";

    $items = '';
    foreach (($pedido['items'] ?? []) as $item) {
        $items .= sprintf(
            '<tr><td style="padding:8px;border-bottom:1px solid #f0e8d8;">%s</td>'
            . '<td style="padding:8px;border-bottom:1px solid #f0e8d8;text-align:center;">%d</td>'
            . '<td style="padding:8px;border-bottom:1px solid #f0e8d8;text-align:right;">%s</td></tr>',
            htmlspecialchars($item['nombre'] ?? ''),
            (int)($item['cantidad'] ?? 1),
            formatMoney($item['precio_unitario'] ?? 0)
        );
    }

    $contenido = <<<HTML
<h2 style="color:#8B6914;margin-top:0;">¡Pedido confirmado, {$nombre}! 🎉</h2>
<p style="color:#555;line-height:1.7;">Hemos recibido tu pedido correctamente. Nos pondremos en contacto contigo para coordinar los detalles.</p>

<div style="background:#faf6f0;border-left:4px solid #8B6914;padding:20px;margin:25px 0;border-radius:4px;">
  <strong style="font-size:18px;color:#5C3D11;">{$folio}</strong><br>
  <span style="color:#888;font-size:13px;">Número de pedido</span>
</div>

<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:20px 0;">
  <tr style="background:#f0e8d8;">
    <th style="padding:10px;text-align:left;color:#5C3D11;">Producto</th>
    <th style="padding:10px;text-align:center;color:#5C3D11;">Cant.</th>
    <th style="padding:10px;text-align:right;color:#5C3D11;">Precio</th>
  </tr>
  {$items}
  <tr><td colspan="2" style="padding:12px;text-align:right;font-weight:bold;color:#5C3D11;">Total:</td>
      <td style="padding:12px;text-align:right;font-weight:bold;font-size:18px;color:#8B6914;">{$total}</td></tr>
</table>

<p style="color:#555;"><strong>Fecha estimada de entrega:</strong> {$fecha}</p>

<div style="text-align:center;margin:30px 0;">
  <a href="{$trackUrl}" style="background:#8B6914;color:#fff;text-decoration:none;padding:14px 30px;border-radius:6px;font-size:15px;display:inline-block;">
    Rastrear mi pedido →
  </a>
</div>
HTML;

    return enviarEmail(
        $pedido['correo_cliente'],
        "Pedido confirmado – {$folio} | Wooden House",
        _emailWrapper("Pedido Confirmado", $contenido)
    );
}

/**
 * Email: Actualización de estado de pedido
 */
function emailEstadoPedido(array $pedido, string $estadoAnterior): bool {
    $folio  = htmlspecialchars($pedido['numero_pedido']);
    $nombre = htmlspecialchars($pedido['nombre_cliente']);

    $estadoLabels = [
        'pendiente'     => 'Pendiente',
        'pagado'        => 'Pago confirmado ✓',
        'en_produccion' => 'En producción 🔨',
        'listo'         => 'Listo para entrega 📦',
        'entregado'     => 'Entregado ✅',
        'cancelado'     => 'Cancelado ❌',
    ];

    $estadoActual = $pedido['estado'];
    $label        = $estadoLabels[$estadoActual] ?? $estadoActual;

    $mensajes = [
        'pagado'        => 'Hemos confirmado tu pago. Pronto comenzaremos a fabricar tus muebles.',
        'en_produccion' => 'Tu pedido está siendo fabricado por nuestros artesanos. ¡Con mucho cariño!',
        'listo'         => 'Tu pedido está listo y esperando ser entregado. Nos pondremos en contacto pronto.',
        'entregado'     => '¡Tu pedido ha sido entregado! Esperamos que disfrutes tus nuevos muebles.',
        'cancelado'     => 'Tu pedido ha sido cancelado. Si tienes dudas, contáctanos.',
    ];

    $msg      = $mensajes[$estadoActual] ?? 'El estado de tu pedido ha sido actualizado.';
    $tracking = $pedido['token_seguimiento'] ?? '';
    $trackUrl = APP_URL . "/public/seguimiento.php?token={$tracking}";

    $contenido = <<<HTML
<h2 style="color:#8B6914;margin-top:0;">Actualización de tu pedido</h2>
<p style="color:#555;">Hola <strong>{$nombre}</strong>, te informamos que el estado de tu pedido ha cambiado.</p>

<div style="background:#faf6f0;border-left:4px solid #8B6914;padding:20px;margin:25px 0;border-radius:4px;">
  <strong style="color:#5C3D11;">{$folio}</strong><br>
  <span style="font-size:20px;font-weight:bold;color:#8B6914;">{$label}</span>
</div>

<p style="color:#555;line-height:1.7;">{$msg}</p>

<div style="text-align:center;margin:30px 0;">
  <a href="{$trackUrl}" style="background:#8B6914;color:#fff;text-decoration:none;padding:14px 30px;border-radius:6px;font-size:15px;display:inline-block;">
    Ver detalles del pedido →
  </a>
</div>
HTML;

    return enviarEmail(
        $pedido['correo_cliente'],
        "Actualización de pedido {$folio} – {$label} | Wooden House",
        _emailWrapper("Estado de Pedido", $contenido)
    );
}

/**
 * Email: Confirmación de solicitud de cotización
 */
function emailCotizacionRecibida(array $cot): bool {
    $folio  = htmlspecialchars($cot['numero_cotizacion']);
    $nombre = htmlspecialchars($cot['nombre_cliente']);
    $tipo   = htmlspecialchars($cot['tipo_mueble'] ?? 'Mueble personalizado');

    $contenido = <<<HTML
<h2 style="color:#8B6914;margin-top:0;">Cotización recibida ✓</h2>
<p style="color:#555;line-height:1.7;">Hola <strong>{$nombre}</strong>, hemos recibido tu solicitud de cotización para <strong>{$tipo}</strong>.</p>

<div style="background:#faf6f0;border-left:4px solid #8B6914;padding:20px;margin:25px 0;border-radius:4px;">
  <strong style="font-size:18px;color:#5C3D11;">{$folio}</strong><br>
  <span style="color:#888;font-size:13px;">Número de cotización</span>
</div>

<p style="color:#555;line-height:1.7;">Nuestro equipo revisará tu solicitud y te contactará en un plazo de <strong>2 a 3 días hábiles</strong> con una propuesta personalizada.</p>

<p style="color:#555;">¿Tienes preguntas? Responde a este correo o llámanos.</p>
HTML;

    return enviarEmail(
        $cot['correo_cliente'],
        "Cotización {$folio} recibida | Wooden House",
        _emailWrapper("Cotización Recibida", $contenido)
    );
}

/**
 * Email: Confirmación de cita
 */
function emailCitaConfirmada(array $cita): bool {
    $folio  = htmlspecialchars($cita['numero_cita']);
    $nombre = htmlspecialchars($cita['nombre_cliente']);
    $fecha  = htmlspecialchars($cita['fecha_cita']);
    $hora   = htmlspecialchars($cita['rango_horario'] ?? '');
    $tipo   = htmlspecialchars($cita['tipo'] ?? 'medición');

    $contenido = <<<HTML
<h2 style="color:#8B6914;margin-top:0;">Cita confirmada 📅</h2>
<p style="color:#555;line-height:1.7;">Hola <strong>{$nombre}</strong>, tu cita de <strong>{$tipo}</strong> ha sido confirmada.</p>

<div style="background:#faf6f0;border-left:4px solid #8B6914;padding:20px;margin:25px 0;border-radius:4px;">
  <p style="margin:4px 0;"><strong style="color:#5C3D11;">📅 Fecha:</strong> {$fecha}</p>
  <p style="margin:4px 0;"><strong style="color:#5C3D11;">🕐 Horario:</strong> {$hora}</p>
  <p style="margin:4px 0;"><strong style="color:#5C3D11;">📋 Tipo:</strong> {$tipo}</p>
  <p style="margin:8px 0 0;font-size:13px;color:#888;">Folio: {$folio}</p>
</div>

<p style="color:#555;line-height:1.7;">Por favor asegúrate de estar disponible en el horario indicado. Si necesitas reagendar, contáctanos con al menos 24 horas de anticipación.</p>
HTML;

    return enviarEmail(
        $cita['correo_cliente'],
        "Cita confirmada – {$fecha} | Wooden House",
        _emailWrapper("Cita Confirmada", $contenido)
    );
}

// ================================================================
// FIRESTORE REST API - Notificaciones en tiempo real para admin
// ================================================================

/**
 * Crear notificación en Firestore (para el panel admin)
 */
function crearNotificacionFirestore(string $tipo, string $titulo, string $mensaje, array $extra = []): bool {
    $projectId = FIREBASE_PROJECT_ID;
    $apiKey    = FIREBASE_API_KEY;

    if (empty($projectId) || empty($apiKey)) {
        return false;
    }

    $url = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents/notificaciones?key={$apiKey}";

    $doc = [
        'fields' => [
            'tipo'       => ['stringValue' => $tipo],
            'titulo'     => ['stringValue' => $titulo],
            'mensaje'    => ['stringValue' => $mensaje],
            'leida'      => ['booleanValue' => false],
            'fecha'      => ['timestampValue' => date('c')],
        ]
    ];

    // Agregar campos extra
    foreach ($extra as $k => $v) {
        if (is_string($v))  $doc['fields'][$k] = ['stringValue' => $v];
        if (is_int($v))     $doc['fields'][$k] = ['integerValue' => (string)$v];
        if (is_float($v))   $doc['fields'][$k] = ['doubleValue' => $v];
        if (is_bool($v))    $doc['fields'][$k] = ['booleanValue' => $v];
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($doc),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_TIMEOUT        => 5,
    ]);
    $res  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return $code === 200;
}

/**
 * Obtener notificaciones no leídas desde Firestore
 */
function obtenerNotificacionesFirestore(int $limit = 20): array {
    $projectId = FIREBASE_PROJECT_ID;
    $apiKey    = FIREBASE_API_KEY;

    if (empty($projectId) || empty($apiKey)) {
        return [];
    }

    $url = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents/notificaciones"
         . "?pageSize={$limit}&orderBy=fecha+desc&key={$apiKey}";

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 5,
    ]);
    $res  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code !== 200 || empty($res)) return [];

    $data = json_decode($res, true);
    $docs = $data['documents'] ?? [];

    return array_map(function ($d) {
        $f    = $d['fields'] ?? [];
        $name = $d['name'] ?? '';
        $id   = basename($name);
        return [
            'id'      => $id,
            'tipo'    => $f['tipo']['stringValue']    ?? '',
            'titulo'  => $f['titulo']['stringValue']  ?? '',
            'mensaje' => $f['mensaje']['stringValue'] ?? '',
            'leida'   => $f['leida']['booleanValue']  ?? false,
            'fecha'   => $f['fecha']['timestampValue'] ?? '',
        ];
    }, $docs);
}

/**
 * Marcar notificación como leída en Firestore
 */
function marcarNotificacionLeida(string $docId): bool {
    $projectId = FIREBASE_PROJECT_ID;
    $apiKey    = FIREBASE_API_KEY;

    if (empty($projectId) || empty($apiKey)) return false;

    $url  = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents/notificaciones/{$docId}"
          . "?updateMask.fieldPaths=leida&key={$apiKey}";
    $body = ['fields' => ['leida' => ['booleanValue' => true]]];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => 'PATCH',
        CURLOPT_POSTFIELDS     => json_encode($body),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_TIMEOUT        => 5,
    ]);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_exec($ch);
    curl_close($ch);

    return $code === 200;
}

// ================================================================
// NOTIFICACIONES COMPUESTAS (email + Firestore)
// ================================================================

/**
 * Notificar nuevo pedido (email al cliente + Firestore para admin)
 */
function notificarNuevoPedido(array $pedido): void {
    // Email al cliente
    emailPedidoConfirmado($pedido);

    // Notificación Firestore para el panel admin
    crearNotificacionFirestore(
        'nuevo_pedido',
        '🛒 Nuevo pedido recibido',
        "Pedido {$pedido['numero_pedido']} de {$pedido['nombre_cliente']} por " . formatMoney($pedido['total']),
        [
            'pedido_id'     => (int)($pedido['id'] ?? 0),
            'numero_pedido' => $pedido['numero_pedido'],
            'total'         => (float)$pedido['total'],
        ]
    );
}

/**
 * Notificar cambio de estado de pedido
 */
function notificarCambioPedido(array $pedido, string $estadoAnterior): void {
    emailEstadoPedido($pedido, $estadoAnterior);

    crearNotificacionFirestore(
        'estado_pedido',
        '📦 Estado de pedido actualizado',
        "Pedido {$pedido['numero_pedido']}: {$estadoAnterior} → {$pedido['estado']}",
        [
            'pedido_id'      => (int)($pedido['id'] ?? 0),
            'numero_pedido'  => $pedido['numero_pedido'],
            'estado_nuevo'   => $pedido['estado'],
            'estado_anterior'=> $estadoAnterior,
        ]
    );
}

/**
 * Notificar nueva cotización
 */
function notificarNuevaCotizacion(array $cot): void {
    emailCotizacionRecibida($cot);

    crearNotificacionFirestore(
        'nueva_cotizacion',
        '📋 Nueva cotización recibida',
        "Cotización {$cot['numero_cotizacion']} de {$cot['nombre_cliente']} para " . ($cot['tipo_mueble'] ?? 'mueble personalizado'),
        [
            'cotizacion_id'     => (int)($cot['id'] ?? 0),
            'numero_cotizacion' => $cot['numero_cotizacion'],
        ]
    );
}

/**
 * Notificar nueva cita
 */
function notificarNuevaCita(array $cita): void {
    crearNotificacionFirestore(
        'nueva_cita',
        '📅 Nueva cita agendada',
        "Cita {$cita['numero_cita']} de {$cita['nombre_cliente']} para el {$cita['fecha_cita']}",
        [
            'cita_id'     => (int)($cita['id'] ?? 0),
            'numero_cita' => $cita['numero_cita'],
            'fecha_cita'  => $cita['fecha_cita'],
        ]
    );
}
