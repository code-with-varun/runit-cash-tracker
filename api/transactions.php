<?php
// Transactions Management API (GET, POST, PUT, DELETE)
// Complete 36-Header Enterprise Taxonomy, Grouping & Date-Wise Auditing
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/helpers/response.php';

handleCors();

$pdo = getDb();
$method = $_SERVER['REQUEST_METHOD'];
$userId = getRequestedUserId();

// Determine sub-action or id from query or URI
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$isBulk = str_ends_with($uri, '/bulk') || (isset($_GET['action']) && $_GET['action'] === 'bulk');
$transactionId = $_GET['id'] ?? null;

if (!$transactionId && preg_match('#/transactions/([0-9]+)$#', $uri, $matches)) {
    $transactionId = $matches[1];
}

switch ($method) {
    case 'GET':
        try {
            $accountFilter = $_GET['account'] ?? null;
            $dateFilter = $_GET['date'] ?? null;
            
            $whereParts = [];
            $params = [];

            if ($userId) {
                $whereParts[] = "user_id = :user_id";
                $params[':user_id'] = $userId;
            }

            if ($accountFilter && $accountFilter !== 'ALL') {
                $whereParts[] = "account_no = :account_no";
                $params[':account_no'] = $accountFilter;
            }

            if ($dateFilter && $dateFilter !== 'ALL') {
                $whereParts[] = "date = :date";
                $params[':date'] = $dateFilter;
            }

            $whereSql = !empty($whereParts) ? "WHERE " . implode(" AND ", $whereParts) : "";

            $stmt = $pdo->prepare("
                SELECT id, user_id, account_id, account_no AS accountNo, date, 
                       category_id AS categoryId, category_name AS categoryName, 
                       subcategory, group_type AS groupType, net_type AS netType, 
                       sub_type AS subType, transaction_type AS transactionType,
                       type, amount, balance, audit_status AS auditStatus, 
                       verified_at AS verifiedAt, frozen_at AS frozenAt,
                       notes, created_at AS createdAt,
                       date_group AS dateGroup, temp_upload_id AS tempUploadId,
                       tran_no AS tranNo, tagging, job_utils AS jobUtils,
                       compensation_type AS compensationType, split_ref AS splitRef,
                       info_type AS infoType, info_status AS infoStatus,
                       eid, allocation_eid AS allocationEid, job_timeline AS jobTimeline,
                       remarks, account_type AS accountType, suffix,
                       keyword_tagging AS keywordTagging, sub_cat_helper AS subCatHelper,
                       method, mode, category, `month`, `year`, week_no AS weekNo,
                       `year_month` AS yearMonth, tran_type_helper AS tranTypeHelper,
                       utr_no AS utrNo
                FROM transactions 
                {$whereSql}
                ORDER BY date DESC, id DESC
            ");
            $stmt->execute($params);
            $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($transactions as &$tx) {
                $tx['id'] = (int)$tx['id'];
                $tx['user_id'] = (int)$tx['user_id'];
                $tx['categoryId'] = $tx['categoryId'] ? (int)$tx['categoryId'] : null;
                $tx['account_id'] = $tx['account_id'] ? (int)$tx['account_id'] : null;
                $tx['amount'] = (float)$tx['amount'];
                $tx['balance'] = (float)($tx['balance'] ?? 0);
                $tx['debit'] = ($tx['type'] === 'Dr') ? (float)$tx['amount'] : 0.00;
                $tx['credit'] = ($tx['type'] === 'Cr') ? (float)$tx['amount'] : 0.00;
                $tx['notes'] = $tx['notes'] ?? '';
                $tx['particulars'] = $tx['notes'];
                $tx['tran_date'] = $tx['date'];
                $tx['accountNo'] = $tx['accountNo'] ?? 'Cash_1';
                $tx['account_no'] = $tx['accountNo'];
                $tx['subcategory'] = $tx['subcategory'] ?: $tx['categoryName'];
                $tx['SUB_CATEGORY'] = $tx['subcategory'];
                $tx['groupType'] = $tx['groupType'] ?: '';
                $tx['netType'] = $tx['netType'] ?: '';
                $tx['subType'] = $tx['subType'] ?: '';
                $tx['transactionType'] = $tx['transactionType'] ?: 'ACTUAL';
                $tx['transaction_type'] = $tx['transactionType'];
                $tx['auditStatus'] = $tx['auditStatus'] ?: 'draft';
                $tx['status'] = $tx['auditStatus'];
                $tx['verifiedAt'] = $tx['verifiedAt'] ?? null;
                $tx['frozenAt'] = $tx['frozenAt'] ?? null;
                $tx['dateGroup'] = $tx['dateGroup'] ?: '1';
                $tx['tempUploadId'] = $tx['tempUploadId'] ?: '';
                $tx['budget'] = $tx['budget'] ?? '';
                $tx['costCenter'] = $tx['costCenter'] ?? ($tx['cost_center'] ?? '');
                $tx['profitCenter'] = $tx['profitCenter'] ?? ($tx['profit_center'] ?? '');
                $tx['project'] = $tx['project'] ?? '';
                $tx['division'] = $tx['division'] ?? ($tx['groupType'] ?? '');
                $tx['tranNo'] = $tx['tranNo'] ?: ('TXN_' . str_pad($tx['id'], 6, '0', STR_PAD_LEFT));
                $tx['tagging'] = $tx['tagging'] ?: '';
                $tx['jobUtils'] = $tx['jobUtils'] ?: '';
                $tx['compensationType'] = $tx['compensationType'] ?: '';
                $tx['splitRef'] = $tx['splitRef'] ?: '';
                $tx['infoType'] = $tx['infoType'] ?: 'BOTH';
                $tx['infoStatus'] = $tx['infoStatus'] ?: '';
                $tx['eid'] = $tx['eid'] ?: '';
                $tx['allocationEid'] = $tx['allocationEid'] ?: '';
                $tx['jobTimeline'] = $tx['jobTimeline'] ?: '';
                $tx['remarks'] = $tx['remarks'] ?: $tx['notes'];
                $tx['accountType'] = $tx['accountType'] ?: 'Cash';
                $tx['suffix'] = $tx['suffix'] ?: ($tx['type'] === 'Cr' ? 'CR' : 'DR');
                $tx['keywordTagging'] = $tx['keywordTagging'] ?: '';
                $tx['subCatHelper'] = $tx['subCatHelper'] ?: '';
                $tx['method'] = $tx['method'] ?: 'UPI';
                $tx['mode'] = $tx['mode'] ?: 'ONLINE';
                $tx['category'] = $tx['category'] ?: 'General';
                $tx['month'] = $tx['month'] ?: date('m', strtotime($tx['date']));
                $tx['year'] = $tx['year'] ? (int)$tx['year'] : (int)date('Y', strtotime($tx['date']));
                $tx['weekNo'] = $tx['weekNo'] ? (int)$tx['weekNo'] : (int)date('W', strtotime($tx['date']));
                $tx['yearMonth'] = $tx['yearMonth'] ?: date('Y-m', strtotime($tx['date']));
                $tx['tranTypeHelper'] = $tx['tranTypeHelper'] ?: '';
                $tx['utrNo'] = $tx['utrNo'] ?: '';
            }

            jsonResponse($transactions);
        } catch (Exception $e) {
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    case 'POST':
        $input = getJsonInput();

        // Helper to load category details
        $catLookup = [];
        $catStmt = $pdo->query("SELECT id, name, subcategory, category, group_type, net_type, sub_type, transaction_type, suffix, info_type FROM categories");
        foreach ($catStmt->fetchAll(PDO::FETCH_ASSOC) as $c) {
            $catLookup[(int)$c['id']] = $c;
        }

        // Account lookup
        $accMap = [];
        $accTypeMap = [];
        $accStmt = $pdo->prepare("SELECT id, code, type FROM accounts WHERE user_id = :user_id OR user_id IS NULL");
        $accStmt->execute([':user_id' => $userId]);
        foreach ($accStmt->fetchAll(PDO::FETCH_ASSOC) as $a) {
            $accMap[$a['code']] = (int)$a['id'];
            $accTypeMap[$a['code']] = $a['type'];
        }

        if ($isBulk || (isset($input[0]) && is_array($input[0])) || (isset($input['transactions']) && is_array($input['transactions']))) {
            // Bulk Transactions Insert
            $items = $isBulk && isset($input['transactions']) ? $input['transactions'] : ($input['transactions'] ?? $input);
            if (!is_array($items)) {
                jsonResponse(['error' => 'Invalid bulk payload'], 400);
            }

            try {
                $stmt = $pdo->prepare("
                    INSERT INTO transactions (
                        user_id, account_id, account_no, date, category_id, category_name, 
                        subcategory, group_type, net_type, sub_type, transaction_type, 
                        type, amount, balance, notes, date_group, temp_upload_id, tran_no,
                        tagging, job_utils, compensation_type, split_ref, info_type, 
                        info_status, eid, allocation_eid, job_timeline, remarks, 
                        account_type, suffix, keyword_tagging, sub_cat_helper, method, 
                        mode, category, `month`, `year`, week_no, `year_month`, 
                        tran_type_helper, audit_status, utr_no, budget, cost_center, profit_center, project, division
                    ) VALUES (
                        :user_id, :account_id, :account_no, :date, :category_id, :category_name, 
                        :subcategory, :group_type, :net_type, :sub_type, :transaction_type, 
                        :type, :amount, :balance, :notes, :date_group, :temp_upload_id, :tran_no,
                        :tagging, :job_utils, :compensation_type, :split_ref, :info_type, 
                        :info_status, :eid, :allocation_eid, :job_timeline, :remarks, 
                        :account_type, :suffix, :keyword_tagging, :sub_cat_helper, :method, 
                        :mode, :category, :month, :year, :week_no, :year_month, 
                        :tran_type_helper, :audit_status, :utr_no, :budget, :cost_center, :profit_center, :project, :division
                    )
                ");

                $count = 0;
                foreach ($items as $tx) {
                    $accNo = $tx['accountNo'] ?? $tx['account_no'] ?? ($input['accountNo'] ?? 'Cash_1');
                    $accId = $tx['accountId'] ?? ($accMap[$accNo] ?? null);
                    $catId = !empty($tx['categoryId']) && is_numeric($tx['categoryId']) ? (int)$tx['categoryId'] : null;

                    $cMeta = $catId && isset($catLookup[$catId]) ? $catLookup[$catId] : null;
                    $catName = $tx['categoryName'] ?? ($cMeta ? $cMeta['name'] : 'General');
                    $subcat = $tx['subcategory'] ?? ($cMeta ? $cMeta['subcategory'] : $catName);
                    $group = $tx['groupType'] ?? ($cMeta ? $cMeta['group_type'] : '');
                    $net = $tx['netType'] ?? ($cMeta ? $cMeta['net_type'] : '');
                    $sub = $tx['subType'] ?? ($cMeta ? $cMeta['sub_type'] : '');
                    $txType = $tx['transactionType'] ?? ($cMeta ? $cMeta['transaction_type'] : 'ACTUAL');
                    $catParent = $tx['category'] ?? ($cMeta ? $cMeta['category'] : 'General');
                    $suffix = $tx['suffix'] ?? ($cMeta ? $cMeta['suffix'] : ($tx['type'] === 'Cr' ? 'CR' : 'DR'));

                    $txDate = $tx['date'] ?? ($tx['tran_date'] ?? date('Y-m-d'));
                    $d = new DateTime($txDate);
                    $month = $tx['month'] ?? $d->format('m');
                    $year = $tx['year'] ? (int)$tx['year'] : (int)$d->format('Y');
                    $weekNo = $tx['weekNo'] ? (int)$tx['weekNo'] : (int)$d->format('W');
                    $yearMonth = $tx['yearMonth'] ?? $d->format('Y-m');

                    $notes = $tx['notes'] ?? ($tx['particulars'] ?? '');
                    $remarks = $tx['remarks'] ?? $notes;

                    $amount = 0.00;
                    $type = 'Dr';
                    if (isset($tx['debit']) && (float)$tx['debit'] > 0) {
                        $amount = (float)$tx['debit'];
                        $type = 'Dr';
                    } elseif (isset($tx['credit']) && (float)$tx['credit'] > 0) {
                        $amount = (float)$tx['credit'];
                        $type = 'Cr';
                    } elseif (isset($tx['amount'])) {
                        $amount = (float)$tx['amount'];
                        $type = in_array($tx['type'] ?? '', ['Cr', 'Dr', 'NU']) ? $tx['type'] : 'Dr';
                    }

                    $stmt->execute([
                        ':user_id' => $userId,
                        ':account_id' => $accId,
                        ':account_no' => $accNo,
                        ':date' => $txDate,
                        ':category_id' => $catId,
                        ':category_name' => $catName,
                        ':subcategory' => $subcat,
                        ':group_type' => $group,
                        ':net_type' => $net,
                        ':sub_type' => $sub,
                        ':transaction_type' => $txType,
                        ':type' => $type,
                        ':amount' => $amount,
                        ':balance' => (float)($tx['balance'] ?? 0),
                        ':notes' => $notes,
                        ':date_group' => $tx['dateGroup'] ?? ($tx['date_group'] ?? '1'),
                        ':temp_upload_id' => $tx['tempUploadId'] ?? ($tx['temp_upload_id'] ?? null),
                        ':tran_no' => $tx['tranNo'] ?? ($tx['tran_no'] ?? null),
                        ':tagging' => $tx['tagging'] ?? null,
                        ':job_utils' => $tx['jobUtils'] ?? ($tx['job_utils'] ?? null),
                        ':compensation_type' => $tx['compensationType'] ?? ($tx['compensation_type'] ?? null),
                        ':split_ref' => $tx['splitRef'] ?? ($tx['split_ref'] ?? null),
                        ':info_type' => $tx['infoType'] ?? ($tx['info_type'] ?? 'BOTH'),
                        ':info_status' => $tx['infoStatus'] ?? ($tx['info_status'] ?? null),
                        ':eid' => $tx['eid'] ?? null,
                        ':allocation_eid' => $tx['allocationEid'] ?? ($tx['allocation_eid'] ?? null),
                        ':job_timeline' => $tx['jobTimeline'] ?? ($tx['job_timeline'] ?? null),
                        ':remarks' => $remarks,
                        ':account_type' => $tx['accountType'] ?? ($accTypeMap[$accNo] ?? 'Cash'),
                        ':suffix' => $suffix,
                        ':keyword_tagging' => $tx['keywordTagging'] ?? ($tx['keyword_tagging'] ?? null),
                        ':sub_cat_helper' => $tx['subCatHelper'] ?? ($tx['sub_cat_helper'] ?? null),
                        ':method' => $tx['method'] ?? 'UPI',
                        ':mode' => $tx['mode'] ?? 'ONLINE',
                        ':category' => $catParent,
                        ':month' => $month,
                        ':year' => $year,
                        ':week_no' => $weekNo,
                        ':year_month' => $yearMonth,
                        ':tran_type_helper' => $tx['tranTypeHelper'] ?? ($tx['tran_type_helper'] ?? null),
                        ':audit_status' => in_array($tx['auditStatus'] ?? ($tx['status'] ?? ''), ['draft', 'verified', 'frozen']) ? ($tx['auditStatus'] ?? $tx['status']) : 'draft',
                        ':utr_no' => $tx['utrNo'] ?? ($tx['utr_no'] ?? null),
                        ':budget' => $tx['budget'] ?? null,
                        ':cost_center' => ($type === 'Dr' || $txType !== 'ACTUAL') ? ($tx['costCenter'] ?? ($tx['cost_center'] ?? null)) : null,
                        ':profit_center' => ($type === 'Cr') ? ($tx['profitCenter'] ?? ($tx['profit_center'] ?? null)) : null,
                        ':project' => $tx['project'] ?? null,
                        ':division' => $tx['division'] ?? ($cMeta ? $cMeta['division'] : ($group ?: 'LIVING')),
                    ]);
                    $count++;
                }

                jsonResponse(['message' => 'Bulk transactions inserted', 'count' => $count], 201);
            } catch (Exception $e) {
                jsonResponse(['error' => $e->getMessage()], 500);
            }
        } else {
            // Single Transaction Insert
            $accNo = $input['accountNo'] ?? ($input['account_no'] ?? 'Cash_1');
            $txDate = $input['date'] ?? ($input['tran_date'] ?? date('Y-m-d'));
            $categoryId = !empty($input['categoryId']) && is_numeric($input['categoryId']) ? (int)$input['categoryId'] : null;
            
            $amount = 0.00;
            $type = 'Dr';
            if (isset($input['debit']) && (float)$input['debit'] > 0) {
                $amount = (float)$input['debit'];
                $type = 'Dr';
            } elseif (isset($input['credit']) && (float)$input['credit'] > 0) {
                $amount = (float)$input['credit'];
                $type = 'Cr';
            } elseif (isset($input['amount'])) {
                $amount = (float)$input['amount'];
                $type = in_array($input['type'] ?? '', ['Cr', 'Dr', 'NU']) ? $input['type'] : 'Dr';
            }

            $notes = $input['notes'] ?? ($input['particulars'] ?? '');
            $remarks = $input['remarks'] ?? $notes;

            $cMeta = $categoryId && isset($catLookup[$categoryId]) ? $catLookup[$categoryId] : null;
            $categoryName = $input['categoryName'] ?? ($cMeta ? $cMeta['name'] : '');
            $subcat = $input['subcategory'] ?? ($cMeta ? $cMeta['subcategory'] : $categoryName);
            $group = $input['groupType'] ?? ($cMeta ? $cMeta['group_type'] : '');
            $net = $input['netType'] ?? ($cMeta ? $cMeta['net_type'] : '');
            $sub = $input['subType'] ?? ($cMeta ? $cMeta['sub_type'] : '');
            $txType = $input['transactionType'] ?? ($cMeta ? $cMeta['transaction_type'] : 'ACTUAL');
            $catParent = $input['category'] ?? ($cMeta ? $cMeta['category'] : 'General');
            $suffix = $input['suffix'] ?? ($cMeta ? $cMeta['suffix'] : ($type === 'Cr' ? 'CR' : 'DR'));

            $d = new DateTime($txDate);
            $month = $input['month'] ?? $d->format('m');
            $year = $input['year'] ? (int)$input['year'] : (int)$d->format('Y');
            $weekNo = $input['weekNo'] ? (int)$input['weekNo'] : (int)$d->format('W');
            $yearMonth = $input['yearMonth'] ?? $d->format('Y-m');

            try {
                $accId = $accMap[$accNo] ?? null;

                $stmt = $pdo->prepare("
                    INSERT INTO transactions (
                        user_id, account_id, account_no, date, category_id, category_name, 
                        subcategory, group_type, net_type, sub_type, transaction_type, 
                        type, amount, balance, notes, date_group, temp_upload_id, tran_no,
                        tagging, job_utils, compensation_type, split_ref, info_type, 
                        info_status, eid, allocation_eid, job_timeline, remarks, 
                        account_type, suffix, keyword_tagging, sub_cat_helper, method, 
                        mode, category, `month`, `year`, week_no, `year_month`, 
                        tran_type_helper, audit_status, utr_no, budget, cost_center, profit_center, project, division
                    ) VALUES (
                        :user_id, :account_id, :account_no, :date, :category_id, :category_name, 
                        :subcategory, :group_type, :net_type, :sub_type, :transaction_type, 
                        :type, :amount, :balance, :notes, :date_group, :temp_upload_id, :tran_no,
                        :tagging, :job_utils, :compensation_type, :split_ref, :info_type, 
                        :info_status, :eid, :allocation_eid, :job_timeline, :remarks, 
                        :account_type, :suffix, :keyword_tagging, :sub_cat_helper, :method, 
                        :mode, :category, :month, :year, :week_no, :year_month, 
                        :tran_type_helper, :audit_status, :utr_no, :budget, :cost_center, :profit_center, :project, :division
                    )
                ");
                $stmt->execute([
                    ':user_id' => $userId,
                    ':account_id' => $accId,
                    ':account_no' => $accNo,
                    ':date' => $txDate,
                    ':category_id' => $categoryId,
                    ':category_name' => $categoryName,
                    ':subcategory' => $subcat,
                    ':group_type' => $group,
                    ':net_type' => $net,
                    ':sub_type' => $sub,
                    ':transaction_type' => $txType,
                    ':type' => $type,
                    ':amount' => $amount,
                    ':balance' => (float)($input['balance'] ?? 0),
                    ':notes' => $notes,
                    ':date_group' => $input['dateGroup'] ?? ($input['date_group'] ?? '1'),
                    ':temp_upload_id' => $input['tempUploadId'] ?? ($input['temp_upload_id'] ?? null),
                    ':tran_no' => $input['tranNo'] ?? ($input['tran_no'] ?? null),
                    ':tagging' => $input['tagging'] ?? null,
                    ':job_utils' => $input['jobUtils'] ?? ($input['job_utils'] ?? null),
                    ':compensation_type' => $input['compensationType'] ?? ($input['compensation_type'] ?? null),
                    ':split_ref' => $input['splitRef'] ?? ($input['split_ref'] ?? null),
                    ':info_type' => $input['infoType'] ?? ($input['info_type'] ?? 'BOTH'),
                    ':info_status' => $input['infoStatus'] ?? ($input['info_status'] ?? null),
                    ':eid' => $input['eid'] ?? null,
                    ':allocation_eid' => $input['allocationEid'] ?? ($input['allocation_eid'] ?? null),
                    ':job_timeline' => $input['jobTimeline'] ?? ($input['job_timeline'] ?? null),
                    ':remarks' => $remarks,
                    ':account_type' => $input['accountType'] ?? ($accTypeMap[$accNo] ?? 'Cash'),
                    ':suffix' => $suffix,
                    ':keyword_tagging' => $input['keywordTagging'] ?? ($input['keyword_tagging'] ?? null),
                    ':sub_cat_helper' => $input['subCatHelper'] ?? ($input['sub_cat_helper'] ?? null),
                    ':method' => $input['method'] ?? 'UPI',
                    ':mode' => $input['mode'] ?? 'ONLINE',
                    ':category' => $catParent,
                    ':month' => $month,
                    ':year' => $year,
                    ':week_no' => $weekNo,
                    ':year_month' => $yearMonth,
                    ':tran_type_helper' => $input['tranTypeHelper'] ?? ($input['tran_type_helper'] ?? null),
                    ':audit_status' => in_array($input['auditStatus'] ?? ($input['status'] ?? ''), ['draft', 'verified', 'frozen']) ? ($input['auditStatus'] ?? $input['status']) : 'draft',
                    ':utr_no' => $input['utrNo'] ?? ($input['utr_no'] ?? null),
                    ':budget' => ($type === 'Dr') ? ($input['budget'] ?? null) : null,
                    ':cost_center' => ($type === 'Dr') ? ($input['costCenter'] ?? ($input['cost_center'] ?? null)) : null,
                    ':profit_center' => ($type === 'Cr') ? ($input['profitCenter'] ?? ($input['profit_center'] ?? null)) : null,
                    ':project' => $input['project'] ?? null,
                    ':division' => $input['division'] ?? ($catObj['division'] ?? $group),
                ]);

                $txId = (int)$pdo->lastInsertId();

                jsonResponse([
                    'id' => $txId,
                    'user_id' => (int)$userId,
                    'account_id' => $accId ? (int)$accId : null,
                    'accountNo' => $accNo,
                    'date' => $txDate,
                    'categoryId' => $categoryId,
                    'categoryName' => $categoryName,
                    'subcategory' => $subcat,
                    'groupType' => $group,
                    'netType' => $net,
                    'subType' => $sub,
                    'transactionType' => $txType,
                    'type' => $type,
                    'amount' => $amount,
                    'balance' => (float)($input['balance'] ?? 0),
                    'notes' => $notes,
                    'auditStatus' => 'draft',
                    'message' => 'Transaction created successfully'
                ], 201);
            } catch (Exception $e) {
                jsonResponse(['error' => $e->getMessage()], 500);
            }
        }
        break;

    case 'PUT':
        $input = getJsonInput();

        // 1. Bulk Audit Status Update
        if (isset($input['action']) && $input['action'] === 'bulk_audit') {
            $ids = array_filter(array_map('intval', $input['ids'] ?? []));
            $newStatus = $input['status'] ?? ($input['auditStatus'] ?? 'draft');
            if ($newStatus === 'locked') $newStatus = 'frozen';
            if (!in_array($newStatus, ['draft', 'verified', 'frozen'])) {
                jsonResponse(['error' => 'Invalid audit status'], 400);
            }

            if (empty($ids)) {
                jsonResponse(['error' => 'No transaction IDs provided for audit update'], 400);
            }
            $inClause = implode(',', $ids);
            try {
                $userClause = $userId ? " AND user_id = {$userId}" : "";
                if ($newStatus === 'verified') {
                    $pdo->exec("UPDATE transactions SET audit_status = 'verified', verified_at = NOW() WHERE id IN ({$inClause}) {$userClause}");
                } elseif ($newStatus === 'frozen') {
                    $pdo->exec("UPDATE transactions SET audit_status = 'frozen', frozen_at = NOW() WHERE id IN ({$inClause}) {$userClause}");
                } else {
                    $pdo->exec("UPDATE transactions SET audit_status = 'draft', verified_at = NULL, frozen_at = NULL WHERE id IN ({$inClause}) {$userClause}");
                }
                jsonResponse(['success' => true, 'message' => "Updated " . count($ids) . " transactions to {$newStatus}", 'count' => count($ids)]);
            } catch (Exception $e) {
                jsonResponse(['error' => $e->getMessage()], 500);
            }
        }

        $targetId = $transactionId ?? ($input['id'] ?? null);
        if (!$targetId) {
            jsonResponse(['error' => 'Transaction ID is required for update'], 400);
        }

        try {
            // Check existing status
            $checkStmt = $pdo->prepare("SELECT audit_status FROM transactions WHERE id = :id");
            $checkStmt->execute([':id' => $targetId]);
            $currentAudit = $checkStmt->fetchColumn() ?: 'draft';

            $newAuditStatus = $input['auditStatus'] ?? ($input['audit_status'] ?? ($input['status'] ?? null));
            if ($newAuditStatus === 'locked') $newAuditStatus = 'frozen';

            // If locked as frozen and not unfreezing
            if ($currentAudit === 'frozen' && ($newAuditStatus === null || $newAuditStatus === 'frozen')) {
                jsonResponse(['error' => 'This transaction is frozen and locked from modification.'], 403);
            }

            $catId = !empty($input['categoryId']) && is_numeric($input['categoryId']) ? (int)$input['categoryId'] : null;

            $cMeta = null;
            if ($catId) {
                $cStmt = $pdo->prepare("SELECT id, name, subcategory, category, group_type, net_type, sub_type, transaction_type, suffix, info_type FROM categories WHERE id = :id");
                $cStmt->execute([':id' => $catId]);
                $cMeta = $cStmt->fetch(PDO::FETCH_ASSOC);
            }

            $catName = $input['categoryName'] ?? ($cMeta ? $cMeta['name'] : null);
            $subcat = $input['subcategory'] ?? ($cMeta ? $cMeta['subcategory'] : $catName);
            $group = $input['groupType'] ?? ($cMeta ? $cMeta['group_type'] : null);
            $net = $input['netType'] ?? ($cMeta ? $cMeta['net_type'] : null);
            $sub = $input['subType'] ?? ($cMeta ? $cMeta['sub_type'] : null);
            $txType = $input['transactionType'] ?? ($cMeta ? $cMeta['transaction_type'] : null);
            $catParent = $input['category'] ?? ($cMeta ? $cMeta['category'] : null);

            // Build dynamic update
            $statusVal = $newAuditStatus ?: $currentAudit;
            $verifiedAtExpr = $statusVal === 'verified' ? "COALESCE(verified_at, NOW())" : ($statusVal === 'draft' ? "NULL" : "verified_at");
            $frozenAtExpr = $statusVal === 'frozen' ? "NOW()" : "NULL";

            $stmt = $pdo->prepare("
                UPDATE transactions 
                SET date = COALESCE(:date, date), 
                    category_id = COALESCE(:category_id, category_id), 
                    category_name = COALESCE(:category_name, category_name), 
                    subcategory = COALESCE(:subcategory, subcategory),
                    group_type = COALESCE(:group_type, group_type),
                    net_type = COALESCE(:net_type, net_type),
                    sub_type = COALESCE(:sub_type, sub_type),
                    transaction_type = COALESCE(:transaction_type, transaction_type),
                    type = COALESCE(:type, type), 
                    amount = COALESCE(:amount, amount), 
                    balance = COALESCE(:balance, balance),
                    notes = COALESCE(:notes, notes),
                    remarks = COALESCE(:remarks, remarks),
                    tagging = COALESCE(:tagging, tagging),
                    job_utils = COALESCE(:job_utils, job_utils),
                    compensation_type = COALESCE(:compensation_type, compensation_type),
                    split_ref = COALESCE(:split_ref, split_ref),
                    method = COALESCE(:method, method),
                    mode = COALESCE(:mode, mode),
                    category = COALESCE(:category, category),
                    utr_no = COALESCE(:utr_no, utr_no),
                    keyword_tagging = COALESCE(:keyword_tagging, keyword_tagging),
                    date_group = COALESCE(:date_group, date_group),
                    tran_no = COALESCE(:tran_no, tran_no),
                    budget = COALESCE(:budget, budget),
                    cost_center = :cost_center,
                    profit_center = :profit_center,
                    project = COALESCE(:project, project),
                    division = COALESCE(:division, division),
                    audit_status = :audit_status,
                    verified_at = {$verifiedAtExpr},
                    frozen_at = {$frozenAtExpr}
                WHERE id = :id AND (user_id = :user_id OR user_id IS NULL)
            ");
            $stmt->execute([
                ':id' => $targetId,
                ':user_id' => $userId,
                ':date' => $input['date'] ?? ($input['tran_date'] ?? null),
                ':category_id' => $catId,
                ':category_name' => $catName,
                ':subcategory' => $subcat,
                ':group_type' => $group,
                ':net_type' => $net,
                ':sub_type' => $sub,
                ':transaction_type' => $txType,
                ':type' => in_array($input['type'] ?? '', ['Cr', 'Dr', 'NU']) ? $input['type'] : null,
                ':amount' => isset($input['amount']) ? (float)$input['amount'] : (isset($input['debit']) && (float)$input['debit'] > 0 ? (float)$input['debit'] : (isset($input['credit']) && (float)$input['credit'] > 0 ? (float)$input['credit'] : null)),
                ':balance' => isset($input['balance']) ? (float)$input['balance'] : null,
                ':notes' => $input['notes'] ?? ($input['particulars'] ?? null),
                ':remarks' => $input['remarks'] ?? null,
                ':tagging' => $input['tagging'] ?? null,
                ':job_utils' => $input['jobUtils'] ?? ($input['job_utils'] ?? null),
                ':compensation_type' => $input['compensationType'] ?? ($input['compensation_type'] ?? null),
                ':split_ref' => $input['splitRef'] ?? ($input['split_ref'] ?? null),
                ':method' => $input['method'] ?? null,
                ':mode' => $input['mode'] ?? null,
                ':category' => $catParent,
                ':utr_no' => $input['utrNo'] ?? ($input['utr_no'] ?? null),
                ':keyword_tagging' => $input['keywordTagging'] ?? ($input['keyword_tagging'] ?? null),
                ':date_group' => $input['dateGroup'] ?? ($input['date_group'] ?? null),
                ':tran_no' => $input['tranNo'] ?? ($input['tran_no'] ?? null),
                ':audit_status' => $statusVal,
                ':budget' => $input['budget'] ?? null,
                ':cost_center' => (isset($input['type']) && $input['type'] === 'Cr') ? null : ($input['costCenter'] ?? ($input['cost_center'] ?? null)),
                ':profit_center' => (isset($input['type']) && $input['type'] === 'Dr') ? null : ($input['profitCenter'] ?? ($input['profit_center'] ?? null)),
                ':project' => $input['project'] ?? null,
                ':division' => $input['division'] ?? ($cMeta ? $cMeta['division'] : null),
            ]);

            jsonResponse([
                'id' => (int)$targetId,
                'categoryId' => $catId,
                'categoryName' => $catName,
                'subcategory' => $subcat,
                'groupType' => $group,
                'netType' => $net,
                'subType' => $sub,
                'transactionType' => $txType,
                'auditStatus' => $statusVal,
                'status' => $statusVal,
                'message' => 'Transaction updated successfully'
            ]);
        } catch (Exception $e) {
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    case 'DELETE':
        $targetId = $transactionId ?? ($_GET['id'] ?? null);
        if (!$targetId) {
            jsonResponse(['error' => 'Transaction ID is required for deletion'], 400);
        }

        try {
            $stmt = $pdo->prepare("SELECT audit_status FROM transactions WHERE id = :id");
            $stmt->execute([':id' => $targetId]);
            $currentStatus = $stmt->fetchColumn() ?: 'draft';

            if ($currentStatus === 'frozen') {
                jsonResponse(['error' => 'Cannot delete frozen transaction'], 403);
            }

            $delStmt = $pdo->prepare("DELETE FROM transactions WHERE id = :id AND (user_id = :user_id OR user_id IS NULL)");
            $delStmt->execute([':id' => $targetId, ':user_id' => $userId]);

            jsonResponse(['success' => true, 'message' => 'Transaction deleted successfully']);
        } catch (Exception $e) {
            jsonResponse(['error' => $e->getMessage()], 500);
        }
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
        break;
}
