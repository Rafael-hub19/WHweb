<?php
// =============================================================
// Wooden House - Capa de Base de Datos (PDO Singleton)
// =============================================================
require_once __DIR__ . '/config.php';

class Database {
    private static ?PDO $pdo = null;

    public static function get(): PDO {
        if (self::$pdo === null) {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                DB_HOST, DB_PORT, DB_NAME, DB_CHARSET
            );
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
            ];
            try {
                self::$pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                http_response_code(500);
                $msg = APP_DEBUG ? $e->getMessage() : 'Error de conexión a base de datos.';
                die(json_encode(['success' => false, 'error' => $msg]));
            }
        }
        return self::$pdo;
    }
}

// ---- Helpers ----
function db(): PDO { return Database::get(); }

function dbQuery(string $sql, array $params = []): PDOStatement {
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

function dbRow(string $sql, array $params = []): ?array {
    $r = dbQuery($sql, $params)->fetch();
    return $r ?: null;
}

function dbRows(string $sql, array $params = []): array {
    return dbQuery($sql, $params)->fetchAll();
}

function dbInsert(string $table, array $data): int {
    $cols = implode(', ', array_map(fn($k) => "`$k`", array_keys($data)));
    $placeholders = implode(', ', array_fill(0, count($data), '?'));
    dbQuery("INSERT INTO `$table` ($cols) VALUES ($placeholders)", array_values($data));
    return (int) db()->lastInsertId();
}

function dbUpdate(string $table, array $data, string $where, array $whereParams = []): int {
    $sets = implode(', ', array_map(fn($k) => "`$k` = ?", array_keys($data)));
    $stmt = dbQuery("UPDATE `$table` SET $sets WHERE $where", array_merge(array_values($data), $whereParams));
    return $stmt->rowCount();
}
