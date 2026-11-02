<?php
// PDO Database Connection & Schema Management Utility for Money Matrix
// Seamlessly connects with MySQL in XAMPP or Hostinger Shared Hosting
// Standard Numeric Auto-Increment Primary Keys (1, 2, 3...)
// Complete 65 Taxonomy Categories Master

// 64 Master Taxonomy Categories from New Taxonomy
const DEFAULT_CATEGORIES = [
    ['id' => 1, 'name' => 'CARGO/COURIER', 'subcategory' => 'CARGO/COURIER', 'category' => 'LOGISTICS', 'division' => 'LIVING', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'LIVING', 'net_type' => 'EMERGENCY', 'sub_type' => 'EMERGENCY', 'description' => 'Expenses incurred for courier services, parcel delivery, cargo transportation, or logistics support.', 'type' => 'Dr'],
    ['id' => 2, 'name' => 'HARDWARES & SERVICE', 'subcategory' => 'HARDWARES & SERVICE', 'category' => 'MAINTENANCE', 'division' => 'MOBILITY', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'MOBILITY', 'net_type' => 'EMERGENCY', 'sub_type' => 'EMERGENCY', 'description' => 'Expenses related to hardware purchases, repairs, maintenance, and technical servicing.', 'type' => 'Dr'],
    ['id' => 3, 'name' => 'PETROL', 'subcategory' => 'PETROL', 'category' => 'FUEL', 'division' => 'MOBILITY', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'MOBILITY', 'net_type' => 'NEEDS', 'sub_type' => 'NEEDS', 'description' => 'Fuel expenses incurred for personal or business vehicle usage.', 'type' => 'Dr'],
    ['id' => 4, 'name' => 'TRANSPORT', 'subcategory' => 'TRANSPORT', 'category' => 'COMMUTE', 'division' => 'MOBILITY', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'MOBILITY', 'net_type' => 'EMERGENCY', 'sub_type' => 'EMERGENCY', 'description' => 'Travel and commuting expenses including bus, train, taxi, auto, and similar transport services.', 'type' => 'Dr'],
    ['id' => 5, 'name' => 'EDUCATION FEES', 'subcategory' => 'EDUCATION FEES', 'category' => 'LEARNING', 'division' => 'LIVING', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'LIVING', 'net_type' => 'NEEDS', 'sub_type' => 'NEEDS', 'description' => 'Payments made towards tuition fees, courses, certifications, training, and educational programs.', 'type' => 'Dr'],
    ['id' => 6, 'name' => 'FOOD/SNACKS', 'subcategory' => 'FOOD/SNACKS', 'category' => 'DINING', 'division' => 'LIVING', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'LIVING', 'net_type' => 'NEEDS', 'sub_type' => 'NEEDS', 'description' => 'Expenses incurred for meals, snacks, beverages, and dining activities.', 'type' => 'Dr'],
    ['id' => 7, 'name' => 'GROCERIES', 'subcategory' => 'GROCERIES', 'category' => 'PROVISIONS', 'division' => 'LIVING', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'LIVING', 'net_type' => 'NEEDS', 'sub_type' => 'NEEDS', 'description' => 'Purchases of household food supplies and daily essential consumable items.', 'type' => 'Dr'],
    ['id' => 8, 'name' => 'GROOMING', 'subcategory' => 'GROOMING', 'category' => 'WELLNESS', 'division' => 'LIVING', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'LIVING', 'net_type' => 'NEEDS', 'sub_type' => 'NEEDS', 'description' => 'Personal care expenses such as salon services, cosmetics, toiletries, and grooming products.', 'type' => 'Dr'],
    ['id' => 9, 'name' => 'HOUSE HOLDS', 'subcategory' => 'HOUSE HOLDS', 'category' => 'HOUSEKEEPING', 'division' => 'LIVING', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'LIVING', 'net_type' => 'EMERGENCY', 'sub_type' => 'EMERGENCY', 'description' => 'Expenses related to household maintenance, cleaning supplies, and daily home essentials.', 'type' => 'Dr'],
    ['id' => 10, 'name' => 'MEDICAL', 'subcategory' => 'MEDICAL', 'category' => 'HEALTHCARE', 'division' => 'LIVING', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'LIVING', 'net_type' => 'EMERGENCY', 'sub_type' => 'EMERGENCY', 'description' => 'Healthcare expenses including consultation fees, medicines, treatments, and diagnostics.', 'type' => 'Dr'],
    ['id' => 11, 'name' => 'XEROX/STATIONERY', 'subcategory' => 'XEROX/STATIONERY', 'category' => 'ACADEMICS', 'division' => 'LIVING', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'LIVING', 'net_type' => 'EMERGENCY', 'sub_type' => 'EMERGENCY', 'description' => 'Expenses incurred for printing, photocopying, books, stationery, and educational supplies.', 'type' => 'Dr'],
    ['id' => 12, 'name' => 'EPFO', 'subcategory' => 'EPFO', 'category' => 'BENEFITS', 'division' => 'EARNINGS', 'suffix' => 'CR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'EARNINGS', 'net_type' => 'INCOME', 'sub_type' => 'INCOME', 'description' => 'Income received from employee provident fund withdrawals, settlements, or benefits.', 'type' => 'Cr'],
    ['id' => 13, 'name' => 'GIFT AMOUNT', 'subcategory' => 'GIFT AMOUNT', 'category' => 'REWARDS', 'division' => 'EARNINGS', 'suffix' => 'CR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'EARNINGS', 'net_type' => 'INCOME', 'sub_type' => 'INCOME', 'description' => 'Monetary gifts, rewards, incentives, or financial assistance received.', 'type' => 'Cr'],
    ['id' => 14, 'name' => 'LD SALARY/INCOME', 'subcategory' => 'LD SALARY/INCOME', 'category' => 'PAYROLL', 'division' => 'EARNINGS', 'suffix' => 'CR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'EARNINGS', 'net_type' => 'INCOME', 'sub_type' => 'INCOME', 'description' => 'Income received from freelance work, side projects, incentives, or other salary-related earnings.', 'type' => 'Cr'],
    ['id' => 15, 'name' => 'PFM', 'subcategory' => 'PFM', 'category' => 'BENEFITS', 'division' => 'EARNINGS', 'suffix' => 'CR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'EARNINGS', 'net_type' => 'INCOME', 'sub_type' => 'INCOME', 'description' => 'Income or benefits received from employer-sponsored funds, incentives, or welfare schemes.', 'type' => 'Cr'],
    ['id' => 16, 'name' => 'SALARY', 'subcategory' => 'SALARY', 'category' => 'PAYROLL', 'division' => 'EARNINGS', 'suffix' => 'CR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'EARNINGS', 'net_type' => 'INCOME', 'sub_type' => 'INCOME', 'description' => 'Regular salary or compensation received from employment.', 'type' => 'Cr'],
    ['id' => 17, 'name' => 'BIKE/CAR INSURANCE', 'subcategory' => 'BIKE/CAR INSURANCE', 'category' => 'VEHICLE COVER', 'division' => 'PROTECTION', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'PROTECTION', 'net_type' => 'NEEDS', 'sub_type' => 'NEEDS', 'description' => 'Premium payments made for motor vehicle insurance coverage.', 'type' => 'Dr'],
    ['id' => 18, 'name' => 'HEALTH INSURANCE', 'subcategory' => 'HEALTH INSURANCE', 'category' => 'MEDICAL COVER', 'division' => 'PROTECTION', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'PROTECTION', 'net_type' => 'NEEDS', 'sub_type' => 'NEEDS', 'description' => 'Premium payments made for health and medical insurance policies.', 'type' => 'Dr'],
    ['id' => 19, 'name' => 'TERM/LIFE INSURANCE', 'subcategory' => 'TERM/LIFE INSURANCE', 'category' => 'LIFE COVER', 'division' => 'PROTECTION', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'PROTECTION', 'net_type' => 'NEEDS', 'sub_type' => 'NEEDS', 'description' => 'Premium payments made for life insurance and term protection plans.', 'type' => 'Dr'],
    ['id' => 20, 'name' => 'EQUITY STOCK', 'subcategory' => 'EQUITY STOCK', 'category' => 'EQUITY', 'division' => 'WEALTH', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'WEALTH', 'net_type' => 'ASSETS', 'sub_type' => 'ASSETS', 'description' => 'Investments made in listed or unlisted company shares and stocks.', 'type' => 'Dr'],
    ['id' => 21, 'name' => 'FIXED DEPOSIT', 'subcategory' => 'FIXED DEPOSIT', 'category' => 'DEPOSIT', 'division' => 'WEALTH', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'WEALTH', 'net_type' => 'ASSETS', 'sub_type' => 'ASSETS', 'description' => 'Funds deposited in fixed-income deposit schemes with financial institutions.', 'type' => 'Dr'],
    ['id' => 22, 'name' => 'LIQUID FUND', 'subcategory' => 'LIQUID FUND', 'category' => 'LIQUIDITY', 'division' => 'WEALTH', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'WEALTH', 'net_type' => 'ASSETS', 'sub_type' => 'ASSETS', 'description' => 'Investments made in highly liquid mutual funds or cash-equivalent instruments.', 'type' => 'Dr'],
    ['id' => 23, 'name' => 'MUTUAL FUND', 'subcategory' => 'MUTUAL FUND', 'category' => 'FUNDING', 'division' => 'WEALTH', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'WEALTH', 'net_type' => 'ASSETS', 'sub_type' => 'ASSETS', 'description' => 'Investments made through mutual fund schemes for wealth creation.', 'type' => 'Dr'],
    ['id' => 24, 'name' => 'PPF/SIP', 'subcategory' => 'PPF/SIP', 'category' => 'RETIREMENT', 'division' => 'WEALTH', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'WEALTH', 'net_type' => 'ASSETS', 'sub_type' => 'ASSETS', 'description' => 'Contributions made towards Public Provident Fund or Systematic Investment Plans.', 'type' => 'Dr'],
    ['id' => 25, 'name' => 'RECURRING DEPOSIT', 'subcategory' => 'RECURRING DEPOSIT', 'category' => 'SAVINGS', 'division' => 'WEALTH', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'WEALTH', 'net_type' => 'ASSETS', 'sub_type' => 'ASSETS', 'description' => 'Periodic savings deposits made under recurring deposit schemes.', 'type' => 'Dr'],
    ['id' => 26, 'name' => 'RETURNS OF INVESTMENT', 'subcategory' => 'RETURNS OF INVESTMENT', 'category' => 'MATURITY', 'division' => 'WEALTH', 'suffix' => 'CR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'WEALTH', 'net_type' => 'INCOME', 'sub_type' => 'INCOME', 'description' => 'Income received from investments through redemption, maturity, dividends, or gains.', 'type' => 'Cr'],
    ['id' => 27, 'name' => 'AMUSEMENT PARKS', 'subcategory' => 'AMUSEMENT PARKS', 'category' => 'RECREATION', 'division' => 'LIFESTYLE', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'LIFESTYLE', 'net_type' => 'WANTS', 'sub_type' => 'WANTS', 'description' => 'Expenses incurred for amusement parks, recreational activities, and leisure outings.', 'type' => 'Dr'],
    ['id' => 28, 'name' => 'APPAREL & ACCESSORIES', 'subcategory' => 'APPAREL & ACCESSORIES', 'category' => 'FASHION', 'division' => 'LIFESTYLE', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'LIFESTYLE', 'net_type' => 'NEEDS', 'sub_type' => 'NEEDS', 'description' => 'Purchases of clothing, footwear, fashion accessories, and related items.', 'type' => 'Dr'],
    ['id' => 29, 'name' => 'CONTRIBUTION/GIFTS/CHARITY', 'subcategory' => 'CONTRIBUTION/GIFTS/CHARITY', 'category' => 'PHILANTHROPY', 'division' => 'LIFESTYLE', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'LIFESTYLE', 'net_type' => 'EMERGENCY', 'sub_type' => 'EMERGENCY', 'description' => 'Expenses incurred towards donations, charity, gifts, and social contributions.', 'type' => 'Dr'],
    ['id' => 30, 'name' => 'ELECTRONICS', 'subcategory' => 'ELECTRONICS', 'category' => 'GADGETS', 'division' => 'LIFESTYLE', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'LIFESTYLE', 'net_type' => 'WANTS', 'sub_type' => 'WANTS', 'description' => 'Purchases of electronic devices, gadgets, accessories, and related equipment.', 'type' => 'Dr'],
    ['id' => 31, 'name' => 'MOVIE', 'subcategory' => 'MOVIE', 'category' => 'MEDIA', 'division' => 'LIFESTYLE', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'LIFESTYLE', 'net_type' => 'WANTS', 'sub_type' => 'WANTS', 'description' => 'Expenses incurred for movies, theatres, OTT rentals, and entertainment content.', 'type' => 'Dr'],
    ['id' => 32, 'name' => 'POJAI ITEMS', 'subcategory' => 'POJAI ITEMS', 'category' => 'SPIRITUAL', 'division' => 'LIFESTYLE', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'LIFESTYLE', 'net_type' => 'WANTS', 'sub_type' => 'WANTS', 'description' => 'Purchases related to religious activities, pooja materials, and devotional offerings.', 'type' => 'Dr'],
    ['id' => 33, 'name' => 'LD PAYROLL', 'subcategory' => 'LD PAYROLL', 'category' => 'DEDUCTION', 'division' => 'COMPLIANCE', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'COMPLIANCE', 'net_type' => 'REPAYMENTS', 'sub_type' => 'REPAYMENTS', 'description' => 'Salary-related deductions, employer recoveries, or payroll adjustments.', 'type' => 'Dr'],
    ['id' => 34, 'name' => 'PENALITIES', 'subcategory' => 'PENALITIES', 'category' => 'PENALTY', 'division' => 'COMPLIANCE', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'COMPLIANCE', 'net_type' => 'EMERGENCY', 'sub_type' => 'EMERGENCY', 'description' => 'Expenses incurred due to fines, penalties, late fees, or regulatory charges.', 'type' => 'Dr'],
    ['id' => 35, 'name' => 'TAX RECEIPTS', 'subcategory' => 'TAX RECEIPTS', 'category' => 'TAXATION', 'division' => 'COMPLIANCE', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'COMPLIANCE', 'net_type' => 'NEEDS', 'sub_type' => 'NEEDS', 'description' => 'Payments made towards taxes, government levies, duties, and statutory charges.', 'type' => 'Dr'],
    ['id' => 36, 'name' => 'TOLLS FEE', 'subcategory' => 'TOLLS FEE', 'category' => 'TOLLING', 'division' => 'COMPLIANCE', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'COMPLIANCE', 'net_type' => 'NEEDS', 'sub_type' => 'NEEDS', 'description' => 'Payments made for toll roads, bridge tolls, and transportation access charges.', 'type' => 'Dr'],
    ['id' => 37, 'name' => 'BROADBAND RECHARGE', 'subcategory' => 'BROADBAND RECHARGE', 'category' => 'INTERNET', 'division' => 'SERVICES', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'SERVICES', 'net_type' => 'NEEDS', 'sub_type' => 'NEEDS', 'description' => 'Expenses incurred for broadband, internet, and home network services.', 'type' => 'Dr'],
    ['id' => 38, 'name' => 'DIGITAL SUBSCRIPTIONS', 'subcategory' => 'DIGITAL SUBSCRIPTIONS', 'category' => 'SUBSCRIPTION', 'division' => 'SERVICES', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'SERVICES', 'net_type' => 'WANTS', 'sub_type' => 'WANTS', 'description' => 'Payments for digital services, OTT platforms, software subscriptions, and memberships.', 'type' => 'Dr'],
    ['id' => 39, 'name' => 'EB BILL', 'subcategory' => 'EB BILL', 'category' => 'ELECTRICITY', 'division' => 'SERVICES', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'SERVICES', 'net_type' => 'NEEDS', 'sub_type' => 'NEEDS', 'description' => 'Payments made towards electricity consumption and utility charges.', 'type' => 'Dr'],
    ['id' => 40, 'name' => 'GAS BILL', 'subcategory' => 'GAS BILL', 'category' => 'COOKING GAS', 'division' => 'SERVICES', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'SERVICES', 'net_type' => 'NEEDS', 'sub_type' => 'NEEDS', 'description' => 'Payments made for cooking gas cylinders or piped gas services.', 'type' => 'Dr'],
    ['id' => 41, 'name' => 'HOUSE/ROOM RENT', 'subcategory' => 'HOUSE/ROOM RENT', 'category' => 'HOUSING', 'division' => 'SERVICES', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'SERVICES', 'net_type' => 'NEEDS', 'sub_type' => 'NEEDS', 'description' => 'Rental payments made for residential accommodation or leased premises.', 'type' => 'Dr'],
    ['id' => 42, 'name' => 'MOBILE RECHARGE', 'subcategory' => 'MOBILE RECHARGE', 'category' => 'TELECOM', 'division' => 'SERVICES', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'SERVICES', 'net_type' => 'NEEDS', 'sub_type' => 'NEEDS', 'description' => 'Expenses incurred for mobile plans, talk time, data packs, and telecom services.', 'type' => 'Dr'],
    ['id' => 43, 'name' => 'TV RECHARGE', 'subcategory' => 'TV RECHARGE', 'category' => 'ENTERTAINMENT SERVICE', 'division' => 'SERVICES', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'SERVICES', 'net_type' => 'WANTS', 'sub_type' => 'WANTS', 'description' => 'Payments made for television subscriptions, DTH services, and cable connections.', 'type' => 'Dr'],
    ['id' => 44, 'name' => 'WATER BILL', 'subcategory' => 'WATER BILL', 'category' => 'WATER SUPPLY', 'division' => 'SERVICES', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ACTUAL', 'group_type' => 'SERVICES', 'net_type' => 'NEEDS', 'sub_type' => 'NEEDS', 'description' => 'Payments made towards water supply and utility consumption charges.', 'type' => 'Dr'],
    ['id' => 45, 'name' => 'Liability Received', 'subcategory' => 'Liability Received', 'category' => 'ADVANCE', 'division' => 'FINANCING', 'suffix' => 'CR', 'info_type' => 'BOTH', 'transaction_type' => 'COMPENSATIONAL', 'group_type' => 'FINANCING', 'net_type' => 'LOANS', 'sub_type' => 'LOANS', 'description' => 'Friend gives ₹5,000 to book a mobile; later you either buy and hand over the mobile or return the money.', 'type' => 'Cr'],
    ['id' => 46, 'name' => 'Liability Payable', 'subcategory' => 'Liability Payable', 'category' => 'BORROWING', 'division' => 'FINANCING', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'COMPENSATIONAL', 'group_type' => 'FINANCING', 'net_type' => 'LEVERAGE', 'sub_type' => 'LEVERAGE', 'description' => 'Friend pays ₹5,000 for your hotel booking; you owe him ₹5,000 later.', 'type' => 'Dr'],
    ['id' => 47, 'name' => 'LOAN', 'subcategory' => 'LOAN', 'category' => 'FUNDING', 'division' => 'FINANCING', 'suffix' => 'CR', 'info_type' => 'BOTH', 'transaction_type' => 'COMPENSATIONAL', 'group_type' => 'FINANCING', 'net_type' => 'LOANS', 'sub_type' => 'LOANS', 'description' => 'Funds received as a loan from financial institutions, friends, family, or other lenders.', 'type' => 'Cr'],
    ['id' => 48, 'name' => 'LOAN RECOLLECTION', 'subcategory' => 'LOAN RECOLLECTION', 'category' => 'RECOVERY', 'division' => 'FINANCING', 'suffix' => 'CR', 'info_type' => 'BOTH', 'transaction_type' => 'COMPENSATIONAL', 'group_type' => 'FINANCING', 'net_type' => 'INCOME', 'sub_type' => 'INCOME', 'description' => 'Amounts recovered from previously issued loans or advances.', 'type' => 'Cr'],
    ['id' => 49, 'name' => 'LOAN REPAYMENT', 'subcategory' => 'LOAN REPAYMENT', 'category' => 'SETTLEMENT', 'division' => 'FINANCING', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'COMPENSATIONAL', 'group_type' => 'FINANCING', 'net_type' => 'REPAYMENTS', 'sub_type' => 'REPAYMENTS', 'description' => 'Payments made towards repayment of loan principal or borrowed amounts.', 'type' => 'Dr'],
    ['id' => 50, 'name' => 'LOAN TO OTHERS', 'subcategory' => 'LOAN TO OTHERS', 'category' => 'LENDING', 'division' => 'FINANCING', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'COMPENSATIONAL', 'group_type' => 'FINANCING', 'net_type' => 'RECEIVABLES', 'sub_type' => 'RECEIVABLES', 'description' => 'Funds lent to other individuals or entities with an expectation of repayment.', 'type' => 'Dr'],
    ['id' => 51, 'name' => 'REIMBURSABLE', 'subcategory' => 'REIMBURSABLE', 'category' => 'REIMBURSEMENT', 'division' => 'FINANCING', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'COMPENSATIONAL', 'group_type' => 'FINANCING', 'net_type' => 'RECEIVABLES', 'sub_type' => 'RECEIVABLES', 'description' => 'Expenses incurred on behalf of others that are expected to be reimbursed.', 'type' => 'Dr'],
    ['id' => 52, 'name' => 'REIMBURSMENT CLAIM', 'subcategory' => 'REIMBURSMENT CLAIM', 'category' => 'CLAIM', 'division' => 'FINANCING', 'suffix' => 'CR', 'info_type' => 'BOTH', 'transaction_type' => 'COMPENSATIONAL', 'group_type' => 'FINANCING', 'net_type' => 'INCOME', 'sub_type' => 'INCOME', 'description' => 'Amounts received against reimbursement claims for prior expenses.', 'type' => 'Cr'],
    ['id' => 53, 'name' => 'CC BILL LOAN', 'subcategory' => 'CC BILL LOAN', 'category' => 'CC FUNDING', 'division' => 'ROTATIONS', 'suffix' => 'CR', 'info_type' => 'BOTH', 'transaction_type' => 'ROTATIONAL', 'group_type' => 'ROTATIONS', 'net_type' => 'LOANS', 'sub_type' => 'LOANS', 'description' => 'Credit card bill amounts converted into loans or financed repayment arrangements.', 'type' => 'Cr'],
    ['id' => 54, 'name' => 'CC BILL PAYMENT', 'subcategory' => 'CC BILL PAYMENT', 'category' => 'CC PAYMENT', 'division' => 'ROTATIONS', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ROTATIONAL', 'group_type' => 'ROTATIONS', 'net_type' => 'REPAYMENTS', 'sub_type' => 'REPAYMENTS', 'description' => 'Payments made towards outstanding credit card bills and dues.', 'type' => 'Dr'],
    ['id' => 55, 'name' => 'CC CASHOUT', 'subcategory' => 'CC CASHOUT', 'category' => 'CC WITHDRAWAL', 'division' => 'ROTATIONS', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ROTATIONAL', 'group_type' => 'ROTATIONS', 'net_type' => 'LOANS', 'sub_type' => 'LOANS', 'description' => 'Cash withdrawn or transferred using available credit card limits.', 'type' => 'Dr'],
    ['id' => 56, 'name' => 'CC ROTATION IN', 'subcategory' => 'CC ROTATION IN', 'category' => 'CC INFLOW', 'division' => 'ROTATIONS', 'suffix' => 'CR', 'info_type' => 'BOTH', 'transaction_type' => 'ROTATIONAL', 'group_type' => 'ROTATIONS', 'net_type' => 'LEVERAGE', 'sub_type' => 'LEVERAGE', 'description' => 'Incoming funds received as part of a credit card rotation or rollover arrangement.', 'type' => 'Cr'],
    ['id' => 57, 'name' => 'CC ROTATION OUT', 'subcategory' => 'CC ROTATION OUT', 'category' => 'CC OUTFLOW', 'division' => 'ROTATIONS', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ROTATIONAL', 'group_type' => 'ROTATIONS', 'net_type' => 'LEVERAGE', 'sub_type' => 'LEVERAGE', 'description' => 'Outgoing funds transferred as part of a credit card rotation or rollover arrangement.', 'type' => 'Dr'],
    ['id' => 58, 'name' => 'CC SETTLEMENT', 'subcategory' => 'CC SETTLEMENT', 'category' => 'CC CLOSURE', 'division' => 'ROTATIONS', 'suffix' => 'CR', 'info_type' => 'BOTH', 'transaction_type' => 'ROTATIONAL', 'group_type' => 'ROTATIONS', 'net_type' => 'REPAYMENTS', 'sub_type' => 'REPAYMENTS', 'description' => 'Payments made to settle or close outstanding credit card balances.', 'type' => 'Cr'],
    ['id' => 59, 'name' => 'ATM CASH IN', 'subcategory' => 'ATM CASH IN', 'category' => 'CASH DEPOSIT', 'division' => 'INTERNAL', 'suffix' => 'CR', 'info_type' => 'BOTH', 'transaction_type' => 'ROTATIONAL', 'group_type' => 'INTERNAL', 'net_type' => 'INTERNAL', 'sub_type' => 'INTERNAL', 'description' => 'Cash deposited into bank accounts through ATM or self-service channels.', 'type' => 'Cr'],
    ['id' => 60, 'name' => 'ATM CASH OUT', 'subcategory' => 'ATM CASH OUT', 'category' => 'CASH WITHDRAWAL', 'division' => 'INTERNAL', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ROTATIONAL', 'group_type' => 'INTERNAL', 'net_type' => 'INTERNAL', 'sub_type' => 'INTERNAL', 'description' => 'Cash withdrawn from bank accounts using ATM facilities.', 'type' => 'Dr'],
    ['id' => 61, 'name' => 'REFUND CASHBACK', 'subcategory' => 'REFUND CASHBACK', 'category' => 'CASHBACK', 'division' => 'INTERNAL', 'suffix' => 'CR', 'info_type' => 'BOTH', 'transaction_type' => 'ROTATIONAL', 'group_type' => 'INTERNAL', 'net_type' => 'INCOME', 'sub_type' => 'INCOME', 'description' => 'Cashback rewards, promotional credits, or refunds received from transactions.', 'type' => 'Cr'],
    ['id' => 62, 'name' => 'SELF TRANSFER IN', 'subcategory' => 'SELF TRANSFER IN', 'category' => 'TRANSFER IN', 'division' => 'INTERNAL', 'suffix' => 'CR', 'info_type' => 'BOTH', 'transaction_type' => 'ROTATIONAL', 'group_type' => 'INTERNAL', 'net_type' => 'INTERNAL', 'sub_type' => 'INTERNAL', 'description' => 'Funds transferred into an account from another self-owned account.', 'type' => 'Cr'],
    ['id' => 63, 'name' => 'SELF TRANSFER OUT', 'subcategory' => 'SELF TRANSFER OUT', 'category' => 'TRANSFER OUT', 'division' => 'INTERNAL', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ROTATIONAL', 'group_type' => 'INTERNAL', 'net_type' => 'INTERNAL', 'sub_type' => 'INTERNAL', 'description' => 'Funds transferred from an account to another self-owned account.', 'type' => 'Dr'],
    ['id' => 64, 'name' => 'TEST SWIPE', 'subcategory' => 'TEST SWIPE', 'category' => 'TESTING', 'division' => 'INTERNAL', 'suffix' => 'DR', 'info_type' => 'BOTH', 'transaction_type' => 'ROTATIONAL', 'group_type' => 'INTERNAL', 'net_type' => 'INTERNAL', 'sub_type' => 'INTERNAL', 'description' => 'Test, verification, or temporary transactions performed for validation purposes.', 'type' => 'Dr'],
];


function getDefaultTransactions(): array {
    $today = date('Y-m-d');
    return [
        [
            'date' => $today,
            'category_name' => 'SALARY',
            'subcategory' => 'SALARY',
            'group_type' => 'INCOME',
            'net_type' => 'NET INCOME',
            'sub_type' => 'INCOME',
            'transaction_type' => 'ACTUAL',
            'type' => 'Cr',
            'amount' => 75000.00,
            'notes' => 'Monthly salary credited',
        ],
        [
            'date' => $today,
            'category_name' => 'HOUSE/ROOM RENT',
            'subcategory' => 'HOUSE/ROOM RENT',
            'group_type' => 'UTILITIES',
            'net_type' => 'NET EXPENSE',
            'sub_type' => 'NEEDS',
            'transaction_type' => 'ACTUAL',
            'type' => 'Dr',
            'amount' => 22000.00,
            'notes' => 'Apartment monthly rent',
        ],
        [
            'date' => $today,
            'category_name' => 'GROCERIES',
            'subcategory' => 'GROCERIES',
            'group_type' => 'HOME NEEDS',
            'net_type' => 'NET EXPENSE',
            'sub_type' => 'NEEDS',
            'transaction_type' => 'ACTUAL',
            'type' => 'Dr',
            'amount' => 1450.00,
            'notes' => 'Grocery store restocking',
        ],
        [
            'date' => $today,
            'category_name' => 'PETROL',
            'subcategory' => 'PETROL',
            'group_type' => 'Fuel & Transport',
            'net_type' => 'NET EXPENSE',
            'sub_type' => 'NEEDS',
            'transaction_type' => 'ACTUAL',
            'type' => 'Dr',
            'amount' => 2000.00,
            'notes' => 'Fuel refill',
        ],
        [
            'date' => $today,
            'category_name' => 'EB BILL',
            'subcategory' => 'EB BILL',
            'group_type' => 'UTILITIES',
            'net_type' => 'NET EXPENSE',
            'sub_type' => '',
            'transaction_type' => 'ACTUAL',
            'type' => 'Dr',
            'amount' => 3200.00,
            'notes' => 'Electricity bill payment',
        ],
    ];
}

function getDb(): PDO {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $config = require __DIR__ . '/config.php';
    $dbConfig = $config['db'];

    $host = $dbConfig['host'];
    $port = $dbConfig['port'];
    $dbName = $dbConfig['name'];
    $user = $dbConfig['user'];
    $pass = $dbConfig['pass'];
    $charset = $dbConfig['charset'];

    try {
        $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset={$charset}";
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        if ($e->getCode() == 1049 || str_contains($e->getMessage(), 'Unknown database')) {
            try {
                $serverDsn = "mysql:host={$host};port={$port};charset={$charset}";
                $rootPdo = new PDO($serverDsn, $user, $pass);
                $rootPdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                unset($rootPdo);

                $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset={$charset}";
                $pdo = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
            } catch (Exception $creationErr) {
                throw new Exception("Database '{$dbName}' could not be created or accessed: " . $creationErr->getMessage());
            }
        } else {
            throw $e;
        }
    }

    ensureSchema($pdo);

    return $pdo;
}

function getDbConnection(): PDO {
    return getDb();
}

function ensureSchema(PDO $pdo): void {
    static $schemaChecked = false;
    if ($schemaChecked) {
        return;
    }

    // 1. Users Table (INT AUTO_INCREMENT)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `users` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `name` VARCHAR(150) NOT NULL,
            `username` VARCHAR(100) NOT NULL UNIQUE,
            `password` VARCHAR(255) NOT NULL,
            `role` ENUM('superadmin', 'user') NOT NULL DEFAULT 'user',
            `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $userCols = $pdo->query("SHOW COLUMNS FROM `users`")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('email', $userCols)) {
        $pdo->exec("ALTER TABLE `users` ADD COLUMN `email` VARCHAR(150) NULL AFTER `username`");
    }
    if (!in_array('google_id', $userCols)) {
        $pdo->exec("ALTER TABLE `users` ADD COLUMN `google_id` VARCHAR(100) NULL AFTER `email`");
    }
    if (!in_array('avatar', $userCols)) {
        $pdo->exec("ALTER TABLE `users` ADD COLUMN `avatar` VARCHAR(255) NULL AFTER `google_id`");
    }
    if (!in_array('auth_provider', $userCols)) {
        $pdo->exec("ALTER TABLE `users` ADD COLUMN `auth_provider` VARCHAR(50) DEFAULT 'local' AFTER `avatar`");
    }

    // 2. Accounts Table (INT AUTO_INCREMENT)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `accounts` (
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
    ");

    $accCols = $pdo->query("SHOW COLUMNS FROM `accounts`")->fetchAll(PDO::FETCH_COLUMN);
    $newAccCols = [
        'credit_limit' => "DECIMAL(15, 2) NOT NULL DEFAULT 0.00",
        'billing_cycle_day' => "INT NULL",
        'masked_card_no' => "VARCHAR(30) NULL",
        'card_expiry' => "VARCHAR(10) NULL",
        'cardholder_name' => "VARCHAR(150) NULL",
        'bank_name' => "VARCHAR(100) NULL"
    ];
    foreach ($newAccCols as $col => $colDef) {
        if (!in_array($col, $accCols)) {
            $pdo->exec("ALTER TABLE `accounts` ADD COLUMN `{$col}` {$colDef}");
        }
    }

    // 3. Categories Table (Complete Taxonomy Master)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `categories` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NULL,
            `name` VARCHAR(150) NOT NULL,
            `subcategory` VARCHAR(150) NOT NULL,
            `category` VARCHAR(150) NOT NULL,
            `division` ENUM('INCOME', 'EXPENSE', 'NEUTRAL') NOT NULL DEFAULT 'EXPENSE',
            `suffix` ENUM('CR', 'DR', 'NU') NOT NULL DEFAULT 'DR',
            `info_type` VARCHAR(50) NOT NULL DEFAULT 'BOTH',
            `transaction_type` VARCHAR(50) NULL DEFAULT 'ACTUAL',
            `group_type` VARCHAR(100) NOT NULL DEFAULT 'Internal & Misc',
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
    ");

    // Check & add any missing taxonomy columns if categories table already existed
    $catCols = $pdo->query("SHOW COLUMNS FROM `categories`")->fetchAll(PDO::FETCH_COLUMN);
    try {
        $pdo->exec("ALTER TABLE `categories` MODIFY COLUMN `division` VARCHAR(100) NOT NULL DEFAULT 'LIVING'");
    } catch (Exception $e) {}
    if (!in_array('description', $catCols)) {
        try {
            $pdo->exec("ALTER TABLE `categories` ADD COLUMN `description` TEXT NULL AFTER `sub_type`");
        } catch (Exception $e) {}
    }
    if (!in_array('subcategory', $catCols)) {
        $pdo->exec("ALTER TABLE `categories` ADD COLUMN `subcategory` VARCHAR(150) NOT NULL DEFAULT '' AFTER `name`");
    }
    if (!in_array('category', $catCols)) {
        $pdo->exec("ALTER TABLE `categories` ADD COLUMN `category` VARCHAR(150) NOT NULL DEFAULT '' AFTER `subcategory`");
    }
    if (!in_array('division', $catCols)) {
        $pdo->exec("ALTER TABLE `categories` ADD COLUMN `division` ENUM('INCOME', 'EXPENSE', 'NEUTRAL') NOT NULL DEFAULT 'EXPENSE' AFTER `category`");
    }
    if (!in_array('suffix', $catCols)) {
        $pdo->exec("ALTER TABLE `categories` ADD COLUMN `suffix` ENUM('CR', 'DR', 'NU') NOT NULL DEFAULT 'DR' AFTER `division`");
    }
    if (!in_array('info_type', $catCols)) {
        $pdo->exec("ALTER TABLE `categories` ADD COLUMN `info_type` VARCHAR(50) NOT NULL DEFAULT 'BOTH' AFTER `suffix`");
    }
    if (!in_array('transaction_type', $catCols)) {
        $pdo->exec("ALTER TABLE `categories` ADD COLUMN `transaction_type` VARCHAR(50) NULL DEFAULT 'ACTUAL' AFTER `info_type`");
    }
    if (!in_array('group_type', $catCols)) {
        $pdo->exec("ALTER TABLE `categories` ADD COLUMN `group_type` VARCHAR(100) NOT NULL DEFAULT 'Internal & Misc' AFTER `transaction_type`");
    }
    if (!in_array('net_type', $catCols)) {
        $pdo->exec("ALTER TABLE `categories` ADD COLUMN `net_type` VARCHAR(100) NULL AFTER `group_type`");
    }
    if (!in_array('sub_type', $catCols)) {
        $pdo->exec("ALTER TABLE `categories` ADD COLUMN `sub_type` VARCHAR(100) NULL AFTER `net_type`");
    }

    // 4. Transactions Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `transactions` (
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
            `notes` TEXT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_tx_user` (`user_id`),
            INDEX `idx_tx_account` (`account_id`),
            INDEX `idx_tx_date` (`date`),
            INDEX `idx_tx_group` (`group_type`),
            INDEX `idx_tx_sub_type` (`sub_type`),
            CONSTRAINT `fk_tx_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
            CONSTRAINT `fk_tx_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL,
            CONSTRAINT `fk_tx_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $txCols = $pdo->query("SHOW COLUMNS FROM `transactions`")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('subcategory', $txCols)) {
        $pdo->exec("ALTER TABLE `transactions` ADD COLUMN `subcategory` VARCHAR(150) NULL AFTER `category_name`");
    }
    if (!in_array('group_type', $txCols)) {
        $pdo->exec("ALTER TABLE `transactions` ADD COLUMN `group_type` VARCHAR(100) NULL AFTER `subcategory`");
    }
    if (!in_array('net_type', $txCols)) {
        $pdo->exec("ALTER TABLE `transactions` ADD COLUMN `net_type` VARCHAR(100) NULL AFTER `group_type`");
    }
    if (!in_array('sub_type', $txCols)) {
        $pdo->exec("ALTER TABLE `transactions` ADD COLUMN `sub_type` VARCHAR(100) NULL AFTER `net_type`");
    }
    if (!in_array('transaction_type', $txCols)) {
        $pdo->exec("ALTER TABLE `transactions` ADD COLUMN `transaction_type` VARCHAR(50) NULL AFTER `sub_type`");
    }
    if (!in_array('audit_status', $txCols)) {
        $pdo->exec("ALTER TABLE `transactions` ADD COLUMN `audit_status` ENUM('draft', 'verified', 'frozen') NOT NULL DEFAULT 'draft' AFTER `amount`");
    }
    if (!in_array('balance', $txCols)) {
        $pdo->exec("ALTER TABLE `transactions` ADD COLUMN `balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 AFTER `amount`");
    }
    if (!in_array('verified_at', $txCols)) {
        $pdo->exec("ALTER TABLE `transactions` ADD COLUMN `verified_at` DATETIME NULL AFTER `audit_status`");
    }
    if (!in_array('frozen_at', $txCols)) {
        $pdo->exec("ALTER TABLE `transactions` ADD COLUMN `frozen_at` DATETIME NULL AFTER `verified_at`");
    }

    $newColumns = [
        'date_group' => "VARCHAR(50) NULL DEFAULT '1'",
        'temp_upload_id' => "VARCHAR(100) NULL",
        'tran_no' => "VARCHAR(100) NULL",
        'tagging' => "VARCHAR(150) NULL",
        'job_utils' => "VARCHAR(150) NULL",
        'compensation_type' => "VARCHAR(100) NULL",
        'split_ref' => "VARCHAR(100) NULL",
        'info_type' => "VARCHAR(50) NULL DEFAULT 'BOTH'",
        'info_status' => "VARCHAR(50) NULL",
        'eid' => "VARCHAR(100) NULL",
        'allocation_eid' => "VARCHAR(100) NULL",
        'job_timeline' => "VARCHAR(100) NULL",
        'remarks' => "TEXT NULL",
        'account_type' => "VARCHAR(50) NULL",
        'suffix' => "VARCHAR(20) NULL",
        'keyword_tagging' => "VARCHAR(255) NULL",
        'sub_cat_helper' => "VARCHAR(150) NULL",
        'method' => "VARCHAR(50) NULL",
        'mode' => "VARCHAR(50) NULL",
        'category' => "VARCHAR(150) NULL",
        'month' => "VARCHAR(20) NULL",
        'year' => "INT NULL",
        'week_no' => "INT NULL",
        'year_month' => "VARCHAR(20) NULL",
        'tran_type_helper' => "VARCHAR(100) NULL",
                'budget' => "VARCHAR(150) NULL",
        'cost_center' => "VARCHAR(150) NULL",
        'profit_center' => "VARCHAR(150) NULL",
        'project' => "VARCHAR(150) NULL",
        'division' => "VARCHAR(100) NULL",
        'utr_no' => "VARCHAR(100) NULL"
    ];

    foreach ($newColumns as $col => $colDef) {
        if (!in_array($col, $txCols)) {
            $pdo->exec("ALTER TABLE `transactions` ADD COLUMN `{$col}` {$colDef}");
        }
    }

    // 5. Settings Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `settings` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NULL,
            `setting_key` VARCHAR(100) NOT NULL,
            `setting_value` TEXT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY `idx_user_setting` (`user_id`, `setting_key`),
            CONSTRAINT `fk_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    
    // 5b. Management Masters Tables: Budgets, Cost Centers, Profit Centers, Projects
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `budgets_master` (
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
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `cost_centers` (
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
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `profit_centers` (
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
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `projects` (
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
    ");

    // 6. Daily Closing Snapshots (Family Closing, CC Liability, Loans, Net Worth)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `daily_closing_snapshots` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `date` DATE NOT NULL,
            `liquid_closing_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `cc_liability` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `loans_payable` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `net_worth` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `net_worth_lakhs` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            `total_credits` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `total_debits` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `audit_locked` TINYINT(1) NOT NULL DEFAULT 0,
            `locked_at` DATETIME NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY `uq_user_snap_date` (`user_id`, `date`),
            INDEX `idx_snap_user_date` (`user_id`, `date`),
            CONSTRAINT `fk_daily_snap_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 7. Monthly Closing Snapshots
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `monthly_closing_snapshots` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `year_month` VARCHAR(20) NOT NULL,
            `month_end_date` DATE NOT NULL,
            `liquid_closing_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `cc_liability` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `loans_payable` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `net_worth` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `net_worth_lakhs` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY `uq_user_snap_month` (`user_id`, `year_month`),
            INDEX `idx_snap_user_month` (`user_id`, `year_month`),
            CONSTRAINT `fk_monthly_snap_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 8. Yearly Closing Snapshots
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `yearly_closing_snapshots` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `year` INT NOT NULL,
            `year_end_date` DATE NOT NULL,
            `liquid_closing_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `cc_liability` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `loans_payable` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `net_worth` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `net_worth_lakhs` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            `net_p_and_l` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY `uq_user_snap_year` (`user_id`, `year`),
            INDEX `idx_snap_user_year` (`user_id`, `year`),
            CONSTRAINT `fk_yearly_snap_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 9. Counterparties Table (AP / AR Entities: Selva, Karthikn, Aneeth, etc.)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `counterparties` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `name` VARCHAR(150) NOT NULL,
            `phone` VARCHAR(50) NULL,
            `relationship_type` VARCHAR(50) NOT NULL DEFAULT 'FRIEND',
            `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY `uq_user_counterparty` (`user_id`, `name`),
            INDEX `idx_cp_user` (`user_id`),
            CONSTRAINT `fk_cp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 10. Budgets Table (Forecast, Estimated, Allocated, Target)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `budgets` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `year` INT NOT NULL,
            `month` INT NULL,
            `category_id` INT NULL,
            `group_type` VARCHAR(100) NOT NULL,
            `division` VARCHAR(50) NOT NULL,
            `forecast_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `estimated_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `allocated_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `target_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_budget_user_yr` (`user_id`, `year`),
            CONSTRAINT `fk_budget_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $bCols = $pdo->query("SHOW COLUMNS FROM `budgets`")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('category_name', $bCols)) {
        $pdo->exec("ALTER TABLE `budgets` ADD COLUMN `category_name` VARCHAR(150) NULL AFTER `category_id`");
    }
    if (!in_array('subcategory', $bCols)) {
        $pdo->exec("ALTER TABLE `budgets` ADD COLUMN `subcategory` VARCHAR(150) NULL AFTER `category_name`");
    }

    // 11. Loan Masters & Amortization
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `loan_masters` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `account_no` VARCHAR(100) NOT NULL,
            `lender_name` VARCHAR(150) NOT NULL,
            `loan_type` VARCHAR(100) NOT NULL DEFAULT 'PERSONAL_LOAN',
            `sanction_date` DATE NOT NULL,
            `principal_amount` DECIMAL(15, 2) NOT NULL,
            `interest_rate_pct` DECIMAL(6, 2) NOT NULL,
            `tenure_months` INT NOT NULL,
            `processing_fee` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `gst_on_fee` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `monthly_emi` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `status` ENUM('ACTIVE', 'FORECLOSED', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_loan_user` (`user_id`),
            CONSTRAINT `fk_loan_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `loan_amortization_schedule` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `loan_id` INT NOT NULL,
            `installment_no` INT NOT NULL,
            `due_date` DATE NOT NULL,
            `opening_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `emi_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `principal_component` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `interest_component` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `closing_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `paid_date` DATE NULL,
            `paid_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `late_fee` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
            `status` ENUM('PENDING', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_sched_loan` (`loan_id`),
            CONSTRAINT `fk_sched_loan` FOREIGN KEY (`loan_id`) REFERENCES `loan_masters` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Seed default users if empty
    $userCount = (int)$pdo->query("SELECT COUNT(*) FROM `users`")->fetchColumn();
    if ($userCount === 0) {
        $userStmt = $pdo->prepare("INSERT INTO `users` (`id`, `name`, `username`, `password`, `role`, `status`) VALUES (:id, :name, :username, :password, :role, 'active')");
        $userStmt->execute([':id' => 1, ':name' => 'System Super Admin', ':username' => 'admin', ':password' => 'admin', ':role' => 'superadmin']);
        $userStmt->execute([':id' => 2, ':name' => 'varun', ':username' => 'varun', ':password' => 'varun', ':role' => 'user']);
        $userStmt->execute([':id' => 3, ':name' => 'maruthu', ':username' => 'maruthu', ':password' => 'maruthu', ':role' => 'user']);

        // Default accounts for varun (id: 2)
        $accStmt = $pdo->prepare("INSERT INTO `accounts` (`user_id`, `code`, `name`, `type`, `dump_type`, `balance`, `status`) VALUES (:user_id, :code, :name, :type, :dump_type, :balance, 'active')");
        $accStmt->execute([':user_id' => 1, ':code' => 'Cash_1', ':name' => 'Cash_1 (Physical Cash)', ':type' => 'Cash Account', ':dump_type' => 'FINANCE', ':balance' => 0.00]);
        $accStmt->execute([':user_id' => 2, ':code' => 'Cash_1', ':name' => 'Cash_1 (Physical Cash)', ':type' => 'Cash Account', ':dump_type' => 'FINANCE', ':balance' => 0.00]);
        $accStmt->execute([':user_id' => 2, ':code' => 'ICICI_DM_3142', ':name' => 'ICICI_DM_3142 (Savings)', ':type' => 'Savings Account', ':dump_type' => 'BANK', ':balance' => 0.00]);
        $accStmt->execute([':user_id' => 2, ':code' => 'FED_SB_9998', ':name' => 'FED_SB_9998 (Federal SB)', ':type' => 'Savings Account', ':dump_type' => 'BANK', ':balance' => 0.00]);
        $accStmt->execute([':user_id' => 2, ':code' => 'HDFC_CC_0733', ':name' => 'HDFC_CC_0733 (Credit Card)', ':type' => 'Credit Card', ':dump_type' => 'CREDIT_CARD', ':balance' => 0.00]);
        $accStmt->execute([':user_id' => 2, ':code' => 'ICICI_CC_8003', ':name' => 'ICICI_CC_HP_8003 (Credit Card)', ':type' => 'Credit Card', ':dump_type' => 'CREDIT_CARD', ':balance' => 0.00]);
        $accStmt->execute([':user_id' => 2, ':code' => 'ICICI_CUR_0498', ':name' => 'ICICI_CUR_0498 (Current)', ':type' => 'Current Account', ':dump_type' => 'BANK', ':balance' => 0.00]);
        $accStmt->execute([':user_id' => 2, ':code' => 'SELVA_LOAN', ':name' => 'SELVA_LOANS (Payable)', ':type' => 'Loan Account', ':dump_type' => 'LOAN', ':balance' => 0.00]);
        $accStmt->execute([':user_id' => 3, ':code' => 'Cash_1', ':name' => 'Cash_1 (Physical Cash)', ':type' => 'Cash Account', ':dump_type' => 'FINANCE', ':balance' => 0.00]);
    }

    // Seed default management masters
    $bmCount = (int)$pdo->query("SELECT COUNT(*) FROM `budgets_master`")->fetchColumn();
    if ($bmCount === 0) {
        $bmStmt = $pdo->prepare("INSERT INTO `budgets_master` (`code`, `name`, `description`, `category_group`, `status`) VALUES (:code, :name, :description, :category_group, 'active')");
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

    $ccCount = (int)$pdo->query("SELECT COUNT(*) FROM `cost_centers`")->fetchColumn();
    if ($ccCount === 0) {
        $ccStmt = $pdo->prepare("INSERT INTO `cost_centers` (`code`, `name`, `description`, `status`) VALUES (:code, :name, :description, 'active')");
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

    $pcCount = (int)$pdo->query("SELECT COUNT(*) FROM `profit_centers`")->fetchColumn();
    if ($pcCount === 0) {
        $pcStmt = $pdo->prepare("INSERT INTO `profit_centers` (`code`, `name`, `description`, `status`) VALUES (:code, :name, :description, 'active')");
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

    $prCount = (int)$pdo->query("SELECT COUNT(*) FROM `projects`")->fetchColumn();
    if ($prCount === 0) {
        $prStmt = $pdo->prepare("INSERT INTO `projects` (`code`, `name`, `description`, `status`) VALUES (:code, :name, :description, 'active')");
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
    $firstSubcat = $pdo->query("SELECT subcategory FROM `categories` WHERE id = 1")->fetchColumn();
    $catCount = (int)$pdo->query("SELECT COUNT(*) FROM `categories`")->fetchColumn();
    if ($catCount < 64 || $firstSubcat !== 'CARGO/COURIER') {
        $pdo->exec("DELETE FROM `categories` WHERE user_id IS NULL");
        $stmt = $pdo->prepare("
            INSERT INTO `categories` (`id`,`user_id`, `name`, `subcategory`, `category`, `division`, `suffix`, `info_type`, `transaction_type`, `group_type`, `net_type`, `sub_type`, `description`, `type`) 
            VALUES (:id, NULL, :name, :subcategory, :category, :division, :suffix, :info_type, :transaction_type, :group_type, :net_type, :sub_type, :description, :type)
            ON DUPLICATE KEY UPDATE 
                `name`=VALUES(`name`), `subcategory`=VALUES(`subcategory`), `category`=VALUES(`category`), 
                `division`=VALUES(`division`), `suffix`=VALUES(`suffix`), `info_type`=VALUES(`info_type`), 
                `transaction_type`=VALUES(`transaction_type`), `group_type`=VALUES(`group_type`), 
                `net_type`=VALUES(`net_type`), `sub_type`=VALUES(`sub_type`), `description`=VALUES(`description`), `type`=VALUES(`type`)
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
