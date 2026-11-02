<?php
// Super Admin Users Management API
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';

handleCors();

$pdo = getDb();
$method = $_SERVER['REQUEST_METHOD'];
$currentUserId = getRequestedUserId();

// Verify that the caller is a superadmin
if ($currentUserId) {
    $stmtAdmin = $pdo->prepare("SELECT role FROM users WHERE id = :id LIMIT 1");
    $stmtAdmin->execute([':id' => $currentUserId]);
    $adminRow = $stmtAdmin->fetch();
    if (!$adminRow || ($adminRow['role'] ?? '') !== 'superadmin') {
        $roleHeader = $_SERVER['HTTP_X_USER_ROLE'] ?? '';
        if ($roleHeader !== 'superadmin') {
            jsonResponse(['error' => 'Unauthorized: Super Admin access required'], 403);
        }
    }
}

switch ($method) {
    case 'GET':
        try {
            $stmt = $pdo->query("
                SELECT u.id, u.name, u.username, u.role, u.status, u.created_at AS createdAt,
                       (SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.id) AS txCount,
                       (SELECT COUNT(*) FROM categories c WHERE c.user_id = u.id) AS catCount
                FROM users u
                ORDER BY u.id ASC
            ");
            $users = $stmt->fetchAll();
            foreach ($users as &$u) {
                $u['id'] = (int)$u['id'];
                $u['txCount'] = (int)$u['txCount'];
                $u['catCount'] = (int)$u['catCount'];
            }

            $totalUsers = count($users);
            $totalTx = $pdo->query("SELECT COUNT(*) FROM transactions")->fetchColumn();
            $totalCats = $pdo->query("SELECT COUNT(*) FROM categories")->fetchColumn();

            jsonResponse([
                'success' => true,
                'stats' => [
                    'totalUsers' => $totalUsers,
                    'totalTransactions' => (int)$totalTx,
                    'totalCategories' => (int)$totalCats,
                ],
                'users' => $users
            ]);
        } catch (Exception $e) {
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    case 'PUT':
        // Update user status or role
        $input = getJsonInput();
        $targetId = $input['id'] ?? null;
        if (!$targetId) {
            jsonResponse(['error' => 'User ID is required'], 400);
        }

        try {
            $updates = [];
            $params = [':id' => $targetId];

            if (isset($input['status']) && in_array($input['status'], ['active', 'inactive'])) {
                $updates[] = "`status` = :status";
                $params[':status'] = $input['status'];
            }
            if (isset($input['role']) && in_array($input['role'], ['user', 'superadmin'])) {
                $updates[] = "`role` = :role";
                $params[':role'] = $input['role'];
            }

            if (empty($updates)) {
                jsonResponse(['error' => 'No valid fields to update'], 400);
            }

            $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            jsonResponse(['success' => true, 'message' => 'User updated successfully']);
        } catch (Exception $e) {
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    case 'POST':
        // Superadmin creates a new user directly
        $input = getJsonInput();
        $name = trim($input['name'] ?? '');
        $username = strtolower(trim($input['username'] ?? ''));
        $password = (string)($input['password'] ?? '');
        $role = in_array($input['role'] ?? '', ['user', 'superadmin']) ? $input['role'] : 'user';

        if (empty($name) || empty($username) || empty($password)) {
            jsonResponse(['error' => 'Name, username, and password are required'], 400);
        }

        try {
            $check = $pdo->prepare("SELECT id FROM users WHERE username = :username LIMIT 1");
            $check->execute([':username' => $username]);
            if ($check->fetch()) {
                jsonResponse(['error' => 'Username already exists'], 409);
            }

            $stmt = $pdo->prepare("INSERT INTO users (name, username, password, role, status) VALUES (:name, :username, :password, :role, 'active')");
            $stmt->execute([
                ':name' => $name,
                ':username' => $username,
                ':password' => $password,
                ':role' => $role,
            ]);
            $userId = (int)$pdo->lastInsertId();

            // Auto-create Cash_1 account
            $acc = $pdo->prepare("INSERT INTO accounts (user_id, code, name, type, dump_type, balance, status) VALUES (:user_id, 'Cash_1', 'Cash_1 (Physical Cash)', 'Cash Account', 'FINANCE', 0.00, 'active')");
            $acc->execute([':user_id' => $userId]);

            jsonResponse(['success' => true, 'id' => $userId, 'message' => 'User created successfully'], 201);
        } catch (Exception $e) {
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    case 'DELETE':
        $targetId = $_GET['id'] ?? null;
        if (!$targetId) {
            jsonResponse(['error' => 'User ID is required'], 400);
        }
        if ((int)$targetId === (int)$currentUserId) {
            jsonResponse(['error' => 'Cannot delete your own superadmin account'], 400);
        }

        try {
            // Cascade delete removes accounts, transactions, categories
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
            $stmt->execute([':id' => $targetId]);

            jsonResponse(['success' => true, 'message' => 'User and data deleted successfully']);
        } catch (Exception $e) {
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
