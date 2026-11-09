const fs = require('fs');

const categoriesJson = JSON.parse(fs.readFileSync('categories_master_verified.json', 'utf8'));
const mastersJson = JSON.parse(fs.readFileSync('masters_default.json', 'utf8'));

let sql = `-- ====================================================
-- Money Matrix - Clean Relational Database Schema DDL
-- Standard Numeric Auto-Increment IDs (1, 2, 3...)
-- Complete Category Taxonomy & Management Hierarchy Masters
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- ====================================================

CREATE DATABASE IF NOT EXISTS \`money_matrix_db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`money_matrix_db\`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS \`transactions\`;
DROP TABLE IF EXISTS \`categories\`;
DROP TABLE IF EXISTS \`accounts\`;
DROP TABLE IF EXISTS \`budgets_master\`;
DROP TABLE IF EXISTS \`cost_centers\`;
DROP TABLE IF EXISTS \`profit_centers\`;
DROP TABLE IF EXISTS \`projects\`;
DROP TABLE IF EXISTS \`settings\`;
DROP TABLE IF EXISTS \`users\`;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------
-- 1. Table: users
-- ----------------------------------------------------
CREATE TABLE \`users\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`name\` VARCHAR(150) NOT NULL,
    \`username\` VARCHAR(100) NOT NULL UNIQUE,
    \`password\` VARCHAR(255) NOT NULL,
    \`role\` ENUM('superadmin', 'user') NOT NULL DEFAULT 'user',
    \`status\` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- 2. Table: accounts
-- ----------------------------------------------------
CREATE TABLE \`accounts\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`user_id\` INT NOT NULL,
    \`code\` VARCHAR(100) NOT NULL,
    \`name\` VARCHAR(150) NOT NULL,
    \`type\` VARCHAR(50) NOT NULL DEFAULT 'Cash Account',
    \`dump_type\` VARCHAR(50) NOT NULL DEFAULT 'FINANCE',
    \`balance\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    \`status\` ENUM('active', 'closed') NOT NULL DEFAULT 'active',
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY \`uq_user_acc_code\` (\`user_id\`, \`code\`),
    INDEX \`idx_acc_user\` (\`user_id\`),
    CONSTRAINT \`fk_acc_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- 3. Table: categories (Taxonomy & Functional Master)
-- ----------------------------------------------------
CREATE TABLE \`categories\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`user_id\` INT NULL,
    \`name\` VARCHAR(150) NOT NULL,
    \`subcategory\` VARCHAR(150) NOT NULL,
    \`category\` VARCHAR(150) NOT NULL,
    \`division\` VARCHAR(100) NOT NULL DEFAULT 'LIVING',
    \`suffix\` ENUM('CR', 'DR', 'NU') NOT NULL DEFAULT 'DR',
    \`info_type\` VARCHAR(50) NOT NULL DEFAULT 'BOTH',
    \`transaction_type\` VARCHAR(50) NULL DEFAULT 'ACTUAL',
    \`group_type\` VARCHAR(100) NOT NULL DEFAULT 'LIVING',
    \`net_type\` VARCHAR(100) NULL,
    \`sub_type\` VARCHAR(100) NULL,
    \`description\` TEXT NULL,
    \`type\` ENUM('Cr', 'Dr', 'NU') NOT NULL DEFAULT 'Dr',
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_cat_user\` (\`user_id\`),
    INDEX \`idx_cat_group\` (\`group_type\`),
    INDEX \`idx_cat_division\` (\`division\`),
    INDEX \`idx_cat_tx_type\` (\`transaction_type\`),
    CONSTRAINT \`fk_cat_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- 4. Management Hierarchy Masters
-- ----------------------------------------------------
CREATE TABLE \`budgets_master\` (
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

CREATE TABLE \`cost_centers\` (
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

CREATE TABLE \`profit_centers\` (
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

CREATE TABLE \`projects\` (
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

-- ----------------------------------------------------
-- 5. Table: transactions
-- ----------------------------------------------------
CREATE TABLE \`transactions\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`user_id\` INT NOT NULL,
    \`account_id\` INT NULL,
    \`account_no\` VARCHAR(100) NOT NULL DEFAULT 'Cash_1',
    \`date\` DATE NOT NULL,
    \`category_id\` INT NULL,
    \`category_name\` VARCHAR(150) NOT NULL,
    \`subcategory\` VARCHAR(150) NULL,
    \`group_type\` VARCHAR(100) NULL,
    \`net_type\` VARCHAR(100) NULL,
    \`sub_type\` VARCHAR(100) NULL,
    \`transaction_type\` VARCHAR(50) NULL,
    \`type\` ENUM('Cr', 'Dr', 'NU') NOT NULL,
    \`amount\` DECIMAL(15, 2) NOT NULL,
    \`balance\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    \`audit_status\` ENUM('draft', 'verified', 'frozen') NOT NULL DEFAULT 'draft',
    \`verified_at\` DATETIME NULL,
    \`frozen_at\` DATETIME NULL,
    \`notes\` TEXT NULL,
    \`date_group\` VARCHAR(50) NULL DEFAULT '1',
    \`temp_upload_id\` VARCHAR(100) NULL,
    \`tran_no\` VARCHAR(100) NULL,
    \`tagging\` VARCHAR(150) NULL,
    \`job_utils\` VARCHAR(150) NULL,
    \`compensation_type\` VARCHAR(100) NULL,
    \`split_ref\` VARCHAR(100) NULL,
    \`info_type\` VARCHAR(50) NULL DEFAULT 'BOTH',
    \`info_status\` VARCHAR(50) NULL,
    \`eid\` VARCHAR(100) NULL,
    \`allocation_eid\` VARCHAR(100) NULL,
    \`job_timeline\` VARCHAR(100) NULL,
    \`remarks\` TEXT NULL,
    \`account_type\` VARCHAR(50) NULL,
    \`suffix\` VARCHAR(20) NULL,
    \`keyword_tagging\` VARCHAR(255) NULL,
    \`sub_cat_helper\` VARCHAR(150) NULL,
    \`method\` VARCHAR(50) NULL,
    \`mode\` VARCHAR(50) NULL,
    \`category\` VARCHAR(150) NULL,
    \`month\` VARCHAR(20) NULL,
    \`year\` INT NULL,
    \`week_no\` INT NULL,
    \`year_month\` VARCHAR(20) NULL,
    \`tran_type_helper\` VARCHAR(100) NULL,
    \`utr_no\` VARCHAR(100) NULL,
    \`budget\` VARCHAR(150) NULL,
    \`cost_center\` VARCHAR(150) NULL,
    \`profit_center\` VARCHAR(150) NULL,
    \`project\` VARCHAR(150) NULL,
    \`division\` VARCHAR(100) NULL,
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`idx_tx_user\` (\`user_id\`),
    INDEX \`idx_tx_account\` (\`account_id\`),
    INDEX \`idx_tx_date\` (\`date\`),
    INDEX \`idx_tx_audit\` (\`audit_status\`),
    INDEX \`idx_tx_division\` (\`division\`),
    INDEX \`idx_tx_budget\` (\`budget\`),
    INDEX \`idx_tx_cost_center\` (\`cost_center\`),
    INDEX \`idx_tx_profit_center\` (\`profit_center\`),
    INDEX \`idx_tx_project\` (\`project\`),
    CONSTRAINT \`fk_tx_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
    CONSTRAINT \`fk_tx_account\` FOREIGN KEY (\`account_id\`) REFERENCES \`accounts\` (\`id\`) ON DELETE SET NULL,
    CONSTRAINT \`fk_tx_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- 6. Table: settings
-- ----------------------------------------------------
CREATE TABLE \`settings\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`user_id\` INT NULL,
    \`setting_key\` VARCHAR(100) NOT NULL,
    \`setting_value\` TEXT NULL,
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY \`idx_user_setting\` (\`user_id\`, \`setting_key\`),
    CONSTRAINT \`fk_settings_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- Seed Users (IDs: 1, 2, 3)
-- ----------------------------------------------------
INSERT INTO \`users\` (\`id\`, \`name\`, \`username\`, \`password\`, \`role\`, \`status\`) VALUES
(1, 'System Super Admin', 'admin', 'admin', 'superadmin', 'active'),
(2, 'varun', 'varun', 'varun', 'user', 'active'),
(3, 'maruthu', 'maruthu', 'maruthu', 'user', 'active');

-- ----------------------------------------------------
-- Seed Accounts
-- ----------------------------------------------------
INSERT INTO \`accounts\` (\`id\`, \`user_id\`, \`code\`, \`name\`, \`type\`, \`dump_type\`, \`balance\`, \`status\`) VALUES
(1, 1, 'Cash_1', 'Cash_1 (Physical Cash)', 'Cash Account', 'FINANCE', 0.00, 'active'),
(2, 2, 'Cash_1', 'Cash_1 (Physical Cash)', 'Cash Account', 'FINANCE', 0.00, 'active'),
(3, 2, 'ICICI_DM_3142', 'ICICI_DM_3142 (Savings)', 'Savings Account', 'BANK', 0.00, 'active'),
(4, 2, 'FED_SB_9998', 'FED_SB_9998 (Federal SB)', 'Savings Account', 'BANK', 0.00, 'active'),
(5, 2, 'HDFC_CC_0733', 'HDFC_CC_0733 (Credit Card)', 'Credit Card', 'CREDIT_CARD', 0.00, 'active'),
(6, 2, 'ICICI_CC_8003', 'ICICI_CC_HP_8003 (Credit Card)', 'Credit Card', 'CREDIT_CARD', 0.00, 'active'),
(7, 2, 'ICICI_CUR_0498', 'ICICI_CUR_0498 (Current)', 'Current Account', 'BANK', 0.00, 'active'),
(8, 2, 'SELVA_LOAN', 'SELVA_LOANS (Payable)', 'Loan Account', 'LOAN', 0.00, 'active'),
(9, 3, 'Cash_1', 'Cash_1 (Physical Cash)', 'Cash Account', 'FINANCE', 0.00, 'active');

-- ----------------------------------------------------
-- Seed 64 Master Taxonomy Categories
-- ----------------------------------------------------
INSERT INTO \`categories\` (\`id\`, \`user_id\`, \`name\`, \`subcategory\`, \`category\`, \`division\`, \`suffix\`, \`info_type\`, \`transaction_type\`, \`group_type\`, \`net_type\`, \`sub_type\`, \`description\`, \`type\`) VALUES
`;

const catRows = categoriesJson.map(c => {
  const escSub = c.subcategory.replace(/'/g, "''");
  const escCat = c.category.replace(/'/g, "''");
  const escDiv = c.division.replace(/'/g, "''");
  const escSubT = c.sub_type.replace(/'/g, "''");
  const escTxT = c.transaction_type.replace(/'/g, "''");
  const escDesc = (c.description || '').replace(/'/g, "''");
  return `(${c.id}, NULL, '${escSub}', '${escSub}', '${escCat}', '${escDiv}', '${c.suffix}', 'BOTH', '${escTxT}', '${escDiv}', '${escSubT}', '${escSubT}', '${escDesc}', '${c.type}')`;
});
sql += catRows.join(',\n') + ';\n\n';

sql += `-- ----------------------------------------------------
-- Seed Budget Masters (B001 - B008)
-- ----------------------------------------------------
INSERT INTO \`budgets_master\` (\`code\`, \`name\`, \`description\`, \`category_group\`, \`status\`) VALUES
`;
const bRows = mastersJson.budgets.map(b => {
  return `('${b.code}', '${b.name.replace(/'/g, "''")}', '${b.description.replace(/'/g, "''")}', '${b.category_group}', 'active')`;
});
sql += bRows.join(',\n') + ';\n\n';

sql += `-- ----------------------------------------------------
-- Seed Cost Center Masters (CC001 - CC008)
-- ----------------------------------------------------
INSERT INTO \`cost_centers\` (\`code\`, \`name\`, \`description\`, \`status\`) VALUES
`;
const ccRows = mastersJson.cost_centers.map(cc => {
  return `('${cc.code}', '${cc.name.replace(/'/g, "''")}', '${cc.description.replace(/'/g, "''")}', 'active')`;
});
sql += ccRows.join(',\n') + ';\n\n';

sql += `-- ----------------------------------------------------
-- Seed Profit Center Masters (PC001 - PC006)
-- ----------------------------------------------------
INSERT INTO \`profit_centers\` (\`code\`, \`name\`, \`description\`, \`status\`) VALUES
`;
const pcRows = mastersJson.profit_centers.map(pc => {
  return `('${pc.code}', '${pc.name.replace(/'/g, "''")}', '${pc.description.replace(/'/g, "''")}', 'active')`;
});
sql += pcRows.join(',\n') + ';\n\n';

sql += `-- ----------------------------------------------------
-- Seed Project Masters (PR001 - PR005)
-- ----------------------------------------------------
INSERT INTO \`projects\` (\`code\`, \`name\`, \`description\`, \`status\`) VALUES
`;
const prRows = mastersJson.projects.map(pr => {
  return `('${pr.code}', '${pr.name.replace(/'/g, "''")}', '${pr.description.replace(/'/g, "''")}', 'active')`;
});
sql += prRows.join(',\n') + ';\n';

fs.writeFileSync('database.sql', sql, 'utf8');
fs.writeFileSync('api/schema.sql', sql, 'utf8');
console.log('Successfully updated database.sql and api/schema.sql');

