// Data Storage & Persistence Utility using LocalStorage

const STORAGE_KEYS = {
  USERS: 'moneymatrix_users',
  ACTIVE_USER: 'moneymatrix_active_user',
  THEME: 'moneymatrix_theme',
};

// Initial Default Categories - Zero dummy data for fresh users
export const DEFAULT_CATEGORIES = [
  {
    "id": 1,
    "name": "CARGO/COURIER",
    "subcategory": "CARGO/COURIER",
    "category": "LOGISTICS",
    "division": "LIVING",
    "sub_type": "EMERGENCY",
    "transaction_type": "ACTUAL",
    "description": "Expenses incurred for courier services, parcel delivery, cargo transportation, or logistics support.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "LIVING",
    "net_type": "EMERGENCY",
    "info_type": "BOTH"
  },
  {
    "id": 2,
    "name": "HARDWARES & SERVICE",
    "subcategory": "HARDWARES & SERVICE",
    "category": "MAINTENANCE",
    "division": "MOBILITY",
    "sub_type": "EMERGENCY",
    "transaction_type": "ACTUAL",
    "description": "Expenses related to hardware purchases, repairs, maintenance, and technical servicing.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "MOBILITY",
    "net_type": "EMERGENCY",
    "info_type": "BOTH"
  },
  {
    "id": 3,
    "name": "PETROL",
    "subcategory": "PETROL",
    "category": "FUEL",
    "division": "MOBILITY",
    "sub_type": "NEEDS",
    "transaction_type": "ACTUAL",
    "description": "Fuel expenses incurred for personal or business vehicle usage.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "MOBILITY",
    "net_type": "NEEDS",
    "info_type": "BOTH"
  },
  {
    "id": 4,
    "name": "TRANSPORT",
    "subcategory": "TRANSPORT",
    "category": "COMMUTE",
    "division": "MOBILITY",
    "sub_type": "EMERGENCY",
    "transaction_type": "ACTUAL",
    "description": "Travel and commuting expenses including bus, train, taxi, auto, and similar transport services.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "MOBILITY",
    "net_type": "EMERGENCY",
    "info_type": "BOTH"
  },
  {
    "id": 5,
    "name": "EDUCATION FEES",
    "subcategory": "EDUCATION FEES",
    "category": "LEARNING",
    "division": "LIVING",
    "sub_type": "NEEDS",
    "transaction_type": "ACTUAL",
    "description": "Payments made towards tuition fees, courses, certifications, training, and educational programs.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "LIVING",
    "net_type": "NEEDS",
    "info_type": "BOTH"
  },
  {
    "id": 6,
    "name": "FOOD/SNACKS",
    "subcategory": "FOOD/SNACKS",
    "category": "DINING",
    "division": "LIVING",
    "sub_type": "NEEDS",
    "transaction_type": "ACTUAL",
    "description": "Expenses incurred for meals, snacks, beverages, and dining activities.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "LIVING",
    "net_type": "NEEDS",
    "info_type": "BOTH"
  },
  {
    "id": 7,
    "name": "GROCERIES",
    "subcategory": "GROCERIES",
    "category": "PROVISIONS",
    "division": "LIVING",
    "sub_type": "NEEDS",
    "transaction_type": "ACTUAL",
    "description": "Purchases of household food supplies and daily essential consumable items.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "LIVING",
    "net_type": "NEEDS",
    "info_type": "BOTH"
  },
  {
    "id": 8,
    "name": "GROOMING",
    "subcategory": "GROOMING",
    "category": "WELLNESS",
    "division": "LIVING",
    "sub_type": "NEEDS",
    "transaction_type": "ACTUAL",
    "description": "Personal care expenses such as salon services, cosmetics, toiletries, and grooming products.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "LIVING",
    "net_type": "NEEDS",
    "info_type": "BOTH"
  },
  {
    "id": 9,
    "name": "HOUSE HOLDS",
    "subcategory": "HOUSE HOLDS",
    "category": "HOUSEKEEPING",
    "division": "LIVING",
    "sub_type": "EMERGENCY",
    "transaction_type": "ACTUAL",
    "description": "Expenses related to household maintenance, cleaning supplies, and daily home essentials.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "LIVING",
    "net_type": "EMERGENCY",
    "info_type": "BOTH"
  },
  {
    "id": 10,
    "name": "MEDICAL",
    "subcategory": "MEDICAL",
    "category": "HEALTHCARE",
    "division": "LIVING",
    "sub_type": "EMERGENCY",
    "transaction_type": "ACTUAL",
    "description": "Healthcare expenses including consultation fees, medicines, treatments, and diagnostics.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "LIVING",
    "net_type": "EMERGENCY",
    "info_type": "BOTH"
  },
  {
    "id": 11,
    "name": "XEROX/STATIONERY",
    "subcategory": "XEROX/STATIONERY",
    "category": "ACADEMICS",
    "division": "LIVING",
    "sub_type": "EMERGENCY",
    "transaction_type": "ACTUAL",
    "description": "Expenses incurred for printing, photocopying, books, stationery, and educational supplies.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "LIVING",
    "net_type": "EMERGENCY",
    "info_type": "BOTH"
  },
  {
    "id": 12,
    "name": "EPFO",
    "subcategory": "EPFO",
    "category": "BENEFITS",
    "division": "EARNINGS",
    "sub_type": "INCOME",
    "transaction_type": "ACTUAL",
    "description": "Income received from employee provident fund withdrawals, settlements, or benefits.",
    "suffix": "CR",
    "type": "Cr",
    "group_type": "EARNINGS",
    "net_type": "INCOME",
    "info_type": "BOTH"
  },
  {
    "id": 13,
    "name": "GIFT AMOUNT",
    "subcategory": "GIFT AMOUNT",
    "category": "REWARDS",
    "division": "EARNINGS",
    "sub_type": "INCOME",
    "transaction_type": "ACTUAL",
    "description": "Monetary gifts, rewards, incentives, or financial assistance received.",
    "suffix": "CR",
    "type": "Cr",
    "group_type": "EARNINGS",
    "net_type": "INCOME",
    "info_type": "BOTH"
  },
  {
    "id": 14,
    "name": "LD SALARY/INCOME",
    "subcategory": "LD SALARY/INCOME",
    "category": "PAYROLL",
    "division": "EARNINGS",
    "sub_type": "INCOME",
    "transaction_type": "ACTUAL",
    "description": "Income received from freelance work, side projects, incentives, or other salary-related earnings.",
    "suffix": "CR",
    "type": "Cr",
    "group_type": "EARNINGS",
    "net_type": "INCOME",
    "info_type": "BOTH"
  },
  {
    "id": 15,
    "name": "PFM",
    "subcategory": "PFM",
    "category": "BENEFITS",
    "division": "EARNINGS",
    "sub_type": "INCOME",
    "transaction_type": "ACTUAL",
    "description": "Income or benefits received from employer-sponsored funds, incentives, or welfare schemes.",
    "suffix": "CR",
    "type": "Cr",
    "group_type": "EARNINGS",
    "net_type": "INCOME",
    "info_type": "BOTH"
  },
  {
    "id": 16,
    "name": "SALARY",
    "subcategory": "SALARY",
    "category": "PAYROLL",
    "division": "EARNINGS",
    "sub_type": "INCOME",
    "transaction_type": "ACTUAL",
    "description": "Regular salary or compensation received from employment.",
    "suffix": "CR",
    "type": "Cr",
    "group_type": "EARNINGS",
    "net_type": "INCOME",
    "info_type": "BOTH"
  },
  {
    "id": 17,
    "name": "BIKE/CAR INSURANCE",
    "subcategory": "BIKE/CAR INSURANCE",
    "category": "VEHICLE COVER",
    "division": "PROTECTION",
    "sub_type": "NEEDS",
    "transaction_type": "ACTUAL",
    "description": "Premium payments made for motor vehicle insurance coverage.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "PROTECTION",
    "net_type": "NEEDS",
    "info_type": "BOTH"
  },
  {
    "id": 18,
    "name": "HEALTH INSURANCE",
    "subcategory": "HEALTH INSURANCE",
    "category": "MEDICAL COVER",
    "division": "PROTECTION",
    "sub_type": "NEEDS",
    "transaction_type": "ACTUAL",
    "description": "Premium payments made for health and medical insurance policies.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "PROTECTION",
    "net_type": "NEEDS",
    "info_type": "BOTH"
  },
  {
    "id": 19,
    "name": "TERM/LIFE INSURANCE",
    "subcategory": "TERM/LIFE INSURANCE",
    "category": "LIFE COVER",
    "division": "PROTECTION",
    "sub_type": "NEEDS",
    "transaction_type": "ACTUAL",
    "description": "Premium payments made for life insurance and term protection plans.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "PROTECTION",
    "net_type": "NEEDS",
    "info_type": "BOTH"
  },
  {
    "id": 20,
    "name": "EQUITY STOCK",
    "subcategory": "EQUITY STOCK",
    "category": "EQUITY",
    "division": "WEALTH",
    "sub_type": "ASSETS",
    "transaction_type": "ACTUAL",
    "description": "Investments made in listed or unlisted company shares and stocks.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "WEALTH",
    "net_type": "ASSETS",
    "info_type": "BOTH"
  },
  {
    "id": 21,
    "name": "FIXED DEPOSIT",
    "subcategory": "FIXED DEPOSIT",
    "category": "DEPOSIT",
    "division": "WEALTH",
    "sub_type": "ASSETS",
    "transaction_type": "ACTUAL",
    "description": "Funds deposited in fixed-income deposit schemes with financial institutions.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "WEALTH",
    "net_type": "ASSETS",
    "info_type": "BOTH"
  },
  {
    "id": 22,
    "name": "LIQUID FUND",
    "subcategory": "LIQUID FUND",
    "category": "LIQUIDITY",
    "division": "WEALTH",
    "sub_type": "ASSETS",
    "transaction_type": "ACTUAL",
    "description": "Investments made in highly liquid mutual funds or cash-equivalent instruments.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "WEALTH",
    "net_type": "ASSETS",
    "info_type": "BOTH"
  },
  {
    "id": 23,
    "name": "MUTUAL FUND",
    "subcategory": "MUTUAL FUND",
    "category": "FUNDING",
    "division": "WEALTH",
    "sub_type": "ASSETS",
    "transaction_type": "ACTUAL",
    "description": "Investments made through mutual fund schemes for wealth creation.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "WEALTH",
    "net_type": "ASSETS",
    "info_type": "BOTH"
  },
  {
    "id": 24,
    "name": "PPF/SIP",
    "subcategory": "PPF/SIP",
    "category": "RETIREMENT",
    "division": "WEALTH",
    "sub_type": "ASSETS",
    "transaction_type": "ACTUAL",
    "description": "Contributions made towards Public Provident Fund or Systematic Investment Plans.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "WEALTH",
    "net_type": "ASSETS",
    "info_type": "BOTH"
  },
  {
    "id": 25,
    "name": "RECURRING DEPOSIT",
    "subcategory": "RECURRING DEPOSIT",
    "category": "SAVINGS",
    "division": "WEALTH",
    "sub_type": "ASSETS",
    "transaction_type": "ACTUAL",
    "description": "Periodic savings deposits made under recurring deposit schemes.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "WEALTH",
    "net_type": "ASSETS",
    "info_type": "BOTH"
  },
  {
    "id": 26,
    "name": "RETURNS OF INVESTMENT",
    "subcategory": "RETURNS OF INVESTMENT",
    "category": "MATURITY",
    "division": "WEALTH",
    "sub_type": "INCOME",
    "transaction_type": "ACTUAL",
    "description": "Income received from investments through redemption, maturity, dividends, or gains.",
    "suffix": "CR",
    "type": "Cr",
    "group_type": "WEALTH",
    "net_type": "INCOME",
    "info_type": "BOTH"
  },
  {
    "id": 27,
    "name": "AMUSEMENT PARKS",
    "subcategory": "AMUSEMENT PARKS",
    "category": "RECREATION",
    "division": "LIFESTYLE",
    "sub_type": "WANTS",
    "transaction_type": "ACTUAL",
    "description": "Expenses incurred for amusement parks, recreational activities, and leisure outings.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "LIFESTYLE",
    "net_type": "WANTS",
    "info_type": "BOTH"
  },
  {
    "id": 28,
    "name": "APPAREL & ACCESSORIES",
    "subcategory": "APPAREL & ACCESSORIES",
    "category": "FASHION",
    "division": "LIFESTYLE",
    "sub_type": "NEEDS",
    "transaction_type": "ACTUAL",
    "description": "Purchases of clothing, footwear, fashion accessories, and related items.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "LIFESTYLE",
    "net_type": "NEEDS",
    "info_type": "BOTH"
  },
  {
    "id": 29,
    "name": "CONTRIBUTION/GIFTS/CHARITY",
    "subcategory": "CONTRIBUTION/GIFTS/CHARITY",
    "category": "PHILANTHROPY",
    "division": "LIFESTYLE",
    "sub_type": "EMERGENCY",
    "transaction_type": "ACTUAL",
    "description": "Expenses incurred towards donations, charity, gifts, and social contributions.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "LIFESTYLE",
    "net_type": "EMERGENCY",
    "info_type": "BOTH"
  },
  {
    "id": 30,
    "name": "ELECTRONICS",
    "subcategory": "ELECTRONICS",
    "category": "GADGETS",
    "division": "LIFESTYLE",
    "sub_type": "WANTS",
    "transaction_type": "ACTUAL",
    "description": "Purchases of electronic devices, gadgets, accessories, and related equipment.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "LIFESTYLE",
    "net_type": "WANTS",
    "info_type": "BOTH"
  },
  {
    "id": 31,
    "name": "MOVIE",
    "subcategory": "MOVIE",
    "category": "MEDIA",
    "division": "LIFESTYLE",
    "sub_type": "WANTS",
    "transaction_type": "ACTUAL",
    "description": "Expenses incurred for movies, theatres, OTT rentals, and entertainment content.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "LIFESTYLE",
    "net_type": "WANTS",
    "info_type": "BOTH"
  },
  {
    "id": 32,
    "name": "POJAI ITEMS",
    "subcategory": "POJAI ITEMS",
    "category": "SPIRITUAL",
    "division": "LIFESTYLE",
    "sub_type": "WANTS",
    "transaction_type": "ACTUAL",
    "description": "Purchases related to religious activities, pooja materials, and devotional offerings.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "LIFESTYLE",
    "net_type": "WANTS",
    "info_type": "BOTH"
  },
  {
    "id": 33,
    "name": "LD PAYROLL",
    "subcategory": "LD PAYROLL",
    "category": "DEDUCTION",
    "division": "COMPLIANCE",
    "sub_type": "REPAYMENTS",
    "transaction_type": "ACTUAL",
    "description": "Salary-related deductions, employer recoveries, or payroll adjustments.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "COMPLIANCE",
    "net_type": "REPAYMENTS",
    "info_type": "BOTH"
  },
  {
    "id": 34,
    "name": "PENALITIES",
    "subcategory": "PENALITIES",
    "category": "PENALTY",
    "division": "COMPLIANCE",
    "sub_type": "EMERGENCY",
    "transaction_type": "ACTUAL",
    "description": "Expenses incurred due to fines, penalties, late fees, or regulatory charges.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "COMPLIANCE",
    "net_type": "EMERGENCY",
    "info_type": "BOTH"
  },
  {
    "id": 35,
    "name": "TAX RECEIPTS",
    "subcategory": "TAX RECEIPTS",
    "category": "TAXATION",
    "division": "COMPLIANCE",
    "sub_type": "NEEDS",
    "transaction_type": "ACTUAL",
    "description": "Payments made towards taxes, government levies, duties, and statutory charges.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "COMPLIANCE",
    "net_type": "NEEDS",
    "info_type": "BOTH"
  },
  {
    "id": 36,
    "name": "TOLLS FEE",
    "subcategory": "TOLLS FEE",
    "category": "TOLLING",
    "division": "COMPLIANCE",
    "sub_type": "NEEDS",
    "transaction_type": "ACTUAL",
    "description": "Payments made for toll roads, bridge tolls, and transportation access charges.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "COMPLIANCE",
    "net_type": "NEEDS",
    "info_type": "BOTH"
  },
  {
    "id": 37,
    "name": "BROADBAND RECHARGE",
    "subcategory": "BROADBAND RECHARGE",
    "category": "INTERNET",
    "division": "SERVICES",
    "sub_type": "NEEDS",
    "transaction_type": "ACTUAL",
    "description": "Expenses incurred for broadband, internet, and home network services.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "SERVICES",
    "net_type": "NEEDS",
    "info_type": "BOTH"
  },
  {
    "id": 38,
    "name": "DIGITAL SUBSCRIPTIONS",
    "subcategory": "DIGITAL SUBSCRIPTIONS",
    "category": "SUBSCRIPTION",
    "division": "SERVICES",
    "sub_type": "WANTS",
    "transaction_type": "ACTUAL",
    "description": "Payments for digital services, OTT platforms, software subscriptions, and memberships.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "SERVICES",
    "net_type": "WANTS",
    "info_type": "BOTH"
  },
  {
    "id": 39,
    "name": "EB BILL",
    "subcategory": "EB BILL",
    "category": "ELECTRICITY",
    "division": "SERVICES",
    "sub_type": "NEEDS",
    "transaction_type": "ACTUAL",
    "description": "Payments made towards electricity consumption and utility charges.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "SERVICES",
    "net_type": "NEEDS",
    "info_type": "BOTH"
  },
  {
    "id": 40,
    "name": "GAS BILL",
    "subcategory": "GAS BILL",
    "category": "COOKING GAS",
    "division": "SERVICES",
    "sub_type": "NEEDS",
    "transaction_type": "ACTUAL",
    "description": "Payments made for cooking gas cylinders or piped gas services.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "SERVICES",
    "net_type": "NEEDS",
    "info_type": "BOTH"
  },
  {
    "id": 41,
    "name": "HOUSE/ROOM RENT",
    "subcategory": "HOUSE/ROOM RENT",
    "category": "HOUSING",
    "division": "SERVICES",
    "sub_type": "NEEDS",
    "transaction_type": "ACTUAL",
    "description": "Rental payments made for residential accommodation or leased premises.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "SERVICES",
    "net_type": "NEEDS",
    "info_type": "BOTH"
  },
  {
    "id": 42,
    "name": "MOBILE RECHARGE",
    "subcategory": "MOBILE RECHARGE",
    "category": "TELECOM",
    "division": "SERVICES",
    "sub_type": "NEEDS",
    "transaction_type": "ACTUAL",
    "description": "Expenses incurred for mobile plans, talk time, data packs, and telecom services.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "SERVICES",
    "net_type": "NEEDS",
    "info_type": "BOTH"
  },
  {
    "id": 43,
    "name": "TV RECHARGE",
    "subcategory": "TV RECHARGE",
    "category": "ENTERTAINMENT SERVICE",
    "division": "SERVICES",
    "sub_type": "WANTS",
    "transaction_type": "ACTUAL",
    "description": "Payments made for television subscriptions, DTH services, and cable connections.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "SERVICES",
    "net_type": "WANTS",
    "info_type": "BOTH"
  },
  {
    "id": 44,
    "name": "WATER BILL",
    "subcategory": "WATER BILL",
    "category": "WATER SUPPLY",
    "division": "SERVICES",
    "sub_type": "NEEDS",
    "transaction_type": "ACTUAL",
    "description": "Payments made towards water supply and utility consumption charges.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "SERVICES",
    "net_type": "NEEDS",
    "info_type": "BOTH"
  },
  {
    "id": 45,
    "name": "Liability Received",
    "subcategory": "Liability Received",
    "category": "ADVANCE",
    "division": "FINANCING",
    "sub_type": "LOANS",
    "transaction_type": "COMPENSATIONAL",
    "description": "Friend gives ₹5,000 to book a mobile; later you either buy and hand over the mobile or return the money.",
    "suffix": "CR",
    "type": "Cr",
    "group_type": "FINANCING",
    "net_type": "LOANS",
    "info_type": "BOTH"
  },
  {
    "id": 46,
    "name": "Liability Payable",
    "subcategory": "Liability Payable",
    "category": "BORROWING",
    "division": "FINANCING",
    "sub_type": "LEVERAGE",
    "transaction_type": "COMPENSATIONAL",
    "description": "Friend pays ₹5,000 for your hotel booking; you owe him ₹5,000 later.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "FINANCING",
    "net_type": "LEVERAGE",
    "info_type": "BOTH"
  },
  {
    "id": 47,
    "name": "LOAN",
    "subcategory": "LOAN",
    "category": "FUNDING",
    "division": "FINANCING",
    "sub_type": "LOANS",
    "transaction_type": "COMPENSATIONAL",
    "description": "Funds received as a loan from financial institutions, friends, family, or other lenders.",
    "suffix": "CR",
    "type": "Cr",
    "group_type": "FINANCING",
    "net_type": "LOANS",
    "info_type": "BOTH"
  },
  {
    "id": 48,
    "name": "LOAN RECOLLECTION",
    "subcategory": "LOAN RECOLLECTION",
    "category": "RECOVERY",
    "division": "FINANCING",
    "sub_type": "INCOME",
    "transaction_type": "COMPENSATIONAL",
    "description": "Amounts recovered from previously issued loans or advances.",
    "suffix": "CR",
    "type": "Cr",
    "group_type": "FINANCING",
    "net_type": "INCOME",
    "info_type": "BOTH"
  },
  {
    "id": 49,
    "name": "LOAN REPAYMENT",
    "subcategory": "LOAN REPAYMENT",
    "category": "SETTLEMENT",
    "division": "FINANCING",
    "sub_type": "REPAYMENTS",
    "transaction_type": "COMPENSATIONAL",
    "description": "Payments made towards repayment of loan principal or borrowed amounts.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "FINANCING",
    "net_type": "REPAYMENTS",
    "info_type": "BOTH"
  },
  {
    "id": 50,
    "name": "LOAN TO OTHERS",
    "subcategory": "LOAN TO OTHERS",
    "category": "LENDING",
    "division": "FINANCING",
    "sub_type": "RECEIVABLES",
    "transaction_type": "COMPENSATIONAL",
    "description": "Funds lent to other individuals or entities with an expectation of repayment.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "FINANCING",
    "net_type": "RECEIVABLES",
    "info_type": "BOTH"
  },
  {
    "id": 51,
    "name": "REIMBURSABLE",
    "subcategory": "REIMBURSABLE",
    "category": "REIMBURSEMENT",
    "division": "FINANCING",
    "sub_type": "RECEIVABLES",
    "transaction_type": "COMPENSATIONAL",
    "description": "Expenses incurred on behalf of others that are expected to be reimbursed.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "FINANCING",
    "net_type": "RECEIVABLES",
    "info_type": "BOTH"
  },
  {
    "id": 52,
    "name": "REIMBURSMENT CLAIM",
    "subcategory": "REIMBURSMENT CLAIM",
    "category": "CLAIM",
    "division": "FINANCING",
    "sub_type": "INCOME",
    "transaction_type": "COMPENSATIONAL",
    "description": "Amounts received against reimbursement claims for prior expenses.",
    "suffix": "CR",
    "type": "Cr",
    "group_type": "FINANCING",
    "net_type": "INCOME",
    "info_type": "BOTH"
  },
  {
    "id": 53,
    "name": "CC BILL LOAN",
    "subcategory": "CC BILL LOAN",
    "category": "CC FUNDING",
    "division": "ROTATIONS",
    "sub_type": "LOANS",
    "transaction_type": "ROTATIONAL",
    "description": "Credit card bill amounts converted into loans or financed repayment arrangements.",
    "suffix": "CR",
    "type": "Cr",
    "group_type": "ROTATIONS",
    "net_type": "LOANS",
    "info_type": "BOTH"
  },
  {
    "id": 54,
    "name": "CC BILL PAYMENT",
    "subcategory": "CC BILL PAYMENT",
    "category": "CC PAYMENT",
    "division": "ROTATIONS",
    "sub_type": "REPAYMENTS",
    "transaction_type": "ROTATIONAL",
    "description": "Payments made towards outstanding credit card bills and dues.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "ROTATIONS",
    "net_type": "REPAYMENTS",
    "info_type": "BOTH"
  },
  {
    "id": 55,
    "name": "CC CASHOUT",
    "subcategory": "CC CASHOUT",
    "category": "CC WITHDRAWAL",
    "division": "ROTATIONS",
    "sub_type": "LOANS",
    "transaction_type": "ROTATIONAL",
    "description": "Cash withdrawn or transferred using available credit card limits.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "ROTATIONS",
    "net_type": "LOANS",
    "info_type": "BOTH"
  },
  {
    "id": 56,
    "name": "CC ROTATION IN",
    "subcategory": "CC ROTATION IN",
    "category": "CC INFLOW",
    "division": "ROTATIONS",
    "sub_type": "LEVERAGE",
    "transaction_type": "ROTATIONAL",
    "description": "Incoming funds received as part of a credit card rotation or rollover arrangement.",
    "suffix": "CR",
    "type": "Cr",
    "group_type": "ROTATIONS",
    "net_type": "LEVERAGE",
    "info_type": "BOTH"
  },
  {
    "id": 57,
    "name": "CC ROTATION OUT",
    "subcategory": "CC ROTATION OUT",
    "category": "CC OUTFLOW",
    "division": "ROTATIONS",
    "sub_type": "LEVERAGE",
    "transaction_type": "ROTATIONAL",
    "description": "Outgoing funds transferred as part of a credit card rotation or rollover arrangement.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "ROTATIONS",
    "net_type": "LEVERAGE",
    "info_type": "BOTH"
  },
  {
    "id": 58,
    "name": "CC SETTLEMENT",
    "subcategory": "CC SETTLEMENT",
    "category": "CC CLOSURE",
    "division": "ROTATIONS",
    "sub_type": "REPAYMENTS",
    "transaction_type": "ROTATIONAL",
    "description": "Payments made to settle or close outstanding credit card balances.",
    "suffix": "CR",
    "type": "Cr",
    "group_type": "ROTATIONS",
    "net_type": "REPAYMENTS",
    "info_type": "BOTH"
  },
  {
    "id": 59,
    "name": "ATM CASH IN",
    "subcategory": "ATM CASH IN",
    "category": "CASH DEPOSIT",
    "division": "INTERNAL",
    "sub_type": "INTERNAL",
    "transaction_type": "ROTATIONAL",
    "description": "Cash deposited into bank accounts through ATM or self-service channels.",
    "suffix": "CR",
    "type": "Cr",
    "group_type": "INTERNAL",
    "net_type": "INTERNAL",
    "info_type": "BOTH"
  },
  {
    "id": 60,
    "name": "ATM CASH OUT",
    "subcategory": "ATM CASH OUT",
    "category": "CASH WITHDRAWAL",
    "division": "INTERNAL",
    "sub_type": "INTERNAL",
    "transaction_type": "ROTATIONAL",
    "description": "Cash withdrawn from bank accounts using ATM facilities.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "INTERNAL",
    "net_type": "INTERNAL",
    "info_type": "BOTH"
  },
  {
    "id": 61,
    "name": "REFUND CASHBACK",
    "subcategory": "REFUND CASHBACK",
    "category": "CASHBACK",
    "division": "INTERNAL",
    "sub_type": "INCOME",
    "transaction_type": "ROTATIONAL",
    "description": "Cashback rewards, promotional credits, or refunds received from transactions.",
    "suffix": "CR",
    "type": "Cr",
    "group_type": "INTERNAL",
    "net_type": "INCOME",
    "info_type": "BOTH"
  },
  {
    "id": 62,
    "name": "SELF TRANSFER IN",
    "subcategory": "SELF TRANSFER IN",
    "category": "TRANSFER IN",
    "division": "INTERNAL",
    "sub_type": "INTERNAL",
    "transaction_type": "ROTATIONAL",
    "description": "Funds transferred into an account from another self-owned account.",
    "suffix": "CR",
    "type": "Cr",
    "group_type": "INTERNAL",
    "net_type": "INTERNAL",
    "info_type": "BOTH"
  },
  {
    "id": 63,
    "name": "SELF TRANSFER OUT",
    "subcategory": "SELF TRANSFER OUT",
    "category": "TRANSFER OUT",
    "division": "INTERNAL",
    "sub_type": "INTERNAL",
    "transaction_type": "ROTATIONAL",
    "description": "Funds transferred from an account to another self-owned account.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "INTERNAL",
    "net_type": "INTERNAL",
    "info_type": "BOTH"
  },
  {
    "id": 64,
    "name": "TEST SWIPE",
    "subcategory": "TEST SWIPE",
    "category": "TESTING",
    "division": "INTERNAL",
    "sub_type": "INTERNAL",
    "transaction_type": "ROTATIONAL",
    "description": "Test, verification, or temporary transactions performed for validation purposes.",
    "suffix": "DR",
    "type": "Dr",
    "group_type": "INTERNAL",
    "net_type": "INTERNAL",
    "info_type": "BOTH"
  }
];

export const DEFAULT_BUDGETS = [
  {
    "code": "B001",
    "name": "Home Budget",
    "description": "Household, groceries, provisions, cleaning, home upkeep",
    "category_group": "LIVING"
  },
  {
    "code": "B002",
    "name": "Food Budget",
    "description": "Dining out, snacks, beverages, social meals, food delivery",
    "category_group": "LIVING"
  },
  {
    "code": "B003",
    "name": "Travel Budget",
    "description": "Daily commute, petrol, tolls, vehicle transit, outstation trips",
    "category_group": "MOBILITY"
  },
  {
    "code": "B004",
    "name": "Utility Budget",
    "description": "Electricity, water, cooking gas, telecom, broadband, routine services",
    "category_group": "SERVICES"
  },
  {
    "code": "B005",
    "name": "Healthcare Budget",
    "description": "Medical consultations, pharmacy, diagnostic tests, treatments",
    "category_group": "LIVING"
  },
  {
    "code": "B006",
    "name": "Lifestyle Budget",
    "description": "Entertainment, gadgets, movies, recreation, fashion, hobbies",
    "category_group": "LIFESTYLE"
  },
  {
    "code": "B007",
    "name": "Investment Budget",
    "description": "Equity, mutual funds, SIP, fixed deposits, gold, long-term wealth",
    "category_group": "WEALTH"
  },
  {
    "code": "B008",
    "name": "Emergency Budget",
    "description": "Contingencies, urgent hospital visits, unforeseen repairs",
    "category_group": "PROTECTION"
  }
];
export const DEFAULT_COST_CENTERS = [
  {
    "code": "CC001",
    "name": "Self",
    "description": "Personal expenses and consumption directly by self"
  },
  {
    "code": "CC002",
    "name": "Parents",
    "description": "Expenses consumed for or by parents / elders"
  },
  {
    "code": "CC003",
    "name": "Home",
    "description": "Expenses consumed for household property and maintenance"
  },
  {
    "code": "CC004",
    "name": "Vehicle",
    "description": "Expenses consumed by car, bike, mobility assets"
  },
  {
    "code": "CC005",
    "name": "Education",
    "description": "Expenses consumed for learning, courses, certifications"
  },
  {
    "code": "CC006",
    "name": "Health",
    "description": "Expenses consumed for personal and family health treatments"
  },
  {
    "code": "CC007",
    "name": "Business",
    "description": "Expenses consumed for professional, freelance, client work"
  },
  {
    "code": "CC008",
    "name": "Travel",
    "description": "Expenses consumed for vacation trips, tours, logistics"
  }
];
export const DEFAULT_PROFIT_CENTERS = [
  {
    "code": "PC001",
    "name": "Salary",
    "description": "Income from primary regular employment and salary payroll"
  },
  {
    "code": "PC002",
    "name": "Freelancing",
    "description": "Income from side consulting, freelance contracts, client projects"
  },
  {
    "code": "PC003",
    "name": "Investments",
    "description": "Income from dividends, capital gains, interest returns"
  },
  {
    "code": "PC004",
    "name": "Business",
    "description": "Income from commercial activities and enterprise sales"
  },
  {
    "code": "PC005",
    "name": "Rental Income",
    "description": "Income from leased property, real estate, equipment"
  },
  {
    "code": "PC006",
    "name": "Cashback & Rewards",
    "description": "Income from transaction cashbacks, rewards, referral bonuses"
  }
];
export const DEFAULT_PROJECTS = [
  {
    "code": "PR001",
    "name": "Goa Trip",
    "description": "Leisure vacation and travel trip"
  },
  {
    "code": "PR002",
    "name": "Money Matrix",
    "description": "Personal finance and enterprise dashboard software"
  },
  {
    "code": "PR003",
    "name": "Bike Purchase",
    "description": "Capital asset acquisition and down payment"
  },
  {
    "code": "PR004",
    "name": "Home Renovation",
    "description": "Interior improvements, painting, furniture upgrading"
  },
  {
    "code": "PR005",
    "name": "AIOS",
    "description": "AI operating system and automation development"
  }
];


// Helper to get Today's Date formatted YYYY-MM-DD
export function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Initial Sample Transactions - Zero dummy data for fresh users
const DEFAULT_TRANSACTIONS = [];

// User Account Management API
export function getUsers() {
  try {
    const mmUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (mmUsers) return JSON.parse(mmUsers) || [];
    const ctUsers = localStorage.getItem('cashtracker_users');
    if (ctUsers) return JSON.parse(ctUsers) || [];
    return [];
  } catch (e) {
    return [];
  }
}

export function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function getCurrentUser() {
  const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER) || localStorage.getItem('cashtracker_active_user');
  if (!activeId) return null;
  const users = getUsers();
  const matched = users.find((u) => String(u.id) === String(activeId));
  if (matched) return matched;
  return { id: Number(activeId) || activeId, name: 'Personal User', username: 'user', role: 'user' };
}

export function registerUser({ name, username, password }) {
  const users = getUsers();
  const trimmedUsername = username.trim().toLowerCase();

  if (users.some((u) => u.username.toLowerCase() === trimmedUsername)) {
    return { success: false, error: 'Username is already registered.' };
  }

  const newUser = {
    id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: name.trim(),
    username: trimmedUsername,
    password: password,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  // Initialize sample categories & transactions for the new account
  localStorage.setItem(`moneymatrix_categories_${newUser.id}`, JSON.stringify(DEFAULT_CATEGORIES));
  localStorage.setItem(`moneymatrix_transactions_${newUser.id}`, JSON.stringify(DEFAULT_TRANSACTIONS));

  // Set active session
  localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, newUser.id);
  return { success: true, user: newUser };
}

export function loginUser(username, password) {
  const users = getUsers();
  const trimmedUsername = username.trim().toLowerCase();
  const user = users.find((u) => u.username.toLowerCase() === trimmedUsername && u.password === password);

  if (!user) {
    return { success: false, error: 'Invalid username or password.' };
  }

  localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, user.id);
  return { success: true, user };
}

export function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
  localStorage.removeItem('cashtracker_active_user');
}

// PIN Storage Helpers
export function getStoredPin() {
  const user = getCurrentUser();
  if (!user) return null;
  return localStorage.getItem(`moneymatrix_pin_${user.id}`) || localStorage.getItem(`cashtracker_pin_${user.id}`);
}

export function setStoredPin(pin) {
  const user = getCurrentUser();
  if (!user) return;
  if (pin) {
    localStorage.setItem(`moneymatrix_pin_${user.id}`, pin);
  } else {
    localStorage.removeItem(`moneymatrix_pin_${user.id}`);
    localStorage.removeItem(`cashtracker_pin_${user.id}`);
  }
}

// User-Scoped Storage Helpers
function getUserCategoriesKey(userId) {
  return `moneymatrix_categories_${userId}`;
}

function getUserTransactionsKey(userId) {
  return `moneymatrix_transactions_${userId}`;
}

// Categories API
export function getCategories() {
  const user = getCurrentUser();
  if (!user) return DEFAULT_CATEGORIES;
  const key = getUserCategoriesKey(user.id);
  try {
    const data = localStorage.getItem(key) || localStorage.getItem(`cashtracker_categories_${user.id}`);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(data) || DEFAULT_CATEGORIES;
  } catch (e) {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories) {
  const user = getCurrentUser();
  if (!user) return;
  localStorage.setItem(getUserCategoriesKey(user.id), JSON.stringify(categories));
}

export function addCategory(category) {
  const categories = getCategories();
  const newCat = {
    id: `cat_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    ...category,
  };
  categories.push(newCat);
  saveCategories(categories);
  return newCat;
}

export function deleteCategory(id) {
  let categories = getCategories();
  categories = categories.filter((c) => c.id !== id);
  saveCategories(categories);
}

// Transactions API
export function getTransactions() {
  const user = getCurrentUser();
  if (!user) return DEFAULT_TRANSACTIONS;
  const key = getUserTransactionsKey(user.id);
  try {
    const data = localStorage.getItem(key) || localStorage.getItem(`cashtracker_transactions_${user.id}`);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_TRANSACTIONS));
      return DEFAULT_TRANSACTIONS;
    }
    return JSON.parse(data) || DEFAULT_TRANSACTIONS;
  } catch (e) {
    return DEFAULT_TRANSACTIONS;
  }
}

export function saveTransactions(transactions) {
  const user = getCurrentUser();
  if (!user) return;
  localStorage.setItem(getUserTransactionsKey(user.id), JSON.stringify(transactions));
}

export function addTransaction(transaction) {
  const transactions = getTransactions();
  const newTx = {
    id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    ...transaction,
  };
  transactions.unshift(newTx);
  saveTransactions(transactions);
  return newTx;
}

export function addBulkTransactions(newTransactions) {
  const transactions = getTransactions();
  const formatted = newTransactions.map((tx, idx) => ({
    id: `tx_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
    ...tx,
  }));
  const updated = [...formatted, ...transactions];
  saveTransactions(updated);
  return updated;
}

export function updateTransaction(updatedTx) {
  let transactions = getTransactions();
  transactions = transactions.map((tx) => (tx.id === updatedTx.id ? updatedTx : tx));
  saveTransactions(transactions);
}

export function deleteTransaction(id) {
  let transactions = getTransactions();
  transactions = transactions.filter((tx) => tx.id !== id);
  saveTransactions(transactions);
}

// Backup & Reset API
export function exportFullDataJSON() {
  const data = {
    User: getCurrentUser(),
    Categories: getCategories(),
    Transactions: getTransactions(),
  };
  return JSON.stringify(data, null, 2);
}

export function importFullDataJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.Categories && Array.isArray(data.Categories)) {
      saveCategories(data.Categories);
    }
    if (data.Transactions && Array.isArray(data.Transactions)) {
      saveTransactions(data.Transactions);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function resetToSampleData() {
  resetToEmptyData();
}

export function resetToEmptyData() {
  const user = getCurrentUser();
  const uid = user ? user.id : '2';

  // Wipe all user-scoped data from localStorage
  const keysToRemove = [
    getUserCategoriesKey(uid),
    getUserTransactionsKey(uid),
    `cashtracker_transactions_${uid}`,
    `cashtracker_categories_${uid}`,
    `moneymatrix_accounts_${uid}`,
    `moneymatrix_holdings_${uid}`,
    `moneymatrix_career_${uid}`,
    `moneymatrix_loans_${uid}`,
    `moneymatrix_apar_${uid}`,
    `moneymatrix_closing_yearly_${uid}`,
    `moneymatrix_closing_monthly_${uid}`,
    `moneymatrix_closing_daily_${uid}`
  ];

  keysToRemove.forEach(k => {
    try { localStorage.removeItem(k); } catch (e) {}
  });

  localStorage.removeItem('cashtracker_transactions');
  localStorage.removeItem('moneymatrix_transactions');
  localStorage.removeItem('cashtracker_categories');
  localStorage.removeItem('moneymatrix_categories');

  // Reset accounts to default empty Cash_1 with balance 0.00
  const emptyAccounts = [
    { id: 1, name: 'Cash_1 (Physical Cash)', code: 'Cash_1', type: 'Cash Account', dump_type: 'FINANCE', balance: 0.00, status: 'active', txCount: 0 }
  ];
  saveAccounts(emptyAccounts);
  saveCategories([]);
  saveTransactions([]);

  // Dispatch global window event so listening views sync immediately
  try {
    window.dispatchEvent(new CustomEvent('moneymatrix_data_reset'));
  } catch (e) {}
}

// Local Accounts storage helper
function getUserAccountsKey(userId) {
  return `moneymatrix_accounts_${userId || 'guest'}`;
}

export function getAccounts() {
  const user = getCurrentUser();
  try {
    const data = localStorage.getItem(getUserAccountsKey(user?.id));
    if (data) return JSON.parse(data);
  } catch (e) {}
  return [
    { id: 1, name: 'Cash_1 (Physical Cash)', code: 'Cash_1', type: 'Cash Account', dump_type: 'FINANCE', balance: 0.00, status: 'active', txCount: 0 }
  ];
}

export function saveAccounts(accounts) {
  const user = getCurrentUser();
  localStorage.setItem(getUserAccountsKey(user?.id), JSON.stringify(accounts));
}

export function addAccount(account) {
  const accounts = getAccounts();
  const code = account.code || account.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  const existingIdx = accounts.findIndex(a => a.code.toLowerCase() === code.toLowerCase());
  const newAcc = {
    id: account.id || Date.now(),
    name: account.name,
    code: code,
    type: account.type || 'Savings Account',
    dump_type: account.dump_type || 'FINANCE',
    balance: Number(account.initialBalance || account.balance || 0),
    status: account.status || 'active',
    txCount: 0,
    createdAt: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    accounts[existingIdx] = { ...accounts[existingIdx], ...newAcc };
  } else {
    accounts.push(newAcc);
  }
  saveAccounts(accounts);
  return newAcc;
}

export function addBulkAccounts(accountsList = []) {
  accountsList.forEach(a => addAccount(a));
  return { success: true, count: accountsList.length };
}

export function updateAccount(account) {
  const accounts = getAccounts();
  const idx = accounts.findIndex(a => a.id === account.id || a.code === account.code);
  if (idx >= 0) {
    accounts[idx] = { ...accounts[idx], ...account };
    saveAccounts(accounts);
  }
  return { success: true };
}

export function deleteAccount(id) {
  let accounts = getAccounts();
  accounts = accounts.filter(a => a.id !== id && a.code !== id);
  saveAccounts(accounts);
  return { success: true };
}


// Management Masters API (Budgets, Cost Centers, Profit Centers, Projects)
function getUserMastersKey(userId, type) {
  return `moneymatrix_master_${type}_${userId || 'default'}`;
}

export function getBudgetMasters() {
  const user = getCurrentUser();
  try {
    const data = localStorage.getItem(getUserMastersKey(user?.id, 'budgets'));
    if (data) return JSON.parse(data);
  } catch (e) {}
  return DEFAULT_BUDGETS;
}

export function saveBudgetMasters(items) {
  const user = getCurrentUser();
  localStorage.setItem(getUserMastersKey(user?.id, 'budgets'), JSON.stringify(items));
}

export function addBudgetMaster(item) {
  const list = getBudgetMasters();
  const newItem = {
    id: item.id || Date.now(),
    code: item.code || `B${String(list.length + 1).padStart(3, '0')}`,
    name: item.name,
    description: item.description || '',
    category_group: item.category_group || 'LIVING',
    status: item.status || 'active'
  };
  list.push(newItem);
  saveBudgetMasters(list);
  return newItem;
}

export function updateBudgetMaster(item) {
  let list = getBudgetMasters();
  list = list.map(i => (i.id === item.id || i.code === item.code ? { ...i, ...item } : i));
  saveBudgetMasters(list);
  return { success: true };
}

export function deleteBudgetMaster(id) {
  let list = getBudgetMasters();
  list = list.filter(i => i.id !== id && i.code !== id);
  saveBudgetMasters(list);
  return { success: true };
}

export function getCostCenters() {
  const user = getCurrentUser();
  try {
    const data = localStorage.getItem(getUserMastersKey(user?.id, 'cost_centers'));
    if (data) return JSON.parse(data);
  } catch (e) {}
  return DEFAULT_COST_CENTERS;
}

export function saveCostCenters(items) {
  const user = getCurrentUser();
  localStorage.setItem(getUserMastersKey(user?.id, 'cost_centers'), JSON.stringify(items));
}

export function addCostCenter(item) {
  const list = getCostCenters();
  const newItem = {
    id: item.id || Date.now(),
    code: item.code || `CC${String(list.length + 1).padStart(3, '0')}`,
    name: item.name,
    description: item.description || '',
    status: item.status || 'active'
  };
  list.push(newItem);
  saveCostCenters(list);
  return newItem;
}

export function updateCostCenter(item) {
  let list = getCostCenters();
  list = list.map(i => (i.id === item.id || i.code === item.code ? { ...i, ...item } : i));
  saveCostCenters(list);
  return { success: true };
}

export function deleteCostCenter(id) {
  let list = getCostCenters();
  list = list.filter(i => i.id !== id && i.code !== id);
  saveCostCenters(list);
  return { success: true };
}

export function getProfitCenters() {
  const user = getCurrentUser();
  try {
    const data = localStorage.getItem(getUserMastersKey(user?.id, 'profit_centers'));
    if (data) return JSON.parse(data);
  } catch (e) {}
  return DEFAULT_PROFIT_CENTERS;
}

export function saveProfitCenters(items) {
  const user = getCurrentUser();
  localStorage.setItem(getUserMastersKey(user?.id, 'profit_centers'), JSON.stringify(items));
}

export function addProfitCenter(item) {
  const list = getProfitCenters();
  const newItem = {
    id: item.id || Date.now(),
    code: item.code || `PC${String(list.length + 1).padStart(3, '0')}`,
    name: item.name,
    description: item.description || '',
    status: item.status || 'active'
  };
  list.push(newItem);
  saveProfitCenters(list);
  return newItem;
}

export function updateProfitCenter(item) {
  let list = getProfitCenters();
  list = list.map(i => (i.id === item.id || i.code === item.code ? { ...i, ...item } : i));
  saveProfitCenters(list);
  return { success: true };
}

export function deleteProfitCenter(id) {
  let list = getProfitCenters();
  list = list.filter(i => i.id !== id && i.code !== id);
  saveProfitCenters(list);
  return { success: true };
}

export function getProjects() {
  const user = getCurrentUser();
  try {
    const data = localStorage.getItem(getUserMastersKey(user?.id, 'projects'));
    if (data) return JSON.parse(data);
  } catch (e) {}
  return DEFAULT_PROJECTS;
}

export function saveProjects(items) {
  const user = getCurrentUser();
  localStorage.setItem(getUserMastersKey(user?.id, 'projects'), JSON.stringify(items));
}

export function addProject(item) {
  const list = getProjects();
  const newItem = {
    id: item.id || Date.now(),
    code: item.code || `PR${String(list.length + 1).padStart(3, '0')}`,
    name: item.name,
    description: item.description || '',
    status: item.status || 'active'
  };
  list.push(newItem);
  saveProjects(list);
  return newItem;
}

export function updateProject(item) {
  let list = getProjects();
  list = list.map(i => (i.id === item.id || i.code === item.code ? { ...i, ...item } : i));
  saveProjects(list);
  return { success: true };
}

export function deleteProject(id) {
  let list = getProjects();
  list = list.filter(i => i.id !== id && i.code !== id);
  saveProjects(list);
  return { success: true };
}

export function getAllMasters() {
  return {
    budgets: getBudgetMasters(),
    cost_centers: getCostCenters(),
    profit_centers: getProfitCenters(),
    projects: getProjects(),
  };
}

export function resetDefaultMasters() {
  saveBudgetMasters(DEFAULT_BUDGETS);
  saveCostCenters(DEFAULT_COST_CENTERS);
  saveProfitCenters(DEFAULT_PROFIT_CENTERS);
  saveProjects(DEFAULT_PROJECTS);
  return getAllMasters();
}
