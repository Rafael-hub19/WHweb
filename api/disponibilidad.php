<?php
/**
 * api/disponibilidad.php
 * 
 * GET /api/disponibilidad.php
 *   → devuelve las próximas semanas con slots disponibles
 *   → el cliente puede elegir en qué semana quiere su entrega
 * 
 * GET /api/disponibilidad.php?modo=calendario&meses=3
 *   → devuelve un mapa día a día para renderizar en calendario
 * 
 * Cómo se calcula la disponibilidad:
 *   1. Toma los días de fabricación configurados (DIAS_FABRICACION)
 *   2. Calcula la fecha mínima posible = hoy + días_fabricacion (sin fines de semana ni festivos)
 *   3. Consulta cuántos pedidos ya tienen fecha_estimada en cada semana
 *   4. Resta de los slots disponibles de esa semana
 *   5. Solo devuelve semanas con slots_entrega > pedidos_agendados
 */

require_once __DIR__ . '/_helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Solo GET permitido', 405);
}

$modo   = $_GET['modo']   ?? 'semanas';   // semanas | calendario
$meses  = min((int)($_GET['meses'] ?? 3), 6);  // máximo 6 meses vista

// ── Fecha mínima de entrega ────────────────────────────────────────
// No podemos prometer entrega antes de DIAS_FABRICACION días hábiles
$fechaMinima = calcularFechaHabil(new DateTime(), DIAS_FABRICACION);

if ($modo === 'calendario') {
    echo json_encode(obtenerMapaCalendario($fechaMinima, $meses));
    exit;
}

// Modo por defecto: devolver semanas con disponibilidad
echo json_encode(obtenerSemanasDisponibles($fechaMinima, $meses));
exit;

// ================================================================
// FUNCIONES
// ================================================================

/**
 * Calcular fecha hábil sumando N días de trabajo
 * (salta fines de semana y días bloqueados en BD)
 */
function calcularFechaHabil(DateTime $desde, int $diasHabiles): DateTime {
    $fecha   = clone $desde;
    $fecha->modify('+1 day'); // mínimo desde mañana
    $contados = 0;

    // Cargar días bloqueados del rango que nos interesa para no hacer N queries
    $diasBloqueadosDB = cargarDiasBloqueados(
        $fecha->format('Y-m-d'),
        (clone $fecha)->modify('+' . ($diasHabiles * 2) . ' days')->format('Y-m-d')
    );

    while ($contados < $diasHabiles) {
        $dow  = (int)$fecha->format('N'); // 1=Lun … 7=Dom
        $ymd  = $fecha->format('Y-m-d');

        // Contar solo días hábiles: lunes a viernes, no bloqueados
        if ($dow <= 5 && !in_array($ymd, $diasBloqueadosDB, true)) {
            $contados++;
        }

        if ($contados < $diasHabiles) {
            $fecha->modify('+1 day');
        }
    }

    return $fecha;
}

/**
 * Obtener días bloqueados de la BD en un rango de fechas
 */
function cargarDiasBloqueados(string $desde, string $hasta): array {
    $rows = dbRows(
        "SELECT fecha FROM dias_bloqueados WHERE fecha BETWEEN ? AND ?",
        [$desde, $hasta]
    );
    return array_column($rows, 'fecha');
}

/**
 * Obtener el lunes de la semana a la que pertenece una fecha
 */
function lunesDeSemana(DateTime $fecha): DateTime {
    $d   = clone $fecha;
    $dow = (int)$d->format('N'); // 1=Lun
    if ($dow > 1) {
        $d->modify('-' . ($dow - 1) . ' days');
    }
    return $d;
}

/**
 * Obtener semanas disponibles con slots reales de la BD
 */
function obtenerSemanasDisponibles(DateTime $fechaMinima, int $meses): array {
    $hoy    = new DateTime();
    $limite = (clone $hoy)->modify("+{$meses} months");

    // Lunes de la semana donde cae la fecha mínima
    $semanaActual = lunesDeSemana($fechaMinima);

    // ── Cargar capacidades configuradas ──────────────────────────
    $capacidades = dbRows(
        "SELECT semana_inicio, slots_produccion, slots_entrega, bloqueado, motivo_bloqueo
         FROM capacidad_produccion
         WHERE semana_inicio >= ? AND semana_inicio <= ?
         ORDER BY semana_inicio ASC",
        [
            $semanaActual->format('Y-m-d'),
            $limite->format('Y-m-d'),
        ]
    );
    $capMap = [];
    foreach ($capacidades as $c) {
        $capMap[$c['semana_inicio']] = $c;
    }

    // ── Contar pedidos ya agendados por semana ────────────────────
    // Un pedido "ocupa" la semana de su fecha_estimada
    $pedidosPorSemana = dbRows(
        "SELECT
            DATE_SUB(fecha_estimada, INTERVAL (DAYOFWEEK(fecha_estimada) + 5) % 7 DAY) AS semana,
            COUNT(*) AS total
         FROM pedidos
         WHERE fecha_estimada >= ?
           AND fecha_estimada <= ?
           AND estado NOT IN ('cancelado','entregado')
         GROUP BY semana",
        [
            $semanaActual->format('Y-m-d'),
            $limite->format('Y-m-d'),
        ]
    );
    $pedidosMap = [];
    foreach ($pedidosPorSemana as $p) {
        $pedidosMap[$p['semana']] = (int)$p['total'];
    }

    // ── Construir respuesta semana a semana ───────────────────────
    $semanas = [];
    $semana  = clone $semanaActual;

    while ($semana <= $limite) {
        $lunes    = $semana->format('Y-m-d');
        $viernes  = (clone $semana)->modify('+4 days')->format('Y-m-d');

        // Capacidad de la semana (default si no está configurada)
        $cap = $capMap[$lunes] ?? [
            'slots_produccion'  => DIAS_FABRICACION > 0 ? 3 : 0,
            'slots_entrega'     => 5,
            'bloqueado'         => 0,
            'motivo_bloqueo'    => null,
        ];

        $bloqueado        = (bool)$cap['bloqueado'];
        $slotsDisponibles = (int)$cap['slots_entrega'];
        $pedidosAgendados = $pedidosMap[$lunes] ?? 0;
        $slotsLibres      = max(0, $slotsDisponibles - $pedidosAgendados);

        // Solo incluir semanas que ya pasaron la fecha mínima de fabricación
        $esFutura = new DateTime($lunes) >= $semanaActual;

        if ($esFutura && !$bloqueado && $slotsLibres > 0) {
            $semanas[] = [
                'semana_inicio'    => $lunes,
                'semana_fin'       => $viernes,
                'etiqueta'         => formatearSemana($lunes, $viernes),
                'slots_total'      => $slotsDisponibles,
                'slots_ocupados'   => $pedidosAgendados,
                'slots_disponibles'=> $slotsLibres,
                'disponible'       => true,
                // La fecha sugerida es el miércoles de esa semana (punto medio)
                'fecha_sugerida'   => (clone $semana)->modify('+2 days')->format('Y-m-d'),
            ];
        } elseif ($esFutura) {
            // Incluir pero marcada como no disponible (útil para el calendario)
            $semanas[] = [
                'semana_inicio'    => $lunes,
                'semana_fin'       => $viernes,
                'etiqueta'         => formatearSemana($lunes, $viernes),
                'slots_disponibles'=> 0,
                'disponible'       => false,
                'motivo'           => $bloqueado ? ($cap['motivo_bloqueo'] ?? 'Taller cerrado') : 'Capacidad llena',
                'fecha_sugerida'   => (clone $semana)->modify('+2 days')->format('Y-m-d'),
            ];
        }

        $semana->modify('+1 week');
    }

    return [
        'success'           => true,
        'fecha_minima'      => $fechaMinima->format('Y-m-d'),
        'dias_fabricacion'  => DIAS_FABRICACION,
        'semanas'           => $semanas,
        'total_disponibles' => count(array_filter($semanas, fn($s) => $s['disponible'])),
    ];
}

/**
 * Mapa de disponibilidad día a día (para un datepicker tipo calendario)
 */
function obtenerMapaCalendario(DateTime $fechaMinima, int $meses): array {
    $hoy    = new DateTime();
    $limite = (clone $hoy)->modify("+{$meses} months");

    // Cargar pedidos agendados
    $pedidos = dbRows(
        "SELECT fecha_estimada, COUNT(*) AS total
         FROM pedidos
         WHERE fecha_estimada BETWEEN ? AND ?
           AND estado NOT IN ('cancelado','entregado')
         GROUP BY fecha_estimada",
        [$hoy->format('Y-m-d'), $limite->format('Y-m-d')]
    );
    $pedidosPorDia = [];
    foreach ($pedidos as $p) {
        $pedidosPorDia[$p['fecha_estimada']] = (int)$p['total'];
    }

    // Cargar capacidades por semana
    $capacidades = dbRows(
        "SELECT semana_inicio, slots_entrega, bloqueado
         FROM capacidad_produccion
         WHERE semana_inicio BETWEEN ? AND ?",
        [$hoy->format('Y-m-d'), $limite->format('Y-m-d')]
    );
    $capPorSemana = [];
    foreach ($capacidades as $c) {
        $capPorSemana[$c['semana_inicio']] = $c;
    }

    // Cargar días festivos
    $festivos = cargarDiasBloqueados($hoy->format('Y-m-d'), $limite->format('Y-m-d'));

    // Construir mapa día a día
    $dias  = [];
    $fecha = clone $hoy;
    $fecha->modify('+1 day');

    while ($fecha <= $limite) {
        $ymd    = $fecha->format('Y-m-d');
        $dow    = (int)$fecha->format('N');
        $lunes  = lunesDeSemana($fecha)->format('Y-m-d');
        $cap    = $capPorSemana[$lunes] ?? ['slots_entrega' => 5, 'bloqueado' => 0];

        $esFinde   = $dow >= 6;
        $esFestivo = in_array($ymd, $festivos, true);
        $bloqueado = (bool)$cap['bloqueado'];
        $antesMin  = new DateTime($ymd) < $fechaMinima;

        if (!$esFinde && !$esFestivo && !$bloqueado && !$antesMin) {
            $pedidos      = $pedidosPorDia[$ymd] ?? 0;
            // Distribuir slots de la semana equitativamente entre días hábiles (5)
            $slotsDia     = max(0, (int)ceil($cap['slots_entrega'] / 5));
            $libres       = max(0, $slotsDia - $pedidos);

            $dias[$ymd] = [
                'disponible' => $libres > 0,
                'slots'      => $libres,
            ];
        } else {
            $dias[$ymd] = ['disponible' => false, 'slots' => 0];
        }

        $fecha->modify('+1 day');
    }

    return [
        'success'           => true,
        'fecha_minima'      => $fechaMinima->format('Y-m-d'),
        'dias_fabricacion'  => DIAS_FABRICACION,
        'dias'              => $dias,
    ];
}

/**
 * Formatear etiqueta legible de una semana
 * Ej: "24 Feb – 28 Feb 2026"
 */
function formatearSemana(string $lunes, string $viernes): string {
    $meses = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
              'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    $dL = (int)substr($lunes,  8, 2);
    $mL = (int)substr($lunes,  5, 2);
    $dV = (int)substr($viernes, 8, 2);
    $mV = (int)substr($viernes, 5, 2);
    $yr = substr($viernes, 0, 4);

    if ($mL === $mV) {
        return "{$dL} – {$dV} {$meses[$mV]} {$yr}";
    }
    return "{$dL} {$meses[$mL]} – {$dV} {$meses[$mV]} {$yr}";
}
