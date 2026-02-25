<?php
// Capturar cualquier error fatal y devolverlo como JSON en vez de HTML
set_exception_handler(function(Throwable $e) {
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
    }
    echo json_encode(['success' => false, 'error' => 'Error interno: ' . $e->getMessage()]);
    exit;
});

require_once __DIR__ . '/_helpers.php';

$method = requestMethod();
$id     = isset($_GET['id'])    ? sanitizeInt($_GET['id'])    : null;
$token  = isset($_GET['token']) ? trim($_GET['token'])        : null;

switch ($method) {
    case 'GET':
        // Seguimiento público por token
        if ($token) {
            $pedido = dbRow(
                "SELECT id, numero_pedido, nombre_cliente, correo_cliente, telefono_cliente,
                        tipo_entrega, direccion_envio, incluye_instalacion, estado,
                        subtotal, costo_envio, costo_instalacion, descuento, total,
                        fecha_estimada, fecha_creacion, notas
                 FROM pedidos WHERE token_seguimiento = ?",
                [$token]
            );
            if (!$pedido) jsonError('Pedido no encontrado', 404);

            $pedido['items'] = dbRows(
                "SELECT dp.id, dp.producto_id, dp.cantidad, dp.precio_unitario, dp.total_linea AS subtotal, dp.nombre_producto AS producto_nombre
                 FROM detalle_pedido dp
                 WHERE dp.pedido_id = ?",
                [$pedido['id']]
            );
            jsonSuccess(['pedido' => $pedido]);
        }

        // Detalle por ID (requiere autenticación)
        if ($id) {
            requerirEmpleado();
            $pedido = dbRow(
                "SELECT p.*, p.estado, p.total FROM pedidos p WHERE p.id = ?",
                [$id]
            );
            if (!$pedido) jsonError('Pedido no encontrado', 404);
            $pedido['items'] = dbRows(
                "SELECT dp.*, dp.nombre_producto AS producto_nombre FROM detalle_pedido dp
                 WHERE dp.pedido_id = ?",
                [$id]
            );
            $pedido['pagos'] = dbRows(
                "SELECT * FROM pagos WHERE pedido_id = ? ORDER BY fecha_creacion DESC",
                [$id]
            );
            jsonSuccess(['pedido' => $pedido]);
        }

        // Listado (requiere autenticación)
        requerirEmpleado();
        $page   = max(1, sanitizeInt($_GET['page'] ?? 1));
        $limit  = min(50, max(1, sanitizeInt($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $estado = trim($_GET['estado'] ?? '');
        $busq   = trim($_GET['busqueda'] ?? '');
        $desde  = trim($_GET['fecha_desde'] ?? '');
        $hasta  = trim($_GET['fecha_hasta'] ?? '');

        $where = ['1=1'];
        $params = [];
        if ($estado) { $where[] = 'estado = ?'; $params[] = $estado; }
        if ($busq)   { $where[] = '(numero_pedido LIKE ? OR nombre_cliente LIKE ? OR correo_cliente LIKE ?)'; $params = array_merge($params, ["%$busq%", "%$busq%", "%$busq%"]); }
        if ($desde)  { $where[] = 'DATE(fecha_creacion) >= ?'; $params[] = $desde; }
        if ($hasta)  { $where[] = 'DATE(fecha_creacion) <= ?'; $params[] = $hasta; }

        $whereStr = 'WHERE ' . implode(' AND ', $where);
        $total = (int)(dbRow("SELECT COUNT(*) AS n FROM pedidos $whereStr", $params)['n'] ?? 0);
        $params[] = $limit; $params[] = $offset;
        $pedidos = dbRows(
            "SELECT id, numero_pedido, nombre_cliente, correo_cliente, telefono_cliente,
                    tipo_entrega, estado, total, fecha_estimada, fecha_creacion
             FROM pedidos $whereStr ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?",
            $params
        );
        jsonSuccess(['pedidos' => $pedidos, 'paginacion' => getPaginacion($total, $page, $limit)]);
        break;

    case 'POST':
        // Crear pedido (público - sin auth)
        $body = getJsonBody();
        requireFields($body, ['nombre_cliente', 'correo_cliente', 'items']);

        if (!isValidEmail($body['correo_cliente'])) jsonError('correo_cliente inválido', 422);
        if (empty($body['items']) || !is_array($body['items'])) jsonError('items requerido', 422);

        $tipoEntrega = $body['tipo_entrega'] ?? 'envio';
        if (!in_array($tipoEntrega, ['recoger', 'envio'])) {
            $tipoEntrega = 'envio'; // valor por defecto seguro
        }

        if ($tipoEntrega === 'envio' && empty($body['direccion_envio'])) {
            jsonError('direccion_envio requerida para entrega a domicilio', 422);
        }
        $cpEnvio     = sanitize($body['cp_envio']     ?? '');
        $ciudadEnvio = sanitize($body['ciudad_envio'] ?? '');

        // Calcular totales
        $subtotal = 0;
        $itemsData = [];
        foreach ($body['items'] as $item) {
            $prodId  = sanitizeInt($item['producto_id'] ?? 0);
            $cant    = max(1, sanitizeInt($item['cantidad'] ?? 1));
            $prod    = dbRow("SELECT id, nombre, precio_base, stock_disponible FROM productos WHERE id = ? AND activo = 1", [$prodId]);
            if (!$prod) jsonError("Producto ID $prodId no encontrado o inactivo", 422);
            // Sin validación de stock — fabricación bajo pedido

            $precioUnit = (float)$prod['precio_base'];
            $subProd    = $precioUnit * $cant;
            $subtotal  += $subProd;
            $itemsData[] = ['producto' => $prod, 'cantidad' => $cant, 'precio' => $precioUnit, 'subtotal' => $subProd];
        }

        $costoEnvio        = $tipoEntrega === 'envio' ? COSTO_ENVIO : 0;
        $costoInstalacion  = !empty($body['incluye_instalacion']) ? COSTO_INSTALACION : 0;
        $descuento         = sanitizeFloat($body['descuento'] ?? 0);
        $total             = $subtotal + $costoEnvio + $costoInstalacion - $descuento;

        $numeroPedido = generarNumeroPedido();
        $tokenSeg     = generarTokenSeguimiento();
        // Calcular fecha inteligente según tipo de entrega y zona
        $totalProductos = array_sum(array_column(array_map(fn($i) => ['c' => $i['cantidad']], $itemsData), 'c'));
        $fechaEst = calcularFechaInteligente($tipoEntrega, $cpEnvio, $totalProductos);

        try {
            db()->beginTransaction();

            // Verificar si las columnas cp_envio/ciudad_envio existen en la BD
            // Si no, omitirlas (migración pendiente en servidor)
            $tieneColumnasZona = false;
            try {
                dbRows("SELECT cp_envio FROM pedidos LIMIT 0");
                $tieneColumnasZona = true;
            } catch (Exception $e) {
                // Columnas no existen aún — ignorar silenciosamente
            }

            $datosPedido = [
                'numero_pedido'      => $numeroPedido,
                'token_seguimiento'  => $tokenSeg,
                'nombre_cliente'     => sanitize($body['nombre_cliente']),
                'correo_cliente'     => strtolower(trim($body['correo_cliente'])),
                'telefono_cliente'   => sanitize($body['telefono_cliente'] ?? ''),
                'tipo_entrega'       => $tipoEntrega,
                'direccion_envio'    => sanitize($body['direccion_envio'] ?? ''),
                'incluye_instalacion'=> !empty($body['incluye_instalacion']) ? 1 : 0,
                'estado'             => 'pendiente',
                'subtotal'           => $subtotal,
                'costo_envio'        => $costoEnvio,
                'costo_instalacion'  => $costoInstalacion,
                'descuento'          => $descuento,
                'total'              => $total,
                'fecha_estimada'     => $fechaEst,
                'notas'              => sanitize($body['notas'] ?? ''),
            ];

            if ($tieneColumnasZona) {
                $datosPedido['cp_envio']     = $cpEnvio;
                $datosPedido['ciudad_envio'] = $ciudadEnvio;
            }

            $pedidoId = dbInsert('pedidos', $datosPedido);

            foreach ($itemsData as $item) {
                //   nombre_producto (NOT NULL, requerido)
                //   total_linea     (en lugar de 'subtotal' que no existe)
                dbInsert('detalle_pedido', [
                    'pedido_id'       => $pedidoId,
                    'producto_id'     => $item['producto']['id'],
                    'nombre_producto' => $item['producto']['nombre'],
                    'cantidad'        => $item['cantidad'],
                    'precio_unitario' => $item['precio'],
                    'total_linea'     => $item['subtotal'],
                ]);
                // Sin reducción de stock — fabricación bajo pedido
            }

            db()->commit();
        } catch (Exception $e) {
            db()->rollBack();
            appLog('error', 'Error creando pedido', ['error' => $e->getMessage()]);
            jsonError('Error interno al crear el pedido', 500);
        }

        // Notificaciones (no críticas - no bloquean la respuesta)
        try {
            // Armar items para el email
            $itemsEmail = array_map(fn($it) => [
                'nombre'        => $it['producto']['nombre'] ?? '',
                'cantidad'      => $it['cantidad'],
                'precio_unitario' => $it['precio'],
            ], $itemsData);

            notificarNuevoPedido([
                'id'                => $pedidoId,
                'numero_pedido'     => $numeroPedido,
                'nombre_cliente'    => $body['nombre_cliente'],
                'correo_cliente'    => $body['correo_cliente'],
                'token_seguimiento' => $tokenSeg,
                'total'             => $total,
                'fecha_estimada'    => $fechaEst,
                'items'             => $itemsEmail,
            ]);
            crearNotificacionFirestore(
                'pedido_nuevo', "Nuevo Pedido: $numeroPedido",
                "Cliente: {$body['nombre_cliente']} | Total: $" . number_format($total, 2),
                ['numero_pedido' => $numeroPedido, 'destinatarios' => ['admin']]
            );
        } catch (Exception $e) {
            appLog('warning', 'Notificación falló', ['error' => $e->getMessage()]);
        }

        jsonSuccess([
            'pedido_id'          => $pedidoId,
            'numero_pedido'      => $numeroPedido,
            'token_seguimiento'  => $tokenSeg,
            'total'              => $total,
            'fecha_estimada'     => $fechaEst,
        ], 201);
        break;

    case 'PUT':
        requerirEmpleado();
        if (!$id) jsonError('ID requerido', 400);
        $pedido = dbRow("SELECT * FROM pedidos WHERE id = ?", [$id]);
        if (!$pedido) jsonError('Pedido no encontrado', 404);

        $body   = getJsonBody();
        $update = [];
        $estadiosValidos = ['pendiente', 'pagado', 'en_produccion', 'listo', 'entregado', 'cancelado'];

        if (isset($body['estado'])) {
            if (!in_array($body['estado'], $estadiosValidos)) jsonError('Estado inválido', 422);
            $update['estado'] = $body['estado'];
        }
        if (isset($body['fecha_estimada'])) $update['fecha_estimada'] = $body['fecha_estimada'];
        if (isset($body['notas']))           $update['notas']          = sanitize($body['notas']);

        if ($update) dbUpdate('pedidos', $update, 'id = ?', [$id]);

        // Notificar cambio de estado
        if (!empty($update['estado']) && $update['estado'] !== $pedido['estado']) {
            try {
                notificarCambioPedido(array_merge($pedido, $update), $pedido['estado']);
            } catch (Exception $e) {}
        }

        jsonSuccess(['mensaje' => 'Pedido actualizado']);
        break;

    default:
        jsonError('Método no permitido', 405);
}