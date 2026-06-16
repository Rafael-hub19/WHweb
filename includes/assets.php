<?php
// assets.php — cache-busting automático para /public/assets/js
// Sin dependencias de sesión: se puede cargar en cualquier página.
function av(string $relPath): string {
    static $base = null;
    if ($base === null) {
        $base = dirname(__DIR__) . '/public/assets/';
    }
    $v = @filemtime($base . $relPath) ?: time();
    return $relPath . '?v=' . $v;
}
