<?php
/**
 * api/seguimiento.php — Endpoint público de seguimiento sin autenticación
 * Permite buscar pedidos, citas y cotizaciones por número de folio
 * 
 * GET /api/seguimiento.php?numero=WH-2026-000001  → pedido
 * GET /api/seguimiento.php?numero=CIT-2026-000001 → cita
 * GET /api/seguimiento.php?numero=COT-2026-000001 → cotización
 */

// Suprimir errores PHP antes de cualquier output
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

// Bootstrap mínimo — NO cargamos auth para evitar cualquier redirect
if (!defined('WH_API_REQUEST')) define('WH_API_REQUEST', true);
if (!defined('WH_LOADED')) require_once dirname(__DIR__) . '/includes/config.php';
require_once dirname(__DIR__) . '/includes/db.php';
require_once dirname(__DIR__) . '/includes/functions.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-store, no-cache');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'error' => 'Solo GET permitido']); exit;
}

// Rate limit: 20 consultas por IP cada 60 segundos — previene enumeración de folios
$ip       = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rlFile   = sys_get_temp_dir() . '/wh_rl_' . md5('seguimiento' . $ip) . '.json';
$now      = time();
$rlData   = file_exists($rlFile) ? (json_decode(file_get_contents($rlFile), true) ?? []) : [];
$rlData   = array_filter($rlData, fn($t) => ($now - $t) < 60);
if (count($rlData) >= 20) {
    http_response_code(429);
    echo json_encode(['success' => false, 'error' => 'Demasiadas consultas. Espera un momento e intenta de nuevo.']);
    exit;
}
$rlData[] = $now;
@file_put_contents($rlFile, json_encode(array_values($rlData)), LOCK_EX);

$numero = trim(strtoupper($_GET['numero'] ?? ''));
if (!$numero) {
    echo json_encode(['success' => false, 'error' => 'Parámetro numero requerido']); exit;
}

try {
    // ── Pedido ────────────────────────────────────────────────────
    if (preg_match('/^WH-\d{4}-\d{6}$/', $numero)) {
        $pedido = dbRow(
            "SELECT id, numero_pedido, nombre_cliente, estado,
                    total, fecha_estimada, fecha_creacion,
                    tipo_entrega, incluye_instalacion
             FROM pedidos WHERE numero_pedido = ?",
            [$numero]
        );
        if (!$pedido) {
            echo json_encode(['success' => false, 'error' => 'Pedido no encontrado']); exit;
        }
        $pedido['items'] = dbRows(
            "SELECT dp.cantidad, dp.precio_unitario, dp.nombre_producto AS producto_nombre,
                    COALESCE(dp.total_linea, dp.cantidad * dp.precio_unitario) AS subtotal
             FROM detalle_pedido dp WHERE dp.pedido_id = ?",
            [$pedido['id']]
        );
        echo json_encode(['success' => true, 'pedido' => $pedido]); exit;
    }

    // ── Cita ──────────────────────────────────────────────────────
    if (preg_match('/^CIT-\d{4}-\d{6}$/', $numero)) {
        $cita = dbRow(
            "SELECT numero_cita, nombre_cliente, fecha_cita, rango_horario, tipo, estado, fecha_creacion
             FROM citas WHERE numero_cita = ?",
            [$numero]
        );
        if (!$cita) {
            echo json_encode(['success' => false, 'error' => 'Cita no encontrada']); exit;
        }
        echo json_encode(['success' => true, 'cita' => $cita]); exit;
    }

    // ── Cotización ────────────────────────────────────────────────
    if (preg_match('/^COT-\d{4,}-\d+$/i', $numero)) {
        $cot = dbRow(
            "SELECT numero_cotizacion, nombre_cliente, modelo_mueble,
                    descripcion_solicitud, estado, fecha_creacion
             FROM cotizaciones WHERE numero_cotizacion = ?",
            [$numero]
        );
        if (!$cot) {
            echo json_encode(['success' => false, 'error' => 'Cotización no encontrada']); exit;
        }
        echo json_encode(['success' => true, 'cotizacion' => $cot]); exit;
    }

    echo json_encode(['success' => false, 'error' => 'Formato inválido. Usa: WH-2026-000001, CIT-2026-000001, o COT-2026-000001']); exit;

} catch (Throwable $e) {
    error_log('seguimiento.php error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Error interno. Intenta de nuevo.']); exit;
}
