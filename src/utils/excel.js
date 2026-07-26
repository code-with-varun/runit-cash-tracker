import * as XLSX from 'xlsx';

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
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const todayStr = new Date().toISOString().slice(0, 10);

        const parsedTransactions = json.map((row) => {
          const rawDate = row['Date'] || row['date'] || todayStr;
          const categoryName = row['Category'] || row['categoryName'] || row['category'] || 'General';
          const rawType = row['Type'] || row['type'] || 'Dr';
          const amount = parseFloat(row['Amount'] || row['amount'] || 0);
          const notes = row['Notes'] || row['notes'] || '';

          let type = String(rawType).trim().toLowerCase().startsWith('c') ? 'Cr' : 'Dr';

          // Match category ID if existing category matches
          const matchedCat = existingCategories.find(
            (c) => c.name.toLowerCase() === String(categoryName).toLowerCase()
          );

          let validDate = String(rawDate).trim();
          if (validDate > todayStr) {
            validDate = todayStr; // Future date blocked
          }

          return {
            date: validDate,
            categoryId: matchedCat ? matchedCat.id : 'cat_general',
            categoryName: matchedCat ? matchedCat.name : String(categoryName).trim(),
            type: matchedCat ? matchedCat.type : type,
            amount: isNaN(amount) ? 0 : amount,
            notes: String(notes).trim(),
          };
        }).filter((tx) => tx.amount > 0);

        resolve(parsedTransactions);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
