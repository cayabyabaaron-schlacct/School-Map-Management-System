<?php
/*
 ============================================================
  SCHOOLMAP — db.php
  Database connection helper
  Include this file wherever a PDO database connection
  is needed independently of api.php.
 ============================================================

  Usage:
    require_once __DIR__ . '/db.php';
    $pdo = getSchoolMapDB();
    $stmt = $pdo->query("SELECT * FROM locations");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

 ============================================================
*/

/* ============================================================
   DATABASE PATH CONFIGURATION
   ============================================================ */

if (!defined('DB_PATH')) {
    define('DB_PATH', __DIR__ . '/database/schoolmap.sqlite');
}

/* ============================================================
   CONNECTION FACTORY
   Returns a singleton PDO instance with SQLite configuration.
   Creates the database directory and file if they do not exist.
   ============================================================ */

function getSchoolMapDB()
{
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    // Ensure the database directory exists
    $dbDir = dirname(DB_PATH);
    if (!is_dir($dbDir)) {
        if (!mkdir($dbDir, 0755, true)) {
            throw new RuntimeException(
                'Failed to create database directory: ' . $dbDir
            );
        }
    }

    // Ensure the directory is writable
    if (!is_writable($dbDir)) {
        throw new RuntimeException(
            'Database directory is not writable: ' . $dbDir
        );
    }

    try {
        // Create or open SQLite database
        $pdo = new PDO('sqlite:' . DB_PATH);

        // Set PDO error mode to exceptions
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Use associative array as default fetch mode
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        // Emulate prepares — faster for SQLite
        $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

        // Enable WAL mode for better concurrent read performance
        $pdo->exec('PRAGMA journal_mode = WAL;');

        // Enable foreign key enforcement
        $pdo->exec('PRAGMA foreign_keys = ON;');

        // Set SQLite busy timeout (milliseconds) — wait before throwing a lock error
        $pdo->exec('PRAGMA busy_timeout = 5000;');

        return $pdo;

    } catch (PDOException $e) {
        throw new RuntimeException(
            'Could not connect to database: ' . $e->getMessage(),
            (int)$e->getCode(),
            $e
        );
    }
}

/* ============================================================
   HELPER — EXECUTE QUERY WITH PARAMS
   Returns the PDOStatement on success.
   ============================================================ */

function dbQuery(PDO $pdo, $sql, array $params = [])
{
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

/* ============================================================
   HELPER — FETCH SINGLE ROW
   Returns associative array or null if no row found.
   ============================================================ */

function dbFetchOne(PDO $pdo, $sql, array $params = [])
{
    $stmt = dbQuery($pdo, $sql, $params);
    $row  = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row !== false ? $row : null;
}

/* ============================================================
   HELPER — FETCH ALL ROWS
   Returns an array of associative arrays.
   ============================================================ */

function dbFetchAll(PDO $pdo, $sql, array $params = [])
{
    $stmt = dbQuery($pdo, $sql, $params);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/* ============================================================
   HELPER — INSERT AND RETURN LAST INSERT ID
   ============================================================ */

function dbInsert(PDO $pdo, $sql, array $params = [])
{
    dbQuery($pdo, $sql, $params);
    return $pdo->lastInsertId();
}

/* ============================================================
   HELPER — EXECUTE AND RETURN AFFECTED ROW COUNT
   ============================================================ */

function dbExecute(PDO $pdo, $sql, array $params = [])
{
    $stmt = dbQuery($pdo, $sql, $params);
    return $stmt->rowCount();
}

/* ============================================================
   HELPER — BEGIN TRANSACTION WRAPPER
   Usage:
     dbTransaction($pdo, function($pdo) {
         dbExecute($pdo, "INSERT INTO ...", [...]);
         dbExecute($pdo, "UPDATE ...", [...]);
     });
   ============================================================ */

function dbTransaction(PDO $pdo, callable $callback)
{
    $pdo->beginTransaction();
    try {
        $result = $callback($pdo);
        $pdo->commit();
        return $result;
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/* ============================================================
   HELPER — CHECK IF TABLE EXISTS
   ============================================================ */

function dbTableExists(PDO $pdo, $tableName)
{
    $row = dbFetchOne(
        $pdo,
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = :name",
        [':name' => $tableName]
    );
    return $row !== null;
}

/* ============================================================
   HELPER — GET DATABASE FILE SIZE (human readable)
   ============================================================ */

function dbFileSize()
{
    if (!file_exists(DB_PATH)) {
        return '0 B';
    }
    $bytes = filesize(DB_PATH);
    $units = ['B', 'KB', 'MB', 'GB'];
    $i     = 0;
    while ($bytes >= 1024 && $i < count($units) - 1) {
        $bytes /= 1024;
        $i++;
    }
    return round($bytes, 2) . ' ' . $units[$i];
}
