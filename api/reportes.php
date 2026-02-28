<?php
require_once __DIR__ . '/_helpers.php';

$usuario = requerirEmpleado(); // Admin y empleado pueden ver KPIs básicos
$esAdmin = $usuario['rol'] === 'administrador';

if (requestMethod() !== 'GET') jsonError('Método no permitido', 405);

$tipo = $_GET['tipo'] ?? 'resumen';

// Solo admin puede ver reportes financieros detallados
if (in_array($tipo, ['ingresos', 'clientes']) && !$esAdmin) {
    jsonError('Acceso denegado: se requiere rol administrador', 403);
}
$desde = trim($_GET['desde'] ?? date('Y-m-01'));
$hasta = trim($_GET['hasta'] ?? date('Y-m-d'));
$limit = min(100, max(1, sanitizeInt($_GET['limit'] ?? 20)));

switch ($tipo) {
    case 'resumen':
        $hoy  = date('Y-m-d');
        $mes  = date('Y-m-01');

        $totalPedidos = (int)(dbRow("SELECT COUNT(*) AS n FROM pedidos")['n'] ?? 0);
        $pedidosMes   = (int)(dbRow("SELECT COUNT(*) AS n FROM pedidos WHERE DATE(fecha_creacion) >= ?", [$mes])['n'] ?? 0);
        $ingresosMes  = (float)(dbRow("SELECT SUM(total) AS s FROM pedidos WHERE DATE(fecha_creacion) >= ? AND estado NOT IN ('cancelado')", [$mes])['s'] ?? 0);
        $pendientes   = (int)(dbRow("SELECT COUNT(*) AS n FROM pedidos WHERE estado = 'pendiente'")['n'] ?? 0);
        $citasHoy     = (int)(dbRow("SELECT COUNT(*) AS n FROM citas WHERE DATE(fecha_cita) = ?", [$hoy])['n'] ?? 0);
        $cotNuevas    = (int)(dbRow("SELECT COUNT(*) AS n FROM cotizaciones WHERE estado = 'nueva'")['n'] ?? 0);
        $productosAct = (int)(dbRow("SELECT COUNT(*) AS n FROM productos WHERE activo = 1")['n'] ?? 0);

        $estadosPedidos = dbRows(
            "SELECT estado, COUNT(*) AS total FROM pedidos GROUP BY estado ORDER BY total DESC"
        );

        jsonSuccess([
            'total_pedidos'      => $totalPedidos,
            'pedidos_mes'        => $pedidosMes,
            'ingresos_mes'       => $ingresosMes,
            'pedidos_pendientes' => $pendientes,
            'citas_hoy'          => $citasHoy,
            'cotizaciones_nuevas'=> $cotNuevas,
            'productos_activos'  => $productosAct,
            'estados_pedidos'    => $estadosPedidos,
        ]);
        break;

    case 'pedidos':
        $pedidos = dbRows(
            "SELECT id, numero_pedido, nombre_cliente, correo_cliente, estado, subtotal, costo_envio, costo_instalacion, descuento, total, fecha_creacion, fecha_estimada
             FROM pedidos WHERE DATE(fecha_creacion) BETWEEN ? AND ? ORDER BY fecha_creacion DESC",
            [$desde, $hasta]
        );
        $totales = dbRow(
            "SELECT COUNT(*) AS total_pedidos, SUM(total) AS ingresos, SUM(CASE WHEN estado='cancelado' THEN 1 ELSE 0 END) AS cancelados
             FROM pedidos WHERE DATE(fecha_creacion) BETWEEN ? AND ?",
            [$desde, $hasta]
        );
        jsonSuccess(['pedidos' => $pedidos, 'totales' => $totales, 'periodo' => ['desde' => $desde, 'hasta' => $hasta]]);
        break;

    case 'productos':
        $productos = dbRows(
            "SELECT p.nombre AS nombre_producto, SUM(dp.cantidad) AS unidades_vendidas,
                    SUM(dp.subtotal) AS ingresos_generados, COUNT(DISTINCT dp.pedido_id) AS num_pedidos
             FROM detalle_pedido dp
             INNER JOIN pedidos pe ON pe.id = dp.pedido_id
             INNER JOIN productos p ON p.id = dp.producto_id
             WHERE DATE(pe.fecha_creacion) BETWEEN ? AND ? AND pe.estado != 'cancelado'
             GROUP BY dp.producto_id ORDER BY unidades_vendidas DESC LIMIT ?",
            [$desde, $hasta, $limit]
        );
        jsonSuccess(['productos' => $productos]);
        break;

    case 'ingresos':
        $agrupacion = $_GET['agrupacion'] ?? 'dia';
        $formatMap  = ['dia' => '%Y-%m-%d', 'semana' => '%Y-%u', 'mes' => '%Y-%m'];
        $fmt = $formatMap[$agrupacion] ?? '%Y-%m-%d';

        $datos = dbRows(
            "SELECT DATE_FORMAT(fecha_creacion, ?) AS periodo,
                    COUNT(*) AS pedidos,
                    SUM(total) AS ingresos,
                    SUM(subtotal) AS subtotal,
                    SUM(costo_envio) AS envios,
                    SUM(costo_instalacion) AS instalaciones
             FROM pedidos
             WHERE DATE(fecha_creacion) BETWEEN ? AND ? AND estado != 'cancelado'
             GROUP BY periodo ORDER BY periodo ASC",
            [$fmt, $desde, $hasta]
        );

        $total = dbRow(
            "SELECT SUM(total) AS total FROM pedidos WHERE DATE(fecha_creacion) BETWEEN ? AND ? AND estado != 'cancelado'",
            [$desde, $hasta]
        );

        jsonSuccess([
            'datos'       => $datos,
            'total'       => (float)($total['total'] ?? 0),
            'agrupacion'  => $agrupacion,
            'periodo'     => ['desde' => $desde, 'hasta' => $hasta],
        ]);
        break;

    case 'clientes':
        $clientes = dbRows(
            "SELECT correo_cliente, nombre_cliente, COUNT(*) AS total_pedidos,
                    SUM(total) AS total_gastado, MAX(fecha_creacion) AS ultimo_pedido
             FROM pedidos WHERE estado != 'cancelado'
             GROUP BY correo_cliente ORDER BY total_gastado DESC LIMIT ?",
            [$limit]
        );
        jsonSuccess(['clientes' => $clientes]);
        break;

    default:
        jsonError('tipo inválido. Usa: resumen, pedidos, productos, ingresos, clientes', 400);
}
