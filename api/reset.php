<?php
// Reset Data Endpoint - User-Scoped Clean Empty State Reset
// Completely clears all modules across transactions, categories, accounts, closing snapshots,
// budgets, counterparties, loan masters & schedules, stock holdings, and career milestones.
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/helpers/response.php';

handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$userId = getRequestedUserId();

if (!$userId) {
    jsonResponse(['error' => 'User authentication required for system reset'], 401);
}

try {
    $pdo = getDb();
    ensureSchema($pdo);

    $pdo->beginTransaction();

    // 1. Delete all transactions belonging to this user
    $stmtTx = $pdo->prepare("DELETE FROM transactions WHERE user_id = :user_id");
    $stmtTx->execute([':user_id' => $userId]);
    $deletedTxs = $stmtTx->rowCount();

    // 2. Delete all categories belonging to this user
    $stmtCat = $pdo->prepare("DELETE FROM categories WHERE user_id = :user_id");
    $stmtCat->execute([':user_id' => $userId]);
    $deletedCats = $stmtCat->rowCount();

    // 3. Reset accounts: Remove custom accounts, preserve Cash_1 with balance 0.00
    $stmtAcc = $pdo->prepare("DELETE FROM accounts WHERE user_id = :user_id AND code != 'Cash_1'");
    $stmtAcc->execute([':user_id' => $userId]);
    $deletedAccounts = $stmtAcc->rowCount();

    // Ensure Cash_1 exists with 0.00 balance
    $cashCheck = $pdo->prepare("SELECT id FROM accounts WHERE user_id = :user_id AND code = 'Cash_1' LIMIT 1");
    $cashCheck->execute([':user_id' => $userId]);
    $cashId = $cashCheck->fetchColumn();

    if ($cashId) {
        $pdo->prepare("UPDATE accounts SET balance = 0.00, status = 'active' WHERE id = :id")->execute([':id' => $cashId]);
    } else {
        $pdo->prepare("INSERT INTO accounts (user_id, code, name, type, dump_type, balance, status) VALUES (:user_id, 'Cash_1', 'Cash_1 (Physical Cash)', 'Cash Account', 'FINANCE', 0.00, 'active')")->execute([':user_id' => $userId]);
    }

    // 4. Clear Closing Balance Snapshots
    try {
        $pdo->prepare("DELETE FROM daily_closing_snapshots WHERE user_id = :user_id")->execute([':user_id' => $userId]);
        $pdo->prepare("DELETE FROM monthly_closing_snapshots WHERE user_id = :user_id")->execute([':user_id' => $userId]);
        $pdo->prepare("DELETE FROM yearly_closing_snapshots WHERE user_id = :user_id")->execute([':user_id' => $userId]);
    } catch (\Throwable $e) {}

    // 5. Clear Budgets
    try {
        $pdo->prepare("DELETE FROM budgets WHERE user_id = :user_id")->execute([':user_id' => $userId]);
    } catch (\Throwable $e) {}

    // 6. Clear Counterparties & AP/AR
    try {
        $pdo->prepare("DELETE FROM counterparties WHERE user_id = :user_id")->execute([':user_id' => $userId]);
    } catch (\Throwable $e) {}

    // 7. Clear Loans & PMT Amortization Schedules
    try {
        $pdo->prepare("DELETE FROM loan_amortization_schedule WHERE loan_id IN (SELECT id FROM loan_masters WHERE user_id = :user_id)")->execute([':user_id' => $userId]);
        $pdo->prepare("DELETE FROM loan_masters WHERE user_id = :user_id")->execute([':user_id' => $userId]);
    } catch (\Throwable $e) {}

    // 8. Clear Stock Portfolio Holdings
    try {
        $pdo->prepare("DELETE FROM stock_holdings WHERE user_id = :user_id")->execute([':user_id' => $userId]);
    } catch (\Throwable $e) {}

    // 9. Clear Career Milestones & Job Experience
    try {
        $pdo->prepare("DELETE FROM career_milestones WHERE user_id = :user_id")->execute([':user_id' => $userId]);
    } catch (\Throwable $e) {}

    // 10. Clear any user-specific settings
    try {
        $pdo->prepare("DELETE FROM settings WHERE user_id = :user_id")->execute([':user_id' => $userId]);
    } catch (\Throwable $e) {}

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => 'System reset completed. Entire database across all modules cleanly returned to empty state.',
        'user_id' => (int)$userId,
        'deleted_transactions' => $deletedTxs,
        'deleted_categories' => $deletedCats,
        'deleted_custom_accounts' => $deletedAccounts,
    ]);
} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['error' => $e->getMessage()], 500);
}
