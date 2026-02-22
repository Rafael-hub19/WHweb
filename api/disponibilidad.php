<?php
/**
 * api/disponibilidad.php
 *
 * GET /api/disponibilidad.php
 *   → devuelve los próximos días hábiles disponibles con su carga real
 *
 * Lógica de negocio:
 *   - Margen mínimo: 2 días hábiles desde hoy (tiempo para arrancar fabricación)
 *   - Límite diario: 5 productos totales por día (SUM de cantidades, no pedidos)
 *   - Un pedido con 3 productos ocupa 3 de los 5 lugares del día
 *   - Se muestran los próximos 14 días hábiles disponibles
 *   - La "fecha sugerida" es el primer día con espacio disponible
 */

require_once __DIR__ . '/_helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Solo GET permitido', 405);
}

// ── Parámetros de la petición ─────────────────────────────────
$tipoEntrega = $_GET['tipo_entrega'] ?? 'envio';   // 'envio' | 'recoger'
$cpCliente   = trim($_GET['cp'] ?? '');             // CP del cliente (para agrupar zonas)

// ── Configuración ──────────────────────────────────────────────
define('LIMITE_PRODUCTOS_DIA', 5);   // máximo productos por día
define('MARGEN_DIAS_HABILES',  2);   // días mínimos desde hoy
define('DIAS_VISTA',          20);   // cuántos días hábiles mostrar hacia adelante

// ── Calcular fecha mínima de entrega ──────────────────────────
$hoy         = new DateTime();
$fechaMinima = calcularFechaMinima($hoy, MARGEN_DIAS_HABILES);

// ── Cargar carga real de productos por día de la BD ───────────
$limite = (clone $hoy)->modify('+60 days')->format('Y-m-d');

$cargaPorDia = cargarCargaPorDia($hoy->format('Y-m-d'), $limite);
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
        $lugaresLibres      = max(0, LIMITE_PRODUCTOS_DIA - $productosAgendados);
        $pct                = round(($productosAgendados / LIMITE_PRODUCTOS_DIA) * 100);

        // Detectar si hay pedidos de la misma zona (mismo CP) en este día
        $mismaZona = !empty($cpCliente) && $tipoEntrega === 'envio'
                     && isset($cargaPorZona[$ymd]);

        $dias[] = [
            'fecha'      => $ymd,
            'etiqueta'   => formatearDia($fecha),
            'disponible' => $lugaresLibres > 0,
            'lugares_libres'   => $lugaresLibres,
            'lugares_ocupados' => $productosAgendados,
            'lugares_total'    => LIMITE_PRODUCTOS_DIA,
            'porcentaje_ocupado' => $pct,
            'nivel'      => $pct >= 80 ? 'lleno' : ($pct >= 40 ? 'medio' : 'libre'),
            'misma_zona' => $mismaZona,   // true = hay pedidos de tu zona ese día
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
    'margen_dias'     => MARGEN_DIAS_HABILES,
    'limite_por_dia'  => LIMITE_PRODUCTOS_DIA,
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