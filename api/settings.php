<?php
// Settings & PIN Management API
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/helpers/response.php';

handleCors();

$pdo = getDb();
$method = $_SERVER['REQUEST_METHOD'];
$userId = getRequestedUserId();

switch ($method) {
    case 'GET':
        try {
            if ($userId) {
                $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE (user_id = :user_id OR user_id IS NULL) AND setting_key = 'security_pin' ORDER BY user_id DESC LIMIT 1");
                $stmt->execute([':user_id' => $userId]);
            } else {
                $stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'security_pin' LIMIT 1");
            }
            $row = $stmt->fetch();
            jsonResponse(['pin' => $row ? $row['setting_value'] : null]);
        } catch (Exception $e) {
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    case 'POST':
        $input = getJsonInput();
        $pin = isset($input['pin']) ? (string)$input['pin'] : null;

        try {
            $stmt = $pdo->prepare("
                INSERT INTO settings (user_id, setting_key, setting_value)
                VALUES (:user_id, 'security_pin', :val)
                ON DUPLICATE KEY UPDATE setting_value = :val2
            ");
            $stmt->execute([
                ':user_id' => $userId,
                ':val' => $pin,
                ':val2' => $pin,
            ]);

            jsonResponse(['message' => 'PIN updated', 'pin' => $pin]);
        } catch (Exception $e) {
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
