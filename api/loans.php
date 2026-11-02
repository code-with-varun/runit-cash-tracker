<?php
// MoneyMatrix AI — Loan Accounts & PMT Amortization Engine API
// Calculates financial PMT, monthly interest/principal breakdown, processing fees, GST, and late fees
// Exactly matching RBL_PL_3531 statement and enterprise loan ledger schema

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/helpers/response.php';

try {
    $pdo = getDb();
    ensureSchema($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $userId = (int)($_GET['user_id'] ?? ($_SERVER['HTTP_X_USER_ID'] ?? 2));
    if ($userId <= 0) $userId = 2; // Default to varun

    // PMT helper
    function calculatePMT($ratePct, $nper, $pv) {
        $r = ($ratePct / 100.0) / 12.0;
        if ($r == 0) return $pv / $nper;
        $pmt = $pv * ($r * pow(1 + $r, $nper)) / (pow(1 + $r, $nper) - 1);
        return round($pmt, 2);
    }

    if ($method === 'GET') {
        $loanAccountNo = $_GET['account_no'] ?? null;

        // Fetch loan masters for user
        $lStmt = $pdo->prepare("SELECT * FROM `loan_masters` WHERE user_id = :uid ORDER BY sanction_date DESC");
        $lStmt->execute([':uid' => $userId]);
        $loans = $lStmt->fetchAll(PDO::FETCH_ASSOC);

        // If no loans seeded yet, check if seed requested or return empty
        if (empty($loans)) {
            if (($_GET['action'] ?? '') !== 'seed') {
                jsonResponse([
                    'success' => true,
                    'loans' => [],
                    'active_loan' => null,
                    'schedule' => [],
                    'statement_ledger' => []
                ]);
            }
            $principal = 282000.00;
            $rate = 14.5;
            $tenure = 36;
            $procFee = 7050.00;
            $gstFee = 1269.00;
            $emi = 10480.00; // Exact EMI from statement

            $insStmt = $pdo->prepare("
                INSERT INTO `loan_masters` 
                    (`user_id`, `account_no`, `lender_name`, `loan_type`, `sanction_date`, `principal_amount`, `interest_rate_pct`, `tenure_months`, `processing_fee`, `gst_on_fee`, `monthly_emi`, `status`)
                VALUES 
                    (:uid, 'RBL_PL_3531', 'RBL Bank (Dial For Cash)', 'PERSONAL_LOAN', '2020-03-07', :p, :r, :t, :pf, :gst, :emi, 'ACTIVE')
            ");
            $insStmt->execute([
                ':uid' => $userId,
                ':p' => $principal,
                ':r' => $rate,
                ':t' => $tenure,
                ':pf' => $procFee,
                ':gst' => $gstFee,
                ':emi' => $emi
            ]);
            $loanId = $pdo->lastInsertId();

            // Also ensure account exists in accounts master
            $accCheck = $pdo->prepare("SELECT COUNT(*) FROM `accounts` WHERE user_id = :uid AND code = 'RBL_PL_3531'");
            $accCheck->execute([':uid' => $userId]);
            if ((int)$accCheck->fetchColumn() === 0) {
                $accIns = $pdo->prepare("INSERT INTO `accounts` (`user_id`, `code`, `name`, `type`, `dump_type`, `balance`, `status`) VALUES (:uid, 'RBL_PL_3531', 'RBL_PL_3531 (Dial For Cash)', 'Loan Account', 'LOAN', -282000.00, 'active')");
                $accIns->execute([':uid' => $userId]);
            }

            // Generate Amortization Schedule
            $openBal = $principal;
            $monthlyRate = ($rate / 100.0) / 12.0;

            for ($i = 1; $i <= $tenure; $i++) {
                $dueDate = date('Y-m-14', strtotime("2020-03-07 +{$i} month"));
                $interest = round($openBal * $monthlyRate, 2);
                $princComp = round($emi - $interest, 2);
                $closeBal = round(max(0, $openBal - $princComp), 2);

                $schedStmt = $pdo->prepare("
                    INSERT INTO `loan_amortization_schedule`
                        (`loan_id`, `installment_no`, `due_date`, `opening_balance`, `emi_amount`, `principal_component`, `interest_component`, `closing_balance`, `paid_date`, `paid_amount`, `late_fee`, `status`)
                    VALUES
                        (:lid, :ino, :ddate, :openb, :emiamt, :pcomp, :icomp, :closeb, :pdate, :pamt, :lfee, :stat)
                ");

                $isPaid = $i <= 11;
                $schedStmt->execute([
                    ':lid' => $loanId,
                    ':ino' => $i,
                    ':ddate' => $dueDate,
                    ':openb' => $openBal,
                    ':emiamt' => $emi,
                    ':pcomp' => $princComp,
                    ':icomp' => $interest,
                    ':closeb' => $closeBal,
                    ':pdate' => $isPaid ? $dueDate : null,
                    ':pamt' => $isPaid ? $emi : 0.00,
                    ':lfee' => ($i === 8 || $i === 10) ? 1250.00 : 0.00,
                    ':stat' => $isPaid ? 'PAID' : 'PENDING'
                ]);

                $openBal = $closeBal;
            }

            // Re-fetch
            $lStmt->execute([':uid' => $userId]);
            $loans = $lStmt->fetchAll(PDO::FETCH_ASSOC);
        }

        $activeLoan = $loans[0];
        if ($loanAccountNo) {
            foreach ($loans as $l) {
                if ($l['account_no'] === $loanAccountNo) {
                    $activeLoan = $l;
                    break;
                }
            }
        }

        // Fetch Amortization Schedule for the active loan
        $schedStmt = $pdo->prepare("SELECT * FROM `loan_amortization_schedule` WHERE loan_id = :lid ORDER BY installment_no ASC");
        $schedStmt->execute([':lid' => $activeLoan['id']]);
        $schedule = $schedStmt->fetchAll(PDO::FETCH_ASSOC);

        // Generate the exact Statement Ledger Format matching user screenshot Image 3
        $statementRows = [
            [
                'transaction_date' => $activeLoan['sanction_date'],
                'account_no' => $activeLoan['account_no'],
                'particulars' => 'DIAL FOR CASH BOOKING',
                'debit' => 0.00,
                'credit' => (float)$activeLoan['principal_amount'],
                'balance' => 0.00
            ],
            [
                'transaction_date' => $activeLoan['sanction_date'],
                'account_no' => $activeLoan['account_no'],
                'particulars' => 'PROCESSING FEE (DIAL FOR CASH)',
                'debit' => (float)$activeLoan['processing_fee'],
                'credit' => 0.00,
                'balance' => 0.00
            ],
            [
                'transaction_date' => date('Y-m-d', strtotime($activeLoan['sanction_date'] . ' +7 days')),
                'account_no' => $activeLoan['account_no'],
                'particulars' => 'Goods & Services Tax',
                'debit' => (float)$activeLoan['gst_on_fee'],
                'credit' => 0.00,
                'balance' => 0.00
            ]
        ];

        foreach ($schedule as $inst) {
            $numFormatted = sprintf('%03d/%03d', $inst['installment_no'], $activeLoan['tenure_months']);
            $statementRows[] = [
                'transaction_date' => $inst['due_date'],
                'account_no' => $activeLoan['account_no'],
                'particulars' => "EMI INSTALMENT-{$numFormatted}(DIAL FOR CASH)",
                'debit' => (float)$inst['emi_amount'],
                'credit' => 0.00,
                'balance' => 0.00
            ];

            if ((float)$inst['late_fee'] > 0) {
                $statementRows[] = [
                    'transaction_date' => date('Y-m-d', strtotime($inst['due_date'] . ' -8 days')),
                    'account_no' => $activeLoan['account_no'],
                    'particulars' => 'LATE FEE',
                    'debit' => (float)$inst['late_fee'],
                    'credit' => 0.00,
                    'balance' => 0.00
                ];
                $statementRows[] = [
                    'transaction_date' => $inst['due_date'],
                    'account_no' => $activeLoan['account_no'],
                    'particulars' => 'Goods & Services Tax',
                    'debit' => round((float)$inst['late_fee'] * 0.18, 2),
                    'credit' => 0.00,
                    'balance' => 0.00
                ];
            }
        }

        echo json_encode([
            'success' => true,
            'loans' => $loans,
            'active_loan' => $activeLoan,
            'schedule' => $schedule,
            'statement_ledger' => $statementRows
        ]);
        exit;
    }

    if ($method === 'POST') {
        $raw = file_get_contents('php://input');
        $payload = json_decode($raw, true);

        if (!$payload || !isset($payload['account_no']) || !isset($payload['principal_amount'])) {
            jsonResponse(['error' => 'account_no and principal_amount are required'], 400);
        }

        $accNo = trim($payload['account_no']);
        $lender = trim($payload['lender_name'] ?? 'Lender Loan');
        $principal = (float)$payload['principal_amount'];
        $rate = (float)($payload['interest_rate_pct'] ?? 14.5);
        $tenure = (int)($payload['tenure_months'] ?? 36);
        $procFee = (float)($payload['processing_fee'] ?? round($principal * 0.025, 2));
        $gstFee = (float)($payload['gst_on_fee'] ?? round($procFee * 0.18, 2));
        $sancDate = $payload['sanction_date'] ?? date('Y-m-d');
        $emi = calculatePMT($rate, $tenure, $principal);

        $ins = $pdo->prepare("
            INSERT INTO `loan_masters` 
                (`user_id`, `account_no`, `lender_name`, `loan_type`, `sanction_date`, `principal_amount`, `interest_rate_pct`, `tenure_months`, `processing_fee`, `gst_on_fee`, `monthly_emi`, `status`)
            VALUES 
                (:uid, :acc, :lender, 'PERSONAL_LOAN', :sanc, :p, :r, :t, :pf, :gst, :emi, 'ACTIVE')
        ");
        $ins->execute([
            ':uid' => $userId,
            ':acc' => $accNo,
            ':lender' => $lender,
            ':sanc' => $sancDate,
            ':p' => $principal,
            ':r' => $rate,
            ':t' => $tenure,
            ':pf' => $procFee,
            ':gst' => $gstFee,
            ':emi' => $emi
        ]);
        $loanId = $pdo->lastInsertId();

        // Generate schedule
        $openBal = $principal;
        $monthlyRate = ($rate / 100.0) / 12.0;

        for ($i = 1; $i <= $tenure; $i++) {
            $dueDate = date('Y-m-14', strtotime("{$sancDate} +{$i} month"));
            $interest = round($openBal * $monthlyRate, 2);
            $princComp = round($emi - $interest, 2);
            $closeBal = round(max(0, $openBal - $princComp), 2);

            $schedStmt = $pdo->prepare("
                INSERT INTO `loan_amortization_schedule`
                    (`loan_id`, `installment_no`, `due_date`, `opening_balance`, `emi_amount`, `principal_component`, `interest_component`, `closing_balance`, `status`)
                VALUES
                    (:lid, :ino, :ddate, :openb, :emiamt, :pcomp, :icomp, :closeb, 'PENDING')
            ");
            $schedStmt->execute([
                ':lid' => $loanId,
                ':ino' => $i,
                ':ddate' => $dueDate,
                ':openb' => $openBal,
                ':emiamt' => $emi,
                ':pcomp' => $princComp,
                ':icomp' => $interest,
                ':closeb' => $closeBal
            ]);
            $openBal = $closeBal;
        }

        jsonResponse(['success' => true, 'message' => 'Loan and PMT amortization schedule created', 'loan_id' => $loanId, 'emi' => $emi]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
