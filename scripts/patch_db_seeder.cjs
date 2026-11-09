const fs = require('fs');
let code = fs.readFileSync('api/config/db.php', 'utf8');

const targetStr = `    // Seed/Re-seed master categories if fewer than 65`;
const targetIdx = code.indexOf(targetStr);

if (targetIdx === -1) {
  console.log('Target not found');
  process.exit(1);
}

const replacement = `    // Seed default management masters
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
    if ($catCount < 64 || $firstSubcat !== 'CARGO/COURIER') {
        $pdo->exec("DELETE FROM \`categories\` WHERE user_id IS NULL");
        $stmt = $pdo->prepare("
            INSERT INTO \`categories\` (\`id\`,\`user_id\`, \`name\`, \`subcategory\`, \`category\`, \`division\`, \`suffix\`, \`info_type\`, \`transaction_type\`, \`group_type\`, \`net_type\`, \`sub_type\`, \`description\`, \`type\`) 
            VALUES (:id, NULL, :name, :subcategory, :category, :division, :suffix, :info_type, :transaction_type, :group_type, :net_type, :sub_type, :description, :type)
            ON DUPLICATE KEY UPDATE 
                \`name\`=VALUES(\`name\`), \`subcategory\`=VALUES(\`subcategory\`), \`category\`=VALUES(\`category\`), 
                \`division\`=VALUES(\`division\`), \`suffix\`=VALUES(\`suffix\`), \`info_type\`=VALUES(\`info_type\`), 
                \`transaction_type\`=VALUES(\`transaction_type\`), \`group_type\`=VALUES(\`group_type\`), 
                \`net_type\`=VALUES(\`net_type\`), \`sub_type\`=VALUES(\`sub_type\`), \`description\`=VALUES(\`description\`), \`type\`=VALUES(\`type\`)
        ");
        foreach (DEFAULT_CATEGORIES as $cat) {
            $stmt->execute([
                ':id' => $cat['id'],
                ':name' => $cat['name'],
                ':subcategory' => $cat['subcategory'],
                ':category' => $cat['category'],
                ':division' => $cat['division'],
                ':suffix' => $cat['suffix'],
                ':info_type' => $cat['info_type'],
                ':transaction_type' => $cat['transaction_type'],
                ':group_type' => $cat['group_type'],
                ':net_type' => $cat['net_type'],
                ':sub_type' => $cat['sub_type'],
                ':description' => $cat['description'] ?? '',
                ':type' => $cat['type'],
            ]);
        }
    }

    $schemaChecked = true;
}
`;

const schemaCheckedIdx = code.indexOf('$schemaChecked = true;', targetIdx);
if (schemaCheckedIdx !== -1) {
  code = code.substring(0, targetIdx) + replacement;
  fs.writeFileSync('api/config/db.php', code, 'utf8');
  console.log('Successfully patched db seeder!');
} else {
  console.log('Could not find schemaChecked');
}

