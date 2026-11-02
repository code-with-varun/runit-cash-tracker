<?php
// Portfolio & Equity Demat Trading Suite API for Money Matrix
// Supports:
// 1. Stock Portfolio Holdings & LTCG 1-Year Readiness
// 2. NSE JV Demat Trading Account Client Control Ledger
// 3. Equity Order Log
// 4. Equity Trade Details (Statutory levies & tax breakdown)
// 5. Equity Trade Bills (Settlement Bills)

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/helpers/response.php';

$pdo = getDb();
$userId = (int)(getRequestedUserId() ?: 2);
if ($userId <= 0) $userId = 2;

// Ensure portfolio table exists
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS `stock_holdings` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL,
        `ticker` VARCHAR(50) NOT NULL,
        `name` VARCHAR(150) NOT NULL,
        `asset_class` VARCHAR(100) NOT NULL DEFAULT 'Equity',
        `sector` VARCHAR(100) NOT NULL DEFAULT 'Financial Services',
        `purchase_date` DATE NOT NULL,
        `qty` INT NOT NULL DEFAULT 1,
        `avg_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        `cmp` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        `is_top_ten` TINYINT(1) NOT NULL DEFAULT 0,
        `notes` TEXT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX `idx_stk_user` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
} catch (\Throwable $e) {}

$method = $_SERVER['REQUEST_METHOD'];

// Handle Seeding or Adding Holdings
if ($method === 'POST') {
    $input = getJsonInput();
    $action = $_GET['action'] ?? ($input['action'] ?? '');

    if ($action === 'seed') {
        $sampleHoldings = [
            ['HDFCBANK', 'HDFC Bank Ltd', 'Banking / Large Cap', 'Financial Services', '2023-01-15', 45, 1480.50, 1682.00, 1],
            ['TCS', 'Tata Consultancy Services', 'IT / Large Cap', 'Information Technology', '2023-04-10', 15, 3520.00, 4120.00, 1],
            ['RELIANCE', 'Reliance Industries Ltd', 'Energy / Conglomerate', 'Oil & Gas', '2023-08-22', 25, 2750.00, 2980.00, 1],
            ['INFY', 'Infosys Ltd', 'IT / Large Cap', 'Information Technology', '2023-11-05', 30, 1540.00, 1890.00, 1],
            ['PARAS', 'Paras Defence & Space Tech', 'Defence / Small Cap', 'Aerospace & Defence', '2024-02-14', 50, 720.00, 1140.00, 0],
            ['TATAMOTORS', 'Tata Motors Ltd', 'Automobile / Large Cap', 'Automobile', '2022-10-18', 60, 430.00, 965.00, 1],
            ['ITC', 'ITC Ltd', 'FMCG / Large Cap', 'FMCG', '2022-06-25', 120, 285.00, 492.00, 1],
            ['SBIN', 'State Bank of India', 'Banking / PSU', 'Financial Services', '2024-05-12', 80, 780.00, 845.00, 0],
            ['SGB_OCT28', 'Sovereign Gold Bond 2.5%', 'Precious Metals / Gold', 'Commodities / Gold', '2020-10-28', 10, 5120.00, 7650.00, 1]
        ];

        $pdo->prepare("DELETE FROM `stock_holdings` WHERE user_id = :uid")->execute([':uid' => $userId]);
        $ins = $pdo->prepare("INSERT INTO `stock_holdings` 
            (user_id, ticker, name, asset_class, sector, purchase_date, qty, avg_price, cmp, is_top_ten) 
            VALUES (:uid, :ticker, :name, :asset_class, :sector, :pdate, :qty, :avg_p, :cmp, :top10)");

        foreach ($sampleHoldings as $sh) {
            $ins->execute([
                ':uid' => $userId,
                ':ticker' => $sh[0],
                ':name' => $sh[1],
                ':asset_class' => $sh[2],
                ':sector' => $sh[3],
                ':pdate' => $sh[4],
                ':qty' => $sh[5],
                ':avg_p' => $sh[6],
                ':cmp' => $sh[7],
                ':top10' => $sh[8]
            ]);
        }
        jsonResponse(['success' => true, 'message' => 'Sample stock holdings populated successfully']);
    }

    // Insert user holding
    $ticker = strtoupper(trim($input['ticker'] ?? ''));
    $name = trim($input['name'] ?? $ticker);
    $assetClass = trim($input['asset_class'] ?? 'Equity');
    $sector = trim($input['sector'] ?? 'General');
    $pdate = trim($input['purchase_date'] ?? date('Y-m-d'));
    $qty = (int)($input['qty'] ?? 1);
    $avgPrice = (float)($input['avg_price'] ?? 0);
    $cmp = (float)($input['cmp'] ?? $avgPrice);
    $isTopTen = !empty($input['is_top_ten']) ? 1 : 0;

    if (!$ticker) {
        jsonResponse(['error' => 'Ticker symbol is required'], 400);
    }

    $ins = $pdo->prepare("INSERT INTO `stock_holdings` 
        (user_id, ticker, name, asset_class, sector, purchase_date, qty, avg_price, cmp, is_top_ten) 
        VALUES (:uid, :ticker, :name, :asset_class, :sector, :pdate, :qty, :avg_p, :cmp, :top10)");
    $ins->execute([
        ':uid' => $userId,
        ':ticker' => $ticker,
        ':name' => $name,
        ':asset_class' => $assetClass,
        ':sector' => $sector,
        ':pdate' => $pdate,
        ':qty' => $qty,
        ':avg_p' => $avgPrice,
        ':cmp' => $cmp,
        ':top10' => $isTopTen
    ]);

    jsonResponse(['success' => true, 'message' => 'Stock holding added successfully']);
}

// GET Portfolio Data
if ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM `stock_holdings` WHERE user_id = :uid ORDER BY id ASC");
    $stmt->execute([':uid' => $userId]);
    $dbHoldings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // If completely empty (application was reset)
    if (empty($dbHoldings)) {
        jsonResponse([
            'status' => 'success',
            'summary' => [
                'total_invested' => 0.00,
                'total_current_value' => 0.00,
                'total_unrealized_pnl' => 0.00,
                'total_pnl_pct' => 0.00,
                'ltcg_ready_value' => 0.00,
                'stcg_holding_value' => 0.00,
                'holdings_count' => 0
            ],
            'holdings' => [],
            'demat_ledger' => [],
            'order_log' => [],
            'trade_details' => [],
            'trade_bills' => []
        ]);
    }

    $now = new DateTime();
    $holdings = [];
    $totalInvested = 0;
    $totalCurrentVal = 0;
    $totalLtcgReadyVal = 0;
    $totalStcgVal = 0;

    foreach ($dbHoldings as $item) {
        $pDate = new DateTime($item['purchase_date']);
        $interval = $pDate->diff($now);
        $daysHeld = (int)$interval->format('%r%a');
        $isLtcg = ($daysHeld >= 365);

        $invested = round((float)$item['qty'] * (float)$item['avg_price'], 2);
        $currentVal = round((float)$item['qty'] * (float)$item['cmp'], 2);
        $pnl = round($currentVal - $invested, 2);
        $pnlPct = $invested > 0 ? round(($pnl / $invested) * 100, 2) : 0;

        $totalInvested += $invested;
        $totalCurrentVal += $currentVal;
        if ($isLtcg) {
            $totalLtcgReadyVal += $currentVal;
        } else {
            $totalStcgVal += $currentVal;
        }

        $holdings[] = array_merge($item, [
            'days_held' => $daysHeld,
            'is_ltcg' => $isLtcg,
            'ltcg_status' => $isLtcg ? 'Ready for Sale (LTCG >= 1 Yr)' : 'Holding (< 1 Yr / STCG)',
            'tax_treatment' => $isLtcg ? '12.5% LTCG (Exempt up to ₹1.25L)' : '20.0% STCG',
            'amount_invested' => $invested,
            'current_value' => $currentVal,
            'pnl' => $pnl,
            'pnl_pct' => $pnlPct
        ]);
    }

    // Demat Ledger for active holdings
    $dematLedger = [
        [
            'id' => 1,
            'trd_date' => '2024-01-10',
            'settlement_no' => '2024008',
            'narration' => 'NSE CASH TRADED VALUE BILL NO 242500129',
            'voucher_no' => 'BILL_129',
            'debit' => 45280.50,
            'credit' => 0.00,
            'running_balance' => -45280.50,
            'balance_type' => 'Dr'
        ],
        [
            'id' => 2,
            'trd_date' => '2024-01-11',
            'settlement_no' => 'UPI_782910',
            'narration' => 'FUNDS RECEIVED VIA UPI / HDFC BANK',
            'voucher_no' => 'REC_884',
            'debit' => 0.00,
            'credit' => 50000.00,
            'running_balance' => 4719.50,
            'balance_type' => 'Cr'
        ]
    ];

    // Order Log
    $orderLog = [];
    foreach ($holdings as $idx => $h) {
        $orderLog[] = [
            'id' => $idx + 1,
            'ord_date_time' => $h['purchase_date'] . ' 10:15:00',
            'exchange' => 'NSE',
            'symbol' => $h['ticker'],
            'action' => 'BUY',
            'qty' => $h['qty'],
            'order_type' => 'LIMIT',
            'limit_price' => (float)$h['avg_price'],
            'product' => 'CASH (CNC)',
            'status' => 'EXECUTED',
            'days_since_purchase' => $h['days_held']
        ];
    }

    // Trade Details with statutory tax breakdown
    $tradeDetails = [];
    foreach ($holdings as $idx => $h) {
        $mktVal = $h['amount_invested'];
        $stt = round($mktVal * 0.001, 2);
        $stamp = round($mktVal * 0.00015, 2);
        $turnover = round($mktVal * 0.0000345, 2);
        $brok = 20.00;
        $gst = round(($brok + $turnover) * 0.18, 2);
        $netTot = round($mktVal + $brok + $stt + $stamp + $turnover + $gst, 2);

        $tradeDetails[] = [
            'id' => $idx + 1,
            'trd_date' => $h['purchase_date'],
            'trd_no' => 'TRD_' . (98200 + $idx),
            'order_no' => 'ORD_' . (48100 + $idx),
            'symbol' => $h['ticker'],
            'action' => 'BUY',
            'qty' => $h['qty'],
            'gross_rate' => (float)$h['avg_price'],
            'market_value' => $mktVal,
            'brokerage' => $brok,
            'stt' => $stt,
            'cgst' => round($gst / 2, 2),
            'sgst' => round($gst / 2, 2),
            'stamp_duty' => $stamp,
            'turnover_tax' => $turnover,
            'net_rate' => round($netTot / max(1, $h['qty']), 2),
            'net_total' => $netTot
        ];
    }

    // Trade Bills
    $tradeBills = [];
    foreach ($tradeDetails as $idx => $td) {
        $levies = round($td['stt'] + $td['stamp_duty'] + $td['turnover_tax'] + ($td['cgst'] * 2), 2);
        $tradeBills[] = [
            'id' => $idx + 1,
            'bill_date' => $td['trd_date'],
            'settlement_date' => date('Y-m-d', strtotime($td['trd_date'] . ' +1 day')),
            'bill_number' => '242500' . (100 + $idx),
            'exchange' => 'NSE',
            'segment' => 'EQ',
            'gross_turnover' => $td['market_value'],
            'brokerage' => $td['brokerage'],
            'statutory_levies' => $levies,
            'net_amount' => $td['net_total'],
            'pay_type' => 'PAYIN',
            'status' => 'SETTLED'
        ];
    }

    $summary = [
        'total_invested' => round($totalInvested, 2),
        'total_current_value' => round($totalCurrentVal, 2),
        'total_unrealized_pnl' => round($totalCurrentVal - $totalInvested, 2),
        'total_pnl_pct' => $totalInvested > 0 ? round((($totalCurrentVal - $totalInvested) / $totalInvested) * 100, 2) : 0,
        'ltcg_ready_value' => round($totalLtcgReadyVal, 2),
        'stcg_holding_value' => round($totalStcgVal, 2),
        'holdings_count' => count($holdings)
    ];

    jsonResponse([
        'status' => 'success',
        'summary' => $summary,
        'holdings' => $holdings,
        'demat_ledger' => $dematLedger,
        'order_log' => $orderLog,
        'trade_details' => $tradeDetails,
        'trade_bills' => $tradeBills
    ]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
