const fs = require('fs');
const path = require('path');

const excelFile = path.join(__dirname, '..', 'src', 'utils', 'excel.js');
let excelContent = fs.readFileSync(excelFile, 'utf8');

const exportCompleteFn = `
/**
 * Complete Multi-Sheet Excel Backup & Export
 * Exports all database tables, masters, and logged-in user profile details table-wise and master-wise in separate sheets.
 */
export async function exportCompleteMasterExcel({
  currentUser,
  transactions = [],
  accounts = [],
  categories = [],
  masters = { budgets: [], cost_centers: [], profit_centers: [], projects: [] }
}) {
  const wb = XLSX.utils.book_new();
  const todayStr = new Date().toISOString().substring(0, 10);
  const nowStr = new Date().toLocaleString('en-IN');
  const username = currentUser?.username || currentUser?.name || 'user';

  // Fetch optional secondary datasets (closing balances, AP/AR, loans, portfolio)
  let closingBalances = [];
  let apArData = [];
  let loansData = [];
  let portfolioData = [];

  try {
    const api = await import('./api');
    const [cbRes, aparRes, loanRes, portRes] = await Promise.allSettled([
      api.getClosingBalancesAPI ? api.getClosingBalancesAPI('all').catch(() => []) : Promise.resolve([]),
      api.getApArMatrixAPI ? api.getApArMatrixAPI().catch(() => []) : Promise.resolve([]),
      api.getLoansAPI ? api.getLoansAPI().catch(() => []) : Promise.resolve([]),
      api.getPortfolioAPI ? api.getPortfolioAPI('all').catch(() => []) : Promise.resolve([])
    ]);
    if (cbRes.status === 'fulfilled' && Array.isArray(cbRes.value)) closingBalances = cbRes.value;
    if (aparRes.status === 'fulfilled' && Array.isArray(aparRes.value)) apArData = aparRes.value;
    if (loanRes.status === 'fulfilled' && Array.isArray(loanRes.value)) loansData = loanRes.value;
    if (portRes.status === 'fulfilled' && Array.isArray(portRes.value)) portfolioData = portRes.value;
  } catch (e) {
    console.warn('Could not load auxiliary datasets for complete export:', e);
  }

  // --- SHEET 1: USER PROFILE & SYSTEM SUMMARY ---
  let totalCredits = 0;
  let totalDebits = 0;
  let verifiedCount = 0;
  let lockedCount = 0;
  let draftCount = 0;

  transactions.forEach(t => {
    const amt = Number(t.amount || 0);
    if (t.type === 'Cr') totalCredits += amt;
    else totalDebits += amt;

    const st = t.auditStatus || t.audit_status || 'draft';
    if (st === 'frozen' || st === 'locked') lockedCount++;
    else if (st === 'verified') verifiedCount++;
    else draftCount++;
  });

  const profileSummaryRows = [
    { 'ATTRIBUTE': '=== LOGGED IN USER PROFILE ===', 'VALUE': '' },
    { 'ATTRIBUTE': 'User ID', 'VALUE': currentUser?.id || '1' },
    { 'ATTRIBUTE': 'Full Name', 'VALUE': currentUser?.name || 'Personal User' },
    { 'ATTRIBUTE': 'Username', 'VALUE': currentUser?.username || username },
    { 'ATTRIBUTE': 'Email Address', 'VALUE': currentUser?.email || 'N/A' },
    { 'ATTRIBUTE': 'Account Role', 'VALUE': (currentUser?.role || 'user').toUpperCase() },
    { 'ATTRIBUTE': 'Account Created Date', 'VALUE': currentUser?.created_at || 'N/A' },
    { 'ATTRIBUTE': 'Export Generated At', 'VALUE': nowStr },
    { 'ATTRIBUTE': 'Platform', 'VALUE': 'MoneyMatrix AI - Enterprise Wealth Operating System' },
    { 'ATTRIBUTE': '', 'VALUE': '' },
    { 'ATTRIBUTE': '=== SYSTEM & LEDGER SUMMARY ===', 'VALUE': '' },
    { 'ATTRIBUTE': 'Total Transactions Recorded', 'VALUE': transactions.length },
    { 'ATTRIBUTE': 'Draft / Pending Line Items', 'VALUE': draftCount },
    { 'ATTRIBUTE': 'Verified Line Items', 'VALUE': verifiedCount },
    { 'ATTRIBUTE': 'Locked & Finalized Lines', 'VALUE': lockedCount },
    { 'ATTRIBUTE': 'Total Cumulative Credits (Inflows)', 'VALUE': \`₹\${totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\` },
    { 'ATTRIBUTE': 'Total Cumulative Debits (Outflows)', 'VALUE': \`₹\${totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\` },
    { 'ATTRIBUTE': 'Net Cashflow Position', 'VALUE': \`₹\${(totalCredits - totalDebits).toLocaleString('en-IN', { minimumFractionDigits: 2 })}\` },
    { 'ATTRIBUTE': 'Active Bank / Cash Accounts', 'VALUE': accounts.length },
    { 'ATTRIBUTE': 'Category Classifications', 'VALUE': categories.length },
    { 'ATTRIBUTE': 'Budget Plans Defined', 'VALUE': (masters?.budgets || []).length },
    { 'ATTRIBUTE': 'Cost Centers Configured', 'VALUE': (masters?.cost_centers || []).length },
    { 'ATTRIBUTE': 'Profit Centers Configured', 'VALUE': (masters?.profit_centers || []).length },
    { 'ATTRIBUTE': 'Projects Configured', 'VALUE': (masters?.projects || []).length }
  ];

  const wsProfile = XLSX.utils.json_to_sheet(profileSummaryRows);
  wsProfile['!cols'] = [{ wch: 38 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsProfile, 'USER PROFILE');

  // --- SHEET 2: MASTER TRANSACTIONS (All 36 Columns) ---
  const txRows = transactions.map((tx, idx) => ({
    'ID': tx.id,
    'LINE_NO': idx + 1,
    'TRAN_NO': tx.tranNo || tx.tran_no || \`TXN_\${tx.id}\`,
    'TRAN_DATE': tx.date || tx.tran_date,
    'ACCOUNT_NO': tx.accountNo || tx.account_no || 'Cash_1',
    'PARTICULARS': tx.notes || tx.particulars || '',
    'FLOW_TYPE': tx.type || (tx.debit ? 'Dr' : 'Cr'),
    'DEBIT_AMOUNT': tx.type === 'Dr' ? Number(tx.amount || 0) : 0,
    'CREDIT_AMOUNT': tx.type === 'Cr' ? Number(tx.amount || 0) : 0,
    'BALANCE': Number(tx.balance || 0),
    'SUB_CATEGORY': tx.subcategory || tx.categoryName || 'GENERAL',
    'PARENT_CATEGORY': tx.category || '',
    'DIVISION': tx.division || '',
    'DISCIPLINE_SUBTYPE': tx.subType || tx.sub_type || '',
    'TRANSACTION_TYPE': tx.transactionType || tx.transaction_type || 'ACTUAL',
    'COST_CENTER': tx.costCenter || tx.cost_center || '',
    'PROFIT_CENTER': tx.profitCenter || tx.profit_center || '',
    'BUDGET': tx.budget || '',
    'PROJECT': tx.project || '',
    'UTR_NO': tx.utrNo || tx.utr_no || '',
    'TAGGING': tx.tagging || '',
    'PAYMENT_MODE': tx.mode || 'ONLINE',
    'PAYMENT_METHOD': tx.method || 'UPI',
    'AUDIT_STATUS': (tx.auditStatus || tx.audit_status || 'draft').toUpperCase(),
    'DATE_GROUP': tx.dateGroup || tx.date_group || '1',
    'TEMP_UPLOAD_ID': tx.tempUploadId || tx.temp_upload_id || \`TEMP_\${tx.date}_\${tx.id}\`,
    'JOB_UTILS': tx.jobUtils || tx.job_utils || '',
    'COMPENSATION_TYPE': tx.compensationType || tx.compensation_type || '',
    'SPLIT_REF': tx.splitRef || tx.split_ref || '',
    'INFO_TYPE': tx.infoType || tx.info_type || 'BOTH',
    'INFO_STATUS': tx.infoStatus || tx.info_status || '',
    'REMARKS': tx.remarks || '',
    'MONTH': tx.month || (tx.date ? tx.date.substring(5, 7) : ''),
    'YEAR': tx.year || (tx.date ? tx.date.substring(0, 4) : ''),
    'VERIFIED_AT': tx.verifiedAt || tx.verified_at || '',
    'FROZEN_AT': tx.frozenAt || tx.frozen_at || ''
  }));

  const wsTx = XLSX.utils.json_to_sheet(txRows);
  wsTx['!cols'] = [
    { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 22 },
    { wch: 45 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 24 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 18 },
    { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 20 },
    { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
    { wch: 24 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 12 },
    { wch: 12 }, { wch: 25 }, { wch: 8 }, { wch: 8 }, { wch: 18 }, { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, wsTx, 'MASTER TRANSACTIONS');

  // --- SHEET 3: ACCOUNTS MASTER ---
  const accRows = accounts.map(a => ({
    'ACCOUNT_CODE': a.code || a.id,
    'ACCOUNT_NAME': a.name,
    'ACCOUNT_TYPE': a.type || 'Savings',
    'BANK_NAME': a.bankName || a.bank_name || a.name,
    'ACCOUNT_NUMBER': a.accountNumber || a.account_number || '',
    'IFSC_CODE': a.ifscCode || a.ifsc || '',
    'BRANCH': a.branch || '',
    'OPENING_BALANCE': Number(a.openingBalance || a.opening_balance || 0),
    'CURRENT_BALANCE': Number(a.balance || a.current_balance || 0),
    'CURRENCY': a.currency || 'INR',
    'STATUS': (a.status || 'ACTIVE').toUpperCase(),
    'UPDATED_AT': a.updatedAt || a.updated_at || nowStr
  }));
  const wsAcc = XLSX.utils.json_to_sheet(accRows);
  wsAcc['!cols'] = [
    { wch: 22 }, { wch: 26 }, { wch: 16 }, { wch: 22 }, { wch: 22 },
    { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 10 },
    { wch: 10 }, { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, wsAcc, 'ACCOUNTS MASTER');

  // --- SHEET 4: CATEGORY TAXONOMY ---
  const catRows = categories.map(c => ({
    'SUBCATEGORY': c.subcategory || c.name,
    'PARENT_CATEGORY': c.category || c.parent_category || '',
    'DIVISION': c.division || '',
    'DISCIPLINE_SUBTYPE': c.sub_type || c.subType || '',
    'TRANSACTION_TYPE': c.transaction_type || c.transactionType || 'ACTUAL',
    'GROUP_TYPE': c.group_type || c.groupType || c.division || '',
    'NET_TYPE': c.net_type || c.netType || c.sub_type || '',
    'FLOW_TYPE': c.type || (c.division === 'EARNINGS' ? 'Cr' : 'Dr'),
    'DESCRIPTION': c.description || ''
  }));
  const wsCat = XLSX.utils.json_to_sheet(catRows);
  wsCat['!cols'] = [
    { wch: 25 }, { wch: 20 }, { wch: 16 }, { wch: 20 }, { wch: 18 },
    { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 55 }
  ];
  XLSX.utils.book_append_sheet(wb, wsCat, 'CATEGORY TAXONOMY');

  // --- SHEET 5: BUDGET MASTER ---
  const budgetRows = (masters?.budgets || []).map(b => ({
    'BUDGET_CODE': b.code || b.id,
    'BUDGET_NAME': b.name,
    'CATEGORY_GROUP': b.category || b.category_group || '',
    'MONTHLY_LIMIT': Number(b.monthly_limit || b.monthlyLimit || 0),
    'ANNUAL_LIMIT': Number(b.annual_limit || b.annualLimit || 0),
    'STATUS': b.active === 0 ? 'INACTIVE' : 'ACTIVE',
    'DESCRIPTION': b.description || ''
  }));
  const wsBudget = XLSX.utils.json_to_sheet(budgetRows);
  wsBudget['!cols'] = [{ wch: 14 }, { wch: 26 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsBudget, 'BUDGET MASTER');

  // --- SHEET 6: COST CENTER MASTER ---
  const ccRows = (masters?.cost_centers || []).map(cc => ({
    'COST_CENTER_CODE': cc.code || cc.id,
    'COST_CENTER_NAME': cc.name,
    'EXPENSE_TYPE': cc.type || 'PERSONAL',
    'ALLOCATION_TARGET': cc.allocation || '',
    'STATUS': cc.active === 0 ? 'INACTIVE' : 'ACTIVE',
    'DESCRIPTION': cc.description || ''
  }));
  const wsCc = XLSX.utils.json_to_sheet(ccRows);
  wsCc['!cols'] = [{ wch: 18 }, { wch: 24 }, { wch: 18 }, { wch: 22 }, { wch: 12 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsCc, 'COST CENTER MASTER');

  // --- SHEET 7: PROFIT CENTER MASTER ---
  const pcRows = (masters?.profit_centers || []).map(pc => ({
    'PROFIT_CENTER_CODE': pc.code || pc.id,
    'PROFIT_CENTER_NAME': pc.name,
    'EARNER_TYPE': pc.earner_type || pc.type || 'INCOME',
    'REVENUE_STREAM': pc.stream || '',
    'STATUS': pc.active === 0 ? 'INACTIVE' : 'ACTIVE',
    'DESCRIPTION': pc.description || ''
  }));
  const wsPc = XLSX.utils.json_to_sheet(pcRows);
  wsPc['!cols'] = [{ wch: 20 }, { wch: 26 }, { wch: 18 }, { wch: 22 }, { wch: 12 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsPc, 'PROFIT CENTER MASTER');

  // --- SHEET 8: PROJECT MASTER ---
  const prjRows = (masters?.projects || []).map(p => ({
    'PROJECT_CODE': p.code || p.id,
    'PROJECT_NAME': p.name,
    'ALLOCATED_BUDGET': Number(p.budget || p.allocated_budget || 0),
    'STATUS': p.status || 'ACTIVE',
    'START_DATE': p.start_date || '',
    'END_DATE': p.end_date || '',
    'DESCRIPTION': p.description || ''
  }));
  const wsPrj = XLSX.utils.json_to_sheet(prjRows);
  wsPrj['!cols'] = [{ wch: 16 }, { wch: 26 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsPrj, 'PROJECT MASTER');

  // --- SHEET 9: CLOSING BALANCES ---
  if (closingBalances.length > 0) {
    const wsCb = XLSX.utils.json_to_sheet(closingBalances);
    XLSX.utils.book_append_sheet(wb, wsCb, 'CLOSING BALANCES');
  }

  // --- SHEET 10: AP & AR MATRIX ---
  if (apArData.length > 0) {
    const wsApar = XLSX.utils.json_to_sheet(apArData);
    XLSX.utils.book_append_sheet(wb, wsApar, 'PAYABLES & RECEIVABLES');
  }

  // --- SHEET 11: LOANS & LIABILITIES ---
  if (loansData.length > 0) {
    const wsLoans = XLSX.utils.json_to_sheet(loansData);
    XLSX.utils.book_append_sheet(wb, wsLoans, 'LOANS & LIABILITIES');
  }

  // --- SHEET 12: INVESTMENTS & PORTFOLIO ---
  if (portfolioData.length > 0) {
    const wsPort = XLSX.utils.json_to_sheet(portfolioData);
    XLSX.utils.book_append_sheet(wb, wsPort, 'INVESTMENTS & STOCKS');
  }

  // Generate file download
  const cleanUsername = String(username).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = \`MoneyMatrix_Complete_Backup_\${cleanUsername}_\${todayStr}.xlsx\`;
  XLSX.writeFile(wb, filename);

  return filename;
}
`;

if (!excelContent.includes('exportCompleteMasterExcel')) {
  excelContent += exportCompleteFn;
  fs.writeFileSync(excelFile, excelContent, 'utf8');
  console.log('Successfully added exportCompleteMasterExcel to src/utils/excel.js');
} else {
  console.log('exportCompleteMasterExcel already present in src/utils/excel.js');
}

