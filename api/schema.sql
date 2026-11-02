-- ====================================================
-- Money Matrix - Clean Relational Database Schema DDL
-- Standard Numeric Auto-Increment IDs (1, 2, 3...)
-- Complete Category Taxonomy & Management Hierarchy Masters
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- ====================================================

CREATE DATABASE IF NOT EXISTS `money_matrix_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `money_matrix_db`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `accounts`;
DROP TABLE IF EXISTS `budgets_master`;
DROP TABLE IF EXISTS `cost_centers`;
DROP TABLE IF EXISTS `profit_centers`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `settings`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------
-- 1. Table: users
-- ----------------------------------------------------
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('superadmin', 'user') NOT NULL DEFAULT 'user',
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- 2. Table: accounts
-- ----------------------------------------------------
CREATE TABLE `accounts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `type` VARCHAR(50) NOT NULL DEFAULT 'Cash Account',
    `dump_type` VARCHAR(50) NOT NULL DEFAULT 'FINANCE',
    `balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `status` ENUM('active', 'closed') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_user_acc_code` (`user_id`, `code`),
    INDEX `idx_acc_user` (`user_id`),
    CONSTRAINT `fk_acc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- 3. Table: categories (Taxonomy & Functional Master)
-- ----------------------------------------------------
CREATE TABLE `categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `name` VARCHAR(150) NOT NULL,
    `subcategory` VARCHAR(150) NOT NULL,
    `category` VARCHAR(150) NOT NULL,
    `division` VARCHAR(100) NOT NULL DEFAULT 'LIVING',
    `suffix` ENUM('CR', 'DR', 'NU') NOT NULL DEFAULT 'DR',
    `info_type` VARCHAR(50) NOT NULL DEFAULT 'BOTH',
    `transaction_type` VARCHAR(50) NULL DEFAULT 'ACTUAL',
    `group_type` VARCHAR(100) NOT NULL DEFAULT 'LIVING',
    `net_type` VARCHAR(100) NULL,
    `sub_type` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `type` ENUM('Cr', 'Dr', 'NU') NOT NULL DEFAULT 'Dr',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_cat_user` (`user_id`),
    INDEX `idx_cat_group` (`group_type`),
    INDEX `idx_cat_division` (`division`),
    INDEX `idx_cat_tx_type` (`transaction_type`),
    CONSTRAINT `fk_cat_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- 4. Management Hierarchy Masters
-- ----------------------------------------------------
CREATE TABLE `budgets_master` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `category_group` VARCHAR(100) NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_bm_user` (`user_id`),
    INDEX `idx_bm_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cost_centers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_cc_user` (`user_id`),
    INDEX `idx_cc_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `profit_centers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_pc_user` (`user_id`),
    INDEX `idx_pc_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `projects` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_pr_user` (`user_id`),
    INDEX `idx_pr_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- 5. Table: transactions
-- ----------------------------------------------------
CREATE TABLE `transactions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `account_id` INT NULL,
    `account_no` VARCHAR(100) NOT NULL DEFAULT 'Cash_1',
    `date` DATE NOT NULL,
    `category_id` INT NULL,
    `category_name` VARCHAR(150) NOT NULL,
    `subcategory` VARCHAR(150) NULL,
    `group_type` VARCHAR(100) NULL,
    `net_type` VARCHAR(100) NULL,
    `sub_type` VARCHAR(100) NULL,
    `transaction_type` VARCHAR(50) NULL,
    `type` ENUM('Cr', 'Dr', 'NU') NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `audit_status` ENUM('draft', 'verified', 'frozen') NOT NULL DEFAULT 'draft',
    `verified_at` DATETIME NULL,
    `frozen_at` DATETIME NULL,
    `notes` TEXT NULL,
    `date_group` VARCHAR(50) NULL DEFAULT '1',
    `temp_upload_id` VARCHAR(100) NULL,
    `tran_no` VARCHAR(100) NULL,
    `tagging` VARCHAR(150) NULL,
    `job_utils` VARCHAR(150) NULL,
    `compensation_type` VARCHAR(100) NULL,
    `split_ref` VARCHAR(100) NULL,
    `info_type` VARCHAR(50) NULL DEFAULT 'BOTH',
    `info_status` VARCHAR(50) NULL,
    `eid` VARCHAR(100) NULL,
    `allocation_eid` VARCHAR(100) NULL,
    `job_timeline` VARCHAR(100) NULL,
    `remarks` TEXT NULL,
    `account_type` VARCHAR(50) NULL,
    `suffix` VARCHAR(20) NULL,
    `keyword_tagging` VARCHAR(255) NULL,
    `sub_cat_helper` VARCHAR(150) NULL,
    `method` VARCHAR(50) NULL,
    `mode` VARCHAR(50) NULL,
    `category` VARCHAR(150) NULL,
    `month` VARCHAR(20) NULL,
    `year` INT NULL,
    `week_no` INT NULL,
    `year_month` VARCHAR(20) NULL,
    `tran_type_helper` VARCHAR(100) NULL,
    `utr_no` VARCHAR(100) NULL,
    `budget` VARCHAR(150) NULL,
    `cost_center` VARCHAR(150) NULL,
    `profit_center` VARCHAR(150) NULL,
    `project` VARCHAR(150) NULL,
    `division` VARCHAR(100) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_tx_user` (`user_id`),
    INDEX `idx_tx_account` (`account_id`),
    INDEX `idx_tx_date` (`date`),
    INDEX `idx_tx_audit` (`audit_status`),
    INDEX `idx_tx_division` (`division`),
    INDEX `idx_tx_budget` (`budget`),
    INDEX `idx_tx_cost_center` (`cost_center`),
    INDEX `idx_tx_profit_center` (`profit_center`),
    INDEX `idx_tx_project` (`project`),
    CONSTRAINT `fk_tx_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_tx_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_tx_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- 6. Table: settings
-- ----------------------------------------------------
CREATE TABLE `settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `setting_key` VARCHAR(100) NOT NULL,
    `setting_value` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `idx_user_setting` (`user_id`, `setting_key`),
    CONSTRAINT `fk_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- Seed Users (IDs: 1, 2, 3)
-- ----------------------------------------------------
INSERT INTO `users` (`id`, `name`, `username`, `password`, `role`, `status`) VALUES
(1, 'System Super Admin', 'admin', 'admin', 'superadmin', 'active'),
(2, 'varun', 'varun', 'varun', 'user', 'active'),
(3, 'maruthu', 'maruthu', 'maruthu', 'user', 'active');

-- ----------------------------------------------------
-- Seed Accounts
-- ----------------------------------------------------
INSERT INTO `accounts` (`id`, `user_id`, `code`, `name`, `type`, `dump_type`, `balance`, `status`) VALUES
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
INSERT INTO `categories` (`id`, `user_id`, `name`, `subcategory`, `category`, `division`, `suffix`, `info_type`, `transaction_type`, `group_type`, `net_type`, `sub_type`, `description`, `type`) VALUES
(1, NULL, 'CARGO/COURIER', 'CARGO/COURIER', 'LOGISTICS', 'LIVING', 'DR', 'BOTH', 'ACTUAL', 'LIVING', 'EMERGENCY', 'EMERGENCY', 'Expenses incurred for courier services, parcel delivery, cargo transportation, or logistics support.', 'Dr'),
(2, NULL, 'HARDWARES & SERVICE', 'HARDWARES & SERVICE', 'MAINTENANCE', 'MOBILITY', 'DR', 'BOTH', 'ACTUAL', 'MOBILITY', 'EMERGENCY', 'EMERGENCY', 'Expenses related to hardware purchases, repairs, maintenance, and technical servicing.', 'Dr'),
(3, NULL, 'PETROL', 'PETROL', 'FUEL', 'MOBILITY', 'DR', 'BOTH', 'ACTUAL', 'MOBILITY', 'NEEDS', 'NEEDS', 'Fuel expenses incurred for personal or business vehicle usage.', 'Dr'),
(4, NULL, 'TRANSPORT', 'TRANSPORT', 'COMMUTE', 'MOBILITY', 'DR', 'BOTH', 'ACTUAL', 'MOBILITY', 'EMERGENCY', 'EMERGENCY', 'Travel and commuting expenses including bus, train, taxi, auto, and similar transport services.', 'Dr'),
(5, NULL, 'EDUCATION FEES', 'EDUCATION FEES', 'LEARNING', 'LIVING', 'DR', 'BOTH', 'ACTUAL', 'LIVING', 'NEEDS', 'NEEDS', 'Payments made towards tuition fees, courses, certifications, training, and educational programs.', 'Dr'),
(6, NULL, 'FOOD/SNACKS', 'FOOD/SNACKS', 'DINING', 'LIVING', 'DR', 'BOTH', 'ACTUAL', 'LIVING', 'NEEDS', 'NEEDS', 'Expenses incurred for meals, snacks, beverages, and dining activities.', 'Dr'),
(7, NULL, 'GROCERIES', 'GROCERIES', 'PROVISIONS', 'LIVING', 'DR', 'BOTH', 'ACTUAL', 'LIVING', 'NEEDS', 'NEEDS', 'Purchases of household food supplies and daily essential consumable items.', 'Dr'),
(8, NULL, 'GROOMING', 'GROOMING', 'WELLNESS', 'LIVING', 'DR', 'BOTH', 'ACTUAL', 'LIVING', 'NEEDS', 'NEEDS', 'Personal care expenses such as salon services, cosmetics, toiletries, and grooming products.', 'Dr'),
(9, NULL, 'HOUSE HOLDS', 'HOUSE HOLDS', 'HOUSEKEEPING', 'LIVING', 'DR', 'BOTH', 'ACTUAL', 'LIVING', 'EMERGENCY', 'EMERGENCY', 'Expenses related to household maintenance, cleaning supplies, and daily home essentials.', 'Dr'),
(10, NULL, 'MEDICAL', 'MEDICAL', 'HEALTHCARE', 'LIVING', 'DR', 'BOTH', 'ACTUAL', 'LIVING', 'EMERGENCY', 'EMERGENCY', 'Healthcare expenses including consultation fees, medicines, treatments, and diagnostics.', 'Dr'),
(11, NULL, 'XEROX/STATIONERY', 'XEROX/STATIONERY', 'ACADEMICS', 'LIVING', 'DR', 'BOTH', 'ACTUAL', 'LIVING', 'EMERGENCY', 'EMERGENCY', 'Expenses incurred for printing, photocopying, books, stationery, and educational supplies.', 'Dr'),
(12, NULL, 'EPFO', 'EPFO', 'BENEFITS', 'EARNINGS', 'CR', 'BOTH', 'ACTUAL', 'EARNINGS', 'INCOME', 'INCOME', 'Income received from employee provident fund withdrawals, settlements, or benefits.', 'Cr'),
(13, NULL, 'GIFT AMOUNT', 'GIFT AMOUNT', 'REWARDS', 'EARNINGS', 'CR', 'BOTH', 'ACTUAL', 'EARNINGS', 'INCOME', 'INCOME', 'Monetary gifts, rewards, incentives, or financial assistance received.', 'Cr'),
(14, NULL, 'LD SALARY/INCOME', 'LD SALARY/INCOME', 'PAYROLL', 'EARNINGS', 'CR', 'BOTH', 'ACTUAL', 'EARNINGS', 'INCOME', 'INCOME', 'Income received from freelance work, side projects, incentives, or other salary-related earnings.', 'Cr'),
(15, NULL, 'PFM', 'PFM', 'BENEFITS', 'EARNINGS', 'CR', 'BOTH', 'ACTUAL', 'EARNINGS', 'INCOME', 'INCOME', 'Income or benefits received from employer-sponsored funds, incentives, or welfare schemes.', 'Cr'),
(16, NULL, 'SALARY', 'SALARY', 'PAYROLL', 'EARNINGS', 'CR', 'BOTH', 'ACTUAL', 'EARNINGS', 'INCOME', 'INCOME', 'Regular salary or compensation received from employment.', 'Cr'),
(17, NULL, 'BIKE/CAR INSURANCE', 'BIKE/CAR INSURANCE', 'VEHICLE COVER', 'PROTECTION', 'DR', 'BOTH', 'ACTUAL', 'PROTECTION', 'NEEDS', 'NEEDS', 'Premium payments made for motor vehicle insurance coverage.', 'Dr'),
(18, NULL, 'HEALTH INSURANCE', 'HEALTH INSURANCE', 'MEDICAL COVER', 'PROTECTION', 'DR', 'BOTH', 'ACTUAL', 'PROTECTION', 'NEEDS', 'NEEDS', 'Premium payments made for health and medical insurance policies.', 'Dr'),
(19, NULL, 'TERM/LIFE INSURANCE', 'TERM/LIFE INSURANCE', 'LIFE COVER', 'PROTECTION', 'DR', 'BOTH', 'ACTUAL', 'PROTECTION', 'NEEDS', 'NEEDS', 'Premium payments made for life insurance and term protection plans.', 'Dr'),
(20, NULL, 'EQUITY STOCK', 'EQUITY STOCK', 'EQUITY', 'WEALTH', 'DR', 'BOTH', 'ACTUAL', 'WEALTH', 'ASSETS', 'ASSETS', 'Investments made in listed or unlisted company shares and stocks.', 'Dr'),
(21, NULL, 'FIXED DEPOSIT', 'FIXED DEPOSIT', 'DEPOSIT', 'WEALTH', 'DR', 'BOTH', 'ACTUAL', 'WEALTH', 'ASSETS', 'ASSETS', 'Funds deposited in fixed-income deposit schemes with financial institutions.', 'Dr'),
(22, NULL, 'LIQUID FUND', 'LIQUID FUND', 'LIQUIDITY', 'WEALTH', 'DR', 'BOTH', 'ACTUAL', 'WEALTH', 'ASSETS', 'ASSETS', 'Investments made in highly liquid mutual funds or cash-equivalent instruments.', 'Dr'),
(23, NULL, 'MUTUAL FUND', 'MUTUAL FUND', 'FUNDING', 'WEALTH', 'DR', 'BOTH', 'ACTUAL', 'WEALTH', 'ASSETS', 'ASSETS', 'Investments made through mutual fund schemes for wealth creation.', 'Dr'),
(24, NULL, 'PPF/SIP', 'PPF/SIP', 'RETIREMENT', 'WEALTH', 'DR', 'BOTH', 'ACTUAL', 'WEALTH', 'ASSETS', 'ASSETS', 'Contributions made towards Public Provident Fund or Systematic Investment Plans.', 'Dr'),
(25, NULL, 'RECURRING DEPOSIT', 'RECURRING DEPOSIT', 'SAVINGS', 'WEALTH', 'DR', 'BOTH', 'ACTUAL', 'WEALTH', 'ASSETS', 'ASSETS', 'Periodic savings deposits made under recurring deposit schemes.', 'Dr'),
(26, NULL, 'RETURNS OF INVESTMENT', 'RETURNS OF INVESTMENT', 'MATURITY', 'WEALTH', 'CR', 'BOTH', 'ACTUAL', 'WEALTH', 'INCOME', 'INCOME', 'Income received from investments through redemption, maturity, dividends, or gains.', 'Cr'),
(27, NULL, 'AMUSEMENT PARKS', 'AMUSEMENT PARKS', 'RECREATION', 'LIFESTYLE', 'DR', 'BOTH', 'ACTUAL', 'LIFESTYLE', 'WANTS', 'WANTS', 'Expenses incurred for amusement parks, recreational activities, and leisure outings.', 'Dr'),
(28, NULL, 'APPAREL & ACCESSORIES', 'APPAREL & ACCESSORIES', 'FASHION', 'LIFESTYLE', 'DR', 'BOTH', 'ACTUAL', 'LIFESTYLE', 'NEEDS', 'NEEDS', 'Purchases of clothing, footwear, fashion accessories, and related items.', 'Dr'),
(29, NULL, 'CONTRIBUTION/GIFTS/CHARITY', 'CONTRIBUTION/GIFTS/CHARITY', 'PHILANTHROPY', 'LIFESTYLE', 'DR', 'BOTH', 'ACTUAL', 'LIFESTYLE', 'EMERGENCY', 'EMERGENCY', 'Expenses incurred towards donations, charity, gifts, and social contributions.', 'Dr'),
(30, NULL, 'ELECTRONICS', 'ELECTRONICS', 'GADGETS', 'LIFESTYLE', 'DR', 'BOTH', 'ACTUAL', 'LIFESTYLE', 'WANTS', 'WANTS', 'Purchases of electronic devices, gadgets, accessories, and related equipment.', 'Dr'),
(31, NULL, 'MOVIE', 'MOVIE', 'MEDIA', 'LIFESTYLE', 'DR', 'BOTH', 'ACTUAL', 'LIFESTYLE', 'WANTS', 'WANTS', 'Expenses incurred for movies, theatres, OTT rentals, and entertainment content.', 'Dr'),
(32, NULL, 'POJAI ITEMS', 'POJAI ITEMS', 'SPIRITUAL', 'LIFESTYLE', 'DR', 'BOTH', 'ACTUAL', 'LIFESTYLE', 'WANTS', 'WANTS', 'Purchases related to religious activities, pooja materials, and devotional offerings.', 'Dr'),
(33, NULL, 'LD PAYROLL', 'LD PAYROLL', 'DEDUCTION', 'COMPLIANCE', 'DR', 'BOTH', 'ACTUAL', 'COMPLIANCE', 'REPAYMENTS', 'REPAYMENTS', 'Salary-related deductions, employer recoveries, or payroll adjustments.', 'Dr'),
(34, NULL, 'PENALITIES', 'PENALITIES', 'PENALTY', 'COMPLIANCE', 'DR', 'BOTH', 'ACTUAL', 'COMPLIANCE', 'EMERGENCY', 'EMERGENCY', 'Expenses incurred due to fines, penalties, late fees, or regulatory charges.', 'Dr'),
(35, NULL, 'TAX RECEIPTS', 'TAX RECEIPTS', 'TAXATION', 'COMPLIANCE', 'DR', 'BOTH', 'ACTUAL', 'COMPLIANCE', 'NEEDS', 'NEEDS', 'Payments made towards taxes, government levies, duties, and statutory charges.', 'Dr'),
(36, NULL, 'TOLLS FEE', 'TOLLS FEE', 'TOLLING', 'COMPLIANCE', 'DR', 'BOTH', 'ACTUAL', 'COMPLIANCE', 'NEEDS', 'NEEDS', 'Payments made for toll roads, bridge tolls, and transportation access charges.', 'Dr'),
(37, NULL, 'BROADBAND RECHARGE', 'BROADBAND RECHARGE', 'INTERNET', 'SERVICES', 'DR', 'BOTH', 'ACTUAL', 'SERVICES', 'NEEDS', 'NEEDS', 'Expenses incurred for broadband, internet, and home network services.', 'Dr'),
(38, NULL, 'DIGITAL SUBSCRIPTIONS', 'DIGITAL SUBSCRIPTIONS', 'SUBSCRIPTION', 'SERVICES', 'DR', 'BOTH', 'ACTUAL', 'SERVICES', 'WANTS', 'WANTS', 'Payments for digital services, OTT platforms, software subscriptions, and memberships.', 'Dr'),
(39, NULL, 'EB BILL', 'EB BILL', 'ELECTRICITY', 'SERVICES', 'DR', 'BOTH', 'ACTUAL', 'SERVICES', 'NEEDS', 'NEEDS', 'Payments made towards electricity consumption and utility charges.', 'Dr'),
(40, NULL, 'GAS BILL', 'GAS BILL', 'COOKING GAS', 'SERVICES', 'DR', 'BOTH', 'ACTUAL', 'SERVICES', 'NEEDS', 'NEEDS', 'Payments made for cooking gas cylinders or piped gas services.', 'Dr'),
(41, NULL, 'HOUSE/ROOM RENT', 'HOUSE/ROOM RENT', 'HOUSING', 'SERVICES', 'DR', 'BOTH', 'ACTUAL', 'SERVICES', 'NEEDS', 'NEEDS', 'Rental payments made for residential accommodation or leased premises.', 'Dr'),
(42, NULL, 'MOBILE RECHARGE', 'MOBILE RECHARGE', 'TELECOM', 'SERVICES', 'DR', 'BOTH', 'ACTUAL', 'SERVICES', 'NEEDS', 'NEEDS', 'Expenses incurred for mobile plans, talk time, data packs, and telecom services.', 'Dr'),
(43, NULL, 'TV RECHARGE', 'TV RECHARGE', 'ENTERTAINMENT SERVICE', 'SERVICES', 'DR', 'BOTH', 'ACTUAL', 'SERVICES', 'WANTS', 'WANTS', 'Payments made for television subscriptions, DTH services, and cable connections.', 'Dr'),
(44, NULL, 'WATER BILL', 'WATER BILL', 'WATER SUPPLY', 'SERVICES', 'DR', 'BOTH', 'ACTUAL', 'SERVICES', 'NEEDS', 'NEEDS', 'Payments made towards water supply and utility consumption charges.', 'Dr'),
(45, NULL, 'Liability Received', 'Liability Received', 'ADVANCE', 'FINANCING', 'CR', 'BOTH', 'COMPENSATIONAL', 'FINANCING', 'LOANS', 'LOANS', 'Friend gives ₹5,000 to book a mobile; later you either buy and hand over the mobile or return the money.', 'Cr'),
(46, NULL, 'Liability Payable', 'Liability Payable', 'BORROWING', 'FINANCING', 'DR', 'BOTH', 'COMPENSATIONAL', 'FINANCING', 'LEVERAGE', 'LEVERAGE', 'Friend pays ₹5,000 for your hotel booking; you owe him ₹5,000 later.', 'Dr'),
(47, NULL, 'LOAN', 'LOAN', 'FUNDING', 'FINANCING', 'CR', 'BOTH', 'COMPENSATIONAL', 'FINANCING', 'LOANS', 'LOANS', 'Funds received as a loan from financial institutions, friends, family, or other lenders.', 'Cr'),
(48, NULL, 'LOAN RECOLLECTION', 'LOAN RECOLLECTION', 'RECOVERY', 'FINANCING', 'CR', 'BOTH', 'COMPENSATIONAL', 'FINANCING', 'INCOME', 'INCOME', 'Amounts recovered from previously issued loans or advances.', 'Cr'),
(49, NULL, 'LOAN REPAYMENT', 'LOAN REPAYMENT', 'SETTLEMENT', 'FINANCING', 'DR', 'BOTH', 'COMPENSATIONAL', 'FINANCING', 'REPAYMENTS', 'REPAYMENTS', 'Payments made towards repayment of loan principal or borrowed amounts.', 'Dr'),
(50, NULL, 'LOAN TO OTHERS', 'LOAN TO OTHERS', 'LENDING', 'FINANCING', 'DR', 'BOTH', 'COMPENSATIONAL', 'FINANCING', 'RECEIVABLES', 'RECEIVABLES', 'Funds lent to other individuals or entities with an expectation of repayment.', 'Dr'),
(51, NULL, 'REIMBURSABLE', 'REIMBURSABLE', 'REIMBURSEMENT', 'FINANCING', 'DR', 'BOTH', 'COMPENSATIONAL', 'FINANCING', 'RECEIVABLES', 'RECEIVABLES', 'Expenses incurred on behalf of others that are expected to be reimbursed.', 'Dr'),
(52, NULL, 'REIMBURSMENT CLAIM', 'REIMBURSMENT CLAIM', 'CLAIM', 'FINANCING', 'CR', 'BOTH', 'COMPENSATIONAL', 'FINANCING', 'INCOME', 'INCOME', 'Amounts received against reimbursement claims for prior expenses.', 'Cr'),
(53, NULL, 'CC BILL LOAN', 'CC BILL LOAN', 'CC FUNDING', 'ROTATIONS', 'CR', 'BOTH', 'ROTATIONAL', 'ROTATIONS', 'LOANS', 'LOANS', 'Credit card bill amounts converted into loans or financed repayment arrangements.', 'Cr'),
(54, NULL, 'CC BILL PAYMENT', 'CC BILL PAYMENT', 'CC PAYMENT', 'ROTATIONS', 'DR', 'BOTH', 'ROTATIONAL', 'ROTATIONS', 'REPAYMENTS', 'REPAYMENTS', 'Payments made towards outstanding credit card bills and dues.', 'Dr'),
(55, NULL, 'CC CASHOUT', 'CC CASHOUT', 'CC WITHDRAWAL', 'ROTATIONS', 'DR', 'BOTH', 'ROTATIONAL', 'ROTATIONS', 'LOANS', 'LOANS', 'Cash withdrawn or transferred using available credit card limits.', 'Dr'),
(56, NULL, 'CC ROTATION IN', 'CC ROTATION IN', 'CC INFLOW', 'ROTATIONS', 'CR', 'BOTH', 'ROTATIONAL', 'ROTATIONS', 'LEVERAGE', 'LEVERAGE', 'Incoming funds received as part of a credit card rotation or rollover arrangement.', 'Cr'),
(57, NULL, 'CC ROTATION OUT', 'CC ROTATION OUT', 'CC OUTFLOW', 'ROTATIONS', 'DR', 'BOTH', 'ROTATIONAL', 'ROTATIONS', 'LEVERAGE', 'LEVERAGE', 'Outgoing funds transferred as part of a credit card rotation or rollover arrangement.', 'Dr'),
(58, NULL, 'CC SETTLEMENT', 'CC SETTLEMENT', 'CC CLOSURE', 'ROTATIONS', 'CR', 'BOTH', 'ROTATIONAL', 'ROTATIONS', 'REPAYMENTS', 'REPAYMENTS', 'Payments made to settle or close outstanding credit card balances.', 'Cr'),
(59, NULL, 'ATM CASH IN', 'ATM CASH IN', 'CASH DEPOSIT', 'INTERNAL', 'CR', 'BOTH', 'ROTATIONAL', 'INTERNAL', 'INTERNAL', 'INTERNAL', 'Cash deposited into bank accounts through ATM or self-service channels.', 'Cr'),
(60, NULL, 'ATM CASH OUT', 'ATM CASH OUT', 'CASH WITHDRAWAL', 'INTERNAL', 'DR', 'BOTH', 'ROTATIONAL', 'INTERNAL', 'INTERNAL', 'INTERNAL', 'Cash withdrawn from bank accounts using ATM facilities.', 'Dr'),
(61, NULL, 'REFUND CASHBACK', 'REFUND CASHBACK', 'CASHBACK', 'INTERNAL', 'CR', 'BOTH', 'ROTATIONAL', 'INTERNAL', 'INCOME', 'INCOME', 'Cashback rewards, promotional credits, or refunds received from transactions.', 'Cr'),
(62, NULL, 'SELF TRANSFER IN', 'SELF TRANSFER IN', 'TRANSFER IN', 'INTERNAL', 'CR', 'BOTH', 'ROTATIONAL', 'INTERNAL', 'INTERNAL', 'INTERNAL', 'Funds transferred into an account from another self-owned account.', 'Cr'),
(63, NULL, 'SELF TRANSFER OUT', 'SELF TRANSFER OUT', 'TRANSFER OUT', 'INTERNAL', 'DR', 'BOTH', 'ROTATIONAL', 'INTERNAL', 'INTERNAL', 'INTERNAL', 'Funds transferred from an account to another self-owned account.', 'Dr'),
(64, NULL, 'TEST SWIPE', 'TEST SWIPE', 'TESTING', 'INTERNAL', 'DR', 'BOTH', 'ROTATIONAL', 'INTERNAL', 'INTERNAL', 'INTERNAL', 'Test, verification, or temporary transactions performed for validation purposes.', 'Dr');

-- ----------------------------------------------------
-- Seed Budget Masters (B001 - B008)
-- ----------------------------------------------------
INSERT INTO `budgets_master` (`code`, `name`, `description`, `category_group`, `status`) VALUES
('B001', 'Home Budget', 'Household, groceries, provisions, cleaning, home upkeep', 'LIVING', 'active'),
('B002', 'Food Budget', 'Dining out, snacks, beverages, social meals, food delivery', 'LIVING', 'active'),
('B003', 'Travel Budget', 'Daily commute, petrol, tolls, vehicle transit, outstation trips', 'MOBILITY', 'active'),
('B004', 'Utility Budget', 'Electricity, water, cooking gas, telecom, broadband, routine services', 'SERVICES', 'active'),
('B005', 'Healthcare Budget', 'Medical consultations, pharmacy, diagnostic tests, treatments', 'LIVING', 'active'),
('B006', 'Lifestyle Budget', 'Entertainment, gadgets, movies, recreation, fashion, hobbies', 'LIFESTYLE', 'active'),
('B007', 'Investment Budget', 'Equity, mutual funds, SIP, fixed deposits, gold, long-term wealth', 'WEALTH', 'active'),
('B008', 'Emergency Budget', 'Contingencies, urgent hospital visits, unforeseen repairs', 'PROTECTION', 'active');

-- ----------------------------------------------------
-- Seed Cost Center Masters (CC001 - CC008)
-- ----------------------------------------------------
INSERT INTO `cost_centers` (`code`, `name`, `description`, `status`) VALUES
('CC001', 'Self', 'Personal expenses and consumption directly by self', 'active'),
('CC002', 'Parents', 'Expenses consumed for or by parents / elders', 'active'),
('CC003', 'Home', 'Expenses consumed for household property and maintenance', 'active'),
('CC004', 'Vehicle', 'Expenses consumed by car, bike, mobility assets', 'active'),
('CC005', 'Education', 'Expenses consumed for learning, courses, certifications', 'active'),
('CC006', 'Health', 'Expenses consumed for personal and family health treatments', 'active'),
('CC007', 'Business', 'Expenses consumed for professional, freelance, client work', 'active'),
('CC008', 'Travel', 'Expenses consumed for vacation trips, tours, logistics', 'active');

-- ----------------------------------------------------
-- Seed Profit Center Masters (PC001 - PC006)
-- ----------------------------------------------------
INSERT INTO `profit_centers` (`code`, `name`, `description`, `status`) VALUES
('PC001', 'Salary', 'Income from primary regular employment and salary payroll', 'active'),
('PC002', 'Freelancing', 'Income from side consulting, freelance contracts, client projects', 'active'),
('PC003', 'Investments', 'Income from dividends, capital gains, interest returns', 'active'),
('PC004', 'Business', 'Income from commercial activities and enterprise sales', 'active'),
('PC005', 'Rental Income', 'Income from leased property, real estate, equipment', 'active'),
('PC006', 'Cashback & Rewards', 'Income from transaction cashbacks, rewards, referral bonuses', 'active');

-- ----------------------------------------------------
-- Seed Project Masters (PR001 - PR005)
-- ----------------------------------------------------
INSERT INTO `projects` (`code`, `name`, `description`, `status`) VALUES
('PR001', 'Goa Trip', 'Leisure vacation and travel trip', 'active'),
('PR002', 'Money Matrix', 'Personal finance and enterprise dashboard software', 'active'),
('PR003', 'Bike Purchase', 'Capital asset acquisition and down payment', 'active'),
('PR004', 'Home Renovation', 'Interior improvements, painting, furniture upgrading', 'active'),
('PR005', 'AIOS', 'AI operating system and automation development', 'active');
