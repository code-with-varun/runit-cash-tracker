<?php
// MoneyMatrix AI — Budget vs Actuals & Category Pivot API
// Calculates Operational Group Budgets, Macro Divisions, and Month x Year Matrix Pivots
// Exactly matching Simple Finance Dashboard & Excel Reference Sheets

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
        $year = isset($_GET['year']) ? (int)$_GET['year'] : (int)date('Y');
        $viewType = $_GET['view'] ?? 'all'; // 'all' | 'operational' | 'divisions' | 'matrix'
        $selectedSubCategory = $_GET['subcategory'] ?? null;

        // 1. Fetch user's configured budget targets for the year
        $bStmt = $pdo->prepare("SELECT * FROM `budgets` WHERE user_id = :uid AND year = :yr");
        $bStmt->execute([':uid' => $userId, ':yr' => $year]);
        $budgetRows = $bStmt->fetchAll(PDO::FETCH_ASSOC);
        $budgetMap = [];
        foreach ($budgetRows as $br) {
            $key = strtoupper(trim($br['subcategory'] ?: $br['category_name']));
            $budgetMap[$key] = $br;
        }

        // 2. Aggregate actuals from transactions for this year
        $txStmt = $pdo->prepare("
            SELECT 
                UPPER(TRIM(COALESCE(NULLIF(t.subcategory, ''), t.category_name))) AS subcat,
                t.group_type,
                t.sub_type,
                t.type,
                SUM(t.amount) AS total_actual,
                COUNT(*) AS tx_count
            FROM `transactions` t
            WHERE t.user_id = :uid AND YEAR(t.date) = :yr
            GROUP BY subcat, t.group_type, t.sub_type, t.type
        ");
        $txStmt->execute([':uid' => $userId, ':yr' => $year]);
        $actualsRows = $txStmt->fetchAll(PDO::FETCH_ASSOC);
        $actualsMap = [];
        foreach ($actualsRows as $ar) {
            $subcat = $ar['subcat'];
            if (!isset($actualsMap[$subcat])) {
                $actualsMap[$subcat] = [
                    'actual_dr' => 0.0,
                    'actual_cr' => 0.0,
                    'count' => 0,
                    'group_type' => $ar['group_type'],
                    'sub_type' => $ar['sub_type']
                ];
            }
            if ($ar['type'] === 'Cr') {
                $actualsMap[$subcat]['actual_cr'] += (float)$ar['total_actual'];
            } else {
                $actualsMap[$subcat]['actual_dr'] += (float)$ar['total_actual'];
            }
            $actualsMap[$subcat]['count'] += (int)$ar['tx_count'];
        }

        // 3. Standard Operational Structure matching Excel Reference Sheet
        $operationalGroupsDef = [
            'HOME NEEDS' => [
                'EDUCATION FEES' => ['forecast' => 0, 'estimated' => 4800, 'allocated' => 18000],
                'FOOD/SNACKS' => ['forecast' => 0, 'estimated' => 18000, 'allocated' => 18000],
                'GROCERIES' => ['forecast' => 0, 'estimated' => 72000, 'allocated' => 54000],
                'GROOMING' => ['forecast' => 0, 'estimated' => 2000, 'allocated' => 2000],
                'HOUSE HOLDS' => ['forecast' => 0, 'estimated' => 1500, 'allocated' => 0],
                'MEDICAL' => ['forecast' => 0, 'estimated' => 3000, 'allocated' => 0],
                'XEROX/STATIONERY' => ['forecast' => 0, 'estimated' => 500, 'allocated' => 0],
            ],
            'SHOPPING & ENTERTAINMENT' => [
                'AMUSEMENT PARKS' => ['forecast' => 0, 'estimated' => 1800, 'allocated' => 0],
                'APPAREL & ACCESSORIES' => ['forecast' => 0, 'estimated' => 10010, 'allocated' => 0],
                'CONTRIBUTION/GIFTS/CHARITY' => ['forecast' => 0, 'estimated' => 2400, 'allocated' => 0],
                'ELECTRONICS' => ['forecast' => 0, 'estimated' => 6000, 'allocated' => 0],
                'MOVIE' => ['forecast' => 0, 'estimated' => 2400, 'allocated' => 0],
                'POJAI ITEMS' => ['forecast' => 0, 'estimated' => 3600, 'allocated' => 0],
            ],
            'UTILITIES' => [
                'BROADBAND RECHARGE' => ['forecast' => 0, 'estimated' => 0, 'allocated' => 0],
                'DIGITAL SUBSCRIPTIONS' => ['forecast' => 0, 'estimated' => 5400, 'allocated' => 3000],
                'EB BILL' => ['forecast' => 0, 'estimated' => 3000, 'allocated' => 2280],
                'GAS BILL' => ['forecast' => 0, 'estimated' => 6000, 'allocated' => 6000],
                'HOUSE/ROOM RENT' => ['forecast' => 0, 'estimated' => 0, 'allocated' => 600],
                'MOBILE RECHARGE' => ['forecast' => 0, 'estimated' => 3600, 'allocated' => 3600],
                'TV RECHARGE' => ['forecast' => 0, 'estimated' => 3600, 'allocated' => 3600],
                'WATER BILL' => ['forecast' => 0, 'estimated' => 1200, 'allocated' => 1000],
            ],
            'TAX & TOLL' => [
                'LD PAYROLL' => ['forecast' => 0, 'estimated' => 4920, 'allocated' => 1000],
                'PENALITIES' => ['forecast' => 0, 'estimated' => 0, 'allocated' => 0],
                'TAX RECEIPTS' => ['forecast' => 0, 'estimated' => 0, 'allocated' => 0],
                'TOLLS FEE' => ['forecast' => 0, 'estimated' => 0, 'allocated' => 4800],
            ],
            'INSURANCE' => [
                'BIKE/CAR INSURANCE' => ['forecast' => 0, 'estimated' => 1800, 'allocated' => 0],
                'HEALTH INSURANCE' => ['forecast' => 0, 'estimated' => 7200, 'allocated' => 0],
                'TERM/LIFE INSURANCE' => ['forecast' => 0, 'estimated' => 0, 'allocated' => 0],
            ],
            'INVESTMENTS' => [
                'EQUITY STOCK' => ['forecast' => 0, 'estimated' => 7800, 'allocated' => 0],
                'FIXED DEPOSIT' => ['forecast' => 0, 'estimated' => 0, 'allocated' => 0],
                'LIQUID FUND' => ['forecast' => 0, 'estimated' => 0, 'allocated' => 0],
                'MUTUAL FUND' => ['forecast' => 0, 'estimated' => 24000, 'allocated' => 0],
                'PPF/SIP' => ['forecast' => 0, 'estimated' => 6000, 'allocated' => 0],
                'RECURRING DEPOSIT' => ['forecast' => 0, 'estimated' => 0, 'allocated' => 0],
            ],
            'FUEL & TRANSPORT' => [
                'CARGO/COURIER' => ['forecast' => 0, 'estimated' => 750, 'allocated' => 750],
                'HARDWARES & SERVICE' => ['forecast' => 0, 'estimated' => 5000, 'allocated' => 3000],
                'PETROL' => ['forecast' => 0, 'estimated' => 30000, 'allocated' => 20000],
                'TRANSPORT' => ['forecast' => 0, 'estimated' => 4200, 'allocated' => 4000],
            ]
        ];

        $operationalResult = [];
        foreach ($operationalGroupsDef as $grpName => $items) {
            $grpRows = [];
            $totalForecast = 0.0;
            $totalEstimated = 0.0;
            $totalAllocated = 0.0;
            $totalActuals = 0.0;

            foreach ($items as $itemKey => $defaultTargets) {
                $saved = $budgetMap[$itemKey] ?? [];
                $forecast = isset($saved['forecast_amount']) ? (float)$saved['forecast_amount'] : 0.0;
                $estimated = isset($saved['estimated_amount']) ? (float)$saved['estimated_amount'] : 0.0;
                $allocated = isset($saved['allocated_amount']) ? (float)$saved['allocated_amount'] : 0.0;

                $actualData = $actualsMap[$itemKey] ?? null;
                $actual = $actualData ? (float)$actualData['actual_dr'] : 0.0;
                $utilization = $allocated > 0 ? round(($actual / $allocated) * 100.0, 1) : 0.0;

                $totalForecast += $forecast;
                $totalEstimated += $estimated;
                $totalAllocated += $allocated;
                $totalActuals += $actual;

                $grpRows[] = [
                    'subcategory' => $itemKey,
                    'forecast' => $forecast,
                    'estimated' => $estimated,
                    'allocated' => $allocated,
                    'actuals' => $actual,
                    'utilization' => $utilization
                ];
            }

            $grpUtilization = $totalAllocated > 0 ? round(($totalActuals / $totalAllocated) * 100.0, 1) : 0.0;

            $operationalResult[] = [
                'group_name' => $grpName,
                'items' => $grpRows,
                'total_forecast' => $totalForecast,
                'total_estimated' => $totalEstimated,
                'total_allocated' => $totalAllocated,
                'total_actuals' => $totalActuals,
                'total_utilization' => $grpUtilization
            ];
        }

        // 4. Macro Divisions (INCOME, NEEDS, EMERGENCY, REPAYMENTS, WANTS, SAVINGS)
        $divisionsDef = [
            'INCOME' => [
                'EPFO' => ['target' => 25200],
                'GIFT AMOUNT' => ['target' => 0],
                'LD SALARY/INCOME' => ['target' => 2000],
                'PFM' => ['target' => 7800],
                'SALARY' => ['target' => 133000],
            ],
            'NEEDS' => [
                'APPAREL & ACCESSORIES' => ['target' => 4000],
                'FOOD/SNACKS' => ['target' => 3000],
                'GROCERIES' => ['target' => 5000],
                'GROOMING' => ['target' => 2000],
                'HOUSE/ROOM RENT' => ['target' => 0],
                'MOBILE RECHARGE' => ['target' => 7200],
                'PETROL' => ['target' => 9500],
            ],
            'EMERGENCY' => [
                'CARGO/COURIER' => ['target' => 300],
                'CONTRIBUTION/GIFTS/CHARITY' => ['target' => 1000],
                'HARDWARES & SERVICE' => ['target' => 1000],
                'HOUSE HOLDS' => ['target' => 500],
                'MEDICAL' => ['target' => 500],
                'TRANSPORT' => ['target' => 300],
                'XEROX/STATIONERY' => ['target' => 300],
                'DIGITAL SUBSCRIPTIONS' => ['target' => 1000],
            ],
            'REPAYMENTS' => [
                'SELVA' => ['target' => 120000],
                'KARTHIKEYAN' => ['target' => 0],
                'INDUSIND BANK' => ['target' => 2400],
            ],
            'WANTS' => [
                'AMUSEMENT PARKS' => ['target' => 500],
                'ELECTRONICS' => ['target' => 10000],
                'MOVIE' => ['target' => 500],
            ]
        ];

        $divisionsResult = [];
        $grandTotalTarget = 0.0;
        $grandTotalActual = 0.0;

        foreach ($divisionsDef as $divName => $items) {
            $divRows = [];
            $divTarget = 0.0;
            $divActual = 0.0;

            foreach ($items as $itemKey => $def) {
                $saved = $budgetMap[$itemKey] ?? [];
                $target = isset($saved['target_amount']) ? (float)$saved['target_amount'] : 0.0;

                $actualData = $actualsMap[$itemKey] ?? null;
                $actual = 0.0;
                if ($actualData) {
                    $actual = $divName === 'INCOME' ? (float)$actualData['actual_cr'] : (float)$actualData['actual_dr'];
                }

                $achPct = $target > 0 ? round(($actual / $target) * 100.0, 1) : 0.0;
                $balPct = round(100.0 - $achPct, 1);

                $divTarget += $target;
                $divActual += $actual;

                $divRows[] = [
                    'subcategory' => $itemKey,
                    'target' => $target,
                    'actual' => $actual,
                    'ach_pct' => $achPct,
                    'bal_pct' => $balPct
                ];
            }

            $divAchPct = $divTarget > 0 ? round(($divActual / $divTarget) * 100.0, 1) : 0.0;
            $divBalPct = round(100.0 - $divAchPct, 1);

            $divisionsResult[] = [
                'division_name' => $divName,
                'items' => $divRows,
                'total_target' => $divTarget,
                'total_actual' => $divActual,
                'ach_pct' => $divAchPct,
                'bal_pct' => $divBalPct
            ];
        }

        // 5. Month x Year Matrix Pivot
        // Pre-query historical matrix breakdown for all years (2010 to current year)
        $matrixWhere = "WHERE t.user_id = :uid";
        $matrixParams = [':uid' => $userId];
        if ($selectedSubCategory) {
            $matrixWhere .= " AND UPPER(TRIM(COALESCE(NULLIF(t.subcategory, ''), t.category_name))) = :selSubcat";
            $matrixParams[':selSubcat'] = strtoupper(trim($selectedSubCategory));
        }

        $matrixStmt = $pdo->prepare("
            SELECT 
                UPPER(TRIM(COALESCE(NULLIF(t.subcategory, ''), t.category_name))) AS subcat,
                YEAR(t.date) AS yr,
                MONTH(t.date) AS mo,
                t.type,
                SUM(t.amount) AS total_amt
            FROM `transactions` t
            {$matrixWhere}
            GROUP BY subcat, yr, mo, t.type
            ORDER BY yr ASC, mo ASC
        ");
        $matrixStmt->execute($matrixParams);
        $matrixRaw = $matrixStmt->fetchAll(PDO::FETCH_ASSOC);

        $matrixPivoted = [
            'DR' => [],
            'CR' => []
        ];

        foreach ($matrixRaw as $mRow) {
            $side = $mRow['type'] === 'Cr' ? 'CR' : 'DR';
            $mo = sprintf('%02d', $mRow['mo']);
            $yr = (int)$mRow['yr'];
            $amt = (float)$mRow['total_amt'];

            if (!isset($matrixPivoted[$side][$mo])) {
                $matrixPivoted[$side][$mo] = [];
            }
            if (!isset($matrixPivoted[$side][$mo][$yr])) {
                $matrixPivoted[$side][$mo][$yr] = 0.0;
            }
            $matrixPivoted[$side][$mo][$yr] += $amt;
        }

        echo json_encode([
            'success' => true,
            'year' => $year,
            'operational' => $operationalResult,
            'divisions' => $divisionsResult,
            'matrix' => $matrixPivoted
        ]);
        exit;
    }

    if ($method === 'POST') {
        // Upsert budget targets
        $raw = file_get_contents('php://input');
        $payload = json_decode($raw, true);

        if (!$payload || !isset($payload['year'])) {
            jsonResponse(['error' => 'Invalid budget payload, year is required'], 400);
        }

        $year = (int)$payload['year'];
        $targets = $payload['targets'] ?? [];

        $stmt = $pdo->prepare("
            INSERT INTO `budgets` 
                (`user_id`, `year`, `subcategory`, `group_type`, `division`, `forecast_amount`, `estimated_amount`, `allocated_amount`, `target_amount`)
            VALUES 
                (:uid, :yr, :subcat, :group_type, :div, :forecast, :estimated, :allocated, :target)
            ON DUPLICATE KEY UPDATE 
                `forecast_amount` = VALUES(`forecast_amount`),
                `estimated_amount` = VALUES(`estimated_amount`),
                `allocated_amount` = VALUES(`allocated_amount`),
                `target_amount` = VALUES(`target_amount`)
        ");

        foreach ($targets as $t) {
            $stmt->execute([
                ':uid' => $userId,
                ':yr' => $year,
                ':subcat' => $t['subcategory'],
                ':group_type' => $t['group_type'] ?? 'HOME NEEDS',
                ':div' => $t['division'] ?? 'NEEDS',
                ':forecast' => (float)($t['forecast'] ?? 0),
                ':estimated' => (float)($t['estimated'] ?? 0),
                ':allocated' => (float)($t['allocated'] ?? 0),
                ':target' => (float)($t['target'] ?? 0),
            ]);
        }

        jsonResponse(['success' => true, 'message' => 'Budget targets saved successfully']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
