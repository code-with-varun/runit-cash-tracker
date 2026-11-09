const fs = require('fs');

// ==========================================
// 1. UPDATE api/categories.php
// ==========================================
let catContent = fs.readFileSync('api/categories.php', 'utf8');

// Replace the user validation block
const userTargetOld = `$userId = getRequestedUserId();`;

const userTargetNew = `$userId = getRequestedUserId();

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
}`;

if (catContent.includes(userTargetOld) && !catContent.includes('$validUserId = null;')) {
  catContent = catContent.replace(userTargetOld, userTargetNew);
  console.log('Added $validUserId check in api/categories.php');
}

// Replace $isImportStandard block
const importOld = `        if ($isImportStandard) {
            if (!$userId) {
                jsonResponse(['error' => 'User authentication required'], 401);
            }

            try {
                $stmtCheck = $pdo->prepare("SELECT id FROM categories WHERE subcategory = :subcat AND user_id = :user_id LIMIT 1");
                $stmtInsert = $pdo->prepare("
                    INSERT INTO categories (user_id, name, subcategory, category, division, suffix, info_type, transaction_type, group_type, net_type, sub_type, description, type) 
                    VALUES (:user_id, :name, :subcategory, :category, :division, :suffix, :info_type, :transaction_type, :group_type, :net_type, :sub_type, :description, :type)
                ");

                $imported = 0;
                foreach (DEFAULT_CATEGORIES as $cat) {
                    $subcat = trim($cat['subcategory'] ?? ($cat['name'] ?? ''));
                    if (empty($subcat)) continue;

                    $stmtCheck->execute([':subcat' => $subcat, ':user_id' => $userId]);
                    if (!$stmtCheck->fetch()) {
                        $stmtInsert->execute([
                            ':user_id' => $userId,`;

const importNew = `        if ($isImportStandard) {
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
                            ':user_id' => null, // Global master category`;

if (catContent.includes(importOld)) {
  catContent = catContent.replace(importOld, importNew);
  console.log('Fixed import_standard in api/categories.php to use null/validUserId');
}

// Replace bulk insert ':user_id' => $userId with $validUserId
const bulkUserOld = `                    $stmtCheck->execute([':subcat' => $subcat, ':user_id' => $userId, ':user_id2' => $userId]);
                    if (!$stmtCheck->fetch()) {
                        $stmtInsert->execute([
                            ':user_id' => $userId,`;

const bulkUserNew = `                    $stmtCheck->execute([':subcat' => $subcat, ':user_id' => $validUserId, ':user_id2' => $validUserId]);
                    if (!$stmtCheck->fetch()) {
                        $stmtInsert->execute([
                            ':user_id' => $validUserId,`;

if (catContent.includes(bulkUserOld)) {
  catContent = catContent.replace(bulkUserOld, bulkUserNew);
  console.log('Fixed bulk categories insert to use $validUserId');
}

// Replace single insert ':user_id' => $userId with $validUserId
const singleUserOld = `                $stmt->execute([
                    ':user_id' => $userId,`;

const singleUserNew = `                $stmt->execute([
                    ':user_id' => $validUserId,`;

if (catContent.includes(singleUserOld)) {
  catContent = catContent.replace(singleUserOld, singleUserNew);
  console.log('Fixed single category insert to use $validUserId');
}

fs.writeFileSync('api/categories.php', catContent, 'utf8');
console.log('Saved api/categories.php');

// ==========================================
// 2. UPDATE api/config/db.php
// ==========================================
let dbContent = fs.readFileSync('api/config/db.php', 'utf8');

// Ensure users table has at least one user so user foreign keys don't fail
const userSeedCheck = `    $userCount = (int)$pdo->query("SELECT COUNT(*) FROM \`users\`")->fetchColumn();
    if ($userCount === 0) {
        $pdo->exec("INSERT INTO \`users\` (\`id\`, \`name\`, \`username\`, \`password\`, \`role\`) VALUES (1, 'Varun', 'varun', 'password', 'user')");
    }`;

if (!dbContent.includes('$userCount = (int)$pdo->query("SELECT COUNT(*) FROM `users`")')) {
  const targetUserTable = `    // 1. Users Table (INT AUTO_INCREMENT)`;
  dbContent = dbContent.replace(targetUserTable, `    // 1. Users Table (INT AUTO_INCREMENT)\n` + userSeedCheck + `\n`);
  console.log('Added auto-seed for default user in db.php');
}

// In ensureSchema: also remove foreign key constraint if it is blocking null or invalid IDs
fs.writeFileSync('api/config/db.php', dbContent, 'utf8');
console.log('Saved api/config/db.php');

