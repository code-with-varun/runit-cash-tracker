<?php
// Categories Management API (GET, POST, PUT, DELETE)
// Complete Taxonomy, Grouping & Reporting Fields for MoneyMatrix
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/helpers/response.php';

handleCors();

$pdo = getDb();
ensureSchema($pdo);

$method = $_SERVER['REQUEST_METHOD'];
$userId = getRequestedUserId();

// Validate if user exists in database to avoid foreign key violations (fk_cat_user)
$validUserId = null;
if ($userId) {
    try {
        $uCheck = $pdo->prepare("SELECT id FROM users WHERE id = :uid LIMIT 1");
        $uCheck->execute([':uid' => $userId]);
        $uRow = $uCheck->fetch(PDO::FETCH_ASSOC);
        if ($uRow) {
            $validUserId = (int)$uRow['id'];
        }
    } catch (Exception $e) {
        $validUserId = null;
    }
}

// Determine sub-action (e.g. bulk) or id from query or URI
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$action = $_GET['action'] ?? '';
$isBulk = str_ends_with($uri, '/bulk') || $action === 'bulk';
$isImportStandard = $action === 'import_standard' || $action === 'seed_standard';
$categoryId = $_GET['id'] ?? null;

if (!$categoryId && preg_match('#/categories/([0-9]+)$#', $uri, $matches)) {
    $categoryId = $matches[1];
}

switch ($method) {
    case 'GET':
        try {
            if ($userId) {
                $stmt = $pdo->prepare("
                    SELECT id, user_id, name, subcategory, category, division, suffix, 
                           info_type, transaction_type, group_type, net_type, sub_type, 
                           description, type, created_at AS createdAt 
                    FROM categories 
                    WHERE user_id = :user_id OR user_id IS NULL
                    ORDER BY id ASC
                ");
                $stmt->execute([':user_id' => $userId]);
            } else {
                $stmt = $pdo->query("
                    SELECT id, user_id, name, subcategory, category, division, suffix, 
                           info_type, transaction_type, group_type, net_type, sub_type, 
                           description, type, created_at AS createdAt 
                    FROM categories 
                    WHERE user_id IS NULL
                    ORDER BY id ASC
                ");
            }
            $categories = $stmt->fetchAll();
            foreach ($categories as &$cat) {
                $cat['id'] = (int)$cat['id'];
                if ($cat['user_id'] !== null) {
                    $cat['user_id'] = (int)$cat['user_id'];
                }
                $cat['subcategory'] = $cat['subcategory'] ?: $cat['name'];
                $cat['name'] = $cat['subcategory'];
                $cat['category'] = $cat['category'] ?: 'GENERAL';
                $cat['division'] = $cat['division'] ?: 'LIVING';
                $cat['suffix'] = $cat['suffix'] ?: ($cat['type'] === 'Cr' ? 'CR' : 'DR');
                $cat['info_type'] = $cat['info_type'] ?: 'BOTH';
                $cat['transaction_type'] = $cat['transaction_type'] ?: 'ACTUAL';
                $cat['group_type'] = $cat['group_type'] ?: $cat['division'];
                $cat['net_type'] = $cat['net_type'] ?: $cat['sub_type'];
                $cat['sub_type'] = $cat['sub_type'] ?: '';
                $cat['description'] = $cat['description'] ?: '';
            }
            jsonResponse($categories);
        } catch (Exception $e) {
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    case 'POST':
        $input = getJsonInput();

        if ($isImportStandard) {
            try {
                // Standard categories are global master categories (user_id = NULL)
                // This ensures they are accessible to all users and never fail fk_cat_user foreign key constraints
                $stmtCheck = $pdo->prepare("SELECT id FROM categories WHERE subcategory = :subcat AND (user_id IS NULL OR (:uid IS NOT NULL AND user_id = :uid2)) LIMIT 1");
                $stmtInsert = $pdo->prepare("
                    INSERT INTO categories (user_id, name, subcategory, category, division, suffix, info_type, transaction_type, group_type, net_type, sub_type, description, type) 
                    VALUES (:user_id, :name, :subcategory, :category, :division, :suffix, :info_type, :transaction_type, :group_type, :net_type, :sub_type, :description, :type)
                ");

                $imported = 0;
                foreach (DEFAULT_CATEGORIES as $cat) {
                    $subcat = trim($cat['subcategory'] ?? ($cat['name'] ?? ''));
                    if (empty($subcat)) continue;

                    $stmtCheck->execute([':subcat' => $subcat, ':uid' => $validUserId, ':uid2' => $validUserId]);
                    if (!$stmtCheck->fetch()) {
                        $stmtInsert->execute([
                            ':user_id' => null, // Global master category
                            ':name' => $subcat,
                            ':subcategory' => $subcat,
                            ':category' => $cat['category'] ?? 'GENERAL',
                            ':division' => $cat['division'] ?? 'LIVING',
                            ':suffix' => $cat['suffix'] ?? 'DR',
                            ':info_type' => $cat['info_type'] ?? 'BOTH',
                            ':transaction_type' => $cat['transaction_type'] ?? 'ACTUAL',
                            ':group_type' => $cat['group_type'] ?? ($cat['division'] ?? 'LIVING'),
                            ':net_type' => $cat['net_type'] ?? ($cat['sub_type'] ?? ''),
                            ':sub_type' => $cat['sub_type'] ?? '',
                            ':description' => $cat['description'] ?? '',
                            ':type' => $cat['type'] ?? 'Dr',
                        ]);
                        $imported++;
                    }
                }

                jsonResponse([
                    'success' => true,
                    'message' => "Successfully imported {$imported} standard taxonomy categories for user.",
                    'imported' => $imported
                ], 201);
            } catch (Exception $e) {
                jsonResponse(['error' => $e->getMessage()], 500);
            }
        }

        if ($isBulk || (isset($input[0]) && is_array($input[0]))) {
            // Bulk Add Categories
            $items = $isBulk && isset($input['categories']) ? $input['categories'] : $input;
            if (!is_array($items)) {
                jsonResponse(['error' => 'Invalid bulk payload'], 400);
            }

            try {
                $addedCount = 0;
                $stmtCheck = $pdo->prepare("SELECT id FROM categories WHERE subcategory = :subcat AND (user_id = :user_id OR (user_id IS NULL AND :user_id2 IS NULL)) LIMIT 1");
                $stmtInsert = $pdo->prepare("
                    INSERT INTO categories (user_id, name, subcategory, category, division, suffix, info_type, transaction_type, group_type, net_type, sub_type, description, type) 
                    VALUES (:user_id, :name, :subcategory, :category, :division, :suffix, :info_type, :transaction_type, :group_type, :net_type, :sub_type, :description, :type)
                ");

                foreach ($items as $cat) {
                    $subcat = trim($cat['subcategory'] ?? ($cat['name'] ?? ''));
                    if (empty($subcat)) continue;

                    $category = trim($cat['category'] ?? 'GENERAL');
                    $division = trim($cat['division'] ?? 'LIVING');
                    $suffix = in_array(strtoupper($cat['suffix'] ?? ''), ['CR', 'DR', 'NU']) ? strtoupper($cat['suffix']) : ($division === 'EARNINGS' ? 'CR' : 'DR');
                    $info = trim($cat['info_type'] ?? 'BOTH');
                    $txType = trim($cat['transaction_type'] ?? 'ACTUAL');
                    $group = trim($cat['group_type'] ?? $division);
                    $net = trim($cat['net_type'] ?? ($cat['sub_type'] ?? ''));
                    $sub = trim($cat['sub_type'] ?? '');
                    $desc = trim($cat['description'] ?? '');
                    $type = $suffix === 'CR' ? 'Cr' : ($suffix === 'NU' ? 'NU' : 'Dr');

                    $stmtCheck->execute([':subcat' => $subcat, ':user_id' => $validUserId, ':user_id2' => $validUserId]);
                    if (!$stmtCheck->fetch()) {
                        $stmtInsert->execute([
                            ':user_id' => $validUserId,
                            ':name' => $subcat,
                            ':subcategory' => $subcat,
                            ':category' => $category,
                            ':division' => $division,
                            ':suffix' => $suffix,
                            ':info_type' => $info,
                            ':transaction_type' => $txType,
                            ':group_type' => $group,
                            ':net_type' => $net,
                            ':sub_type' => $sub,
                            ':description' => $desc,
                            ':type' => $type,
                        ]);
                        $addedCount++;
                    }
                }

                jsonResponse(['message' => 'Bulk categories added', 'added' => $addedCount], 201);
            } catch (Exception $e) {
                jsonResponse(['error' => $e->getMessage()], 500);
            }
        } else {
            // Single Add Category
            $subcat = trim($input['subcategory'] ?? ($input['name'] ?? ''));
            if (empty($subcat)) {
                jsonResponse(['error' => 'Subcategory / Category name is required'], 400);
            }

            $category = trim($input['category'] ?? 'GENERAL');
            $division = trim($input['division'] ?? 'LIVING');
            $suffix = in_array(strtoupper($input['suffix'] ?? ''), ['CR', 'DR', 'NU']) ? strtoupper($input['suffix']) : ($division === 'EARNINGS' ? 'CR' : 'DR');
            $info = trim($input['info_type'] ?? 'BOTH');
            $txType = trim($input['transaction_type'] ?? 'ACTUAL');
            $group = trim($input['group_type'] ?? $division);
            $net = trim($input['net_type'] ?? ($input['sub_type'] ?? ''));
            $sub = trim($input['sub_type'] ?? '');
            $desc = trim($input['description'] ?? '');
            $type = $suffix === 'CR' ? 'Cr' : ($suffix === 'NU' ? 'NU' : 'Dr');

            try {
                $stmt = $pdo->prepare("
                    INSERT INTO categories (user_id, name, subcategory, category, division, suffix, info_type, transaction_type, group_type, net_type, sub_type, description, type) 
                    VALUES (:user_id, :name, :subcategory, :category, :division, :suffix, :info_type, :transaction_type, :group_type, :net_type, :sub_type, :description, :type)
                ");
                $stmt->execute([
                    ':user_id' => $validUserId,
                    ':name' => $subcat,
                    ':subcategory' => $subcat,
                    ':category' => $category,
                    ':division' => $division,
                    ':suffix' => $suffix,
                    ':info_type' => $info,
                    ':transaction_type' => $txType,
                    ':group_type' => $group,
                    ':net_type' => $net,
                    ':sub_type' => $sub,
                    ':description' => $desc,
                    ':type' => $type,
                ]);

                $catId = (int)$pdo->lastInsertId();

                jsonResponse([
                    'id' => $catId,
                    'user_id' => $userId ? (int)$userId : null,
                    'name' => $subcat,
                    'subcategory' => $subcat,
                    'category' => $category,
                    'division' => $division,
                    'suffix' => $suffix,
                    'info_type' => $info,
                    'transaction_type' => $txType,
                    'group_type' => $group,
                    'net_type' => $net,
                    'sub_type' => $sub,
                    'description' => $desc,
                    'type' => $type,
                    'createdAt' => date('Y-m-d H:i:s'),
                ], 201);
            } catch (Exception $e) {
                jsonResponse(['error' => $e->getMessage()], 500);
            }
        }
        break;

    case 'PUT':
        $input = getJsonInput();
        $targetId = $categoryId ?? ($input['id'] ?? null);

        if (!$targetId) {
            jsonResponse(['error' => 'Category ID is required for update'], 400);
        }

        try {
            $stmtFetch = $pdo->prepare("SELECT * FROM categories WHERE id = :id AND (user_id = :user_id OR user_id IS NULL)");
            $stmtFetch->execute([':id' => $targetId, ':user_id' => $userId]);
            $existing = $stmtFetch->fetch();
            if (!$existing) {
                jsonResponse(['error' => 'Category not found'], 404);
            }

            $subcat = isset($input['subcategory']) ? trim($input['subcategory']) : (isset($input['name']) ? trim($input['name']) : $existing['subcategory']);
            $category = isset($input['category']) ? trim($input['category']) : $existing['category'];
            $division = isset($input['division']) ? trim($input['division']) : $existing['division'];
            $suffix = isset($input['suffix']) ? strtoupper(trim($input['suffix'])) : $existing['suffix'];
            $info = isset($input['info_type']) ? trim($input['info_type']) : $existing['info_type'];
            $txType = isset($input['transaction_type']) ? trim($input['transaction_type']) : $existing['transaction_type'];
            $group = isset($input['group_type']) ? trim($input['group_type']) : $division;
            $net = isset($input['net_type']) ? trim($input['net_type']) : $existing['net_type'];
            $sub = isset($input['sub_type']) ? trim($input['sub_type']) : $existing['sub_type'];
            $desc = isset($input['description']) ? trim($input['description']) : ($existing['description'] ?? '');
            $type = $suffix === 'CR' ? 'Cr' : ($suffix === 'NU' ? 'NU' : 'Dr');

            $updateStmt = $pdo->prepare("
                UPDATE categories 
                SET name = :name, subcategory = :subcategory, category = :category, 
                    division = :division, suffix = :suffix, info_type = :info_type, 
                    transaction_type = :transaction_type, group_type = :group_type, 
                    net_type = :net_type, sub_type = :sub_type, description = :description, type = :type
                WHERE id = :id
            ");
            $updateStmt->execute([
                ':name' => $subcat,
                ':subcategory' => $subcat,
                ':category' => $category,
                ':division' => $division,
                ':suffix' => $suffix,
                ':info_type' => $info,
                ':transaction_type' => $txType,
                ':group_type' => $group,
                ':net_type' => $net,
                ':sub_type' => $sub,
                ':description' => $desc,
                ':type' => $type,
                ':id' => $targetId,
            ]);

            jsonResponse(['success' => true, 'message' => 'Category updated successfully']);
        } catch (Exception $e) {
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    case 'DELETE':
        $targetId = $categoryId ?? ($_GET['id'] ?? null);
        if (!$targetId) {
            $input = getJsonInput();
            $targetId = $input['id'] ?? null;
        }

        if (!$targetId) {
            jsonResponse(['error' => 'Category ID is required for deletion'], 400);
        }

        try {
            if ($userId) {
                $stmt = $pdo->prepare("DELETE FROM categories WHERE id = :id AND (user_id = :user_id OR user_id IS NULL)");
                $stmt->execute([':id' => $targetId, ':user_id' => $userId]);
            } else {
                $stmt = $pdo->prepare("DELETE FROM categories WHERE id = :id");
                $stmt->execute([':id' => $targetId]);
            }

            jsonResponse(['message' => 'Category deleted']);
        } catch (Exception $e) {
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
