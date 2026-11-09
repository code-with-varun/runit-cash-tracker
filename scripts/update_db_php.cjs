const fs = require('fs');
let code = fs.readFileSync('api/config/db.php', 'utf8');

// 1. Add description to category table creation and alter
const catCreateTarget = '`sub_type` VARCHAR(100) NULL,';
const catCreateRepl = '`sub_type` VARCHAR(100) NULL,\n            `description` TEXT NULL,';
if (code.includes(catCreateTarget) && !code.includes('`description` TEXT NULL,')) {
  code = code.replace(catCreateTarget, catCreateRepl);
}

// 2. Ensure division is VARCHAR(100) and description column added
const catColsTarget = '$catCols = $pdo->query("SHOW COLUMNS FROM `categories`")->fetchAll(PDO::FETCH_COLUMN);';
const catColsRepl = `$catCols = $pdo->query("SHOW COLUMNS FROM \`categories\`")->fetchAll(PDO::FETCH_COLUMN);
    try {
        $pdo->exec("ALTER TABLE \`categories\` MODIFY COLUMN \`division\` VARCHAR(100) NOT NULL DEFAULT 'LIVING'");
    } catch (Exception $e) {}
    if (!in_array('description', $catCols)) {
        try {
            $pdo->exec("ALTER TABLE \`categories\` ADD COLUMN \`description\` TEXT NULL AFTER \`sub_type\`");
        } catch (Exception $e) {}
    }`;
code = code.replace(catColsTarget, catColsRepl);

// 3. Add management columns to transactions
const txColsAdd = `        'budget' => "VARCHAR(150) NULL",
        'cost_center' => "VARCHAR(150) NULL",
        'profit_center' => "VARCHAR(150) NULL",
        'project' => "VARCHAR(150) NULL",
        'division' => "VARCHAR(100) NULL",
        'utr_no' => "VARCHAR(100) NULL"`;
code = code.replace("'utr_no' => \"VARCHAR(100) NULL\"", txColsAdd);

// 4. Add master tables after settings table
const masterTablesDDL = `
    // 5b. Management Masters Tables: Budgets, Cost Centers, Profit Centers, Projects
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS \`budgets_master\` (
            \`id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`user_id\` INT NULL,
            \`code\` VARCHAR(50) NOT NULL,
            \`name\` VARCHAR(150) NOT NULL,
            \`description\` TEXT NULL,
            \`category_group\` VARCHAR(100) NULL,
            \`status\` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
            \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX \`idx_bm_user\` (\`user_id\`),
            INDEX \`idx_bm_code\` (\`code\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS \`cost_centers\` (
            \`id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`user_id\` INT NULL,
            \`code\` VARCHAR(50) NOT NULL,
            \`name\` VARCHAR(150) NOT NULL,
            \`description\` TEXT NULL,
            \`status\` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
            \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX \`idx_cc_user\` (\`user_id\`),
            INDEX \`idx_cc_code\` (\`code\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS \`profit_centers\` (
            \`id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`user_id\` INT NULL,
            \`code\` VARCHAR(50) NOT NULL,
            \`name\` VARCHAR(150) NOT NULL,
            \`description\` TEXT NULL,
            \`status\` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
            \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX \`idx_pc_user\` (\`user_id\`),
            INDEX \`idx_pc_code\` (\`code\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS \`projects\` (
            \`id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`user_id\` INT NULL,
            \`code\` VARCHAR(50) NOT NULL,
            \`name\` VARCHAR(150) NOT NULL,
            \`description\` TEXT NULL,
            \`status\` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
            \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX \`idx_pr_user\` (\`user_id\`),
            INDEX \`idx_pr_code\` (\`code\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
`;

code = code.replace("// 6. Daily Closing Snapshots", masterTablesDDL + "\n    // 6. Daily Closing Snapshots");

// 5. Seed management masters and categories
const seedTarget = `    // Seed/Re-seed master categories if fewer than 65
    $catCount = (int)$pdo->query("SELECT COUNT(*) FROM \`categories\`")->fetchColumn();
    if ($catCount < 60) {`;

const seedReplacement = `    // Seed default management masters
    $bmCount = (int)$pdo->query("SELECT COUNT(*) FROM \`budgets_master\`")->fetchColumn();
    if ($bmCount === 0) {
        $bmStmt = $pdo->prepare("INSERT INTO \`budgets_master\` (\`code\`, \`name\`, \`description\`, \`category_group\`, \`status\`) VALUES (:code, :name, :description, :category_group, 'active')");
        $defaultBudgets = [
            ['B001', 'Home Budget', 'Household, groceries, provisions, cleaning, home upkeep', 'LIVING'],
            ['B002', 'Food Budget', 'Dining out, snacks, beverages, social meals, food delivery', 'LIVING'],
            ['B003', 'Travel Budget', 'Daily commute, petrol, tolls, vehicle transit, outstation trips', 'MOBILITY'],
            ['B004', 'Utility Budget', 'Electricity, water, cooking gas, telecom, broadband, routine services', 'SERVICES'],
            ['B005', 'Healthcare Budget', 'Medical consultations, pharmacy, diagnostic tests, treatments', 'LIVING'],
            ['B006', 'Lifestyle Budget', 'Entertainment, gadgets, movies, recreation, fashion, hobbies', 'LIFESTYLE'],
            ['B007', 'Investment Budget', 'Equity, mutual funds, SIP, fixed deposits, gold, long-term wealth', 'WEALTH'],
            ['B008', 'Emergency Budget', 'Contingencies, urgent hospital visits, unforeseen repairs', 'PROTECTION']
        ];
        foreach ($defaultBudgets as $b) {
            $bmStmt->execute([':code' => $b[0], ':name' => $b[1], ':description' => $b[2], ':category_group' => $b[3]]);
        }
    }

    $ccCount = (int)$pdo->query("SELECT COUNT(*) FROM \`cost_centers\`")->fetchColumn();
    if ($ccCount === 0) {
        $ccStmt = $pdo->prepare("INSERT INTO \`cost_centers\` (\`code\`, \`name\`, \`description\`, \`status\`) VALUES (:code, :name, :description, 'active')");
        $defaultCC = [
            ['CC001', 'Self', 'Personal expenses and consumption directly by self'],
            ['CC002', 'Parents', 'Expenses consumed for or by parents / elders'],
            ['CC003', 'Home', 'Expenses consumed for household property and maintenance'],
            ['CC004', 'Vehicle', 'Expenses consumed by car, bike, mobility assets'],
            ['CC005', 'Education', 'Expenses consumed for learning, courses, certifications'],
            ['CC006', 'Health', 'Expenses consumed for personal and family health treatments'],
            ['CC007', 'Business', 'Expenses consumed for professional, freelance, client work'],
            ['CC008', 'Travel', 'Expenses consumed for vacation trips, tours, logistics']
        ];
        foreach ($defaultCC as $cc) {
            $ccStmt->execute([':code' => $cc[0], ':name' => $cc[1], ':description' => $cc[2]]);
        }
    }

    $pcCount = (int)$pdo->query("SELECT COUNT(*) FROM \`profit_centers\`")->fetchColumn();
    if ($pcCount === 0) {
        $pcStmt = $pdo->prepare("INSERT INTO \`profit_centers\` (\`code\`, \`name\`, \`description\`, \`status\`) VALUES (:code, :name, :description, 'active')");
        $defaultPC = [
            ['PC001', 'Salary', 'Income from primary regular employment and salary payroll'],
            ['PC002', 'Freelancing', 'Income from side consulting, freelance contracts, client projects'],
            ['PC003', 'Investments', 'Income from dividends, capital gains, interest returns'],
            ['PC004', 'Business', 'Income from commercial activities and enterprise sales'],
            ['PC005', 'Rental Income', 'Income from leased property, real estate, equipment'],
            ['PC006', 'Cashback & Rewards', 'Income from transaction cashbacks, rewards, referral bonuses']
        ];
        foreach ($defaultPC as $pc) {
            $pcStmt->execute([':code' => $pc[0], ':name' => $pc[1], ':description' => $pc[2]]);
        }
    }

    $prCount = (int)$pdo->query("SELECT COUNT(*) FROM \`projects\`")->fetchColumn();
    if ($prCount === 0) {
        $prStmt = $pdo->prepare("INSERT INTO \`projects\` (\`code\`, \`name\`, \`description\`, \`status\`) VALUES (:code, :name, :description, 'active')");
        $defaultPR = [
            ['PR001', 'Goa Trip', 'Leisure vacation and travel trip'],
            ['PR002', 'Money Matrix', 'Personal finance and enterprise dashboard software'],
            ['PR003', 'Bike Purchase', 'Capital asset acquisition and down payment'],
            ['PR004', 'Home Renovation', 'Interior improvements, painting, furniture upgrading'],
            ['PR005', 'AIOS', 'AI operating system and automation development']
        ];
        foreach ($defaultPR as $pr) {
            $prStmt->execute([':code' => $pr[0], ':name' => $pr[1], ':description' => $pr[2]]);
        }
    }

    // Seed/Re-seed master categories if fewer than 64 or if old taxonomy
    $firstSubcat = $pdo->query("SELECT subcategory FROM \`categories\` WHERE id = 1")->fetchColumn();
    $catCount = (int)$pdo->query("SELECT COUNT(*) FROM \`categories\`")->fetchColumn();
    if ($catCount < 64 || $firstSubcat !== 'CARGO/COURIER') {`;

code = code.replace(seedTarget, seedReplacement);

// In the category insert statement, add description column
const catInsertTarget = `INSERT INTO \`categories\` (\`id\`, \`user_id\`, \`name\`, \`subcategory\`, \`category\`, \`division\`, \`suffix\`, \`info_type\`, \`transaction_type\`, \`group_type\`, \`net_type\`, \`sub_type\`, \`type\`) 
            VALUES (:id, NULL, :name, :subcategory, :category, :division, :suffix, :info_type, :transaction_type, :group_type, :net_type, :sub_type, :type)`;

const catInsertRepl = `INSERT INTO \`categories\` (\`id\`, \`user_id\`, \`name\`, \`subcategory\`, \`category\`, \`division\`, \`suffix\`, \`info_type\`, \`transaction_type\`, \`group_type\`, \`net_type\`, \`sub_type\`, \`description\`, \`type\`) 
            VALUES (:id, NULL, :name, :subcategory, :category, :division, :suffix, :info_type, :transaction_type, :group_type, :net_type, :sub_type, :description, :type)`;

code = code.replace(catInsertTarget, catInsertRepl);

// Update ON DUPLICATE KEY UPDATE
const catDupTarget = `\`net_type\`=VALUES(\`net_type\`), \`sub_type\`=VALUES(\`sub_type\`), \`type\`=VALUES(\`type\`)`;
const catDupRepl = `\`net_type\`=VALUES(\`net_type\`), \`sub_type\`=VALUES(\`sub_type\`), \`description\`=VALUES(\`description\`), \`type\`=VALUES(\`type\`)`;
code = code.replace(catDupTarget, catDupRepl);

// Add description parameter to execute
const catExecTarget = `':sub_type' => $cat['sub_type'],
                ':type' => $cat['type'],`;
const catExecRepl = `':sub_type' => $cat['sub_type'],
                ':description' => $cat['description'] ?? '',
                ':type' => $cat['type'],`;
code = code.replace(catExecTarget, catExecRepl);

fs.writeFileSync('api/config/db.php', code, 'utf8');
console.log('db.php updated successfully');

