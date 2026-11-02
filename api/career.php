<?php
// Job Experience / Career Timeline P&L API for Money Matrix
// Tracks lifetime earnings, tenure, cumulative savings, CTC progression, and daily financial velocity per organization

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/helpers/response.php';

$pdo = getDb();
$userId = (int)(getRequestedUserId() ?: 2);
if ($userId <= 0) $userId = 2;

try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS `career_milestones` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL,
        `company` VARCHAR(150) NOT NULL,
        `role` VARCHAR(150) NOT NULL,
        `start_date` DATE NOT NULL,
        `end_date` DATE NULL,
        `is_current` TINYINT(1) NOT NULL DEFAULT 0,
        `start_ctc` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        `end_ctc` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        `total_inflow` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        `total_outflow` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        `notes` TEXT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX `idx_car_user` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
} catch (\Throwable $e) {}

$method = $_SERVER['REQUEST_METHOD'];

// Handle Seeding or Adding Milestones
if ($method === 'POST') {
    $input = getJsonInput();
    $action = $_GET['action'] ?? ($input['action'] ?? '');

    if ($action === 'seed') {
        $sampleMilestones = [
            ['Firstsource Solutions Ltd', 'Process Associate', '2010-06-01', '2012-08-31', 0, 180000.00, 240000.00, 415000.00, 290000.00, 'Early career foundations, customer operations & data validation'],
            ['Honeywell Technology Solutions', 'Senior Operations Analyst', '2012-09-15', '2015-03-31', 0, 360000.00, 520000.00, 1140000.00, 725000.00, 'Supply chain operations, financial reconciliations & reporting automation'],
            ['Serco Global Services', 'Team Lead - Financial Shared Services', '2015-05-01', '2017-10-31', 0, 580000.00, 720000.00, 1580000.00, 980000.00, 'Managed AP/AR reconciliation team, MIS reporting & SLA governance'],
            ['Datamatics Global Services', 'Assistant Manager - Financial Systems & Automation', '2017-11-15', '2020-12-31', 0, 800000.00, 1050000.00, 2850000.00, 1690000.00, 'ERP implementation, cash-flow automation & multi-entity ledger consolidation'],
            ['Page Industries (Jockey)', 'Lead - Business Finance Systems & Cash Intelligence', '2021-01-15', null, 1, 1200000.00, 1850000.00, 5420000.00, 2840000.00, 'Enterprise financial operating system, executive dashboards & treasury management']
        ];

        $pdo->prepare("DELETE FROM `career_milestones` WHERE user_id = :uid")->execute([':uid' => $userId]);
        $ins = $pdo->prepare("INSERT INTO `career_milestones` 
            (user_id, company, role, start_date, end_date, is_current, start_ctc, end_ctc, total_inflow, total_outflow, notes) 
            VALUES (:uid, :company, :role, :sdate, :edate, :curr, :sctc, :ectc, :inflow, :outflow, :notes)");

        foreach ($sampleMilestones as $sm) {
            $ins->execute([
                ':uid' => $userId,
                ':company' => $sm[0],
                ':role' => $sm[1],
                ':sdate' => $sm[2],
                ':edate' => $sm[3],
                ':curr' => $sm[4],
                ':sctc' => $sm[5],
                ':ectc' => $sm[6],
                ':inflow' => $sm[7],
                ':outflow' => $sm[8],
                ':notes' => $sm[9]
            ]);
        }
        jsonResponse(['success' => true, 'message' => 'Career milestones seeded successfully']);
    }

    $company = trim($input['company'] ?? '');
    $role = trim($input['role'] ?? '');
    $sdate = trim($input['start_date'] ?? date('Y-m-d'));
    $edate = !empty($input['end_date']) ? trim($input['end_date']) : null;
    $isCurrent = !empty($input['is_current']) ? 1 : 0;
    $sctc = (float)($input['start_ctc'] ?? 0);
    $ectc = (float)($input['end_ctc'] ?? $sctc);
    $inflow = (float)($input['total_inflow'] ?? 0);
    $outflow = (float)($input['total_outflow'] ?? 0);
    $notes = trim($input['notes'] ?? '');

    if (!$company || !$role) {
        jsonResponse(['error' => 'Company and Role are required'], 400);
    }

    $ins = $pdo->prepare("INSERT INTO `career_milestones` 
        (user_id, company, role, start_date, end_date, is_current, start_ctc, end_ctc, total_inflow, total_outflow, notes) 
        VALUES (:uid, :company, :role, :sdate, :edate, :curr, :sctc, :ectc, :inflow, :outflow, :notes)");
    $ins->execute([
        ':uid' => $userId,
        ':company' => $company,
        ':role' => $role,
        ':sdate' => $sdate,
        ':edate' => $edate,
        ':curr' => $isCurrent,
        ':sctc' => $sctc,
        ':ectc' => $ectc,
        ':inflow' => $inflow,
        ':outflow' => $outflow,
        ':notes' => $notes
    ]);

    jsonResponse(['success' => true, 'message' => 'Career milestone added successfully']);
}

// GET Career Data
if ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM `career_milestones` WHERE user_id = :uid ORDER BY start_date ASC");
    $stmt->execute([':uid' => $userId]);
    $dbMilestones = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // If completely empty (application was reset)
    if (empty($dbMilestones)) {
        jsonResponse([
            'status' => 'success',
            'summary' => [
                'lifetime_inflow' => 0.00,
                'lifetime_outflow' => 0.00,
                'lifetime_savings' => 0.00,
                'lifetime_savings_pct' => 0.00,
                'total_career_days' => 0,
                'total_career_years' => 0.0,
                'lifetime_gain_per_day' => 0.00,
                'stints_count' => 0
            ],
            'milestones' => []
        ]);
    }

    $now = new DateTime();
    $processed = [];
    $lifetimeInflow = 0;
    $lifetimeOutflow = 0;
    $lifetimeDays = 0;

    foreach ($dbMilestones as $m) {
        $start = new DateTime($m['start_date']);
        $end = !empty($m['is_current']) ? $now : new DateTime($m['end_date'] ?: date('Y-m-d'));
        $interval = $start->diff($end);
        $days = max(1, (int)$interval->format('%a'));

        $netSavings = round((float)$m['total_inflow'] - (float)$m['total_outflow'], 2);
        $savingsPct = (float)$m['total_inflow'] > 0 ? round(($netSavings / (float)$m['total_inflow']) * 100, 2) : 0;
        $gainPerDay = round($netSavings / $days, 2);
        $burnPerDay = round((float)$m['total_outflow'] / $days, 2);

        $lifetimeInflow += (float)$m['total_inflow'];
        $lifetimeOutflow += (float)$m['total_outflow'];
        $lifetimeDays += $days;

        $processed[] = array_merge($m, [
            'tenure_days' => $days,
            'tenure_years' => round($days / 365.25, 1),
            'net_savings' => $netSavings,
            'savings_pct' => $savingsPct,
            'gain_per_day' => $gainPerDay,
            'burn_per_day' => $burnPerDay,
            'status' => !empty($m['is_current']) ? 'ACTIVE / PRESENT' : 'COMPLETED'
        ]);
    }

    $lifetimeSavings = round($lifetimeInflow - $lifetimeOutflow, 2);
    $lifetimeSavingsPct = $lifetimeInflow > 0 ? round(($lifetimeSavings / $lifetimeInflow) * 100, 2) : 0;
    $lifetimeGainPerDay = $lifetimeDays > 0 ? round($lifetimeSavings / $lifetimeDays, 2) : 0;

    jsonResponse([
        'status' => 'success',
        'summary' => [
            'lifetime_inflow' => $lifetimeInflow,
            'lifetime_outflow' => $lifetimeOutflow,
            'lifetime_savings' => $lifetimeSavings,
            'lifetime_savings_pct' => $lifetimeSavingsPct,
            'total_career_days' => $lifetimeDays,
            'total_career_years' => round($lifetimeDays / 365.25, 1),
            'lifetime_gain_per_day' => $lifetimeGainPerDay,
            'stints_count' => count($processed)
        ],
        'milestones' => $processed
    ]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
