<?php
// MoneyMatrix AI — Management Dimensions Master API (Budgets, Cost Centers, Profit Centers, Projects)
// Handles complete CRUD operations for management hierarchies
// "Category = What, Budget = Planned Under What, Cost Center = Consumed By Whom, Profit Center = Earned By Whom, Project = Why"

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/helpers/response.php';

handleCors();

$pdo = getDb();
ensureSchema($pdo);

$method = $_SERVER['REQUEST_METHOD'];
$userId = getRequestedUserId();

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$action = $_GET['action'] ?? '';
$type = $_GET['type'] ?? 'all'; // 'all' | 'budgets' | 'cost_centers' | 'profit_centers' | 'projects'
$masterId = $_GET['id'] ?? null;

if (!$masterId && preg_match('#/masters/([0-9]+)$#', $uri, $matches)) {
    $masterId = $matches[1];
}

switch ($method) {
    case 'GET':
        try {
            $userClause = $userId ? "(user_id = :uid OR user_id IS NULL)" : "user_id IS NULL";
            $params = $userId ? [':uid' => $userId] : [];

            if ($type === 'budgets' || $type === 'all') {
                $bStmt = $pdo->prepare("SELECT id, user_id, code, name, description, category_group, status, created_at FROM `budgets_master` WHERE {$userClause} ORDER BY code ASC, id ASC");
                $bStmt->execute($params);
                $budgets = $bStmt->fetchAll(PDO::FETCH_ASSOC);
            }

            if ($type === 'cost_centers' || $type === 'all') {
                $ccStmt = $pdo->prepare("SELECT id, user_id, code, name, description, status, created_at FROM `cost_centers` WHERE {$userClause} ORDER BY code ASC, id ASC");
                $ccStmt->execute($params);
                $costCenters = $ccStmt->fetchAll(PDO::FETCH_ASSOC);
            }

            if ($type === 'profit_centers' || $type === 'all') {
                $pcStmt = $pdo->prepare("SELECT id, user_id, code, name, description, status, created_at FROM `profit_centers` WHERE {$userClause} ORDER BY code ASC, id ASC");
                $pcStmt->execute($params);
                $profitCenters = $pcStmt->fetchAll(PDO::FETCH_ASSOC);
            }

            if ($type === 'projects' || $type === 'all') {
                $prStmt = $pdo->prepare("SELECT id, user_id, code, name, description, status, created_at FROM `projects` WHERE {$userClause} ORDER BY code ASC, id ASC");
                $prStmt->execute($params);
                $projects = $prStmt->fetchAll(PDO::FETCH_ASSOC);
            }

            if ($type !== 'all') {
                $ret = match ($type) {
                    'budgets' => $budgets,
                    'cost_centers' => $costCenters,
                    'profit_centers' => $profitCenters,
                    'projects' => $projects,
                    default => []
                };
                jsonResponse($ret);
            } else {
                jsonResponse([
                    'success' => true,
                    'budgets' => $budgets,
                    'cost_centers' => $costCenters,
                    'profit_centers' => $profitCenters,
                    'projects' => $projects,
                ]);
            }
        } catch (Exception $e) {
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    case 'POST':
        $input = getJsonInput();

        // Check if reset action
        if ($action === 'reset_defaults') {
            try {
                if ($userId) {
                    $pdo->exec("DELETE FROM `budgets_master` WHERE user_id = {$userId}");
                    $pdo->exec("DELETE FROM `cost_centers` WHERE user_id = {$userId}");
                    $pdo->exec("DELETE FROM `profit_centers` WHERE user_id = {$userId}");
                    $pdo->exec("DELETE FROM `projects` WHERE user_id = {$userId}");
                }
                ensureSchema($pdo);
                jsonResponse(['success' => true, 'message' => 'Default management masters restored']);
            } catch (Exception $e) {
                jsonResponse(['error' => $e->getMessage()], 500);
            }
        }

        $targetType = $input['type'] ?? ($type !== 'all' ? $type : 'cost_centers');
        $code = trim($input['code'] ?? '');
        $name = trim($input['name'] ?? '');
        $desc = trim($input['description'] ?? '');
        $categoryGroup = trim($input['category_group'] ?? '');

        if (empty($name)) {
            jsonResponse(['error' => 'Master Name is required'], 400);
        }

        $tableName = match ($targetType) {
            'budgets', 'budget' => 'budgets_master',
            'cost_centers', 'cost_center' => 'cost_centers',
            'profit_centers', 'profit_center' => 'profit_centers',
            'projects', 'project' => 'projects',
            default => 'cost_centers'
        };

        if (empty($code)) {
            $prefix = match ($tableName) {
                'budgets_master' => 'B',
                'cost_centers' => 'CC',
                'profit_centers' => 'PC',
                'projects' => 'PR',
                default => 'M'
            };
            $maxId = (int)$pdo->query("SELECT MAX(id) FROM `{$tableName}`")->fetchColumn();
            $code = sprintf('%s%03d', $prefix, $maxId + 1);
        }

        try {
            if ($tableName === 'budgets_master') {
                $stmt = $pdo->prepare("INSERT INTO `budgets_master` (user_id, code, name, description, category_group, status) VALUES (:uid, :code, :name, :desc, :grp, 'active')");
                $stmt->execute([':uid' => $userId, ':code' => $code, ':name' => $name, ':desc' => $desc, ':grp' => $categoryGroup]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO `{$tableName}` (user_id, code, name, description, status) VALUES (:uid, :code, :name, :desc, 'active')");
                $stmt->execute([':uid' => $userId, ':code' => $code, ':name' => $name, ':desc' => $desc]);
            }

            $newId = (int)$pdo->lastInsertId();
            jsonResponse([
                'success' => true,
                'id' => $newId,
                'code' => $code,
                'name' => $name,
                'description' => $desc,
                'category_group' => $categoryGroup,
                'status' => 'active',
                'type' => $targetType,
                'message' => 'Master item created successfully'
            ], 201);
        } catch (Exception $e) {
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    case 'PUT':
        $input = getJsonInput();
        $targetId = $masterId ?? ($input['id'] ?? null);
        $targetType = $input['type'] ?? ($type !== 'all' ? $type : null);

        if (!$targetId) {
            jsonResponse(['error' => 'Master Item ID is required'], 400);
        }

        $tableName = match ($targetType) {
            'budgets', 'budget' => 'budgets_master',
            'cost_centers', 'cost_center' => 'cost_centers',
            'profit_centers', 'profit_center' => 'profit_centers',
            'projects', 'project' => 'projects',
            default => null
        };

        if (!$tableName) {
            jsonResponse(['error' => 'Valid master type is required for update'], 400);
        }

        try {
            $userClause = $userId ? "(user_id = :uid OR user_id IS NULL)" : "1=1";
            $params = [
                ':id' => $targetId,
                ':code' => $input['code'] ?? null,
                ':name' => $input['name'] ?? null,
                ':desc' => $input['description'] ?? null,
                ':status' => $input['status'] ?? 'active'
            ];
            if ($userId) $params[':uid'] = $userId;

            if ($tableName === 'budgets_master') {
                $params[':grp'] = $input['category_group'] ?? null;
                $stmt = $pdo->prepare("
                    UPDATE `budgets_master`
                    SET code = COALESCE(:code, code),
                        name = COALESCE(:name, name),
                        description = COALESCE(:desc, description),
                        category_group = COALESCE(:grp, category_group),
                        status = COALESCE(:status, status)
                    WHERE id = :id AND {$userClause}
                ");
            } else {
                $stmt = $pdo->prepare("
                    UPDATE `{$tableName}`
                    SET code = COALESCE(:code, code),
                        name = COALESCE(:name, name),
                        description = COALESCE(:desc, description),
                        status = COALESCE(:status, status)
                    WHERE id = :id AND {$userClause}
                ");
            }
            $stmt->execute($params);
            jsonResponse(['success' => true, 'message' => 'Master item updated successfully']);
        } catch (Exception $e) {
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    case 'DELETE':
        $targetId = $masterId ?? ($_GET['id'] ?? null);
        $targetType = $_GET['type'] ?? null;

        if (!$targetId || !$targetType) {
            jsonResponse(['error' => 'Master ID and Type are required for deletion'], 400);
        }

        $tableName = match ($targetType) {
            'budgets', 'budget' => 'budgets_master',
            'cost_centers', 'cost_center' => 'cost_centers',
            'profit_centers', 'profit_center' => 'profit_centers',
            'projects', 'project' => 'projects',
            default => null
        };

        if (!$tableName) {
            jsonResponse(['error' => 'Invalid master type'], 400);
        }

        try {
            $userClause = $userId ? " AND (user_id = {$userId} OR user_id IS NULL)" : "";
            $pdo->exec("DELETE FROM `{$tableName}` WHERE id = " . (int)$targetId . $userClause);
            jsonResponse(['success' => true, 'message' => 'Master item deleted successfully']);
        } catch (Exception $e) {
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}

