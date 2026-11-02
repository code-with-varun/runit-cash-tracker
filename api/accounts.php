<?php
// Personal Finance Accounts Management API
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/helpers/response.php';

handleCors();

$pdo = getDb();
$method = $_SERVER['REQUEST_METHOD'];
$userId = getRequestedUserId();

if (!$userId) {
    jsonResponse(['error' => 'User authentication required'], 401);
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$action = $_GET['action'] ?? '';
$isBulk = str_ends_with($uri, '/bulk') || $action === 'bulk';

switch ($method) {
    case 'GET':
        try {
            $stmt = $pdo->prepare("
                SELECT id, user_id, name, code, type, dump_type, balance, status, created_at AS createdAt 
                FROM accounts 
                WHERE user_id = :user_id 
                ORDER BY id ASC
            ");
            $stmt->execute([':user_id' => $userId]);
            $accounts = $stmt->fetchAll();

            // If user has zero accounts yet, auto-create their default Cash_1 ledger
            if (empty($accounts)) {
                $ins = $pdo->prepare("INSERT INTO accounts (user_id, name, code, type, dump_type, balance, status) VALUES (:user_id, 'Cash_1 (Physical Cash)', 'Cash_1', 'Cash Account', 'FINANCE', 0.00, 'active')");
                $ins->execute([':user_id' => $userId]);
                $defaultId = (int)$pdo->lastInsertId();

                $accounts = [[
                    'id' => $defaultId,
                    'user_id' => (int)$userId,
                    'name' => 'Cash_1 (Physical Cash)',
                    'code' => 'Cash_1',
                    'type' => 'Cash Account',
                    'dump_type' => 'FINANCE',
                    'balance' => 0.00,
                    'status' => 'active',
                    'createdAt' => date('Y-m-d H:i:s'),
                ]];
            }

            // Calculate live balance, transaction counts, date ranges, and latest update for each account
            $txStmt = $pdo->prepare("
                SELECT account_no, 
                       SUM(CASE WHEN type = 'Cr' THEN amount ELSE 0 END) AS totalCr,
                       SUM(CASE WHEN type = 'Dr' THEN amount ELSE 0 END) AS totalDr,
                       COUNT(*) AS txCount,
                       MIN(date) AS startDate,
                       MAX(date) AS endDate,
                       MAX(created_at) AS lastUpdated
                FROM transactions 
                WHERE user_id = :user_id 
                GROUP BY account_no
            ");
            $txStmt->execute([':user_id' => $userId]);
            $txSummaries = [];
            foreach ($txStmt->fetchAll() as $row) {
                $txSummaries[$row['account_no']] = [
                    'cr' => (float)$row['totalCr'],
                    'dr' => (float)$row['totalDr'],
                    'balance' => (float)$row['totalCr'] - (float)$row['totalDr'],
                    'txCount' => (int)$row['txCount'],
                    'startDate' => $row['startDate'],
                    'endDate' => $row['endDate'],
                    'lastUpdated' => $row['lastUpdated'],
                ];
            }

            foreach ($accounts as &$acc) {
                $acc['id'] = (int)$acc['id'];
                $acc['user_id'] = (int)$acc['user_id'];
                $code = $acc['code'];
                $summary = $txSummaries[$code] ?? null;
                $acc['dump_type'] = $acc['dump_type'] ?? 'FINANCE';
                $acc['status'] = strtolower($acc['status'] ?? 'active');

                if ($summary) {
                    $acc['balance'] = (float)$acc['balance'] + $summary['balance'];
                    $acc['txCount'] = $summary['txCount'];
                    $acc['startDate'] = $summary['startDate'];
                    $acc['endDate'] = $summary['endDate'];
                    $acc['lastUpdated'] = $summary['lastUpdated'] ?? $acc['createdAt'];
                } else {
                    $acc['balance'] = (float)$acc['balance'];
                    $acc['txCount'] = 0;
                    $acc['startDate'] = null;
                    $acc['endDate'] = null;
                    $acc['lastUpdated'] = $acc['createdAt'];
                }
            }

            jsonResponse($accounts);
        } catch (Exception $e) {
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    case 'POST':
        $input = getJsonInput();

        if ($isBulk || isset($input['accounts']) || (isset($input[0]) && is_array($input[0]))) {
            $items = isset($input['accounts']) ? $input['accounts'] : (isset($input[0]) ? $input : []);
            if (!is_array($items)) {
                jsonResponse(['error' => 'Invalid bulk payload'], 400);
            }

            try {
                $addedCount = 0;
                $updatedCount = 0;
                $pdo->beginTransaction();

                $stmtCheck = $pdo->prepare("SELECT id FROM accounts WHERE user_id = :user_id AND code = :code LIMIT 1");
                $stmtInsert = $pdo->prepare("
                    INSERT INTO accounts (user_id, name, code, type, dump_type, balance, status)
                    VALUES (:user_id, :name, :code, :type, :dump_type, :balance, :status)
                ");
                $stmtUpdate = $pdo->prepare("
                    UPDATE accounts 
                    SET name = :name, type = :type, dump_type = :dump_type, balance = :balance, status = :status
                    WHERE id = :id
                ");

                foreach ($items as $acc) {
                    $name = trim($acc['name'] ?? ($acc['account_name'] ?? ''));
                    $code = trim($acc['code'] ?? ($acc['account_code'] ?? ($acc['FINAL STD AC'] ?? preg_replace('/[^a-zA-Z0-9_]/', '_', strtoupper($name)))));
                    if (empty($code)) continue;
                    if (empty($name)) $name = $code;

                    $type = trim($acc['type'] ?? ($acc['account_type'] ?? 'Savings Account'));
                    $dumpType = trim($acc['dump_type'] ?? ($acc['dumpType'] ?? 'FINANCE'));
                    $status = strtolower(trim($acc['status'] ?? 'active'));
                    $balance = (float)($acc['balance'] ?? ($acc['initialBalance'] ?? ($acc['opening_balance'] ?? 0)));

                    $stmtCheck->execute([':user_id' => $userId, ':code' => $code]);
                    $existing = $stmtCheck->fetch();

                    if ($existing) {
                        $stmtUpdate->execute([
                            ':name' => $name,
                            ':type' => $type,
                            ':dump_type' => $dumpType,
                            ':balance' => $balance,
                            ':status' => in_array($status, ['active', 'closed']) ? $status : 'active',
                            ':id' => $existing['id']
                        ]);
                        $updatedCount++;
                    } else {
                        $stmtInsert->execute([
                            ':user_id' => $userId,
                            ':name' => $name,
                            ':code' => $code,
                            ':type' => $type,
                            ':dump_type' => $dumpType,
                            ':balance' => $balance,
                            ':status' => in_array($status, ['active', 'closed']) ? $status : 'active'
                        ]);
                        $addedCount++;
                    }
                }

                $pdo->commit();
                jsonResponse(['success' => true, 'message' => "Imported accounts: $addedCount created, $updatedCount updated", 'added' => $addedCount, 'updated' => $updatedCount], 201);
            } catch (Exception $e) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                jsonResponse(['error' => $e->getMessage()], 500);
            }
        }

        $name = trim($input['name'] ?? '');
        $code = trim($input['code'] ?? preg_replace('/[^a-zA-Z0-9_]/', '_', strtoupper($name)));
        $type = trim($input['type'] ?? 'Savings Account');
        $dumpType = trim($input['dump_type'] ?? $input['dumpType'] ?? 'FINANCE');
        $status = strtolower(trim($input['status'] ?? 'active'));
        $balance = (float)($input['initialBalance'] ?? $input['balance'] ?? 0);

        if (empty($name) || empty($code)) {
            jsonResponse(['error' => 'Account name and code are required'], 400);
        }

        try {
            $check = $pdo->prepare("SELECT id FROM accounts WHERE user_id = :user_id AND code = :code LIMIT 1");
            $check->execute([':user_id' => $userId, ':code' => $code]);
            if ($check->fetch()) {
                jsonResponse(['error' => 'An account with code "' . $code . '" already exists'], 409);
            }

            $stmt = $pdo->prepare("
                INSERT INTO accounts (user_id, name, code, type, dump_type, balance, status)
                VALUES (:user_id, :name, :code, :type, :dump_type, :balance, :status)
            ");
            $stmt->execute([
                ':user_id' => $userId,
                ':name' => $name,
                ':code' => $code,
                ':type' => $type,
                ':dump_type' => $dumpType,
                ':balance' => $balance,
                ':status' => in_array($status, ['active', 'closed']) ? $status : 'active',
            ]);

            $accId = (int)$pdo->lastInsertId();

            jsonResponse([
                'id' => $accId,
                'user_id' => (int)$userId,
                'name' => $name,
                'code' => $code,
                'type' => $type,
                'dump_type' => $dumpType,
                'balance' => $balance,
                'status' => $status,
                'txCount' => 0,
                'startDate' => null,
                'endDate' => null,
                'lastUpdated' => date('Y-m-d H:i:s'),
            ], 201);
        } catch (Exception $e) {
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    case 'PUT':
        $input = getJsonInput();
        $targetId = $input['id'] ?? ($_GET['id'] ?? null);
        if (!$targetId) {
            jsonResponse(['error' => 'Account ID is required'], 400);
        }

        try {
            $fetchStmt = $pdo->prepare("SELECT * FROM accounts WHERE id = :id AND user_id = :user_id");
            $fetchStmt->execute([':id' => $targetId, ':user_id' => $userId]);
            $existing = $fetchStmt->fetch();
            if (!$existing) {
                jsonResponse(['error' => 'Account not found'], 404);
            }

            $name = isset($input['name']) ? trim($input['name']) : $existing['name'];
            $type = isset($input['type']) ? trim($input['type']) : $existing['type'];
            $dumpType = isset($input['dump_type']) ? trim($input['dump_type']) : ($input['dumpType'] ?? $existing['dump_type']);
            $status = isset($input['status']) ? strtolower(trim($input['status'])) : $existing['status'];

            $updateStmt = $pdo->prepare("
                UPDATE accounts 
                SET name = :name, type = :type, dump_type = :dump_type, status = :status
                WHERE id = :id AND user_id = :user_id
            ");
            $updateStmt->execute([
                ':name' => $name,
                ':type' => $type,
                ':dump_type' => $dumpType,
                ':status' => in_array($status, ['active', 'closed']) ? $status : 'active',
                ':id' => $targetId,
                ':user_id' => $userId
            ]);

            jsonResponse(['success' => true, 'message' => 'Account updated successfully']);
        } catch (Exception $e) {
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    case 'DELETE':
        $targetId = $_GET['id'] ?? null;
        if (!$targetId) {
            jsonResponse(['error' => 'Account ID is required'], 400);
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM accounts WHERE id = :id AND user_id = :user_id");
            $stmt->execute([':id' => $targetId, ':user_id' => $userId]);
            jsonResponse(['success' => true, 'message' => 'Account deleted']);
        } catch (Exception $e) {
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
