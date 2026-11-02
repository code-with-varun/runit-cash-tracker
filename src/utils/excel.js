import * as XLSX from 'xlsx';

/**
 * Helper function to normalize Excel dates into standard YYYY-MM-DD format
 * Supports JS Date objects, Excel serial numbers, DD/MM/YYYY, YYYY/MM/DD, etc.
 */
export function normalizeExcelDate(val, fallbackDate) {
  if (val === undefined || val === null || val === '') return fallbackDate;

  // If SheetJS parsed it as a JS Date object
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      const year = val.getFullYear();
      const month = String(val.getMonth() + 1).padStart(2, '0');
      const day = String(val.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  // If val is an Excel Serial Number (e.g. 45482)
  if (typeof val === 'number') {
    try {
      const parsedDate = XLSX.SSF.parse_date_code(val);
      if (parsedDate && parsedDate.y && parsedDate.m && parsedDate.d) {
        const year = parsedDate.y;
        const month = String(parsedDate.m).padStart(2, '0');
        const day = String(parsedDate.d).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      // Fallthrough
    }
  }

  const str = String(val).trim();
  if (!str) return fallbackDate;

  // Standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // YYYY/MM/DD
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(str)) {
    return str.replace(/\//g, '-');
  }

  // DD/MM/YYYY or DD-MM-YYYY
  if (/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.test(str)) {
    const parts = str.split(/[\/-]/);
    const day = String(parts[0]).padStart(2, '0');
    const month = String(parts[1]).padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }

  // DD-Mon-YY or DD-Mon-YYYY (e.g. 12-Aug-14, 04-Sep-14, 25-Dec-2026)
  const monMatch = str.match(/^(\d{1,2})[-/\s]([A-Za-z]{3})[-/\s](\d{2,4})$/);
  if (monMatch) {
    const day = String(monMatch[1]).padStart(2, '0');
    const monStr = monMatch[2].toLowerCase();
    const months = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    const month = months[monStr];
    let year = monMatch[3];
    if (year.length === 2) {
      year = parseInt(year, 10) > 50 ? '19' + year : '20' + year;
    }
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // Attempt parsing string with JS Date
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return fallbackDate;
}

/**
 * Intelligent categorization classifier based on bank particulars / narration keywords
 */
export function classifyParticulars(particulars = '', existingCategories = []) {
  const text = String(particulars || '').toUpperCase();
  if (!text) {
    const fallback = existingCategories[0] || { id: 1, name: 'General', type: 'Dr' };
    return { categoryId: fallback.id, categoryName: fallback.name, type: fallback.type };
  }

  const rules = [
    { keywords: ['ATM WDL', 'ATM CASH OUT', 'ATM 366', 'ATM 273', 'ATM 1384', 'ATM 7627', 'ATM 7628', 'ATM 2610', 'ATM 1632', 'ATM'], name: 'ATM CASH OUT', fallbackType: 'Dr' },
    { keywords: ['CASH DEPOSIT', 'ATM CASH IN', 'CHEQUE DEPOSIT', 'CHQ DEPOSIT', 'CLEARING', 'INB BY CLEARING'], name: 'ATM CASH IN', fallbackType: 'Cr' },
    { keywords: ['CREDIT INTEREST', 'INTEREST', 'INT CR', 'INT.PD'], name: 'CREDIT INTEREST', fallbackType: 'Cr' },
    { keywords: ['SMS', 'CHARGES FOR SMS', 'AMC DEBIT CARD', 'AMC', 'MIN BAL', 'SERVICE CHARGE', 'FEE'], name: 'HARDWARES & SERVICE', fallbackType: 'Dr' },
    { keywords: ['SALARY', 'PAYROLL', 'MONTHLY PAY', 'STIPEND'], name: 'LD SALARY/INCOME', fallbackType: 'Cr' },
    { keywords: ['PETROL', 'FUEL', 'SHELL', 'HPCL', 'BPCL', 'IOCL', 'INDIAN OIL'], name: 'PETROL', fallbackType: 'Dr' },
    { keywords: ['GROCERY', 'SUPERMARKET', 'MART', 'DMART', 'RELIANCE FRESH', 'ZEPTO', 'BLINKIT', 'INSTAMART'], name: 'GROCERIES', fallbackType: 'Dr' },
    { keywords: ['FOOD', 'SNACKS', 'HOTEL', 'RESTAURANT', 'SWIGGY', 'ZOMATO', 'CAFE', 'DINE'], name: 'FOOD/SNACKS', fallbackType: 'Dr' },
    { keywords: ['TRANSPORT', 'UBER', 'OLA', 'RAPIDO', 'METRO', 'BUS', 'TRAIN', 'IRCTC', 'FASTAG', 'CARGO', 'COURIER'], name: 'TRANSPORT', fallbackType: 'Dr' },
    { keywords: ['MEDICAL', 'PHARMACY', 'APOLLO', 'MEDPLUS', 'HOSPITAL', 'CLINIC', 'DOCTOR'], name: 'MEDICAL', fallbackType: 'Dr' },
    { keywords: ['EPFO', 'PF TRANSFER', 'PROVIDENT FUND'], name: 'EPFO', fallbackType: 'Cr' },
    { keywords: ['INSURANCE', 'LIC', 'HDFC ERGO', 'STAR HEALTH'], name: 'HEALTH INSURANCE', fallbackType: 'Dr' },
    { keywords: ['EDUCATION', 'SCHOOL', 'COLLEGE', 'FEES', 'TUITION', 'XEROX'], name: 'EDUCATION FEES', fallbackType: 'Dr' },
    { keywords: ['CC BILL', 'CREDIT CARD', 'CC PAYMENT', 'CC ROTATION', 'CC SETTLEMENT'], name: 'CC BILL PAYMENT', fallbackType: 'Dr' },
    { keywords: ['MUTUAL FUND', 'SIP', 'ZERODHA', 'GROWW', 'KFINTECH', 'CAMS'], name: 'MUTUAL FUND', fallbackType: 'Dr' },
    { keywords: ['EQUITY', 'STOCK', 'SHARE'], name: 'EQUITY STOCK', fallbackType: 'Dr' },
    { keywords: ['FIXED DEPOSIT', 'FD CREATION', 'FD'], name: 'FIXED DEPOSIT', fallbackType: 'Dr' },
    { keywords: ['RENT', 'HOUSE RENT'], name: 'HOUSE HOLDS', fallbackType: 'Dr' },
    { keywords: ['ADVANCE'], name: 'ADVANCE', fallbackType: 'Dr' },
  ];

  for (const rule of rules) {
    if (rule.keywords.some(k => text.includes(k))) {
      const match = (existingCategories || []).find(c => 
        String(c.name || '').toUpperCase() === rule.name || 
        String(c.subcategory || '').toUpperCase() === rule.name
      );
      if (match) {
        return {
          categoryId: match.id,
          categoryName: match.name,
          subcategory: match.subcategory || match.name,
          groupType: match.group_type,
          netType: match.net_type,
          subType: match.sub_type,
          transactionType: match.transaction_type,
          type: match.type || rule.fallbackType,
        };
      }
      return {
        categoryId: null,
        categoryName: rule.name,
        subcategory: rule.name,
        type: rule.fallbackType,
      };
    }
  }

  const fallback = existingCategories[0] || { id: 1, name: 'General', type: 'Dr' };
  return { categoryId: fallback.id, categoryName: fallback.name, type: fallback.type };
}

/**
 * Download sample Bank Transaction Excel (.xlsx) template matching exact headers:
 * tran_date | tran_no | account_no | particulars | debit | credit | balance
 */
export function downloadBankTransactionTemplate(defaultAccount = 'SBI_SB_20200698609') {
  const sampleData = [
    {
      'tran_date': '12-Aug-14',
      'tran_no': 1,
      'account_no': defaultAccount || 'SBI_SB_20200698609',
      'particulars': 'CASH DEPOSIT SELF',
      'debit': 0,
      'credit': 1000,
      'balance': 1000,
    },
    {
      'tran_date': '13-Aug-14',
      'tran_no': 2,
      'account_no': defaultAccount || 'SBI_SB_20200698609',
      'particulars': 'CHEQUE DEPOSIT',
      'debit': 0,
      'credit': 500,
      'balance': 1500,
    },
    {
      'tran_date': '15-Aug-14',
      'tran_no': 3,
      'account_no': defaultAccount || 'SBI_SB_20200698609',
      'particulars': 'ATM 366 SBI PONDICHERRY-NATE PONDICHERRY TN IN',
      'debit': 200,
      'credit': 0,
      'balance': 1300,
    },
    {
      'tran_date': '17-Aug-14',
      'tran_no': 4,
      'account_no': defaultAccount || 'SBI_SB_20200698609',
      'particulars': 'ATM 273 SBI NATESAN ST-3RD, POPONDICHERRY TN IN',
      'debit': 100,
      'credit': 0,
      'balance': 1200,
    },
    {
      'tran_date': '20-Aug-14',
      'tran_no': 5,
      'account_no': defaultAccount || 'SBI_SB_20200698609',
      'particulars': 'ATM 1384 SBI NATESAN ST-3RD, POPONDICHERRY TN IN',
      'debit': 100,
      'credit': 0,
      'balance': 1100,
    },
    {
      'tran_date': '04-Sep-14',
      'tran_no': 6,
      'account_no': defaultAccount || 'SBI_SB_20200698609',
      'particulars': 'ATM 7627 PONDICHERRY CHENNAI IND',
      'debit': 500,
      'credit': 0,
      'balance': 600,
    },
    {
      'tran_date': '04-Sep-14',
      'tran_no': 7,
      'account_no': defaultAccount || 'SBI_SB_20200698609',
      'particulars': 'ATM 7628 PONDICHERRY CHENNAI IND',
      'debit': 500,
      'credit': 0,
      'balance': 100,
    },
    {
      'tran_date': '28-Sep-14',
      'tran_no': 8,
      'account_no': defaultAccount || 'SBI_SB_20200698609',
      'particulars': 'AMC Debit Card',
      'debit': 15,
      'credit': 0,
      'balance': 85,
    },
    {
      'tran_date': '20-Dec-14',
      'tran_no': 9,
      'account_no': defaultAccount || 'SBI_SB_20200698609',
      'particulars': 'CHARGES FOR SMS - QUARTERLY',
      'debit': 15,
      'credit': 0,
      'balance': 70,
    },
    {
      'tran_date': '25-Dec-14',
      'tran_no': 10,
      'account_no': defaultAccount || 'SBI_SB_20200698609',
      'particulars': 'CREDIT INTEREST',
      'debit': 0,
      'credit': 4,
      'balance': 74,
    },
    {
      'tran_date': '10-Jan-15',
      'tran_no': 11,
      'account_no': defaultAccount || 'SBI_SB_20200698609',
      'particulars': 'INB BY CLEARING',
      'debit': 0,
      'credit': 1400,
      'balance': 1474,
    },
    {
      'tran_date': '10-Jan-15',
      'tran_no': 12,
      'account_no': defaultAccount || 'SBI_SB_20200698609',
      'particulars': 'ATM 2610 SBI NATESAN ST-3RD, POPONDICHERRY TN IN',
      'debit': 1400,
      'credit': 0,
      'balance': 74,
    },
    {
      'tran_date': '06-Mar-15',
      'tran_no': 13,
      'account_no': defaultAccount || 'SBI_SB_20200698609',
      'particulars': 'CASH DEPOSIT-CASH Deposited at GCC--',
      'debit': 0,
      'credit': 2000,
      'balance': 2074,
    },
    {
      'tran_date': '06-Mar-15',
      'tran_no': 14,
      'account_no': defaultAccount || 'SBI_SB_20200698609',
      'particulars': 'TO TRANSFER-Transfer through GCC--',
      'debit': 1800,
      'credit': 0,
      'balance': 274,
    },
    {
      'tran_date': '06-Mar-15',
      'tran_no': 15,
      'account_no': defaultAccount || 'SBI_SB_20200698609',
      'particulars': 'ATM WDL-ATM 1632 MUDALIARPET ADDL CHENNAI IND--',
      'debit': 200,
      'credit': 0,
      'balance': 74,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'sample data');

  worksheet['!cols'] = [
    { wch: 14 }, // tran_date
    { wch: 10 }, // tran_no
    { wch: 24 }, // account_no
    { wch: 50 }, // particulars
    { wch: 12 }, // debit
    { wch: 12 }, // credit
    { wch: 14 }, // balance
  ];

  XLSX.writeFile(workbook, `MoneyMatrix_Bank_Transactions_Template.xlsx`);
}

/**
 * Download sample Cash Transactions Excel (.xlsx) template
 */
export function downloadCashTransactionTemplate() {
  const sampleData = [
    {
      'Date': '2026-07-25',
      'Category': 'Salary',
      'Type': 'Cr',
      'Amount': 50000,
      'Notes': 'Monthly Salary credited',
    },
    {
      'Date': '2026-07-26',
      'Category': 'Rent & Housing',
      'Type': 'Dr',
      'Amount': 15000,
      'Notes': 'Apartment monthly rent payment',
    },
    {
      'Date': '2026-07-27',
      'Category': 'Food & Dining',
      'Type': 'Dr',
      'Amount': 2500,
      'Notes': 'Supermarket grocery bill',
    },
    {
      'Date': '2026-07-28',
      'Category': 'Freelance & Consulting',
      'Type': 'Cr',
      'Amount': 12000,
      'Notes': 'Web development milestone payment',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bulk_Cash_Template');

  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 24 },
    { wch: 12 },
    { wch: 14 },
    { wch: 35 },
  ];

  XLSX.writeFile(workbook, `MoneyMatrix_Cash_Bulk_Template.xlsx`);
}

/**
 * Unified Bulk Entry template downloader: delegates to Bank or Cash format based on active mode/account
 */
export function downloadBulkEntryTemplate(mode = 'bank', defaultAccount = 'SBI_SB_20200698609') {
  if (mode === 'cash') {
    downloadCashTransactionTemplate();
  } else {
    downloadBankTransactionTemplate(defaultAccount);
  }
}

/**
 * Export Categories array to Excel (.xlsx) file
 * @param {Array} categories 
 */
export function exportCategoriesToExcel(categories) {
  const data = categories.map((cat, idx) => ({
    'CategoryID': cat.id || (idx + 1),
    'SubCategory': cat.subcategory || cat.name,
    'Category': cat.category || '',
    'Division': cat.division || 'LIVING',
    'SubType': cat.sub_type || cat.net_type || '',
    'TransactionType': cat.transaction_type || 'ACTUAL',
    'sub category description': cat.description || '',
    'Suffix': cat.suffix || (cat.type === 'Cr' ? 'CR' : 'DR'),
    'Type': cat.type || 'Dr'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Category Taxonomy');

  // Auto-fit column widths
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 26 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 50 },
    { wch: 10 },
    { wch: 10 },
  ];

  XLSX.writeFile(workbook, `MoneyMatrix_Category_Taxonomy_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Export Transactions array to Excel (.xlsx) file
 * @param {Array} transactions 
 */
export function exportTransactionsToExcel(transactions) {
  const data = transactions.map((tx) => ({
    'Transaction ID': tx.id,
    'Date': tx.date,
    'Category': tx.categoryName,
    'Type': tx.type === 'Cr' ? 'Credit (Cr)' : 'Debit (Dr)',
    'Amount': tx.amount,
    'Notes': tx.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

  worksheet['!cols'] = [
    { wch: 18 },
    { wch: 12 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 35 },
  ];

  XLSX.writeFile(workbook, `MoneyMatrix_Transactions_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Parse uploaded Excel/CSV file for Categories
 * @param {File} file 
 * @returns {Promise<Array>}
 */
export function parseCategoriesExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        // Normalize keys and map to category objects with complete taxonomy
        const parsedCategories = json.map((row) => {
          const subcat = row['SubCategory'] || row['Subcategory'] || row['subcategory'] || row['Category Name'] || row['name'] || row['Name'] || row['Category'] || '';
          const cat = row['Category'] || row['category'] || 'GENERAL';
          const division = String(row['Division'] || row['division'] || 'LIVING').trim();
          const subType = row['SubType'] || row['sub_type'] || row['SUB-TYPE'] || row['Sub-Type'] || '';
          const txType = row['TransactionType'] || row['transaction_type'] || row['TRANSACTION TYPE'] || row['Transaction Type'] || 'ACTUAL';
          const desc = row['sub category description'] || row['description'] || row['Description'] || '';
          const suffix = (row['Suffix'] || row['suffix'] || '').toUpperCase();
          const info = row['info_type'] || row['Info Type'] || 'BOTH';
          const group = row['Group Type'] || row['group_type'] || division;

          let type = suffix === 'CR' ? 'Cr' : (suffix === 'NU' ? 'NU' : 'Dr');
          if (!suffix && row['Type (Cr/Dr)']) {
            type = String(row['Type (Cr/Dr)']).trim().toLowerCase().startsWith('c') ? 'Cr' : 'Dr';
          } else if (!suffix && (division === 'EARNINGS' || subType === 'INCOME')) {
            type = 'Cr';
          }

          return {
            name: String(subcat).trim(),
            subcategory: String(subcat).trim(),
            category: String(cat).trim(),
            division: division || (type === 'Cr' ? 'EARNINGS' : 'LIVING'),
            sub_type: subType,
            transaction_type: txType,
            description: desc,
            suffix: suffix || (type === 'Cr' ? 'CR' : 'DR'),
            info_type: info,
            group_type: group,
            net_type: subType,
            type: type,
          };
        }).filter((cat) => cat.name.length > 0);

        resolve(parsedCategories);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse uploaded Excel/CSV file for Transactions
 * @param {File} file 
 * @param {Array} existingCategories 
 * @returns {Promise<Array>}
 */
export function parseTransactionsExcel(file, existingCategories = []) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const todayStr = new Date().toISOString().slice(0, 10);

        if (!json || json.length === 0) {
          resolve([]);
          return;
        }

        // Detect if uploaded sheet matches Bank Statement format (tran_date, particulars, debit, credit, etc.)
        const isBankFormat = json.some(row => 
          row.hasOwnProperty('tran_date') || 
          row.hasOwnProperty('particulars') || 
          row.hasOwnProperty('debit') || 
          row.hasOwnProperty('credit') || 
          row.hasOwnProperty('tran_no') ||
          row.hasOwnProperty('tran_id') ||
          row.hasOwnProperty('account_no')
        );

        let parsedTransactions = [];

        if (isBankFormat) {
          parsedTransactions = json.map((row, idx) => {
            const rawDate = row['tran_date'] || row['date'] || row['Date'] || row['TRAN_DATE'] || '';
            const tranNo = row['tran_no'] ?? row['tran_id'] ?? row['Tran No'] ?? (idx + 1);
            const accountNo = row['account_no'] || row['Account No'] || row['account'] || '';
            const particulars = String(row['particulars'] || row['Particulars'] || row['narration'] || row['Narration'] || row['description'] || row['notes'] || '').trim();
            const debit = parseFloat(row['debit'] ?? row['Debit'] ?? 0) || 0;
            const credit = parseFloat(row['credit'] ?? row['Credit'] ?? 0) || 0;
            const balance = parseFloat(row['balance'] ?? row['Balance'] ?? 0) || 0;

            let validDate = normalizeExcelDate(rawDate, todayStr);

            // Determine type & amount
            let type = 'Dr';
            let amount = 0;
            if (credit > 0) {
              type = 'Cr';
              amount = credit;
            } else if (debit > 0) {
              type = 'Dr';
              amount = debit;
            }

            // Intelligent classification from narration
            const classification = classifyParticulars(particulars, existingCategories);

            return {
              id: `staged_bank_${Date.now()}_${idx}_${Math.random()}`,
              isBankFormat: true,
              date: validDate,
              tran_date: validDate,
              tran_no: tranNo,
              tranNo: tranNo,
              account_no: accountNo,
              accountNo: accountNo,
              particulars: particulars,
              notes: particulars,
              debit: debit,
              credit: credit,
              balance: balance,
              type: type,
              amount: amount,
              categoryId: classification.categoryId,
              categoryName: classification.categoryName,
              subcategory: classification.subcategory || classification.categoryName,
              groupType: classification.groupType,
              netType: classification.netType,
              subType: classification.subType,
              transactionType: classification.transactionType || 'ACTUAL',
            };
          }).filter(tx => tx.debit > 0 || tx.credit > 0 || tx.amount > 0 || tx.particulars);
        } else {
          // Standard Cash format
          parsedTransactions = json.map((row, idx) => {
            const rawDate = row['Date'] || row['date'] || row['DATE'];
            const categoryName = row['Category'] || row['categoryName'] || row['category'] || 'General';
            const rawType = row['Type'] || row['type'] || 'Dr';
            const amount = parseFloat(row['Amount'] || row['amount'] || 0);
            const notes = row['Notes'] || row['notes'] || '';

            let type = String(rawType).trim().toLowerCase().startsWith('c') ? 'Cr' : 'Dr';

            const matchedCat = existingCategories.find(
              (c) => c.name.toLowerCase() === String(categoryName).toLowerCase()
            );

            let validDate = normalizeExcelDate(rawDate, todayStr);
            if (validDate > todayStr) {
              validDate = todayStr;
            }

            return {
              id: `staged_cash_${Date.now()}_${idx}_${Math.random()}`,
              isBankFormat: false,
              date: validDate,
              tran_date: validDate,
              tran_no: idx + 1,
              account_no: '',
              particulars: String(notes).trim(),
              notes: String(notes).trim(),
              debit: type === 'Dr' ? (isNaN(amount) ? 0 : amount) : 0,
              credit: type === 'Cr' ? (isNaN(amount) ? 0 : amount) : 0,
              balance: 0,
              categoryId: matchedCat ? matchedCat.id : (existingCategories[0]?.id || 'cat_general'),
              categoryName: matchedCat ? matchedCat.name : String(categoryName).trim(),
              type: matchedCat ? matchedCat.type : type,
              amount: isNaN(amount) ? '' : amount,
            };
          }).filter((tx) => tx.amount !== '' || tx.notes !== '');
        }

        resolve(parsedTransactions);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Download standard Account-Wise Bank Statement Excel (.xlsx) template
 * Exactly matches: tran_date | tran_no | account_no | particulars | debit | credit | balance | UPDATE DATE
 */
export function downloadAccountStatementTemplate(defaultAccount = 'SBI_THULASI_0144') {
  const sampleData = [
    {
      'tran_date': '01-Jul-26',
      'tran_no': 1,
      'account_no': defaultAccount,
      'particulars': 'OPENING / SALARY CREDIT',
      'debit': 0,
      'credit': 50000.00,
      'balance': 50000.00,
      'UPDATE DATE': '10-01-2026',
    },
    {
      'tran_date': '15-Jul-26',
      'tran_no': 2,
      'account_no': defaultAccount,
      'particulars': 'ATM WDL CASH WITHDRAWAL 242 S1CN00090015',
      'debit': 5000.00,
      'credit': 0,
      'balance': 45000.00,
      'UPDATE DATE': '10-01-2026',
    },
    {
      'tran_date': '20-Jul-26',
      'tran_no': 3,
      'account_no': defaultAccount,
      'particulars': 'UPI PAYMENT TO GROCERY MART 1413 S1CN0009',
      'debit': 1250.00,
      'credit': 0,
      'balance': 43750.00,
      'UPDATE DATE': '10-01-2026',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Statement_Dump');

  // Column widths
  worksheet['!cols'] = [
    { wch: 14 }, // tran_date
    { wch: 10 }, // tran_no
    { wch: 22 }, // account_no
    { wch: 42 }, // particulars
    { wch: 12 }, // debit
    { wch: 12 }, // credit
    { wch: 14 }, // balance
    { wch: 14 }, // UPDATE DATE
  ];

  XLSX.writeFile(workbook, `MoneyMatrix_Bank_Statement_Template.xlsx`);
}

/**
 * Export registered Bank Account Master list to Excel (.xlsx)
 * Exactly mirrors: FINAL STD AC | account_type | dump_type | status | MAX RID | last_updated | closing_balance | start date | end date | Last date Balance
 */
export function exportAccountMasterToExcel(accounts = []) {
  const data = accounts.map((acc) => {
    const balanceNum = Number(acc.balance || 0);
    return {
      'FINAL STD AC': acc.code || '',
      'account_name': acc.name || '',
      'account_type': acc.type || 'Savings Account',
      'dump_type': (acc.dump_type || 'FINANCE').toUpperCase(),
      'status': (acc.status || 'ACTIVE').toUpperCase(),
      'MAX RID': acc.txCount || 0,
      'last_updated': acc.lastUpdated ? String(acc.lastUpdated).slice(0, 10) : '',
      'closing_balance': balanceNum,
      'start date': acc.startDate || '',
      'end date': acc.endDate || '',
      'Last date Balance': balanceNum,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Account_Master');

  worksheet['!cols'] = [
    { wch: 24 }, // FINAL STD AC
    { wch: 28 }, // account_name
    { wch: 18 }, // account_type
    { wch: 14 }, // dump_type
    { wch: 12 }, // status
    { wch: 10 }, // MAX RID
    { wch: 14 }, // last_updated
    { wch: 16 }, // closing_balance
    { wch: 14 }, // start date
    { wch: 14 }, // end date
    { wch: 16 }, // Last date Balance
  ];

  XLSX.writeFile(workbook, `MoneyMatrix_Account_Master_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Download sample Category Master Excel (.xlsx) template for users to fill and import
 */
export function downloadCategoryMasterTemplate() {
  const sampleData = [
    {
      'CategoryID': 1,
      'SubCategory': 'CARGO/COURIER',
      'Category': 'LOGISTICS',
      'Division': 'LIVING',
      'SubType': 'EMERGENCY',
      'TransactionType': 'ACTUAL',
      'sub category description': 'Expenses incurred for courier services, parcel delivery, cargo transportation, or logistics support.'
    },
    {
      'CategoryID': 2,
      'SubCategory': 'PETROL',
      'Category': 'FUEL',
      'Division': 'MOBILITY',
      'SubType': 'NEEDS',
      'TransactionType': 'ACTUAL',
      'sub category description': 'Fuel expenses incurred for personal or business vehicle usage.'
    },
    {
      'CategoryID': 3,
      'SubCategory': 'SALARY',
      'Category': 'PAYROLL',
      'Division': 'EARNINGS',
      'SubType': 'INCOME',
      'TransactionType': 'ACTUAL',
      'sub category description': 'Regular salary or compensation received from employment.'
    },
    {
      'CategoryID': 4,
      'SubCategory': 'GROCERIES',
      'Category': 'PROVISIONS',
      'Division': 'LIVING',
      'SubType': 'NEEDS',
      'TransactionType': 'ACTUAL',
      'sub category description': 'Purchases of household food supplies and daily essential consumable items.'
    },
    {
      'CategoryID': 5,
      'SubCategory': 'HEALTH INSURANCE',
      'Category': 'MEDICAL COVER',
      'Division': 'PROTECTION',
      'SubType': 'NEEDS',
      'TransactionType': 'ACTUAL',
      'sub category description': 'Premium payments made for health and medical insurance policies.'
    },
    {
      'CategoryID': 6,
      'SubCategory': 'EQUITY STOCK',
      'Category': 'EQUITY',
      'Division': 'WEALTH',
      'SubType': 'ASSETS',
      'TransactionType': 'ACTUAL',
      'sub category description': 'Investments made in listed or unlisted company shares and stocks.'
    },
    {
      'CategoryID': 7,
      'SubCategory': 'CC BILL PAYMENT',
      'Category': 'CC PAYMENT',
      'Division': 'ROTATIONS',
      'SubType': 'REPAYMENTS',
      'TransactionType': 'ROTATIONAL',
      'sub category description': 'Payments made towards outstanding credit card bills and dues.'
    },
    {
      'CategoryID': 8,
      'SubCategory': 'ATM CASH IN',
      'Category': 'CASH DEPOSIT',
      'Division': 'INTERNAL',
      'SubType': 'INTERNAL',
      'TransactionType': 'ROTATIONAL',
      'sub category description': 'Cash deposited into bank accounts through ATM or self-service channels.'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Category_Template');

  worksheet['!cols'] = [
    { wch: 12 }, // CategoryID
    { wch: 25 }, // SubCategory
    { wch: 20 }, // Category
    { wch: 16 }, // Division
    { wch: 16 }, // SubType
    { wch: 18 }, // TransactionType
    { wch: 60 }  // Description
  ];

  XLSX.writeFile(workbook, 'MoneyMatrix_Category_Taxonomy_Template.xlsx');
}

/**
 * Download sample Accounts Master Excel (.xlsx) template for users to fill and import
 */
export function downloadAccountMasterTemplate() {
  const sampleData = [
    {
      'Account Code': 'Cash_1',
      'Account Name': 'Cash_1 (Physical Cash)',
      'Account Type': 'Cash Account',
      'Dump Type': 'FINANCE',
      'Opening Balance': 0.00,
      'Status': 'ACTIVE'
    },
    {
      'Account Code': 'ICICI_DM_3142',
      'Account Name': 'ICICI Bank Primary Savings',
      'Account Type': 'Savings Account',
      'Dump Type': 'BANK',
      'Opening Balance': 25000.00,
      'Status': 'ACTIVE'
    },
    {
      'Account Code': 'HDFC_CC_0733',
      'Account Name': 'HDFC Millennia Credit Card',
      'Account Type': 'Credit Card',
      'Dump Type': 'CREDIT_CARD',
      'Opening Balance': 0.00,
      'Status': 'ACTIVE'
    },
    {
      'Account Code': 'FED_SB_9998',
      'Account Name': 'Federal Bank Savings',
      'Account Type': 'Savings Account',
      'Dump Type': 'BANK',
      'Opening Balance': 5000.00,
      'Status': 'ACTIVE'
    },
    {
      'Account Code': 'ICICI_CUR_0498',
      'Account Name': 'ICICI Current Account',
      'Account Type': 'Current Account',
      'Dump Type': 'BANK',
      'Opening Balance': 10000.00,
      'Status': 'ACTIVE'
    },
    {
      'Account Code': 'SELVA_LOAN',
      'Account Name': 'Selva Personal Loan',
      'Account Type': 'Loan Account',
      'Dump Type': 'LOAN',
      'Opening Balance': -50000.00,
      'Status': 'ACTIVE'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Accounts_Template');

  worksheet['!cols'] = [
    { wch: 20 }, // Account Code
    { wch: 32 }, // Account Name
    { wch: 20 }, // Account Type
    { wch: 15 }, // Dump Type
    { wch: 18 }, // Opening Balance
    { wch: 12 }  // Status
  ];

  XLSX.writeFile(workbook, 'MoneyMatrix_Accounts_Template.xlsx');
}

/**
 * Parse uploaded Excel/CSV file for Accounts Master
 * @param {File} file 
 * @returns {Promise<Array>}
 */
export function parseAccountsExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const parsedAccounts = json.map((row) => {
          const rawCode = row['Account Code'] || row['account_code'] || row['code'] || row['Code'] || row['FINAL STD AC'] || '';
          const rawName = row['Account Name'] || row['account_name'] || row['name'] || row['Name'] || rawCode;
          const rawType = row['Account Type'] || row['account_type'] || row['type'] || row['Type'] || 'Savings Account';
          const rawDump = row['Dump Type'] || row['dump_type'] || row['dumpType'] || 'FINANCE';
          const rawBalance = row['Opening Balance'] || row['opening_balance'] || row['balance'] || row['Balance'] || row['closing_balance'] || 0;
          const rawStatus = row['Status'] || row['status'] || 'active';

          const code = String(rawCode).trim().replace(/[^a-zA-Z0-9_]/g, '_');
          const name = String(rawName).trim() || code;

          return {
            code,
            name,
            type: String(rawType).trim() || 'Savings Account',
            dump_type: String(rawDump).trim().toUpperCase() || 'FINANCE',
            balance: parseFloat(rawBalance) || 0,
            status: String(rawStatus).trim().toLowerCase() === 'closed' ? 'closed' : 'active',
          };
        }).filter((acc) => acc.code.length > 0);

        resolve(parsedAccounts);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
