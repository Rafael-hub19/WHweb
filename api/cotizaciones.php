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
                "SELECT numero_cotizacion, nombre_cliente, tipo_mueble,
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
        $body = getJsonBody();
        requireFields($body, ['nombre_cliente', 'correo_cliente', 'telefono_cliente', 'descripcion_solicitud']);
        if (!isValidEmail($body['correo_cliente'])) jsonError('correo_cliente inválido', 422);

        $numCot = generarNumeroCotizacion();
        // Enriquecer descripción con campos extra del formulario web
        $descripcionCompleta = sanitize($body['descripcion_solicitud']);
        $extra = [];
        if (!empty($body['urgencia']))   $extra[] = 'Urgencia: ' . sanitize($body['urgencia']);
        if (!empty($body['referencia'])) $extra[] = 'Nos conoció por: ' . sanitize($body['referencia']);
        if (!empty($body['instalacion']) && $body['instalacion'] !== 'nose') {
            $extra[] = 'Instalación: ' . sanitize($body['instalacion']);
        }
        if ($extra) $descripcionCompleta .= ' | ' . implode(' | ', $extra);

        $cotId = dbInsert('cotizaciones', [
            'numero_cotizacion'     => $numCot,
            'nombre_cliente'        => sanitize($body['nombre_cliente']),
            'correo_cliente'        => strtolower(trim($body['correo_cliente'])),
            'telefono_cliente'      => sanitize($body['telefono_cliente']),
            'tipo_mueble'           => sanitize($body['tipo_mueble'] ?? ''),
            'descripcion_solicitud' => $descripcionCompleta,
            'tiene_medidas'         => !empty($body['tiene_medidas']) ? 1 : 0,
            'medidas'               => sanitize($body['medidas'] ?? ''),
            'rango_presupuesto'     => sanitize($body['rango_presupuesto'] ?? ''),
            'requiere_instalacion'  => !empty($body['requiere_instalacion']) ? 1 : 0,
            'estado'                => 'nueva',
        ]);

        try {
            notificarNuevaCotizacion([
                'numero_cotizacion' => $numCot,
                'nombre_cliente'    => $body['nombre_cliente'],
                'correo_cliente'    => $body['correo_cliente'],
                'tipo_mueble'       => $body['tipo_mueble'] ?? 'Mueble personalizado',
            ]);
            crearNotificacionFirestore('cotizacion_nueva', "Nueva Cotización: $numCot", "Cliente: {$body['nombre_cliente']}", ['numero_cotizacion' => $numCot, 'destino' => 'admin']);
        } catch (Exception $e) {}

        jsonSuccess(['cotizacion_id' => $cotId, 'numero_cotizacion' => $numCot], 201);
        break;

    case 'PUT':
        requerirEmpleado();
        if (!$id) jsonError('ID requerido', 400);
        $body = getJsonBody();
        $update = [];
        $estadosValidos = ['nueva', 'en_revision', 'respondida', 'cerrada'];
        if (isset($body['estado'])) {
            if (!in_array($body['estado'], $estadosValidos)) jsonError('Estado inválido', 422);
            $update['estado'] = $body['estado'];
        }
        if (isset($body['notas_admin'])) $update['notas_admin'] = sanitize($body['notas_admin']);
        if ($update) dbUpdate('cotizaciones', $update, 'id = ?', [$id]);
        jsonSuccess(['mensaje' => 'Cotización actualizada']);
        break;

    default:
        jsonError('Método no permitido', 405);
}