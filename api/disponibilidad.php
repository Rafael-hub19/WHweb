<?php
/**
 * api/disponibilidad.php
 *
 * GET /api/disponibilidad.php
 *   → devuelve los próximos días hábiles disponibles con su carga real
 *
 * Lógica de negocio:
 *   - Margen mínimo: MARGEN_HABILES días hábiles desde hoy (config.php, default 2)
 *   - Límite diario: LIMITE_DIA productos totales por día (config.php, default 10)
 *     → Cuenta pedidos con estado: pendiente, pagado, en_produccion, listo
 *     → NO cuenta cancelados ni entregados
 *   - Un pedido con 3 productos ocupa 3 de los 10 lugares del día
 *   - Se muestran los próximos DIAS_VISTA días hábiles
 *   - La "fecha sugerida" es el primer día con espacio para TODO el pedido actual
 */

require_once __DIR__ . '/_helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Solo GET permitido', 405);
}

// ── Parámetros de la petición ─────────────────────────────────
$tipoEntrega    = $_GET['tipo_entrega'] ?? 'envio';   // 'envio' | 'recoger'
$cpCliente      = trim($_GET['cp'] ?? '');             // CP del cliente (para agrupar zonas)
$cantidadPedido = max(1, (int)($_GET['cantidad'] ?? 1)); // cuántos productos quiere pedir el usuario

// ── Configuración ──────────────────────────────────────────────
// LIMITE_DIA y MARGEN_HABILES vienen de config.php (definidos ahí para centralizar)
// Si por alguna razón no están definidos, usar fallback
if (!defined('LIMITE_DIA'))    define('LIMITE_DIA',    10);
if (!defined('MARGEN_HABILES')) define('MARGEN_HABILES', 2);
define('DIAS_VISTA', 20);   // cuántos días hábiles mostrar hacia adelante

// ── Calcular fecha mínima de entrega ──────────────────────────
$hoy         = new DateTime();
$fechaMinima = calcularFechaMinima($hoy, MARGEN_HABILES);

// ── Cargar carga real de productos por día de la BD ───────────
$limite = (clone $hoy)->modify('+60 days')->format('Y-m-d');

[$cargaPorDia, $cargaPorZona] = cargarCargaPorDia($hoy->format('Y-m-d'), $limite, $tipoEntrega, $cpCliente);
$diasBloqueados = cargarDiasBloqueados($hoy->format('Y-m-d'), $limite);

// ── Construir lista de días disponibles ───────────────────────
$dias = [];
$fecha = clone $fechaMinima;
$diasHabilesEncontrados = 0;

while ($diasHabilesEncontrados < DIAS_VISTA) {
    $ymd = $fecha->format('Y-m-d');
    $dow = (int)$fecha->format('N'); // 1=Lun … 7=Dom

    // Solo días hábiles (lun-vie) no bloqueados
    if ($dow <= 5 && !in_array($ymd, $diasBloqueados, true)) {
        $productosAgendados = $cargaPorDia[$ymd] ?? 0;
        $lugaresLibres      = max(0, LIMITE_DIA - $productosAgendados);
        $pct                = round(($productosAgendados / LIMITE_DIA) * 100);

        // Detectar si hay pedidos de la misma zona (mismo CP) en este día
        $mismaZona = !empty($cpCliente) && $tipoEntrega === 'envio'
                     && isset($cargaPorZona[$ymd]);

        // Un día está disponible para este pedido SOLO si tiene lugares suficientes
        // para TODOS los productos del pedido actual (no solo 1 lugar libre)
        $disponibleParaEstePedido = $lugaresLibres >= $cantidadPedido;

        $dias[] = [
            'fecha'      => $ymd,
            'etiqueta'   => formatearDia($fecha),
            'disponible' => $disponibleParaEstePedido,
            'lugares_libres'   => $lugaresLibres,
            'lugares_ocupados' => $productosAgendados,
            'lugares_total'    => LIMITE_DIA,
            'porcentaje_ocupado' => $pct,
            'nivel'      => $pct >= 80 ? 'lleno' : ($pct >= 40 ? 'medio' : 'libre'),
            'misma_zona' => $mismaZona,   // true = hay pedidos de tu zona ese día
            'lugares_necesarios' => $cantidadPedido, // para debug/UI
        ];

        $diasHabilesEncontrados++;
    }

    $fecha->modify('+1 day');
}

// ── Fecha sugerida ─────────────────────────────────────────────
// Para domicilio: preferir un día que ya tenga pedidos de la misma zona
// Para tienda o sin CP: primer día disponible
$fechaSugerida = null;
$fechaZona     = null;
foreach ($dias as $d) {
    if ($d['disponible']) {
        if ($fechaSugerida === null) $fechaSugerida = $d['fecha'];
        if ($d['misma_zona'] && $fechaZona === null) $fechaZona = $d['fecha'];
        if ($fechaSugerida && $fechaZona) break;
    }
}
// Usar fecha de zona si existe y es para domicilio
if ($tipoEntrega === 'envio' && !empty($cpCliente) && $fechaZona !== null) {
    $fechaSugerida = $fechaZona;
}

jsonSuccess([
    'fecha_minima'    => $fechaMinima->format('Y-m-d'),
    'fecha_sugerida'  => $fechaSugerida,
    'margen_dias'     => MARGEN_HABILES,
    'limite_por_dia'  => LIMITE_DIA,
    'dias'            => $dias,
]);

// ================================================================
// FUNCIONES
// ================================================================

/**
 * Calcular fecha mínima sumando N días hábiles desde hoy
 */
function calcularFechaMinima(DateTime $hoy, int $diasHabiles): DateTime {
    $fecha    = clone $hoy;
    $contados = 0;

    // Rango para consultar días bloqueados
    $limite = (clone $hoy)->modify('+30 days')->format('Y-m-d');
    $bloqueados = cargarDiasBloqueados($hoy->format('Y-m-d'), $limite);

    while ($contados < $diasHabiles) {
        $fecha->modify('+1 day');
        $dow = (int)$fecha->format('N');
        $ymd = $fecha->format('Y-m-d');

        if ($dow <= 5 && !in_array($ymd, $bloqueados, true)) {
            $contados++;
        }
    }

    return $fecha;
}

/**
 * Cargar suma de productos por día + carga por zona (CP)
 * Retorna [$cargaTotal, $cargaZona]
 *   $cargaTotal[fecha] = total productos ese día
 *   $cargaZona[fecha]  = total productos de ese CP ese día
 */
function cargarCargaPorDia(string $desde, string $hasta, string $tipoEntrega = 'envio', string $cp = ''): array {
    $rows = dbRows(
        "SELECT p.fecha_estimada,
                COALESCE(p.cp_envio, '') AS cp_envio,
                SUM(dp.cantidad) AS total_productos
         FROM pedidos p
         INNER JOIN detalle_pedido dp ON dp.pedido_id = p.id
         WHERE p.fecha_estimada BETWEEN ? AND ?
           AND p.estado NOT IN ('cancelado', 'entregado')
         GROUP BY p.fecha_estimada, p.cp_envio",
        [$desde, $hasta]
    );

    $mapaTotal = [];
    $mapaZona  = [];

    foreach ($rows as $r) {
        $fecha = $r['fecha_estimada'];
        $prod  = (int)$r['total_productos'];

        // Acumular total del día
        $mapaTotal[$fecha] = ($mapaTotal[$fecha] ?? 0) + $prod;

        // Acumular por zona si coincide el CP
        if (!empty($cp) && $r['cp_envio'] === $cp) {
            $mapaZona[$fecha] = ($mapaZona[$fecha] ?? 0) + $prod;
        }
    }

    return [$mapaTotal, $mapaZona];
}

/**
 * Cargar días bloqueados (festivos, cierre de taller, etc.)
 */
function cargarDiasBloqueados(string $desde, string $hasta): array {
    $rows = dbRows(
        "SELECT fecha FROM dias_bloqueados WHERE fecha BETWEEN ? AND ?",
        [$desde, $hasta]
    );
    return array_column($rows, 'fecha');
}

/**
 * Formatear fecha legible en español
 * Ej: "Lunes 23 Feb"
 */
function formatearDia(DateTime $fecha): string {
    $dias   = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    $meses  = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    $dow = (int)$fecha->format('N');
    $d   = (int)$fecha->format('j');
    $m   = (int)$fecha->format('n');
    return "{$dias[$dow]} {$d} {$meses[$m]}";
}