<?php
// MoneyMatrix AI — Closing Balances & Net Worth API
// Provides Daywise, Monthwise, and Yearwise Closing Balances exactly matching enterprise financial sheets
// Formulas:
// Liquid Assets (Family Closing Balance) = Sum of Savings, Current, and Cash accounts balance
// CC Liability = Sum of Credit Card liabilities (negative)
// Loans Payable = Sum of Loans (negative)
// Net Worth = Liquid Assets + CC Liability + Loans Payable

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
        $type = $_GET['type'] ?? 'yearly'; // 'yearly' | 'monthly' | 'daily'
        $targetYear = isset($_GET['year']) ? (int)$_GET['year'] : null;

        // Fetch user's accounts to categorize them
        $accStmt = $pdo->prepare("SELECT id, code, name, type, dump_type, balance FROM `accounts` WHERE user_id = :uid");
        $accStmt->execute([':uid' => $userId]);
        $accounts = $accStmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch all verified/frozen transactions for accurate historical reconstruction
        $txStmt = $pdo->prepare("
            SELECT t.id, t.account_no, t.date, t.amount, t.type, t.balance, a.type AS acc_type, a.dump_type
            FROM `transactions` t
            LEFT JOIN `accounts` a ON (t.account_no = a.code AND a.user_id = :uid)
            WHERE t.user_id = :uid
            ORDER BY t.date ASC, t.id ASC
        ");
        $txStmt->execute([':uid' => $userId]);
        $allTxs = $txStmt->fetchAll(PDO::FETCH_ASSOC);

        if ($type === 'yearly') {
            // Group by Year (e.g. 2010 to 2024)
            $years = [];
            foreach ($allTxs as $tx) {
                $yr = (int)substr($tx['date'], 0, 4);
                if ($yr > 0) $years[$yr] = true;
            }
            if (empty($years)) {
                $currYr = (int)date('Y');
                for ($y = 2010; $y <= $currYr; $y++) $years[$y] = true;
            }
            ksort($years);

            $yearlyRows = [];
            foreach (array_keys($years) as $yr) {
                $yearEnd = "{$yr}-12-31";
                $lab = "{$yr}-12-Dec";

                $accountBalances = [];
                foreach ($accounts as $acc) {
                    $accountBalances[$acc['code']] = [
                        'type' => $acc['type'],
                        'dump_type' => $acc['dump_type'],
                        'balance' => 0.0
                    ];
                }

                foreach ($allTxs as $tx) {
                    if ($tx['date'] <= $yearEnd) {
                        $code = $tx['account_no'];
                        if (!isset($accountBalances[$code])) {
                            $accountBalances[$code] = [
                                'type' => $tx['acc_type'] ?: 'Savings Account',
                                'dump_type' => $tx['dump_type'] ?: 'BANK',
                                'balance' => 0.0
                            ];
                        }
                        $amt = (float)$tx['amount'];
                        if ($tx['type'] === 'Cr') {
                            $accountBalances[$code]['balance'] += $amt;
                        } else {
                            $accountBalances[$code]['balance'] -= $amt;
                        }
                    }
                }

                $familyBal = 0.0;
                $ccLiability = 0.0;
                $loansPayable = 0.0;

                foreach ($accountBalances as $code => $acc) {
                    $bal = $acc['balance'];
                    $t = strtolower($acc['type'] . ' ' . $acc['dump_type']);
                    if (str_contains($t, 'credit') || str_contains($t, 'cc')) {
                        if ($bal < 0) {
                            $ccLiability += $bal;
                        }
                    } elseif (str_contains($t, 'loan')) {
                        if ($bal < 0) {
                            $loansPayable += $bal;
                        }
                    } else {
                        $familyBal += $bal;
                    }
                }

                $netWorth = $familyBal + $ccLiability + $loansPayable;

                $yearlyRows[] = [
                    'date' => "31-Dec-" . substr($yr, -2),
                    'full_date' => $yearEnd,
                    'year' => $yr,
                    'lab' => $lab,
                    'family_closing_balance' => round($familyBal, 2),
                    'cc_liability' => round($ccLiability, 2),
                    'loans' => round($loansPayable, 2),
                    'networth' => round($netWorth, 2),
                    'networth_lakhs' => round($netWorth / 100000.0, 1),
                    'loans_lakhs' => round($loansPayable / 100000.0, 1),
                    'cc_liability_lakhs' => round($ccLiability / 100000.0, 1),
                    'savings_bal_lakhs' => round($familyBal / 100000.0, 1),
                ];
            }

            echo json_encode(['success' => true, 'data' => $yearlyRows]);
            exit;
        }

        if ($type === 'monthly') {
            $months = [];
            foreach ($allTxs as $tx) {
                $ym = substr($tx['date'], 0, 7);
                if ($ym) $months[$ym] = true;
            }
            if ($targetYear) {
                for ($m = 1; $m <= 12; $m++) {
                    $ym = sprintf('%04d-%02d', $targetYear, $m);
                    $months[$ym] = true;
                }
            }
            ksort($months);

            $monthlyRows = [];
            foreach (array_keys($months) as $ym) {
                $parts = explode('-', $ym);
                $y = (int)$parts[0];
                $m = (int)$parts[1];
                $lastDay = date('t', strtotime("{$ym}-01"));
                $monthEndDate = "{$ym}-{$lastDay}";
                $monthName = date('M', strtotime("{$ym}-01"));
                $lab = "{$y}-{$parts[1]}-{$monthName}";

                $accountBalances = [];
                foreach ($accounts as $acc) {
                    $accountBalances[$acc['code']] = [
                        'type' => $acc['type'],
                        'dump_type' => $acc['dump_type'],
                        'balance' => 0.0
                    ];
                }

                foreach ($allTxs as $tx) {
                    if ($tx['date'] <= $monthEndDate) {
                        $code = $tx['account_no'];
                        if (!isset($accountBalances[$code])) {
                            $accountBalances[$code] = [
                                'type' => $tx['acc_type'] ?: 'Savings Account',
                                'dump_type' => $tx['dump_type'] ?: 'BANK',
                                'balance' => 0.0
                            ];
                        }
                        $amt = (float)$tx['amount'];
                        if ($tx['type'] === 'Cr') {
                            $accountBalances[$code]['balance'] += $amt;
                        } else {
                            $accountBalances[$code]['balance'] -= $amt;
                        }
                    }
                }

                $familyBal = 0.0;
                $ccLiability = 0.0;
                $loansPayable = 0.0;
                foreach ($accountBalances as $code => $acc) {
                    $bal = $acc['balance'];
                    $t = strtolower($acc['type'] . ' ' . $acc['dump_type']);
                    if (str_contains($t, 'credit') || str_contains($t, 'cc')) {
                        if ($bal < 0) $ccLiability += $bal;
                    } elseif (str_contains($t, 'loan')) {
                        if ($bal < 0) $loansPayable += $bal;
                    } else {
                        $familyBal += $bal;
                    }
                }

                $netWorth = $familyBal + $ccLiability + $loansPayable;

                $monthlyRows[] = [
                    'date' => "{$lastDay}-{$monthName}-" . substr($y, -2),
                    'full_date' => $monthEndDate,
                    'year_month' => $ym,
                    'year' => $y,
                    'lab' => $lab,
                    'family_closing_balance' => round($familyBal, 2),
                    'cc_liability' => round($ccLiability, 2),
                    'loans' => round($loansPayable, 2),
                    'networth' => round($netWorth, 2),
                    'networth_lakhs' => round($netWorth / 100000.0, 1),
                    'loans_lakhs' => round($loansPayable / 100000.0, 1),
                    'cc_liability_lakhs' => round($ccLiability / 100000.0, 1),
                    'savings_bal_lakhs' => round($familyBal / 100000.0, 1),
                ];
            }

            echo json_encode(['success' => true, 'data' => $monthlyRows]);
            exit;
        }

        if ($type === 'daily') {
            $dates = [];
            foreach ($allTxs as $tx) {
                if ($tx['date']) $dates[$tx['date']] = true;
            }
            ksort($dates);

            $dailyRows = [];
            foreach (array_keys($dates) as $dStr) {
                $accountBalances = [];
                foreach ($accounts as $acc) {
                    $accountBalances[$acc['code']] = [
                        'type' => $acc['type'],
                        'dump_type' => $acc['dump_type'],
                        'balance' => 0.0
                    ];
                }

                foreach ($allTxs as $tx) {
                    if ($tx['date'] <= $dStr) {
                        $code = $tx['account_no'];
                        if (!isset($accountBalances[$code])) {
                            $accountBalances[$code] = [
                                'type' => $tx['acc_type'] ?: 'Savings Account',
                                'dump_type' => $tx['dump_type'] ?: 'BANK',
                                'balance' => 0.0
                            ];
                        }
                        $amt = (float)$tx['amount'];
                        if ($tx['type'] === 'Cr') {
                            $accountBalances[$code]['balance'] += $amt;
                        } else {
                            $accountBalances[$code]['balance'] -= $amt;
                        }
                    }
                }

                $familyBal = 0.0;
                $ccLiability = 0.0;
                $loansPayable = 0.0;
                foreach ($accountBalances as $code => $acc) {
                    $bal = $acc['balance'];
                    $t = strtolower($acc['type'] . ' ' . $acc['dump_type']);
                    if (str_contains($t, 'credit') || str_contains($t, 'cc')) {
                        if ($bal < 0) $ccLiability += $bal;
                    } elseif (str_contains($t, 'loan')) {
                        if ($bal < 0) $loansPayable += $bal;
                    } else {
                        $familyBal += $bal;
                    }
                }

                $netWorth = $familyBal + $ccLiability + $loansPayable;
                $dailyRows[] = [
                    'date' => date('d-M-y', strtotime($dStr)),
                    'full_date' => $dStr,
                    'lab' => $dStr,
                    'family_closing_balance' => round($familyBal, 2),
                    'cc_liability' => round($ccLiability, 2),
                    'loans' => round($loansPayable, 2),
                    'networth' => round($netWorth, 2),
                    'networth_lakhs' => round($netWorth / 100000.0, 1),
                    'loans_lakhs' => round($loansPayable / 100000.0, 1),
                    'cc_liability_lakhs' => round($ccLiability / 100000.0, 1),
                    'savings_bal_lakhs' => round($familyBal / 100000.0, 1),
                ];
            }

            echo json_encode(['success' => true, 'data' => $dailyRows]);
            exit;
        }

        echo json_encode(['success' => false, 'error' => 'Invalid closing balance type']);
        exit;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
