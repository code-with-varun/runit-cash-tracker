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
 * Download sample Bulk Entry Excel (.xlsx) template for users to feed data into
 */
export function downloadBulkEntryTemplate() {
  const todayStr = new Date().toISOString().slice(0, 10);
  
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
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bulk_Transactions_Template');

  // Column widths
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 24 },
    { wch: 12 },
    { wch: 14 },
    { wch: 35 },
  ];

  XLSX.writeFile(workbook, `CashTracker_Bulk_Entry_Template.xlsx`);
}

/**
 * Export Categories array to Excel (.xlsx) file
 * @param {Array} categories 
 */
export function exportCategoriesToExcel(categories) {
  const data = categories.map((cat) => ({
    'Category ID': cat.id,
    'Category Name': cat.name,
    'Type (Cr/Dr)': cat.type,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Categories');

  // Auto-fit column widths
  worksheet['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 15 }];

  XLSX.writeFile(workbook, `CashTracker_Categories_${new Date().toISOString().slice(0, 10)}.xlsx`);
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

  XLSX.writeFile(workbook, `CashTracker_Transactions_${new Date().toISOString().slice(0, 10)}.xlsx`);
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

        // Normalize keys and map to category objects
        const parsedCategories = json.map((row) => {
          const name = row['Category Name'] || row['name'] || row['Name'] || row['Category'] || '';
          let type = row['Type (Cr/Dr)'] || row['type'] || row['Type'] || 'Dr';
          
          type = String(type).trim().toLowerCase().startsWith('c') ? 'Cr' : 'Dr';

          return {
            name: String(name).trim(),
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

        const parsedTransactions = json.map((row, idx) => {
          const rawDate = row['Date'] || row['date'] || row['DATE'];
          const categoryName = row['Category'] || row['categoryName'] || row['category'] || 'General';
          const rawType = row['Type'] || row['type'] || 'Dr';
          const amount = parseFloat(row['Amount'] || row['amount'] || 0);
          const notes = row['Notes'] || row['notes'] || '';

          let type = String(rawType).trim().toLowerCase().startsWith('c') ? 'Cr' : 'Dr';

          // Match category ID if existing category matches
          const matchedCat = existingCategories.find(
            (c) => c.name.toLowerCase() === String(categoryName).toLowerCase()
          );

          // Extract date from Excel cell or fallback to today
          let validDate = normalizeExcelDate(rawDate, todayStr);
          if (validDate > todayStr) {
            validDate = todayStr; // Future date blocked
          }

          return {
            id: `staged_${Date.now()}_${idx}_${Math.random()}`,
            date: validDate, // Exact date parsed from Excel file
            categoryId: matchedCat ? matchedCat.id : 'cat_general',
            categoryName: matchedCat ? matchedCat.name : String(categoryName).trim(),
            type: matchedCat ? matchedCat.type : type,
            amount: isNaN(amount) ? '' : amount,
            notes: String(notes).trim(),
          };
        }).filter((tx) => tx.amount !== '' || tx.notes !== '');

        resolve(parsedTransactions);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
