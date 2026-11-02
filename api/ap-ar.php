<?php
// MoneyMatrix AI — AP / AR Counterparty Matrix & Yearwise Net P/L API
// Computes multi-person reconciliation matrix and 2010-2024 Net P/L ledger
// Counterparties: SELVA, KARTHIKN, ANEETH, MUTHU, JOTHI, SEGAR, THULASI, SANTHOSH

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/helpers/response.php';

try {
    $pdo = getDb();
    ensureSchema($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $userId = (int)($_GET['user_id'] ?? ($_SERVER['HTTP_X_USER_ID'] ?? 2));
    if ($userId <= 0) $userId = 2; // Default to varun

    if ($method === 'GET') {
        // Query user counterparties
        $cpStmt = $pdo->prepare("SELECT name FROM counterparties WHERE user_id = :uid ORDER BY id ASC");
        $cpStmt->execute([':uid' => $userId]);
        $counterparties = $cpStmt->fetchAll(PDO::FETCH_COLUMN);

        if (empty($counterparties)) {
            if (($_GET['action'] ?? '') === 'seed') {
                $standard = ['SELVA', 'KARTHIKN', 'ANEETH', 'MUTHU', 'JOTHI', 'SEGAR', 'THULASI', 'SANTHOSH'];
                $insCp = $pdo->prepare("INSERT INTO `counterparties` (`user_id`, `name`, `relationship_type`, `status`) VALUES (:uid, :name, 'FRIEND', 'active')");
                foreach ($standard as $sc) {
                    $insCp->execute([':uid' => $userId, ':name' => $sc]);
                }
                $counterparties = $standard;
            } else {
                jsonResponse([
                    'success' => true,
                    'counterparties' => [],
                    'matrix' => [],
                    'raw_data' => [],
                    'yearwise_pl' => []
                ]);
            }
        }

        // Default baseline figures matching user's Excel AP/AR sample sheet
        $baselineData = [
            'LOAN' => [
                'SELVA' => 370000, 'KARTHIKN' => 2500, 'ANEETH' => 586959, 'MUTHU' => 0,
                'JOTHI' => 176492, 'SEGAR' => 29132, 'THULASI' => 4500, 'SANTHOSH' => 18200
            ],
            'LEVERAGE' => [
                'SELVA' => 0, 'KARTHIKN' => 0, 'ANEETH' => 0, 'MUTHU' => 0,
                'JOTHI' => 0, 'SEGAR' => 0, 'THULASI' => 0, 'SANTHOSH' => 0
            ],
            'ADVANCE' => [
                'SELVA' => 0, 'KARTHIKN' => 0, 'ANEETH' => 280, 'MUTHU' => 1050,
                'JOTHI' => 200, 'SEGAR' => 0, 'THULASI' => 0, 'SANTHOSH' => 2230
            ],
            'SHARED_SPENDING' => [
                'SELVA' => 0, 'KARTHIKN' => 0, 'ANEETH' => 0, 'MUTHU' => 0,
                'JOTHI' => 0, 'SEGAR' => 0, 'THULASI' => 0, 'SANTHOSH' => 0
            ],
            'LOAN_REPAYMENT' => [
                'SELVA' => 423000, 'KARTHIKN' => 2500, 'ANEETH' => 46300, 'MUTHU' => 0,
                'JOTHI' => 13145, 'SEGAR' => 37425, 'THULASI' => 91000, 'SANTHOSH' => 8595
            ],
            'CC_ROTATION_OUT_OTHERS' => [
                'SELVA' => 0, 'KARTHIKN' => 0, 'ANEETH' => 0, 'MUTHU' => 0,
                'JOTHI' => 0, 'SEGAR' => 0, 'THULASI' => 0, 'SANTHOSH' => 0
            ],
            'CC_ROTATION_IN_OTHERS' => [
                'SELVA' => 0, 'KARTHIKN' => 0, 'ANEETH' => 0, 'MUTHU' => 0,
                'JOTHI' => 0, 'SEGAR' => 0, 'THULASI' => 0, 'SANTHOSH' => 0
            ],
            'CC_ROTATION_IN_VARUN' => [
                'SELVA' => 0, 'KARTHIKN' => 0, 'ANEETH' => 281500, 'MUTHU' => 0,
                'JOTHI' => 0, 'SEGAR' => 0, 'THULASI' => 0, 'SANTHOSH' => 0
            ],
            'CC_ROTATION_OUT_VARUN' => [
                'SELVA' => 0, 'KARTHIKN' => 0, 'ANEETH' => 118100, 'MUTHU' => 0,
                'JOTHI' => 0, 'SEGAR' => 0, 'THULASI' => 0, 'SANTHOSH' => 0
            ],
            'REIMBURSABLE' => [
                'SELVA' => 4184, 'KARTHIKN' => 0, 'ANEETH' => 21404, 'MUTHU' => 0,
                'JOTHI' => 1095, 'SEGAR' => 0, 'THULASI' => 0, 'SANTHOSH' => 21692
            ],
            'LTO' => [
                'SELVA' => 0, 'KARTHIKN' => 0, 'ANEETH' => 5940, 'MUTHU' => 500,
                'JOTHI' => 0, 'SEGAR' => 0, 'THULASI' => 0, 'SANTHOSH' => 0
            ],
            'REIMBURSEMENT_CLAIM' => [
                'SELVA' => 4644, 'KARTHIKN' => 0, 'ANEETH' => 4614, 'MUTHU' => 1337,
                'JOTHI' => 3270, 'SEGAR' => 249, 'THULASI' => 0, 'SANTHOSH' => 9850
            ],
        ];

        // Read dynamic overrides if saved in settings or transactions
        $sStmt = $pdo->prepare("SELECT setting_value FROM `settings` WHERE user_id = :uid AND setting_key = 'ap_ar_matrix_overrides'");
        $sStmt->execute([':uid' => $userId]);
        $customRaw = $sStmt->fetchColumn();
        if ($customRaw) {
            $custom = json_decode($customRaw, true);
            if (is_array($custom)) {
                $baselineData = array_replace_recursive($baselineData, $custom);
            }
        }

        // Calculate differences per person
        $matrixSummary = [];
        foreach ($counterparties as $cp) {
            $loan = (float)($baselineData['LOAN'][$cp] ?? 0);
            $leverage = (float)($baselineData['LEVERAGE'][$cp] ?? 0);
            $advance = (float)($baselineData['ADVANCE'][$cp] ?? 0);
            $sharedSpending = (float)($baselineData['SHARED_SPENDING'][$cp] ?? 0);
            $loanRepay = (float)($baselineData['LOAN_REPAYMENT'][$cp] ?? 0);

            // AP Difference = (Loan + Leverage + Advance + Shared - Loan Repayment)
            // Negative means overpaid/we owe less, positive means we still owe
            $apDiff = ($loan + $leverage + $advance + $sharedSpending) - $loanRepay;

            $ccRotOutOthers = (float)($baselineData['CC_ROTATION_OUT_OTHERS'][$cp] ?? 0);
            $ccRotInOthers = (float)($baselineData['CC_ROTATION_IN_OTHERS'][$cp] ?? 0);
            $ccRotInVarun = (float)($baselineData['CC_ROTATION_IN_VARUN'][$cp] ?? 0);
            $ccRotOutVarun = (float)($baselineData['CC_ROTATION_OUT_VARUN'][$cp] ?? 0);

            // Rotation Difference = (CC Rot In - CC Rot Out)
            $rotDiff = ($ccRotInVarun + $ccRotInOthers) - ($ccRotOutVarun + $ccRotOutOthers);

            $reimbursable = (float)($baselineData['REIMBURSABLE'][$cp] ?? 0);
            $lto = (float)($baselineData['LTO'][$cp] ?? 0);
            $claim = (float)($baselineData['REIMBURSEMENT_CLAIM'][$cp] ?? 0);

            // AR Difference = (Reimbursable + LTO - Claim)
            $arDiff = ($reimbursable + $lto) - $claim;

            // Total Net Outstanding = AP Difference + Rotation Difference - AR Difference
            $netOutstanding = $apDiff + $rotDiff - $arDiff;

            $matrixSummary[$cp] = [
                'loan' => $loan,
                'leverage' => $leverage,
                'advance' => $advance,
                'shared_spending' => $sharedSpending,
                'loan_repayment' => $loanRepay,
                'ap_diff' => $apDiff,
                'cc_rot_out_others' => $ccRotOutOthers,
                'cc_rot_in_others' => $ccRotInOthers,
                'cc_rot_in_varun' => $ccRotInVarun,
                'cc_rot_out_varun' => $ccRotOutVarun,
                'rotation_diff' => $rotDiff,
                'reimbursable' => $reimbursable,
                'lto' => $lto,
                'reimbursement_claim' => $claim,
                'ar_diff' => $arDiff,
                'net_outstanding' => $netOutstanding
            ];
        }

        // 2. Yearwise Net P/L Ledger (2010 to 2024)
        $yearwisePLDef = [
            2010 => ['loans' => 0, 'leverage' => 0, 'net_income' => 3188, 'receivables' => 0, 'assets' => 0, 'net_expense' => 88],
            2011 => ['loans' => 0, 'leverage' => 0, 'net_income' => 13819, 'receivables' => 0, 'assets' => 0, 'net_expense' => 119],
            2012 => ['loans' => 19250, 'leverage' => 0, 'net_income' => 0, 'receivables' => 0, 'assets' => 0, 'net_expense' => 0],
            2013 => ['loans' => 0, 'leverage' => 0, 'net_income' => 93, 'receivables' => 0, 'assets' => 0, 'net_expense' => 0],
            2014 => ['loans' => 0, 'leverage' => 0, 'net_income' => 17623, 'receivables' => 0, 'assets' => 0, 'net_expense' => 30],
            2015 => ['loans' => 0, 'leverage' => 0, 'net_income' => 59864, 'receivables' => 0, 'assets' => 0, 'net_expense' => 6272],
            2016 => ['loans' => 4000, 'leverage' => 0, 'net_income' => 100432, 'receivables' => 0, 'assets' => 0, 'net_expense' => 13119],
            2017 => ['loans' => 10500, 'leverage' => 0, 'net_income' => 152834, 'receivables' => 2106, 'assets' => 0, 'net_expense' => 59444],
            2018 => ['loans' => 105884, 'leverage' => 0, 'net_income' => 346206, 'receivables' => 6864, 'assets' => 8000, 'net_expense' => 325662],
            2019 => ['loans' => 258248, 'leverage' => 0, 'net_income' => 280987, 'receivables' => 999, 'assets' => 6200, 'net_expense' => 307444],
            2020 => ['loans' => 1028901, 'leverage' => 0, 'net_income' => 86688, 'receivables' => 15404, 'assets' => 0, 'net_expense' => 914208],
            2021 => ['loans' => 410572, 'leverage' => 0, 'net_income' => 308244, 'receivables' => 611, 'assets' => 0, 'net_expense' => 317757],
            2022 => ['loans' => 356646, 'leverage' => 0, 'net_income' => 227931, 'receivables' => 25048, 'assets' => 31582, 'net_expense' => 617046],
            2023 => ['loans' => 313688, 'leverage' => 0, 'net_income' => 303654, 'receivables' => 46776, 'assets' => 12532, 'net_expense' => 440373],
            2024 => ['loans' => 430923, 'leverage' => 0, 'net_income' => 212258, 'receivables' => 29931, 'assets' => 12622, 'net_expense' => 323177],
        ];

        $yearwisePLRows = [];
        foreach ($yearwisePLDef as $yr => $data) {
            $netIncome = (float)$data['net_income'];
            $netExpense = (float)$data['net_expense'];
            $netPL = $netIncome - $netExpense;

            $yearwisePLRows[] = [
                'year' => $yr,
                'loans' => $data['loans'],
                'leverage' => $data['leverage'],
                'net_income' => $netIncome,
                'receivables' => $data['receivables'],
                'assets' => $data['assets'],
                'net_expense' => $netExpense,
                'net_pl' => $netPL,
            ];
        }

        echo json_encode([
            'success' => true,
            'counterparties' => $counterparties,
            'matrix' => $matrixSummary,
            'raw_data' => $baselineData,
            'yearwise_pl' => $yearwisePLRows
        ]);
        exit;
    }

    if ($method === 'POST') {
        $raw = file_get_contents('php://input');
        $payload = json_decode($raw, true);

        if (!$payload || !isset($payload['matrix_data'])) {
            jsonResponse(['error' => 'matrix_data is required'], 400);
        }

        $stmt = $pdo->prepare("
            INSERT INTO `settings` (`user_id`, `setting_key`, `setting_value`)
            VALUES (:uid, 'ap_ar_matrix_overrides', :val)
            ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`)
        ");
        $stmt->execute([
            ':uid' => $userId,
            ':val' => json_encode($payload['matrix_data'])
        ]);

        jsonResponse(['success' => true, 'message' => 'AP/AR matrix saved successfully']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
