<?php
// Login User Endpoint
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';

handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

$input = getJsonInput();
$username = strtolower(trim($input['username'] ?? ''));
$password = (string)($input['password'] ?? '');

if (empty($username) || empty($password)) {
    jsonResponse(['success' => false, 'error' => 'Username and password are required.'], 400);
}

try {
    $pdo = getDb();
    $stmt = $pdo->prepare("SELECT id, name, username, role, status FROM users WHERE username = :username AND password = :password LIMIT 1");
    $stmt->execute([
        ':username' => $username,
        ':password' => $password,
    ]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonResponse(['success' => false, 'error' => 'Invalid username or password.']);
    }

    if (isset($user['status']) && $user['status'] === 'inactive') {
        jsonResponse(['success' => false, 'error' => 'Your account has been deactivated. Please contact support.']);
    }

    jsonResponse([
        'success' => true,
        'user' => [
            'id' => (int)$user['id'],
            'name' => $user['name'],
            'username' => $user['username'],
            'role' => $user['role'] ?? 'user',
        ],
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}
