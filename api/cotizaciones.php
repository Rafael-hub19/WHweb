<?php
require_once __DIR__ . '/_helpers.php';

$method = requestMethod();
$id     = isset($_GET['id'])     ? sanitizeInt($_GET['id'])   : null;
$numero = isset($_GET['numero']) ? trim($_GET['numero'])      : null;

switch ($method) {
    case 'GET':
        // Búsqueda pública por número de cotización (para seguimiento sin login)
        if ($numero && !$id) {
            if (!preg_match('/^COT-\d{4,}-\d+$/i', $numero)) {
                jsonError('Formato de número inválido', 422);
            }
            $cot = dbRow(
                "SELECT numero_cotizacion, nombre_cliente, modelo_mueble,
                        descripcion_solicitud, estado, fecha_creacion
                 FROM cotizaciones WHERE numero_cotizacion = ?",
                [$numero]
            );
            if (!$cot) jsonError('Cotización no encontrada', 404);
            jsonSuccess(['cotizacion' => $cot]);
        }

        requerirEmpleado();
        if ($id) {
            $cot = dbRow("SELECT * FROM cotizaciones WHERE id = ?", [$id]);
            if (!$cot) jsonError('Cotización no encontrada', 404);
            jsonSuccess(['cotizacion' => $cot]);
        }
        $page = max(1, sanitizeInt($_GET['page'] ?? 1));
        $limit = min(50, max(1, sanitizeInt($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $where = ['1=1']; $params = [];
        if (!empty($_GET['estado'])) { $where[] = 'estado = ?'; $params[] = $_GET['estado']; }
        if (!empty($_GET['busqueda'])) {
            $b = '%' . $_GET['busqueda'] . '%';
            $where[] = '(numero_cotizacion LIKE ? OR nombre_cliente LIKE ? OR correo_cliente LIKE ?)';
            $params = array_merge($params, [$b, $b, $b]);
        }
        $whereStr = 'WHERE ' . implode(' AND ', $where);
        $total = (int)(dbRow("SELECT COUNT(*) AS n FROM cotizaciones $whereStr", $params)['n'] ?? 0);
        $params[] = $limit; $params[] = $offset;
        $cots = dbRows("SELECT * FROM cotizaciones $whereStr ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?", $params);
        jsonSuccess(['cotizaciones' => $cots, 'paginacion' => getPaginacion($total, $page, $limit)]);
        break;

    case 'POST':
        checkRateLimit('cotizaciones_post', 5, 60); // máx 5 cotizaciones por minuto por IP
        $body = getJsonBody();
        requireFields($body, ['nombre_cliente', 'correo_cliente', 'telefono_cliente', 'descripcion_solicitud']);

        // ── ANTI-BOT: Honeypot ────────────────────────────────────
        if (!empty($body['_hp']) || !empty($body['website']) || !empty($body['url'])) {
            jsonSuccess(['numero_cotizacion' => 'COT-' . date('Y') . '-000000', 'mensaje' => 'Enviado']);
        }

        // ── Validaciones de formato (TODOS los campos) ────────────
        // Email: formato estricto + sin caracteres SQL
        $emailCot = strtolower(trim($body['correo_cliente']));
        if (!isValidEmail($emailCot)) jsonError('Correo electrónico inválido', 422);
        if (strpbrk($emailCot, "'\"`;\\\n\r") !== false) jsonError('Correo electrónico contiene caracteres no permitidos', 422);

        // Teléfono
        if (!isValidPhone($body['telefono_cliente'])) jsonError('Teléfono inválido (mínimo 10 dígitos)', 422);

        // Longitudes máximas
        if (mb_strlen($body['nombre_cliente'])        > 150)  jsonError('Nombre demasiado largo', 422);
        if (mb_strlen($body['descripcion_solicitud']) > 2000) jsonError('Descripción demasiado larga', 422);
        if (mb_strlen($body['medidas']              ?? '') > 600)  jsonError('Medidas demasiado largas', 422);
        if (mb_strlen($body['ciudad']               ?? '') > 120)  jsonError('Ciudad demasiado larga', 422);

        // Campos de selección: validar contra lista permitida
        $tiposValidos = ['baño','sala','recamara','estudio','personalizado',''];
        $modeloMueble   = $body['modelo_mueble'] ?? '';
        if (!in_array($modeloMueble, $tiposValidos, true) && mb_strlen($modeloMueble) > 100) {
            $modeloMueble = sanitize(mb_substr($modeloMueble, 0, 100));
        }

        $presupuestosValidos = ['5-20','20-50','50+',''];
        $presupuesto = in_array($body['rango_presupuesto'] ?? '', $presupuestosValidos, true)
            ? ($body['rango_presupuesto'] ?? '')
            : '';

        $numCot = generarNumeroCotizacion();

        $descripcionCompleta = sanitize($body['descripcion_solicitud']);
        $extra = [];
        if (!empty($body['urgencia']))   $extra[] = 'Urgencia: '        . sanitize($body['urgencia']);
        if (!empty($body['referencia'])) $extra[] = 'Nos conoció por: ' . sanitize($body['referencia']);
        if (!empty($body['instalacion']) && $body['instalacion'] !== 'nose') {
            $extra[] = 'Instalación: ' . sanitize($body['instalacion']);
        }
        if (!empty($body['ciudad'])) $extra[] = 'Ciudad: ' . sanitize($body['ciudad']);
        if ($extra) $descripcionCompleta .= ' | ' . implode(' | ', $extra);

        $datosCot = [
            'numero_cotizacion'     => $numCot,
            'nombre_cliente'        => sanitize($body['nombre_cliente']),
            'correo_cliente'        => $emailCot,
            'telefono_cliente'      => sanitize($body['telefono_cliente']),
            'modelo_mueble'           => sanitize($modeloMueble),
            'descripcion_solicitud' => $descripcionCompleta,
            'tiene_medidas'         => !empty($body['tiene_medidas']) ? 1 : 0,
            'medidas'               => sanitize($body['medidas'] ?? ''),
            'rango_presupuesto'     => $presupuesto,
            'requiere_instalacion'  => !empty($body['requiere_instalacion']) ? 1 : 0,
            'estado'                => 'nueva',
        ];
        $clienteSession = sesionClienteActiva();
        if ($clienteSession) {
            $tieneClienteId = false;
            try { dbRows("SELECT cliente_id FROM cotizaciones LIMIT 0"); $tieneClienteId = true; } catch (\Exception $e) {}
            if ($tieneClienteId) $datosCot['cliente_id'] = $clienteSession['id'];
        }
        $cotId = dbInsert('cotizaciones', $datosCot);

        try {
            // Firebase Cloud Function enviará correos al cliente y al admin
            notificarNuevaCotizacion([
                'id'               => $cotId,
                'numero_cotizacion' => $numCot,
                'nombre_cliente'   => $body['nombre_cliente'],
                'correo_cliente'   => $body['correo_cliente'],
                'telefono_cliente' => $body['telefono_cliente'],
                'modelo_mueble'      => $body['modelo_mueble'] ?? '',
                'descripcion'      => $descripcionCompleta,
            ]);
        } catch (Exception $e) {
            appLog('warning', 'Notif cotizacion falló', ['e' => $e->getMessage()]);
        }

        jsonSuccess(['cotizacion_id' => $cotId, 'numero_cotizacion' => $numCot], 201);
        break;

    case 'PUT':
        requerirEmpleado();
        if (!$id) jsonError('ID requerido', 400);
        $cotActual = dbRow("SELECT * FROM cotizaciones WHERE id = ?", [$id]);
        if (!$cotActual) jsonError('Cotización no encontrada', 404);
        $body = getJsonBody();
        $update = [];
        $estadosValidos = ['nueva', 'en_revision', 'respondida', 'cerrada'];
        if (isset($body['estado'])) {
            if (!in_array($body['estado'], $estadosValidos)) jsonError('Estado inválido', 422);
            $update['estado'] = $body['estado'];
        }
        if (isset($body['notas_admin'])) $update['notas_admin'] = sanitize($body['notas_admin']);
        if ($update) dbUpdate('cotizaciones', $update, 'id = ?', [$id]);

        // Notificar al cliente cuando el admin responde la cotización
        if (!empty($update['estado']) && $update['estado'] === 'respondida'
            && $cotActual['estado'] !== 'respondida') {
            try {
                notificarCotizacionRespondida(array_merge($cotActual, $update));
            } catch (Exception $e) {
                appLog('warning', 'Notif cotizacion respondida fallida', ['e' => $e->getMessage()]);
            }
        }

        jsonSuccess(['mensaje' => 'Cotización actualizada']);
        break;

    default:
        jsonError('Método no permitido', 405);
}