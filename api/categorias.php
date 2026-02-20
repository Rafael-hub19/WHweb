<?php
require_once __DIR__ . '/_helpers.php';

if (requestMethod() !== 'GET') jsonError('Método no permitido', 405);

$activo = isset($_GET['todas']) ? null : 1;
$sql = $activo !== null
    ? "SELECT id, nombre, descripcion, activo FROM categorias WHERE activo = 1 ORDER BY nombre"
    : "SELECT id, nombre, descripcion, activo FROM categorias ORDER BY nombre";

jsonSuccess(['categorias' => dbRows($sql)]);
