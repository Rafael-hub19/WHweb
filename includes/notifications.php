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

function enviarEmail(string $to, string $subject, string $bodyHtml, string $bodyText = '', string $fromOverride = '', string $fromNameOverride = ''): bool {
    $host     = SMTP_HOST;
    $port     = SMTP_PORT;
    $user     = SMTP_USER;
    $pass     = SMTP_PASS;
    // Usar el remitente específico si se pasa, si no usar el default del .env
    $from     = !empty($fromOverride)     ? $fromOverride     : EMAIL_FROM;
    $fromName = !empty($fromNameOverride) ? $fromNameOverride : EMAIL_FROM_NAME;

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

    // Construir las partes MIME del cuerpo (SIN headers de nivel raíz aquí)
    // Los headers MIME van en $headers, antes del \r\n separador
    $body  = "--{$boundary}\r\n";
    $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: quoted-printable\r\n\r\n";
    $body .= quoted_printable_encode($bodyText) . "\r\n\r\n";
    $body .= "--{$boundary}\r\n";
    $body .= "Content-Type: text/html; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: quoted-printable\r\n\r\n";
    $body .= quoted_printable_encode($bodyHtml) . "\r\n\r\n";
    $body .= "--{$boundary}--";

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
        // CRÍTICO: MIME-Version y Content-Type van ANTES del \r\n separador
        // Si van después, el cliente de correo los muestra como texto en el body
        $headers  = "From: {$fromEncoded}\r\n";
        $headers .= "To: {$to}\r\n";
        $headers .= "Subject: {$subjectEncoded}\r\n";
        $headers .= "Message-ID: {$msgId}\r\n";
        $headers .= "Date: " . date('r') . "\r\n";
        $headers .= "X-Mailer: WoodenHouse/2.0\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";

        // \r\n separa headers de cuerpo — después solo van las partes MIME
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
        // ── Fallback modo demo/escuela: guardar el email como archivo de log ──
        // Si SMTP falla (firewall, sin internet, etc.) el correo se archiva
        // en logs/emails_YYYY-MM.log para que pueda verificarse en demo
        _guardarEmailLog($to, $subject, $bodyText);
        return false;
    }
}

/**
 * Guardar email en archivo de log cuando SMTP no está disponible
 * Útil para demos escolares o entornos sin salida SMTP
 */
function _guardarEmailLog(string $to, string $subject, string $body): void {
    $logDir  = dirname(__DIR__) . '/logs';
    if (!is_dir($logDir)) @mkdir($logDir, 0750, true);
    $archivo = $logDir . '/emails_' . date('Y-m') . '.log';
    $sep     = str_repeat('=', 70);
    $entrada = implode(PHP_EOL, [
        $sep,
        '[EMAIL LOG] ' . date('Y-m-d H:i:s'),
        'TO:      ' . $to,
        'SUBJECT: ' . $subject,
        'BODY:',
        $body,
        '',
    ]);
    @file_put_contents($archivo, $entrada . PHP_EOL, FILE_APPEND | LOCK_EX);
}

// ================================================================
// PLANTILLAS DE EMAIL
// ================================================================

function _emailWrapper(string $titulo, string $contenido): string {
    $year = date('Y');
    $gold = '#8B6914';
    $bg   = '#f0ebe3';
    return <<<HTML
<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$titulo}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    body{margin:0;padding:0;background-color:{$bg};}
    table{border-spacing:0;mso-table-lspace:0pt;mso-table-rspace:0pt;}
    td{padding:0;}
    img{border:0;outline:none;text-decoration:none;display:block;}
    @media only screen and (max-width:640px){
      .email-outer{padding:12px 0 !important;}
      .email-card{width:100% !important;border-radius:0 !important;}
      .email-body{padding:28px 20px !important;}
      .email-header{padding:24px 20px !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:{$bg};">
<div style="display:none;max-height:0;overflow:hidden;">{$titulo} — Wooden House</div>

<!-- ═══ OUTER WRAPPER ═══════════════════════════════════════════ -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0"
       width="100%" class="email-outer"
       style="background-color:{$bg};padding:32px 0;">
  <tr>
    <td align="center" style="padding:0 16px;">

      <!-- ═══ CARD (600px) ═══════════════════════════════════════ -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0"
             width="600" class="email-card"
             style="width:600px;max-width:600px;background:#ffffff;
                    border-radius:10px;overflow:hidden;
                    box-shadow:0 4px 24px rgba(0,0,0,.12);">

        <!-- HEADER -->
        <tr>
          <td align="center" bgcolor="{$gold}" class="email-header"
              style="background-color:{$gold};padding:28px 40px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="center">
                  <p style="margin:0;font-size:11px;letter-spacing:3px;color:rgba(255,255,255,.70);
                             font-family:Arial,sans-serif;text-transform:uppercase;">
                    WOODEN HOUSE
                  </p>
                  <div style="width:48px;height:2px;background:rgba(255,255,255,.40);margin:10px auto;"></div>
                  <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:1px;
                              font-family:Georgia,'Times New Roman',serif;font-weight:normal;">
                    {$titulo}
                  </h1>
                  <p style="margin:8px 0 0;color:rgba(255,255,255,.75);font-size:12px;
                             font-family:Arial,sans-serif;letter-spacing:.5px;">
                    Muebles de baño de madera • Guadalajara, México
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td class="email-body" valign="top"
              style="padding:40px 48px;background:#ffffff;
                     font-family:Georgia,'Times New Roman',serif;
                     font-size:15px;line-height:1.75;color:#3a3a3a;">
            {$contenido}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td align="center" bgcolor="#f8f4ef"
              style="background-color:#f8f4ef;padding:24px 40px;
                     border-top:1px solid #e5ddd4;">
            <p style="margin:0 0 4px;color:#aaa;font-size:11px;
                       font-family:Arial,sans-serif;line-height:1.7;">
              © {$year} Wooden House — Guadalajara, Jalisco, México
            </p>
            <p style="margin:0;color:#bbb;font-size:11px;font-family:Arial,sans-serif;">
              Este correo fue generado automáticamente, por favor no respondas a él.
            </p>
          </td>
        </tr>

      </table>
      <!-- /CARD -->

    </td>
  </tr>
</table>
<!-- /OUTER WRAPPER -->

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
    $trackUrl = APP_URL . "/seguimiento?token={$tracking}&pedido={$folio}";

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

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:25px 0;">
  <tr>
    <td style="background:#faf6f0;border-left:4px solid #8B6914;
                padding:18px 20px;border-radius:4px;">
      <strong style="font-size:18px;color:#5C3D11;display:block;margin-bottom:4px;">{$folio}</strong>
      <span style="color:#888;font-size:13px;">Número de pedido — guárdalo para rastrear tu pedido</span>
    </td>
  </tr>
</table>

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

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;">
  <tr><td align="center">
    <a href="{$trackUrl}"
       style="background:#8B6914;color:#ffffff;text-decoration:none;
               padding:14px 32px;border-radius:6px;font-size:15px;
               font-weight:bold;display:inline-block;mso-padding-alt:0;
               font-family:Georgia,serif;">
      <!--[if mso]><i style="letter-spacing:20px;mso-font-width:-100%;" hidden>&nbsp;</i><![endif]-->
      Rastrear mi pedido →
      <!--[if mso]><i style="letter-spacing:20px;mso-font-width:-100%;" hidden>&nbsp;</i><![endif]-->
    </a>
  </td></tr>
</table>
<p style="color:#888;font-size:13px;text-align:center;">
  También puedes ingresar tu número de pedido en <a href="{$trackUrl}" style="color:#8B6914;">muebleswh.com/seguimiento</a>
</p>
HTML;

    return enviarEmail(
        $pedido['correo_cliente'],
        "Pedido confirmado – {$folio} | Wooden House",
        _emailWrapper("Pedido Confirmado", $contenido),
        '',
        'pedidos@muebleswh.com',
        'Wooden House Pedidos'
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
    $trackUrl = APP_URL . "/seguimiento?token={$tracking}&pedido={$folio}";

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
        _emailWrapper("Estado de Pedido", $contenido),
        '',
        'pedidos@muebleswh.com',
        'Wooden House Pedidos'
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
        'baño'         => 'Mueble de baño',
        'personalizado'=> 'Diseño Personalizado',
        // Legacy values
        'cocina'       => 'Mueble de cocina',
        'closet'       => 'Mueble closet',
        'bano'         => 'Mueble de baño',
        'sala'         => 'Mueble de sala',
        'recamara'     => 'Mueble de recámara',
        'estudio'      => 'Mueble de estudio',
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
        _emailWrapper("Cotización Recibida", $contenido),
        '',
        'ventas@muebleswh.com',
        'Wooden House Ventas'
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
        "Cita confirmada – {$folio} | Wooden House",
        _emailWrapper("Cita Confirmada", $contenido),
        '',
        'soporte@muebleswh.com',
        'Wooden House Soporte'
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
// EMAIL AL ADMINISTRADOR
// ================================================================

/**
 * Enviar email de alerta al administrador cuando llega algo nuevo.
 * Usa SITE_EMAIL definido en .env (ventas@muebleswh.com)
 */
function emailAdminNuevoEvento(string $tipo, array $datos): void {
    $adminEmail = defined('SITE_EMAIL') ? SITE_EMAIL : EMAIL_FROM;

    switch ($tipo) {
        case 'pedido':
            $folio   = htmlspecialchars($datos['numero_pedido'] ?? '');
            $cliente = htmlspecialchars($datos['nombre_cliente'] ?? '');
            $total   = '$' . number_format((float)($datos['total'] ?? 0), 2);
            $subject = "🛒 Nuevo pedido {$folio} — {$total}";
            $body    = <<<HTML
<h2 style="color:#8B6914;margin-top:0;">Nuevo pedido recibido</h2>
<p style="color:#555;">Se acaba de confirmar un pedido en tu tienda.</p>
<div style="background:#faf6f0;border-left:4px solid #8B6914;padding:16px 20px;margin:20px 0;border-radius:4px;">
  <p style="margin:4px 0;"><strong>Folio:</strong> {$folio}</p>
  <p style="margin:4px 0;"><strong>Cliente:</strong> {$cliente}</p>
  <p style="margin:4px 0;"><strong>Total:</strong> {$total}</p>
  <p style="margin:4px 0;"><strong>Entrega:</strong> {$datos['tipo_entrega']}</p>
</div>
<p><a href="https://muebleswh.com/admin" style="background:#8B6914;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;display:inline-block;">Ver en el panel →</a></p>
HTML;
            break;

        case 'cotizacion':
            $folio   = htmlspecialchars($datos['numero_cotizacion'] ?? '');
            $cliente = htmlspecialchars($datos['nombre_cliente'] ?? '');
            $subject = "📋 Nueva cotización {$folio} de {$cliente}";
            $body    = <<<HTML
<h2 style="color:#8B6914;margin-top:0;">Nueva cotización recibida</h2>
<p style="color:#555;">Un cliente ha enviado una solicitud de cotización.</p>
<div style="background:#faf6f0;border-left:4px solid #8B6914;padding:16px 20px;margin:20px 0;border-radius:4px;">
  <p style="margin:4px 0;"><strong>Folio:</strong> {$folio}</p>
  <p style="margin:4px 0;"><strong>Cliente:</strong> {$cliente}</p>
  <p style="margin:4px 0;"><strong>Email:</strong> {$datos['correo_cliente']}</p>
  <p style="margin:4px 0;"><strong>Teléfono:</strong> {$datos['telefono_cliente']}</p>
</div>
<p><a href="https://muebleswh.com/admin" style="background:#8B6914;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;display:inline-block;">Ver en el panel →</a></p>
HTML;
            break;

        case 'cita':
            $folio   = htmlspecialchars($datos['numero_cita'] ?? '');
            $cliente = htmlspecialchars($datos['nombre_cliente'] ?? '');
            $fecha   = htmlspecialchars($datos['fecha_cita'] ?? '');
            $hora    = htmlspecialchars($datos['rango_horario'] ?? '');
            $subject = "📅 Nueva cita {$folio} — {$fecha}";
            $body    = <<<HTML
<h2 style="color:#8B6914;margin-top:0;">Nueva cita agendada</h2>
<p style="color:#555;">Un cliente ha agendado una cita.</p>
<div style="background:#faf6f0;border-left:4px solid #8B6914;padding:16px 20px;margin:20px 0;border-radius:4px;">
  <p style="margin:4px 0;"><strong>Folio:</strong> {$folio}</p>
  <p style="margin:4px 0;"><strong>Cliente:</strong> {$cliente}</p>
  <p style="margin:4px 0;"><strong>Fecha:</strong> {$fecha}</p>
  <p style="margin:4px 0;"><strong>Horario:</strong> {$hora}</p>
</div>
<p><a href="https://muebleswh.com/admin" style="background:#8B6914;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;display:inline-block;">Ver en el panel →</a></p>
HTML;
            break;

        default:
            return;
    }

    // Enviar desde ventas@ (el correo del negocio) al mismo ventas@
    // Reply-To puede ser el cliente para responder fácil
    enviarEmail(
        $adminEmail,
        $subject,
        _emailWrapper('Notificación Interna', $body),
        '',
        'ventas@muebleswh.com',
        'Wooden House Sistema'
    );
}

// ================================================================
// NOTIFICACIONES COMPUESTAS (email + Firestore)
// ================================================================

function notificarNuevoPedido(array $pedido): void {
    // Cloud Function en Firebase maneja los correos automáticamente
    // al detectar el nuevo documento en Firestore con tipo='nuevo_pedido'
    crearNotificacionFirestore(
        'nuevo_pedido',
        '🛒 Nuevo pedido recibido',
        "Pedido {$pedido['numero_pedido']} de {$pedido['nombre_cliente']} por " . formatMoney($pedido['total']),
        [
            'pedido_id'         => (int)($pedido['id'] ?? 0),
            'numero_pedido'     => $pedido['numero_pedido'],
            'total'             => (float)$pedido['total'],
            // datos_pedido: objeto completo para que la Cloud Function genere el correo
            'datos_pedido'      => json_encode([
                'id'                => (int)($pedido['id'] ?? 0),
                'numero_pedido'     => $pedido['numero_pedido'],
                'token_seguimiento' => $pedido['token_seguimiento'] ?? '',
                'nombre_cliente'    => $pedido['nombre_cliente'],
                'correo_cliente'    => $pedido['correo_cliente'],
                'total'             => (float)$pedido['total'],
                'tipo_entrega'      => $pedido['tipo_entrega'] ?? 'envio',
                'fecha_estimada'    => $pedido['fecha_estimada'] ?? '',
                'items'             => $pedido['items'] ?? [],
            ]),
        ]
    );
}

function notificarCambioPedido(array $pedido, string $estadoAnterior): void {
    // Cloud Function envía el correo de actualización de estado al cliente
    crearNotificacionFirestore(
        'estado_pedido',
        '📦 Estado de pedido actualizado',
        "Pedido {$pedido['numero_pedido']}: {$estadoAnterior} → {$pedido['estado']}",
        [
            'pedido_id'      => (int)($pedido['id'] ?? 0),
            'numero_pedido'  => $pedido['numero_pedido'],
            'estado_anterior'=> $estadoAnterior,
            'datos_pedido'   => json_encode([
                'numero_pedido'  => $pedido['numero_pedido'],
                'nombre_cliente' => $pedido['nombre_cliente'],
                'correo_cliente' => $pedido['correo_cliente'],
                'estado_nuevo'   => $pedido['estado'],
                'estado_anterior'=> $estadoAnterior,
            ]),
        ]
    );
}

function notificarNuevaCotizacion(array $cot): void {
    // Cloud Function envía correos al cliente y al admin
    crearNotificacionFirestore(
        'nueva_cotizacion',
        '📋 Nueva cotización recibida',
        "Cotización {$cot['numero_cotizacion']} de {$cot['nombre_cliente']}",
        [
            'cotizacion_id'      => (int)($cot['id'] ?? 0),
            'numero_cotizacion'  => $cot['numero_cotizacion'],
            'datos_cotizacion'   => json_encode([
                'id'                 => (int)($cot['id'] ?? 0),
                'numero_cotizacion'  => $cot['numero_cotizacion'],
                'nombre_cliente'     => $cot['nombre_cliente'],
                'correo_cliente'     => $cot['correo_cliente'],
                'telefono_cliente'   => $cot['telefono_cliente'] ?? '',
                'descripcion'        => $cot['descripcion'] ?? '',
            ]),
        ]
    );
}

function notificarNuevaCita(array $cita): void {
    // Cloud Function envía correos al cliente y al admin
    crearNotificacionFirestore(
        'nueva_cita',
        '📅 Nueva cita agendada',
        "Cita {$cita['numero_cita']} de {$cita['nombre_cliente']} para el {$cita['fecha_cita']}",
        [
            'cita_id'       => (int)($cita['id'] ?? 0),
            'numero_cita'   => $cita['numero_cita'],
            'fecha_cita'    => $cita['fecha_cita'],
            'datos_cita'    => json_encode([
                'id'               => (int)($cita['id'] ?? 0),
                'numero_cita'      => $cita['numero_cita'],
                'nombre_cliente'   => $cita['nombre_cliente'],
                'correo_cliente'   => $cita['correo_cliente'],
                'telefono_cliente' => $cita['telefono_cliente'] ?? '',
                'fecha_cita'       => $cita['fecha_cita'],
                'rango_horario'    => $cita['rango_horario'] ?? '',
                'tipo'             => $cita['tipo'] ?? 'medicion',
            ]),
        ]
    );
}