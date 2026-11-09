const { execSync } = require('child_process');
const fs = require('fs');

const phpCode = `<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REQUEST_URI'] = '/api/transactions';
$rawInput = json_encode([
    'date' => '2026-11-02',
    'accountNo' => 'ICICI_DM_3142',
    'particulars' => 'Shell Petrol Pump Fuel',
    'amount' => 1500.00,
    'type' => 'Dr',
    'subcategory' => 'PETROL',
    'category' => 'FUEL & TRANSPORT',
    'division' => 'MOBILITY',
    'subType' => 'NEEDS',
    'transactionType' => 'ACTUAL',
    'costCenter' => 'Vehicle',
    'profitCenter' => 'Salary', // Should be stripped because it is Dr (Expense)
    'budget' => 'Travel Budget',
    'project' => 'Goa Trip'
]);

// Override php://input wrapper simulation
function getTestJson() {
    global $rawInput;
    return json_decode($rawInput, true);
}

require_once 'api/config/cors.php';
require_once 'api/config/db.php';
require_once 'api/helpers/response.php';

$pdo = getDb();
ensureSchema($pdo);
$userId = 2;

// Execute insertion logic matching api/transactions.php
$input = json_decode($rawInput, true);
$type = ($input['type'] ?? 'Dr') === 'Cr' ? 'Cr' : 'Dr';
$isExpense = ($type === 'Dr');
$isIncome = ($type === 'Cr');
$finalCostCenter = $isIncome ? null : ($input['costCenter'] ?? null);
$finalProfitCenter = $isExpense ? null : ($input['profitCenter'] ?? null);

$stmt = $pdo->prepare("
    INSERT INTO transactions (
        user_id, account_id, account_no, date, particulars,
        type, amount, balance,
        category_id, category_name, subcategory, division, group_type, net_type, sub_type, transaction_type,
        cost_center, profit_center, budget, project,
        audit_status, created_at, updated_at
    ) VALUES (
        :uid, NULL, :account_no, :date, :particulars,
        :type, :amount, 0.00,
        NULL, :category_name, :subcategory, :division, :group_type, :net_type, :sub_type, :transaction_type,
        :cost_center, :profit_center, :budget, :project,
        'draft', NOW(), NOW()
    )
");

$stmt->execute([
    ':uid' => $userId,
    ':account_no' => $input['accountNo'],
    ':date' => $input['date'],
    ':particulars' => $input['particulars'],
    ':type' => $type,
    ':amount' => $input['amount'],
    ':category_name' => $input['subcategory'],
    ':subcategory' => $input['subcategory'],
    ':division' => $input['division'],
    ':group_type' => $input['division'],
    ':net_type' => $input['subType'],
    ':sub_type' => $input['subType'],
    ':transaction_type' => $input['transactionType'],
    ':cost_center' => $finalCostCenter,
    ':profit_center' => $finalProfitCenter,
    ':budget' => $input['budget'],
    ':project' => $input['project']
]);

$newId = $pdo->lastInsertId();
$check = $pdo->query("SELECT id, type, subcategory, division, cost_center, profit_center, budget, project FROM transactions WHERE id = {$newId}")->fetch(PDO::FETCH_ASSOC);
echo json_encode(['success' => true, 'inserted' => $check]);
`;

fs.writeFileSync('test_insert_tmp.php', phpCode);
try {
  const out = execSync('C:\\xampp\\php\\php.exe test_insert_tmp.php', { encoding: 'utf8' });
  const json = JSON.parse(out.substring(out.indexOf('{')));
  console.log('Insert test result:', json);
} finally {
  if (fs.existsSync('test_insert_tmp.php')) fs.unlinkSync('test_insert_tmp.php');
}

