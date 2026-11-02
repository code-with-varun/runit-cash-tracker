<?php
// Register User Endpoint
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';

handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

$input = getJsonInput();
$name = trim($input['name'] ?? '');
$username = strtolower(trim($input['username'] ?? ''));
$password = (string)($input['password'] ?? '');

if (empty($name) || empty($username) || empty($password)) {
    jsonResponse(['success' => false, 'error' => 'All fields (name, username, password) are required.'], 400);
}

try {
    $pdo = getDb();

    // Check for existing user
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = :username LIMIT 1");
    $stmt->execute([':username' => $username]);
    if ($stmt->fetch()) {
        jsonResponse(['success' => false, 'error' => 'Username is already registered.']);
    }

    // Insert new user with clean AUTO_INCREMENT id
    $insert = $pdo->prepare("INSERT INTO users (name, username, password, role, status) VALUES (:name, :username, :password, 'user', 'active')");
    $insert->execute([
        ':name' => $name,
        ':username' => $username,
        ':password' => $password,
    ]);

    $userId = (int)$pdo->lastInsertId();

    // Create primary Cash_1 personal account for the user
    $accStmt = $pdo->prepare("INSERT INTO accounts (user_id, code, name, type, dump_type, balance, status) VALUES (:user_id, 'Cash_1', 'Cash_1 (Physical Cash)', 'Cash Account', 'FINANCE', 0.00, 'active')");
    $accStmt->execute([
        ':user_id' => $userId,
    ]);

    jsonResponse([
        'success' => true,
        'user' => [
            'id' => $userId,
            'name' => $name,
            'username' => $username,
            'role' => 'user',
        ],
    ], 201);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}
