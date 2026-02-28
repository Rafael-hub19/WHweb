<?php
/**
 * notifications.php - Notificaciones por email (SMTP Brevo) y Firestore
 * Wooden House
 */

if (!defined('WH_LOADED')) {
    require_once __DIR__ . '/config.php';
    require_once __DIR__ . '/functions.php';
}

// ================================================================
// EMAIL — Envío via SMTP con sockets (sin dependencias externas)
// Compatible con Brevo, Gmail, cualquier SMTP
// ================================================================

function enviarEmail(string $to, string $subject, string $bodyHtml, string $bodyText = ''): bool {
    $host     = SMTP_HOST;
    $port     = SMTP_PORT;
    $user     = SMTP_USER;
    $pass     = SMTP_PASS;
    $from     = EMAIL_FROM;
    $fromName = EMAIL_FROM_NAME;

    if (empty($host) || empty($user) || empty($pass)) {
        appLog('error', 'SMTP no configurado', ['to' => $to]);
        return false;
    }

    if (empty($bodyText)) {
        $bodyText = strip_tags($bodyHtml);
    }

    $boundary = md5(uniqid('wh_', true));
    $msgId    = '<' . uniqid('wh') . '@' . (gethostname() ?: 'woodenhouse') . '>';
    $subjectEncoded = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $fromEncoded    = '=?UTF-8?B?' . base64_encode($fromName) . '?= <' . $from . '>';

    // Construir el cuerpo MIME
    $body  = "MIME-Version: 1.0\r\n";
    $body .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";
    $body .= "\r\n";
    $body .= "--{$boundary}\r\n";
    $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: quoted-printable\r\n\r\n";
    $body .= quoted_printable_encode($bodyText) . "\r\n\r\n";
    $body .= "--{$boundary}\r\n";
    $body .= "Content-Type: text/html; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: quoted-printable\r\n\r\n";
    $body .= quoted_printable_encode($bodyHtml) . "\r\n\r\n";
    $body .= "--{$boundary}--\r\n";

    try {
        // Conectar sin cifrado (STARTTLS en puerto 587, TLS directo en puerto 465)
        $useTls  = ((int)$port === 465);
        $prefix  = $useTls ? 'ssl://' : '';
        $socket  = fsockopen($prefix . $host, $port, $errno, $errstr, 15);
        if (!$socket) {
            throw new RuntimeException("No se pudo conectar a SMTP {$host}:{$port} — $errstr ($errno)");
        }
        stream_set_timeout($socket, 15);

        // Leer banner de bienvenida
        $read = fgets($socket, 512);
        if (substr($read, 0, 3) !== '220') {
            throw new RuntimeException("SMTP banner inválido: $read");
        }

        // EHLO inicial
        $hostname = gethostname() ?: 'woodenhouse';
        fwrite($socket, "EHLO {$hostname}\r\n");
        $ehloResp = '';
        while ($line = fgets($socket, 512)) {
            $ehloResp .= $line;
            if (substr($line, 3, 1) === ' ') break; // última línea del multi-line EHLO
        }
        if (substr($ehloResp, 0, 3) !== '250') {
            throw new RuntimeException("EHLO error: " . trim($ehloResp));
        }

        // STARTTLS solo si no es puerto 465 (que ya va cifrado)
        if (!$useTls) {
            fwrite($socket, "STARTTLS\r\n");
            $resp = fgets($socket, 512);
            if (substr($resp, 0, 3) !== '220') {
                throw new RuntimeException("STARTTLS rechazado: " . trim($resp));
            }
            // Actualizar el socket a TLS
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('No se pudo iniciar TLS en el socket');
            }
            // Segundo EHLO post-TLS (requerido por el estándar SMTP)
            fwrite($socket, "EHLO {$hostname}\r\n");
            $ehloResp2 = '';
            while ($line = fgets($socket, 512)) {
                $ehloResp2 .= $line;
                if (substr($line, 3, 1) === ' ') break;
            }
            if (substr($ehloResp2, 0, 3) !== '250') {
                throw new RuntimeException("EHLO post-TLS error: " . trim($ehloResp2));
            }
        }

        // AUTH LOGIN
        $smtpCmd = function($socket, $cmd, $expected) {
            fwrite($socket, $cmd);
            $resp = fgets($socket, 512);
            if (substr($resp, 0, 3) !== $expected) {
                throw new RuntimeException("SMTP error (esperado {$expected}): " . trim($resp));
            }
            return $resp;
        };

        $smtpCmd($socket, "AUTH LOGIN\r\n",                '334');
        $smtpCmd($socket, base64_encode($user) . "\r\n",   '334');
        $smtpCmd($socket, base64_encode($pass) . "\r\n",   '235');
        $smtpCmd($socket, "MAIL FROM:<{$from}>\r\n",       '250');
        $smtpCmd($socket, "RCPT TO:<{$to}>\r\n",           '250');
        $smtpCmd($socket, "DATA\r\n",                      '354');

        // Enviar cabeceras + cuerpo
        $headers  = "From: {$fromEncoded}\r\n";
        $headers .= "To: {$to}\r\n";
        $headers .= "Subject: {$subjectEncoded}\r\n";
        $headers .= "Message-ID: {$msgId}\r\n";
        $headers .= "Date: " . date('r') . "\r\n";
        $headers .= "X-Mailer: WoodenHouse/2.0\r\n";

        fwrite($socket, $headers . "\r\n" . $body . "\r\n.\r\n");
        $resp = fgets($socket, 512);
        if (substr($resp, 0, 3) !== '250') {
            throw new RuntimeException("SMTP DATA error: " . trim($resp));
        }

        fwrite($socket, "QUIT\r\n");
        fclose($socket);

        appLog('info', "Email enviado OK a {$to}", ['subject' => $subject]);
        return true;

    } catch (RuntimeException $e) {
        appLog('error', 'Email SMTP error: ' . $e->getMessage(), ['to' => $to]);
        return false;
    }
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
      <tr><td style="background:{$color};padding:30px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:26px;letter-spacing:2px;">WOODEN HOUSE</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Muebles de baño de madera</p>
      </td></tr>
      <tr><td style="padding:40px 50px;">
        {$contenido}
      </td></tr>
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
 * Email: Confirmación de pedido al cliente
 */
function emailPedidoConfirmado(array $pedido): bool {
    $folio    = htmlspecialchars($pedido['numero_pedido']);
    $nombre   = htmlspecialchars($pedido['nombre_cliente']);
    $total    = formatMoney($pedido['total']);
    $fecha    = $pedido['fecha_estimada'] ?? 'Por confirmar';
    $tracking = $pedido['token_seguimiento'] ?? '';
    $trackUrl = APP_URL . "/seguimiento?token={$tracking}";

    $items = '';
    foreach (($pedido['items'] ?? []) as $item) {
        $items .= sprintf(
            '<tr><td style="padding:8px;border-bottom:1px solid #f0e8d8;">%s</td>'
            . '<td style="padding:8px;border-bottom:1px solid #f0e8d8;text-align:center;">%d</td>'
            . '<td style="padding:8px;border-bottom:1px solid #f0e8d8;text-align:right;">%s</td></tr>',
            htmlspecialchars($item['nombre'] ?? $item['nombre_producto'] ?? ''),
            (int)($item['cantidad'] ?? 1),
            formatMoney($item['precio_unitario'] ?? $item['precio'] ?? 0)
        );
    }

    $contenido = <<<HTML
<h2 style="color:#8B6914;margin-top:0;">¡Pedido confirmado, {$nombre}! 🎉</h2>
<p style="color:#555;line-height:1.7;">Hemos recibido tu pedido. Nos pondremos en contacto para coordinar los detalles de entrega.</p>

<div style="background:#faf6f0;border-left:4px solid #8B6914;padding:20px;margin:25px 0;border-radius:4px;">
  <strong style="font-size:18px;color:#5C3D11;">{$folio}</strong><br>
  <span style="color:#888;font-size:13px;">Número de pedido — guárdalo para rastrear tu pedido</span>
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

<p style="color:#555;"><strong>Semana estimada de entrega:</strong> {$fecha}</p>

<div style="text-align:center;margin:30px 0;">
  <a href="{$trackUrl}" style="background:#8B6914;color:#fff;text-decoration:none;padding:14px 30px;border-radius:6px;font-size:15px;display:inline-block;">
    Rastrear mi pedido →
  </a>
</div>
<p style="color:#888;font-size:13px;text-align:center;">
  También puedes ingresar tu número de pedido en <a href="{$trackUrl}" style="color:#8B6914;">muebleswh.com/seguimiento</a>
</p>
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
        'pendiente'     => 'Pendiente de pago',
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
        'en_produccion' => 'Tu pedido está siendo fabricado por nuestros artesanos.',
        'listo'         => 'Tu pedido está listo. Nos pondremos en contacto para coordinar la entrega.',
        'entregado'     => '¡Tu pedido ha sido entregado! Esperamos que disfrutes tus nuevos muebles.',
        'cancelado'     => 'Tu pedido ha sido cancelado. Si tienes dudas, contáctanos.',
    ];

    $msg      = $mensajes[$estadoActual] ?? 'El estado de tu pedido ha sido actualizado.';
    $tracking = $pedido['token_seguimiento'] ?? '';
    $trackUrl = APP_URL . "/seguimiento?token={$tracking}";

    $contenido = <<<HTML
<h2 style="color:#8B6914;margin-top:0;">Actualización de tu pedido</h2>
<p style="color:#555;">Hola <strong>{$nombre}</strong>, el estado de tu pedido ha cambiado.</p>

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
        "Pedido {$folio} — {$label} | Wooden House",
        _emailWrapper("Estado de Pedido", $contenido)
    );
}

/**
 * Email: Confirmación de cotización
 */
function emailCotizacionRecibida(array $cot): bool {
    $folio  = htmlspecialchars($cot['numero_cotizacion']);
    $nombre = htmlspecialchars($cot['nombre_cliente']);
    // Mapear values del select al label legible para el email
    $tipoMap = [
        'baño'         => 'Modelo Sevilla',
        'baño'         => 'Modelo Roma',
        'baño'         => 'Modelo Edinburgo',
        'baño'         => 'Modelo Singapur',
        'baño'         => 'Modelo Sydney',
        'baño'         => 'Modelo Palermo',
        'baño'         => 'Modelo Budapest',
        'baño'         => 'Modelo Quebec',
        'baño'         => 'Modelo Toronto',
        'baño'         => 'Modelo Amsterdam',
        'personalizado'=> 'Diseño Personalizado',
    ];
    $tipoRaw = $cot['tipo_mueble'] ?? '';
    $tipo    = htmlspecialchars($tipoMap[$tipoRaw] ?? ($tipoRaw ?: 'Mueble personalizado'));

    $contenido = <<<HTML
<h2 style="color:#8B6914;margin-top:0;">Cotización recibida ✓</h2>
<p style="color:#555;line-height:1.7;">Hola <strong>{$nombre}</strong>, recibimos tu solicitud para <strong>{$tipo}</strong>.</p>

<div style="background:#faf6f0;border-left:4px solid #8B6914;padding:20px;margin:25px 0;border-radius:4px;">
  <strong style="font-size:18px;color:#5C3D11;">{$folio}</strong><br>
  <span style="color:#888;font-size:13px;">Número de cotización</span>
</div>

<p style="color:#555;line-height:1.7;">Nuestro equipo revisará tu solicitud y te contactará en <strong>2 a 3 días hábiles</strong>.</p>
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

<p style="color:#555;line-height:1.7;">Si necesitas reagendar, contáctanos con al menos 24 horas de anticipación.</p>
HTML;

    return enviarEmail(
        $cita['correo_cliente'],
        "Cita confirmada – {$fecha} | Wooden House",
        _emailWrapper("Cita Confirmada", $contenido)
    );
}

// ================================================================
// FIRESTORE REST API
// ================================================================

function crearNotificacionFirestore(string $tipo, string $titulo, string $mensaje, array $extra = []): bool {
    $projectId = FIREBASE_PROJECT_ID;
    $apiKey    = FIREBASE_API_KEY;
    if (empty($projectId) || empty($apiKey)) return false;

    $url = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents/notificaciones?key={$apiKey}";

    $doc = ['fields' => [
        'tipo'    => ['stringValue' => $tipo],
        'titulo'  => ['stringValue' => $titulo],
        'mensaje' => ['stringValue' => $mensaje],
        'leida'   => ['booleanValue' => false],
        'fecha'   => ['timestampValue' => date('c')],
    ]];

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
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_exec($ch);
    curl_close($ch);
    return $code === 200;
}

function obtenerNotificacionesFirestore(int $limit = 20): array {
    $projectId = FIREBASE_PROJECT_ID;
    $apiKey    = FIREBASE_API_KEY;
    if (empty($projectId) || empty($apiKey)) return [];

    $url = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents/notificaciones"
         . "?pageSize={$limit}&orderBy=fecha+desc&key={$apiKey}";

    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 5]);
    $res  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code !== 200 || empty($res)) return [];

    $data = json_decode($res, true);
    return array_map(function ($d) {
        $f = $d['fields'] ?? [];
        return [
            'id'      => basename($d['name'] ?? ''),
            'tipo'    => $f['tipo']['stringValue']     ?? '',
            'titulo'  => $f['titulo']['stringValue']   ?? '',
            'mensaje' => $f['mensaje']['stringValue']  ?? '',
            'leida'   => $f['leida']['booleanValue']   ?? false,
            'fecha'   => $f['fecha']['timestampValue'] ?? '',
        ];
    }, $data['documents'] ?? []);
}

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
    curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return $code === 200;
}

// ================================================================
// NOTIFICACIONES COMPUESTAS (email + Firestore)
// ================================================================

function notificarNuevoPedido(array $pedido): void {
    emailPedidoConfirmado($pedido);
    crearNotificacionFirestore(
        'nuevo_pedido',
        '🛒 Nuevo pedido recibido',
        "Pedido {$pedido['numero_pedido']} de {$pedido['nombre_cliente']} por " . formatMoney($pedido['total']),
        ['pedido_id' => (int)($pedido['id'] ?? 0), 'numero_pedido' => $pedido['numero_pedido'], 'total' => (float)$pedido['total']]
    );
}

function notificarCambioPedido(array $pedido, string $estadoAnterior): void {
    emailEstadoPedido($pedido, $estadoAnterior);
    crearNotificacionFirestore(
        'estado_pedido',
        '📦 Estado de pedido actualizado',
        "Pedido {$pedido['numero_pedido']}: {$estadoAnterior} → {$pedido['estado']}",
        ['pedido_id' => (int)($pedido['id'] ?? 0), 'numero_pedido' => $pedido['numero_pedido'], 'estado_nuevo' => $pedido['estado'], 'estado_anterior' => $estadoAnterior]
    );
}

function notificarNuevaCotizacion(array $cot): void {
    emailCotizacionRecibida($cot);
    crearNotificacionFirestore(
        'nueva_cotizacion',
        '📋 Nueva cotización recibida',
        "Cotización {$cot['numero_cotizacion']} de {$cot['nombre_cliente']}",
        ['cotizacion_id' => (int)($cot['id'] ?? 0), 'numero_cotizacion' => $cot['numero_cotizacion']]
    );
}

function notificarNuevaCita(array $cita): void {
    crearNotificacionFirestore(
        'nueva_cita',
        '📅 Nueva cita agendada',
        "Cita {$cita['numero_cita']} de {$cita['nombre_cliente']} para el {$cita['fecha_cita']}",
        ['cita_id' => (int)($cita['id'] ?? 0), 'numero_cita' => $cita['numero_cita'], 'fecha_cita' => $cita['fecha_cita']]
    );
}