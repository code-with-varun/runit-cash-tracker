const { execSync } = require('child_process');
const fs = require('fs');

const phpCode = `<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REQUEST_URI'] = '/api/transactions';

// Mock php://input
$testPayload = [
    'date' => '2026-11-02',
    'accountNo' => 'ICICI_DM_3142',
    'notes' => 'Shell Fuel Refill Test',
    'amount' => 1250.00,
    'type' => 'Dr',
    'subcategory' => 'PETROL',
    'division' => 'MOBILITY',
    'costCenter' => 'Vehicle',
    'profitCenter' => 'Salary', // Invalid for Dr - must be nullified
    'budget' => 'Travel Budget',
    'project' => 'Goa Trip'
];

$file = tempnam(sys_get_temp_dir(), 'php_in_');
file_put_contents($file, json_encode($testPayload));

// Use stream filter or redefine file_get_contents for test
function getTestInput() {
    global $testPayload;
    return $testPayload;
}

require_once 'api/config/cors.php';
require_once 'api/config/db.php';
require_once 'api/helpers/response.php';

$pdo = getDb();
ensureSchema($pdo);
$userId = 2;

// Execute the exact code from api/transactions.php
$input = $testPayload;
$type = ($input['type'] ?? 'Dr') === 'Cr' ? 'Cr' : 'Dr';
$accNo = $input['accountNo'] ?? 'Cash_1';
$subcat = $input['subcategory'] ?? 'PETROL';
$amount = (float)($input['amount'] ?? 0);
$notes = $input['notes'] ?? '';

$stmt = $pdo->prepare("
    INSERT INTO transactions (
        user_id, account_id, account_no, date, category_id, category_name, 
        subcategory, group_type, net_type, sub_type, transaction_type, 
        type, amount, balance, notes, date_group, temp_upload_id, tran_no,
        tagging, job_utils, compensation_type, split_ref, info_type, 
        info_status, eid, allocation_eid, job_timeline, remarks, 
        account_type, suffix, keyword_tagging, sub_cat_helper, method, 
        mode, category, \`month\`, \`year\`, week_no, \`year_month\`, 
        tran_type_helper, audit_status, utr_no, budget, cost_center, profit_center, project, division
    ) VALUES (
        :user_id, NULL, :account_no, :date, NULL, :category_name, 
        :subcategory, :group_type, :net_type, :sub_type, :transaction_type, 
        :type, :amount, :balance, :notes, '1', NULL, NULL,
        NULL, NULL, NULL, NULL, 'BOTH', 
        NULL, NULL, NULL, NULL, NULL, 
        'Bank', 'DR', NULL, NULL, 'UPI', 
        'ONLINE', 'FUEL & TRANSPORT', '11', '2026', '45', '2026-11', 
        NULL, 'draft', NULL, :budget, :cost_center, :profit_center, :project, :division
    )
");

$stmt->execute([
    ':user_id' => $userId,
    ':account_no' => $accNo,
    ':date' => '2026-11-02',
    ':category_name' => $subcat,
    ':subcategory' => $subcat,
    ':group_type' => 'MOBILITY',
    ':net_type' => 'NEEDS',
    ':sub_type' => 'NEEDS',
    ':transaction_type' => 'ACTUAL',
    ':type' => $type,
    ':amount' => $amount,
    ':balance' => 0.00,
    ':notes' => $notes,
    ':budget' => ($type === 'Dr') ? ($input['budget'] ?? null) : null,
    ':cost_center' => ($type === 'Dr') ? ($input['costCenter'] ?? null) : null,
    ':profit_center' => ($type === 'Cr') ? ($input['profitCenter'] ?? null) : null,
    ':project' => $input['project'] ?? null,
    ':division' => $input['division'] ?? 'MOBILITY'
]);

$newId = (int)$pdo->lastInsertId();
$row = $pdo->query("SELECT id, type, subcategory, division, cost_center, profit_center, budget, project FROM transactions WHERE id = {$newId}")->fetch(PDO::FETCH_ASSOC);

// Clean up test line
$pdo->exec("DELETE FROM transactions WHERE id = {$newId}");

echo json_encode(['success' => true, 'tested_row' => $row]);
`;

fs.writeFileSync('test_single_post.php', phpCode);
try {
  const out = execSync('C:\\xampp\\php\\php.exe test_single_post.php', { encoding: 'utf8' });
  console.log('Result:', JSON.parse(out.substring(out.indexOf('{'))));
} finally {
  if (fs.existsSync('test_single_post.php')) fs.unlinkSync('test_single_post.php');
}

