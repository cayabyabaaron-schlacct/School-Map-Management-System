<?php
/*
 ============================================================
  SCHOOLMAP — api.php
  Full PHP REST API backend for SchoolMap application
  Uses SQLite (via PHP PDO) — no external database required
  Requires: PHP 7.4+, PDO, PDO_SQLite extensions
 ============================================================

  ENDPOINTS:
  ----------
  POST   /api.php?action=login           — Login a user
  POST   /api.php?action=register        — Register a new user
  POST   /api.php?action=logout          — Logout current user
  GET    /api.php?action=me              — Get current session user
  GET    /api.php?action=locations       — Get all locations
  POST   /api.php?action=locations       — Create a new location
  PUT    /api.php?action=locations&id=X  — Update a location
  DELETE /api.php?action=locations&id=X  — Delete a location
  GET    /api.php?action=floors          — Get all floors
  POST   /api.php?action=floors          — Create a new floor
  PUT    /api.php?action=floors&id=X     — Update a floor
  DELETE /api.php?action=floors&id=X     — Delete a floor
  GET    /api.php?action=legends         — Get legend items
  PUT    /api.php?action=legends&id=X    — Update a legend item
  POST   /api.php?action=reset           — Reset all data to defaults
 ============================================================
*/

/* ============================================================
   CONFIGURATION
   ============================================================ */

define('DB_PATH',       __DIR__ . '/database/schoolmap.sqlite');
define('SESSION_NAME',  'schoolmap_session');
define('APP_VERSION',   '1.0');

/* ============================================================
   BOOTSTRAP
   ============================================================ */

// Start PHP session for authentication
session_name(SESSION_NAME);
session_start();

// Set JSON response headers
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// Handle pre-flight CORS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Read the request body for POST/PUT requests
$requestBody = file_get_contents('php://input');
$requestData = array();
if (!empty($requestBody)) {
    $requestData = json_decode($requestBody, true);
    if ($requestData === null) {
        $requestData = array();
    }
}

// Merge query params and request body
$action     = isset($_GET['action'])  ? trim($_GET['action'])  : '';
$resourceId = isset($_GET['id'])      ? trim($_GET['id'])      : '';
$method     = $_SERVER['REQUEST_METHOD'];

/* ============================================================
   DATABASE INITIALIZATION
   ============================================================ */

function getDatabase()
{
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    // Create database directory if it does not exist
    $dbDir = dirname(DB_PATH);
    if (!is_dir($dbDir)) {
        mkdir($dbDir, 0755, true);
    }

    try {
        $pdo = new PDO('sqlite:' . DB_PATH);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec('PRAGMA foreign_keys = ON');

        initializeSchema($pdo);
        seedDefaultData($pdo);

        return $pdo;
    } catch (PDOException $e) {
        jsonError(500, 'Database connection failed: ' . $e->getMessage());
        exit;
    }
}

function initializeSchema(PDO $pdo)
{
    // Users table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id          TEXT PRIMARY KEY,
            full_name   TEXT NOT NULL,
            email       TEXT NOT NULL UNIQUE,
            username    TEXT NOT NULL UNIQUE,
            role        TEXT NOT NULL DEFAULT 'student',
            password    TEXT NOT NULL,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        )
    ");

    // Floors table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS floors (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            label       TEXT NOT NULL,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        )
    ");

    // Legends table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS legends (
            id          TEXT PRIMARY KEY,
            type        TEXT NOT NULL UNIQUE,
            label       TEXT NOT NULL,
            color       TEXT NOT NULL,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        )
    ");

    // Locations table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS locations (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            description TEXT,
            type        TEXT NOT NULL,
            floor       INTEGER NOT NULL,
            x           REAL NOT NULL DEFAULT 50,
            y           REAL NOT NULL DEFAULT 50,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
        )
    ");

    // Seeded flag
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS metadata (
            key_name    TEXT PRIMARY KEY,
            value       TEXT NOT NULL
        )
    ");
}

function seedDefaultData(PDO $pdo)
{
    // Check if already seeded
    $stmt = $pdo->query("SELECT value FROM metadata WHERE key_name = 'seeded'");
    $row  = $stmt->fetch();
    if ($row) {
        return; // Already seeded
    }

    seedAdminUser($pdo);
    seedFloors($pdo);
    seedLegends($pdo);
    seedLocations($pdo);

    $pdo->exec("INSERT INTO metadata (key_name, value) VALUES ('seeded', '1')");
}

function seedAdminUser(PDO $pdo)
{
    $stmt = $pdo->prepare("
        INSERT OR IGNORE INTO users (id, full_name, email, username, role, password)
        VALUES (:id, :full_name, :email, :username, :role, :password)
    ");
    $stmt->execute([
        ':id'        => 'admin-1',
        ':full_name' => 'Administrator',
        ':email'     => 'admin@schoolmap.edu',
        ':username'  => 'admin',
        ':role'      => 'admin',
        ':password'  => 'admin123'
    ]);
}

function seedFloors(PDO $pdo)
{
    $floors = [
        ['name' => 'Ground Floor', 'label' => '1F'],
        ['name' => '2nd Floor',    'label' => '2F'],
        ['name' => '3rd Floor',    'label' => '3F'],
    ];

    $stmt = $pdo->prepare("INSERT OR IGNORE INTO floors (name, label) VALUES (:name, :label)");
    foreach ($floors as $floor) {
        $stmt->execute([':name' => $floor['name'], ':label' => $floor['label']]);
    }
}

function seedLegends(PDO $pdo)
{
    $legends = [
        ['id' => 'classroom', 'type' => 'classroom', 'label' => 'Classroom',         'color' => '#192A57'],
        ['id' => 'office',    'type' => 'office',    'label' => 'VP / Admin Office',  'color' => '#8F3347'],
        ['id' => 'admin',     'type' => 'admin',     'label' => 'Admin / Registrar',  'color' => '#C24322'],
        ['id' => 'library',   'type' => 'library',   'label' => 'Library',            'color' => '#2d5da1'],
        ['id' => 'cafeteria', 'type' => 'cafeteria', 'label' => 'Cafeteria',          'color' => '#b45309'],
        ['id' => 'gym',       'type' => 'gym',       'label' => 'Gymnasium',          'color' => '#15803d'],
        ['id' => 'restroom',  'type' => 'restroom',  'label' => 'Restroom',           'color' => '#6b7280'],
        ['id' => 'stairwell', 'type' => 'stairwell', 'label' => 'Stairwell',          'color' => '#7c3aed'],
        ['id' => 'entrance',  'type' => 'entrance',  'label' => 'Entrance / Exit',    'color' => '#0891b2'],
        ['id' => 'emergency', 'type' => 'emergency', 'label' => 'Emergency Exit',     'color' => '#dc2626'],
    ];

    $stmt = $pdo->prepare("
        INSERT OR IGNORE INTO legends (id, type, label, color)
        VALUES (:id, :type, :label, :color)
    ");
    foreach ($legends as $leg) {
        $stmt->execute($leg);
    }
}

function seedLocations(PDO $pdo)
{
    // Ground floor (floor id = 1)
    $locations = [
        ['id' => 'entrance-main',  'name' => 'Main Entrance',         'type' => 'entrance',  'floor' => 1, 'x' => 50, 'y' => 7,  'description' => 'Main building entrance (top)'],
        ['id' => 'entrance-left',  'name' => 'Exit / Entrance Left',  'type' => 'entrance',  'floor' => 1, 'x' => 3,  'y' => 53, 'description' => 'Left side emergency exit'],
        ['id' => 'entrance-right', 'name' => 'Exit / Entrance Right', 'type' => 'entrance',  'floor' => 1, 'x' => 97, 'y' => 53, 'description' => 'Right side emergency exit'],
        ['id' => 'stair-left',     'name' => 'Stairwell Left',        'type' => 'stairwell', 'floor' => 1, 'x' => 27, 'y' => 91, 'description' => 'Left stairwell to upper floors'],
        ['id' => 'stair-right',    'name' => 'Stairwell Right',       'type' => 'stairwell', 'floor' => 1, 'x' => 73, 'y' => 91, 'description' => 'Right stairwell to upper floors'],
        ['id' => 'room-101',       'name' => 'Room 101',              'type' => 'classroom', 'floor' => 1, 'x' => 5,  'y' => 28, 'description' => 'Classroom / Office'],
        ['id' => 'room-102',       'name' => 'Room 102',              'type' => 'classroom', 'floor' => 1, 'x' => 12, 'y' => 28, 'description' => 'Classroom / Office'],
        ['id' => 'room-103',       'name' => 'Room 103',              'type' => 'office',    'floor' => 1, 'x' => 19, 'y' => 28, 'description' => 'Faculty Office'],
        ['id' => 'restroom-1a',    'name' => 'Restroom (Left)',       'type' => 'restroom',  'floor' => 1, 'x' => 25, 'y' => 28, 'description' => 'Ground floor left restroom'],
        ['id' => 'room-104',       'name' => 'Room 104',              'type' => 'classroom', 'floor' => 1, 'x' => 31, 'y' => 28, 'description' => 'Classroom'],
        ['id' => 'parking-1',      'name' => 'Parking / Storage',     'type' => 'admin',     'floor' => 1, 'x' => 38, 'y' => 28, 'description' => 'Parking / storage area'],
        ['id' => 'cafeteria-1',    'name' => 'Cafeteria',             'type' => 'cafeteria', 'floor' => 1, 'x' => 45, 'y' => 28, 'description' => 'Student dining / café area'],
        ['id' => 'lobby-1',        'name' => 'Central Lobby',         'type' => 'entrance',  'floor' => 1, 'x' => 50, 'y' => 55, 'description' => 'Open lobby with garden feature'],
        ['id' => 'room-105',       'name' => 'Room 105',              'type' => 'office',    'floor' => 1, 'x' => 58, 'y' => 28, 'description' => 'Admin Office'],
        ['id' => 'restroom-1b',    'name' => 'Restroom (Right)',      'type' => 'restroom',  'floor' => 1, 'x' => 64, 'y' => 28, 'description' => 'Ground floor right restroom'],
        ['id' => 'room-106',       'name' => 'Room 106',              'type' => 'classroom', 'floor' => 1, 'x' => 71, 'y' => 28, 'description' => 'Classroom'],
        ['id' => 'library-1',      'name' => 'Library / Hall',        'type' => 'library',   'floor' => 1, 'x' => 80, 'y' => 28, 'description' => 'School library / function hall'],
        ['id' => 'room-107',       'name' => 'Room 107',              'type' => 'classroom', 'floor' => 1, 'x' => 91, 'y' => 28, 'description' => 'Classroom'],
        ['id' => 'room-108',       'name' => 'Room 108',              'type' => 'classroom', 'floor' => 1, 'x' => 11, 'y' => 71, 'description' => 'Classroom'],
        ['id' => 'room-109',       'name' => 'Room 109',              'type' => 'admin',     'floor' => 1, 'x' => 18, 'y' => 71, 'description' => 'Admin Office'],
        ['id' => 'room-110',       'name' => 'Room 110',              'type' => 'classroom', 'floor' => 1, 'x' => 25, 'y' => 71, 'description' => 'Classroom'],
        ['id' => 'room-111',       'name' => 'Room 111',              'type' => 'classroom', 'floor' => 1, 'x' => 33, 'y' => 71, 'description' => 'Classroom'],
        ['id' => 'room-112',       'name' => 'Room 112',              'type' => 'classroom', 'floor' => 1, 'x' => 60, 'y' => 71, 'description' => 'Classroom'],
        ['id' => 'room-113',       'name' => 'Room 113',              'type' => 'office',    'floor' => 1, 'x' => 68, 'y' => 71, 'description' => 'Office'],
        ['id' => 'gym-1',          'name' => 'Gymnasium',             'type' => 'gym',       'floor' => 1, 'x' => 76, 'y' => 71, 'description' => 'Sports & physical education'],
        ['id' => 'room-114',       'name' => 'Room 114',              'type' => 'classroom', 'floor' => 1, 'x' => 84, 'y' => 71, 'description' => 'Classroom'],
        ['id' => 'room-115',       'name' => 'Room 115',              'type' => 'cafeteria', 'floor' => 1, 'x' => 91, 'y' => 71, 'description' => 'Canteen / Food area'],
        // 2nd floor
        ['id' => 'vp-room',        'name' => "VP Office",             'type' => 'office',    'floor' => 2, 'x' => 30, 'y' => 30, 'description' => "Vice President's office"],
        ['id' => 'president-room', 'name' => "President's Office",    'type' => 'office',    'floor' => 2, 'x' => 60, 'y' => 25, 'description' => "School President's office"],
        ['id' => 'registrar',      'name' => 'Registrar',             'type' => 'admin',     'floor' => 2, 'x' => 45, 'y' => 55, 'description' => 'Student records & registration'],
        ['id' => 'mis',            'name' => 'MIS Office',            'type' => 'admin',     'floor' => 2, 'x' => 75, 'y' => 55, 'description' => 'Management Information Systems'],
        ['id' => 'room-201',       'name' => 'Room 201 - English',    'type' => 'classroom', 'floor' => 2, 'x' => 20, 'y' => 70, 'description' => 'English department'],
        ['id' => 'room-202',       'name' => 'Room 202 - History',    'type' => 'classroom', 'floor' => 2, 'x' => 50, 'y' => 72, 'description' => 'Social studies'],
        ['id' => 'restroom-2a',    'name' => 'Restroom (2nd)',        'type' => 'restroom',  'floor' => 2, 'x' => 80, 'y' => 80, 'description' => 'Second floor restroom'],
        ['id' => 'stair-2',        'name' => 'Stairwell A (2F)',      'type' => 'stairwell', 'floor' => 2, 'x' => 15, 'y' => 85, 'description' => 'Stairwell access'],
        // 3rd floor
        ['id' => 'room-301',       'name' => 'Room 301 - Computer Lab', 'type' => 'classroom', 'floor' => 3, 'x' => 30, 'y' => 35, 'description' => 'Computer laboratory'],
        ['id' => 'room-302',       'name' => 'Room 302 - Arts',          'type' => 'classroom', 'floor' => 3, 'x' => 60, 'y' => 35, 'description' => 'Arts & crafts room'],
        ['id' => 'room-303',       'name' => 'Room 303 - Music',         'type' => 'classroom', 'floor' => 3, 'x' => 45, 'y' => 60, 'description' => 'Music room'],
        ['id' => 'restroom-3a',    'name' => 'Restroom (3rd)',           'type' => 'restroom',  'floor' => 3, 'x' => 15, 'y' => 75, 'description' => 'Third floor restroom'],
        ['id' => 'emergency-3',    'name' => 'Emergency Exit',           'type' => 'emergency', 'floor' => 3, 'x' => 80, 'y' => 90, 'description' => 'Emergency exit'],
    ];

    $stmt = $pdo->prepare("
        INSERT OR IGNORE INTO locations (id, name, description, type, floor, x, y)
        VALUES (:id, :name, :description, :type, :floor, :x, :y)
    ");
    foreach ($locations as $loc) {
        $stmt->execute([
            ':id'          => $loc['id'],
            ':name'        => $loc['name'],
            ':description' => $loc['description'],
            ':type'        => $loc['type'],
            ':floor'       => $loc['floor'],
            ':x'           => $loc['x'],
            ':y'           => $loc['y'],
        ]);
    }
}

/* ============================================================
   RESPONSE HELPERS
   ============================================================ */

function jsonResponse($data, $statusCode = 200)
{
    http_response_code($statusCode);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonError($statusCode, $message, $details = null)
{
    $response = ['error' => true, 'message' => $message];
    if ($details !== null) {
        $response['details'] = $details;
    }
    http_response_code($statusCode);
    echo json_encode($response, JSON_PRETTY_PRINT);
    exit;
}

function jsonSuccess($message = 'Success', $data = null)
{
    $response = ['success' => true, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    jsonResponse($response, 200);
}

function requireAuth()
{
    if (!isset($_SESSION['user_id'])) {
        jsonError(401, 'Unauthorized. Please log in.');
    }
}

function requireAdmin()
{
    requireAuth();
    if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
        jsonError(403, 'Forbidden. Admin access required.');
    }
}

function getRequestField($data, $field, $required = true)
{
    if (isset($data[$field]) && $data[$field] !== '') {
        return $data[$field];
    }
    if ($required) {
        jsonError(400, "Field '{$field}' is required.");
    }
    return null;
}

function sanitizeString($value)
{
    return htmlspecialchars(strip_tags(trim((string)$value)), ENT_QUOTES, 'UTF-8');
}

function generateId($prefix = 'id')
{
    return $prefix . '-' . uniqid() . '-' . mt_rand(1000, 9999);
}

/* ============================================================
   ROUTE DISPATCHER
   ============================================================ */

try {
    $pdo = getDatabase();
    dispatchRequest($pdo, $action, $resourceId, $method, $requestData);
} catch (PDOException $e) {
    jsonError(500, 'Database error: ' . $e->getMessage());
} catch (Exception $e) {
    jsonError(500, 'Server error: ' . $e->getMessage());
}

function dispatchRequest(PDO $pdo, $action, $resourceId, $method, $requestData)
{
    switch ($action) {

        /* -------------------------------------------------------
           AUTH ENDPOINTS
           ------------------------------------------------------- */

        case 'login':
            if ($method !== 'POST') { jsonError(405, 'Method Not Allowed'); }
            handleLogin($pdo, $requestData);
            break;

        case 'register':
            if ($method !== 'POST') { jsonError(405, 'Method Not Allowed'); }
            handleRegister($pdo, $requestData);
            break;

        case 'logout':
            handleLogout();
            break;

        case 'me':
            handleGetCurrentUser($pdo);
            break;

        /* -------------------------------------------------------
           LOCATIONS ENDPOINTS
           ------------------------------------------------------- */

        case 'locations':
            if ($method === 'GET') {
                handleGetLocations($pdo);
            } elseif ($method === 'POST') {
                requireAdmin();
                handleCreateLocation($pdo, $requestData);
            } elseif ($method === 'PUT') {
                requireAdmin();
                handleUpdateLocation($pdo, $resourceId, $requestData);
            } elseif ($method === 'DELETE') {
                requireAdmin();
                handleDeleteLocation($pdo, $resourceId);
            } else {
                jsonError(405, 'Method Not Allowed');
            }
            break;

        /* -------------------------------------------------------
           FLOORS ENDPOINTS
           ------------------------------------------------------- */

        case 'floors':
            if ($method === 'GET') {
                handleGetFloors($pdo);
            } elseif ($method === 'POST') {
                requireAdmin();
                handleCreateFloor($pdo, $requestData);
            } elseif ($method === 'PUT') {
                requireAdmin();
                handleUpdateFloor($pdo, $resourceId, $requestData);
            } elseif ($method === 'DELETE') {
                requireAdmin();
                handleDeleteFloor($pdo, $resourceId);
            } else {
                jsonError(405, 'Method Not Allowed');
            }
            break;

        /* -------------------------------------------------------
           LEGENDS ENDPOINTS
           ------------------------------------------------------- */

        case 'legends':
            if ($method === 'GET') {
                handleGetLegends($pdo);
            } elseif ($method === 'PUT') {
                requireAdmin();
                handleUpdateLegend($pdo, $resourceId, $requestData);
            } else {
                jsonError(405, 'Method Not Allowed');
            }
            break;

        /* -------------------------------------------------------
           RESET ENDPOINT (Admin only)
           ------------------------------------------------------- */

        case 'reset':
            requireAdmin();
            handleReset($pdo);
            break;

        /* -------------------------------------------------------
           DEFAULT / HEALTH CHECK
           ------------------------------------------------------- */

        case 'ping':
        case '':
            jsonResponse([
                'status'  => 'ok',
                'app'     => 'SchoolMap API',
                'version' => APP_VERSION,
                'time'    => date('Y-m-d H:i:s'),
            ]);
            break;

        default:
            jsonError(404, "Unknown action: {$action}");
    }
}

/* ============================================================
   AUTH HANDLERS
   ============================================================ */

function handleLogin(PDO $pdo, $data)
{
    $identifier = getRequestField($data, 'identifier');
    $password   = getRequestField($data, 'password');

    // Find user by email OR username
    $stmt = $pdo->prepare("
        SELECT id, full_name, email, username, role, password
        FROM   users
        WHERE  email = :identifier OR username = :identifier
        LIMIT  1
    ");
    $stmt->execute([':identifier' => $identifier]);
    $user = $stmt->fetch();

    if (!$user || $user['password'] !== $password) {
        jsonError(401, 'Invalid email/username or password.');
    }

    // Start session
    $_SESSION['user_id']    = $user['id'];
    $_SESSION['user_role']  = $user['role'];
    $_SESSION['user_name']  = $user['full_name'];

    jsonSuccess('Login successful', [
        'id'       => $user['id'],
        'fullName' => $user['full_name'],
        'email'    => $user['email'],
        'username' => $user['username'],
        'role'     => $user['role'],
    ]);
}

function handleRegister(PDO $pdo, $data)
{
    $fullName  = sanitizeString(getRequestField($data, 'fullName'));
    $email     = sanitizeString(getRequestField($data, 'email'));
    $username  = sanitizeString(getRequestField($data, 'username'));
    $password  = getRequestField($data, 'password');
    $role      = isset($data['role']) ? sanitizeString($data['role']) : 'student';

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonError(400, 'Invalid email address format.');
    }

    // Validate username length
    if (strlen($username) < 3) {
        jsonError(400, 'Username must be at least 3 characters long.');
    }

    // Validate password length
    if (strlen($password) < 6) {
        jsonError(400, 'Password must be at least 6 characters long.');
    }

    // Validate role
    $allowedRoles = ['student', 'faculty', 'visitor'];
    if (!in_array($role, $allowedRoles, true)) {
        $role = 'student';
    }

    // Check if email already exists
    $checkEmail = $pdo->prepare("SELECT id FROM users WHERE email = :email");
    $checkEmail->execute([':email' => $email]);
    if ($checkEmail->fetch()) {
        jsonError(409, 'Email address is already registered.');
    }

    // Check if username already exists
    $checkUser = $pdo->prepare("SELECT id FROM users WHERE username = :username");
    $checkUser->execute([':username' => $username]);
    if ($checkUser->fetch()) {
        jsonError(409, 'Username is already taken.');
    }

    $userId = generateId('user');

    $stmt = $pdo->prepare("
        INSERT INTO users (id, full_name, email, username, role, password)
        VALUES (:id, :full_name, :email, :username, :role, :password)
    ");
    $stmt->execute([
        ':id'        => $userId,
        ':full_name' => $fullName,
        ':email'     => $email,
        ':username'  => $username,
        ':role'      => $role,
        ':password'  => $password,
    ]);

    // Auto-login after registration
    $_SESSION['user_id']   = $userId;
    $_SESSION['user_role'] = $role;
    $_SESSION['user_name'] = $fullName;

    jsonSuccess('Account created successfully!', [
        'id'       => $userId,
        'fullName' => $fullName,
        'email'    => $email,
        'username' => $username,
        'role'     => $role,
    ]);
}

function handleLogout()
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(), '', time() - 42000,
            $params['path'],   $params['domain'],
            $params['secure'], $params['httponly']
        );
    }
    session_destroy();
    jsonSuccess('Logged out successfully.');
}

function handleGetCurrentUser(PDO $pdo)
{
    if (!isset($_SESSION['user_id'])) {
        jsonResponse(['user' => null]);
    }

    $stmt = $pdo->prepare("
        SELECT id, full_name, email, username, role
        FROM   users
        WHERE  id = :id
    ");
    $stmt->execute([':id' => $_SESSION['user_id']]);
    $user = $stmt->fetch();

    if (!$user) {
        session_destroy();
        jsonResponse(['user' => null]);
    }

    jsonResponse([
        'user' => [
            'id'       => $user['id'],
            'fullName' => $user['full_name'],
            'email'    => $user['email'],
            'username' => $user['username'],
            'role'     => $user['role'],
        ]
    ]);
}

/* ============================================================
   LOCATIONS HANDLERS
   ============================================================ */

function handleGetLocations(PDO $pdo)
{
    $stmt = $pdo->query("
        SELECT id, name, description, type, floor, x, y
        FROM   locations
        ORDER  BY floor ASC, name ASC
    ");
    $rows = $stmt->fetchAll();

    // Convert types to match JavaScript expectations
    $locations = array_map(function ($row) {
        return [
            'id'          => $row['id'],
            'name'        => $row['name'],
            'description' => $row['description'],
            'type'        => $row['type'],
            'floor'       => (int)$row['floor'],
            'x'           => (float)$row['x'],
            'y'           => (float)$row['y'],
        ];
    }, $rows);

    jsonResponse(['locations' => $locations]);
}

function handleCreateLocation(PDO $pdo, $data)
{
    $name        = sanitizeString(getRequestField($data, 'name'));
    $description = isset($data['description']) ? sanitizeString($data['description']) : '';
    $type        = sanitizeString(getRequestField($data, 'type'));
    $floor       = (int)getRequestField($data, 'floor');
    $x           = isset($data['x']) ? (float)$data['x'] : 50;
    $y           = isset($data['y']) ? (float)$data['y'] : 50;

    if ($x < 0 || $x > 100 || $y < 0 || $y > 100) {
        jsonError(400, 'X and Y coordinates must be between 0 and 100.');
    }

    $id = generateId('loc');

    $stmt = $pdo->prepare("
        INSERT INTO locations (id, name, description, type, floor, x, y)
        VALUES (:id, :name, :description, :type, :floor, :x, :y)
    ");
    $stmt->execute([
        ':id'          => $id,
        ':name'        => $name,
        ':description' => $description,
        ':type'        => $type,
        ':floor'       => $floor,
        ':x'           => $x,
        ':y'           => $y,
    ]);

    jsonSuccess('Location created successfully.', [
        'id'          => $id,
        'name'        => $name,
        'description' => $description,
        'type'        => $type,
        'floor'       => $floor,
        'x'           => $x,
        'y'           => $y,
    ]);
}

function handleUpdateLocation(PDO $pdo, $id, $data)
{
    if (!$id) { jsonError(400, 'Location ID is required.'); }

    // Check if location exists
    $check = $pdo->prepare("SELECT id FROM locations WHERE id = :id");
    $check->execute([':id' => $id]);
    if (!$check->fetch()) {
        jsonError(404, 'Location not found.');
    }

    $name        = sanitizeString(getRequestField($data, 'name'));
    $description = isset($data['description']) ? sanitizeString($data['description']) : '';
    $type        = sanitizeString(getRequestField($data, 'type'));
    $floor       = (int)getRequestField($data, 'floor');
    $x           = isset($data['x']) ? (float)$data['x'] : 50;
    $y           = isset($data['y']) ? (float)$data['y'] : 50;

    $stmt = $pdo->prepare("
        UPDATE locations
        SET    name = :name,
               description = :description,
               type = :type,
               floor = :floor,
               x = :x,
               y = :y,
               updated_at = datetime('now')
        WHERE  id = :id
    ");
    $stmt->execute([
        ':id'          => $id,
        ':name'        => $name,
        ':description' => $description,
        ':type'        => $type,
        ':floor'       => $floor,
        ':x'           => $x,
        ':y'           => $y,
    ]);

    jsonSuccess('Location updated successfully.', [
        'id'          => $id,
        'name'        => $name,
        'description' => $description,
        'type'        => $type,
        'floor'       => $floor,
        'x'           => $x,
        'y'           => $y,
    ]);
}

function handleDeleteLocation(PDO $pdo, $id)
{
    if (!$id) { jsonError(400, 'Location ID is required.'); }

    $check = $pdo->prepare("SELECT id FROM locations WHERE id = :id");
    $check->execute([':id' => $id]);
    if (!$check->fetch()) {
        jsonError(404, 'Location not found.');
    }

    $stmt = $pdo->prepare("DELETE FROM locations WHERE id = :id");
    $stmt->execute([':id' => $id]);

    jsonSuccess('Location deleted successfully.');
}

/* ============================================================
   FLOORS HANDLERS
   ============================================================ */

function handleGetFloors(PDO $pdo)
{
    $stmt = $pdo->query("SELECT id, name, label FROM floors ORDER BY id ASC");
    $rows = $stmt->fetchAll();

    $floors = array_map(function ($row) {
        return [
            'id'    => (int)$row['id'],
            'name'  => $row['name'],
            'label' => $row['label'],
        ];
    }, $rows);

    jsonResponse(['floors' => $floors]);
}

function handleCreateFloor(PDO $pdo, $data)
{
    $name  = sanitizeString(getRequestField($data, 'name'));
    $label = sanitizeString(getRequestField($data, 'label'));

    $stmt = $pdo->prepare("INSERT INTO floors (name, label) VALUES (:name, :label)");
    $stmt->execute([':name' => $name, ':label' => $label]);
    $newId = (int)$pdo->lastInsertId();

    jsonSuccess('Floor created successfully.', [
        'id'    => $newId,
        'name'  => $name,
        'label' => $label,
    ]);
}

function handleUpdateFloor(PDO $pdo, $id, $data)
{
    if (!$id) { jsonError(400, 'Floor ID is required.'); }

    $check = $pdo->prepare("SELECT id FROM floors WHERE id = :id");
    $check->execute([':id' => $id]);
    if (!$check->fetch()) {
        jsonError(404, 'Floor not found.');
    }

    $name  = sanitizeString(getRequestField($data, 'name'));
    $label = sanitizeString(getRequestField($data, 'label'));

    $stmt = $pdo->prepare("UPDATE floors SET name = :name, label = :label WHERE id = :id");
    $stmt->execute([':id' => $id, ':name' => $name, ':label' => $label]);

    jsonSuccess('Floor updated successfully.', [
        'id'    => (int)$id,
        'name'  => $name,
        'label' => $label,
    ]);
}

function handleDeleteFloor(PDO $pdo, $id)
{
    if (!$id) { jsonError(400, 'Floor ID is required.'); }

    // Count floors to prevent deleting the last one
    $count = $pdo->query("SELECT COUNT(*) as cnt FROM floors")->fetch();
    if ((int)$count['cnt'] <= 1) {
        jsonError(400, 'Cannot delete the only remaining floor.');
    }

    $check = $pdo->prepare("SELECT id FROM floors WHERE id = :id");
    $check->execute([':id' => $id]);
    if (!$check->fetch()) {
        jsonError(404, 'Floor not found.');
    }

    // Also delete all locations on this floor
    $stmtLocs = $pdo->prepare("DELETE FROM locations WHERE floor = :floor");
    $stmtLocs->execute([':floor' => $id]);

    $stmt = $pdo->prepare("DELETE FROM floors WHERE id = :id");
    $stmt->execute([':id' => $id]);

    jsonSuccess('Floor and its locations deleted successfully.');
}

/* ============================================================
   LEGENDS HANDLERS
   ============================================================ */

function handleGetLegends(PDO $pdo)
{
    $stmt = $pdo->query("SELECT id, type, label, color FROM legends ORDER BY type ASC");
    $rows = $stmt->fetchAll();

    jsonResponse(['legends' => $rows]);
}

function handleUpdateLegend(PDO $pdo, $id, $data)
{
    if (!$id) { jsonError(400, 'Legend ID is required.'); }

    $check = $pdo->prepare("SELECT id FROM legends WHERE id = :id");
    $check->execute([':id' => $id]);
    if (!$check->fetch()) {
        jsonError(404, 'Legend not found.');
    }

    $label = sanitizeString(getRequestField($data, 'label'));
    $color = sanitizeString(getRequestField($data, 'color'));

    // Validate color format (hex)
    if (!preg_match('/^#[0-9a-fA-F]{3,8}$/', $color)) {
        jsonError(400, 'Invalid color format. Must be a hex color (e.g. #192A57).');
    }

    $stmt = $pdo->prepare("UPDATE legends SET label = :label, color = :color WHERE id = :id");
    $stmt->execute([':id' => $id, ':label' => $label, ':color' => $color]);

    jsonSuccess('Legend updated successfully.', [
        'id'    => $id,
        'label' => $label,
        'color' => $color,
    ]);
}

/* ============================================================
   RESET HANDLER
   ============================================================ */

function handleReset(PDO $pdo)
{
    // Clear all data
    $pdo->exec("DELETE FROM locations");
    $pdo->exec("DELETE FROM floors");
    $pdo->exec("DELETE FROM legends");
    $pdo->exec("DELETE FROM metadata");

    // Re-seed all default data
    seedFloors($pdo);
    seedLegends($pdo);
    seedLocations($pdo);
    $pdo->exec("INSERT INTO metadata (key_name, value) VALUES ('seeded', '1')");

    jsonSuccess('All data has been reset to defaults.');
}

