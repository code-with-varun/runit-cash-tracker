import React, { useState, useEffect } from 'react';
import {
  TableProperties,
  Plus,
  Trash2,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Eye,
  Landmark,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Tag,
  History,
  Banknote
} from 'lucide-react';
import { getTodayString } from '../utils/storage';
import {
  parseTransactionsExcel,
  downloadBankTransactionTemplate,
  downloadCashTransactionTemplate,
  classifyParticulars
} from '../utils/excel';

export default function BulkEntryGrid({
  categories = [],
  accounts = [],
  masters = { budgets: [], cost_centers: [], profit_centers: [], projects: [] },
  activeAccount = 'Cash_1',
  initialFormatMode,
  isCashTrackerMode = false,
  transactions = [],
  onAddBulkTransactions,
  onDeleteTransaction,
  onNavigate
}) {
  const todayStr = getTodayString();

  const defaultAccountsList = [
    { id: 'ICICI_DM_3142', name: 'ICICI_DM_3142 (Savings)', type: 'Bank' },
    { id: 'FED_SB_9998', name: 'FED_SB_9998 (Federal SB)', type: 'Bank' },
    { id: 'HDFC_CC_0733', name: 'HDFC_CC_0733 (Credit Card)', type: 'Card' },
    { id: 'ICICI_CC_8003', name: 'ICICI_CC_HP_8003 (Credit Card)', type: 'Card' },
    { id: 'ICICI_CUR_0498', name: 'ICICI_CUR_0498 (Current)', type: 'Current' },
    { id: 'SELVA_LOAN', name: 'SELVA_LOANS (Payable)', type: 'Loan' },
  ];

  // Bank accounts list explicitly filtering out Cash_1 to prevent any cash contamination in bank entry
  const bankAccounts = (accounts && accounts.length > 0)
    ? accounts.filter(a => a.code !== 'Cash_1' && a.id !== 'Cash_1' && a.name !== 'Cash_1' && a.type !== 'Cash' && a.type !== 'Cash Account')
    : defaultAccountsList;

  const bankAccountOptions = bankAccounts.map(a => ({
    id: a.code || a.name || a.id,
    name: `${a.name} (${a.code || a.type})`
  }));

  const defaultBankAcc = bankAccountOptions[0]?.id || 'ICICI_DM_3142';

  const [selectedAccount, setSelectedAccount] = useState(() => {
    if (isCashTrackerMode) return 'Cash_1';
    if (activeAccount && activeAccount !== 'Cash_1') return activeAccount;
    return defaultBankAcc;
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Dedicated format per module: Cash Tracker is always 'cash', Bank Entry is always 'bank'
  const formatMode = isCashTrackerMode ? 'cash' : 'bank';

  useEffect(() => {
    if (isCashTrackerMode) {
      setSelectedAccount('Cash_1');
    } else {
      if (activeAccount && activeAccount !== 'Cash_1') {
        setSelectedAccount(activeAccount);
      } else {
        setSelectedAccount(defaultBankAcc);
      }
    }
  }, [isCashTrackerMode, activeAccount, defaultBankAcc]);

  const crCategories = categories ? categories.filter((c) => c.type === 'Cr') : [];
  const drCategories = categories ? categories.filter((c) => c.type === 'Dr') : [];

  const createBlankRow = (serial = 1, currentAccount = selectedAccount) => {
    const firstCat = categories && categories.length > 0 ? categories[0] : { id: 1, name: 'General', type: 'Dr' };
    if (!isCashTrackerMode) {
      return {
        id: Date.now() + Math.random(),
        isBankFormat: true,
        date: todayStr,
        tran_date: todayStr,
        tran_no: serial,
        account_no: (currentAccount && currentAccount !== 'Cash_1') ? currentAccount : defaultBankAcc,
        particulars: '',
        notes: '',
        debit: '',
        credit: '',
        balance: '',
        categoryId: firstCat.id,
        categoryName: firstCat.name,
        subcategory: firstCat.subcategory || firstCat.name,
        type: 'Dr',
        amount: '',
      };
    } else {
      return {
        id: Date.now() + Math.random(),
        isBankFormat: false,
        date: todayStr,
        tran_date: todayStr,
        tran_no: serial,
        account_no: 'Cash_1',
        particulars: '',
        categoryId: firstCat.id,
        categoryName: firstCat.name,
        type: firstCat.type || 'Dr',
        amount: '',
        notes: '',
      };
    }
  };

  const [rows, setRows] = useState([
    createBlankRow(1),
    createBlankRow(2),
    createBlankRow(3),
  ]);

  // When switching modes, re-initialize blank rows if empty
  useEffect(() => {
    const hasData = rows.some(r => r.amount || r.debit || r.credit || r.particulars || r.notes);
    if (!hasData) {
      setRows([
        createBlankRow(1, selectedAccount),
        createBlankRow(2, selectedAccount),
        createBlankRow(3, selectedAccount)
      ]);
    }
  }, [isCashTrackerMode]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isStagedFromFile, setIsStagedFromFile] = useState(false);

  const handleAccountChange = (newAcc) => {
    setSelectedAccount(newAcc);
    setRows(prevRows => prevRows.map(r => ({
      ...r,
      account_no: (!r.account_no || r.account_no === selectedAccount || r.account_no === 'Cash_1') ? newAcc : r.account_no
    })));
  };

  const handleAddRow = () => {
    setRows([...rows, createBlankRow(rows.length + 1, selectedAccount)]);
  };

  const handleRemoveRow = (index) => {
    if (rows.length === 1) {
      setError('At least one row must remain in the grid.');
      return;
    }
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated);
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...rows];
    const targetRow = { ...updated[index] };

    if (field === 'debit') {
      targetRow.debit = value;
      const numVal = parseFloat(value);
      if (!isNaN(numVal) && numVal > 0) {
        targetRow.credit = 0;
        targetRow.type = 'Dr';
        targetRow.amount = numVal;
      } else if (!targetRow.credit) {
        targetRow.amount = '';
      }
    } else if (field === 'credit') {
      targetRow.credit = value;
      const numVal = parseFloat(value);
      if (!isNaN(numVal) && numVal > 0) {
        targetRow.debit = 0;
        targetRow.type = 'Cr';
        targetRow.amount = numVal;
      } else if (!targetRow.debit) {
        targetRow.amount = '';
      }
    } else if (field === 'particulars') {
      targetRow.particulars = value;
      targetRow.notes = value;
      if (!targetRow._manualCategory && categories.length > 0) {
        const classified = classifyParticulars(value, categories);
        if (classified && classified.categoryName) {
          targetRow.categoryId = classified.categoryId;
          targetRow.categoryName = classified.categoryName;
          targetRow.subcategory = classified.subcategory || classified.categoryName;
          if (!targetRow.debit && !targetRow.credit) {
            targetRow.type = classified.type;
          }
        }
      }
    } else if (field === 'categoryId') {
      const selectedCat = categories.find((c) => String(c.id) === String(value));
      if (selectedCat) {
        targetRow.categoryId = selectedCat.id;
        targetRow.categoryName = selectedCat.name;
        targetRow.subcategory = selectedCat.subcategory || selectedCat.name;
        targetRow.division = selectedCat.division || 'LIVING';
        targetRow.category = selectedCat.category || 'General';
        targetRow.subType = selectedCat.sub_type || null;
        targetRow.transactionType = selectedCat.transaction_type || 'ACTUAL';
        targetRow._manualCategory = true;
        if (!targetRow.debit && !targetRow.credit) {
          targetRow.type = selectedCat.type;
        }
        // Auto-recommend dimensions based on category keywords
        const sub = (selectedCat.subcategory || selectedCat.name || '').toUpperCase();
        if (targetRow.type === 'Dr') {
          targetRow.profitCenter = '';
          if (sub.includes('PETROL') || sub.includes('TRANSPORT') || sub.includes('BIKE') || sub.includes('CAR')) {
            targetRow.costCenter = 'Vehicle';
            targetRow.budget = 'Travel Budget';
          } else if (sub.includes('FOOD') || sub.includes('DINING') || sub.includes('SNACK')) {
            targetRow.costCenter = 'Self';
            targetRow.budget = 'Food Budget';
          } else if (sub.includes('GROCERIES') || sub.includes('HOUSE') || sub.includes('MAINTENANCE')) {
            targetRow.costCenter = 'Home';
            targetRow.budget = 'Home Budget';
          } else if (sub.includes('MEDICAL') || sub.includes('HEALTH')) {
            targetRow.costCenter = 'Health';
            targetRow.budget = 'Healthcare Budget';
          }
        } else if (targetRow.type === 'Cr') {
          targetRow.costCenter = '';
          targetRow.budget = '';
          if (sub.includes('SALARY') || sub.includes('PAYROLL')) {
            targetRow.profitCenter = 'Salary';
          } else if (sub.includes('FREELANCE') || sub.includes('CONSULTING')) {
            targetRow.profitCenter = 'Freelancing';
          } else if (sub.includes('DIVIDEND') || sub.includes('INTEREST')) {
            targetRow.profitCenter = 'Investments';
          }
        }
      }
    } else if (field === 'date' || field === 'tran_date') {
      targetRow.date = value;
      targetRow.tran_date = value;
    } else {
      targetRow[field] = value;
    }

    updated[index] = targetRow;
    setRows(updated);
  };

  const handleSubmitBulk = () => {
    setError('');
    setSuccess('');

    const validRows = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      let amount = 0;
      let type = r.type || 'Dr';

      if (isCashTrackerMode) {
        const parsedAmount = parseFloat(r.amount);
        if (!r.amount && !r.notes) continue;
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          setError(`Row #${i + 1}: Amount must be a positive number.`);
          return;
        }
        amount = parsedAmount;
        type = r.type || 'Dr';
      } else {
        const debitNum = parseFloat(r.debit || 0);
        const creditNum = parseFloat(r.credit || 0);

        if (!debitNum && !creditNum && !r.particulars) continue;

        if (creditNum > 0) {
          amount = creditNum;
          type = 'Cr';
        } else if (debitNum > 0) {
          amount = debitNum;
          type = 'Dr';
        } else if (r.amount && parseFloat(r.amount) > 0) {
          amount = parseFloat(r.amount);
          type = r.type || 'Dr';
        } else {
          setError(`Row #${i + 1}: Please specify a valid Debit or Credit amount.`);
          return;
        }
      }

      const catObj = (categories || []).find((c) => String(c.id) === String(r.categoryId));
      const targetAccCode = isCashTrackerMode ? 'Cash_1' : (r.account_no || selectedAccount || defaultBankAcc);
      const matchedAcc = (accounts || []).find(a => a.code === targetAccCode || a.name === targetAccCode);

      validRows.push({
        date: r.date || r.tran_date || todayStr,
        tran_date: r.date || r.tran_date || todayStr,
        tran_no: r.tran_no || (i + 1),
        tranNo: r.tran_no || (i + 1),
        accountNo: targetAccCode,
        account_no: targetAccCode,
        account_id: matchedAcc?.id || null,
        particulars: (r.particulars || r.notes || '').trim(),
        notes: (r.particulars || r.notes || '').trim(),
        debit: type === 'Dr' ? amount : 0.00,
        credit: type === 'Cr' ? amount : 0.00,
        balance: parseFloat(r.balance || 0),
        amount: amount,
        type: type,
        categoryId: catObj?.id || r.categoryId || null,
        categoryName: catObj?.name || r.categoryName || 'General',
        subcategory: catObj?.subcategory || catObj?.name || r.categoryName || 'General',
        category: catObj?.category || r.category || null,
        division: catObj?.division || r.division || null,
        groupType: catObj?.group_type || catObj?.division || null,
        netType: catObj?.net_type || catObj?.sub_type || null,
        subType: catObj?.sub_type || r.subType || null,
        transactionType: catObj?.transaction_type || r.transactionType || 'ACTUAL',
        costCenter: type === 'Dr' ? (r.costCenter || null) : null,
        profitCenter: type === 'Cr' ? (r.profitCenter || null) : null,
        budget: type === 'Dr' ? (r.budget || null) : null,
        project: r.project || null,
        auditStatus: 'draft',
      });
    }

    if (validRows.length === 0) {
      setError(isCashTrackerMode
        ? 'Please fill in at least one cash line item with a valid amount.'
        : 'Please fill in at least one bank statement row with a valid debit or credit amount.'
      );
      return;
    }

    onAddBulkTransactions(validRows);
    setSuccess(`Successfully committed ${validRows.length} ${isCashTrackerMode ? 'cash' : 'bank'} transactions to database!`);
    setIsStagedFromFile(false);
    setRows([
      createBlankRow(1, selectedAccount),
      createBlankRow(2, selectedAccount),
      createBlankRow(3, selectedAccount)
    ]);

    setTimeout(() => {
      setSuccess('');
    }, 4000);
  };

  // Upload Excel file and load rows into UI grid state for review
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const parsed = await parseTransactionsExcel(file, categories);
      if (parsed.length === 0) {
        setError('No valid transaction rows found in uploaded file.');
        return;
      }

      if (isCashTrackerMode) {
        // Enforce physical cash mode strictly
        const cashRows = parsed.map((p, idx) => ({
          ...p,
          id: `staged_cash_${Date.now()}_${idx}`,
          isBankFormat: false,
          account_no: 'Cash_1',
          accountNo: 'Cash_1',
          notes: p.notes || p.particulars || '',
          particulars: p.notes || p.particulars || ''
        }));
        setRows(cashRows);
        setIsStagedFromFile(true);
        setSuccess(`Loaded ${cashRows.length} cash rows from "${file.name}" for physical ledger review! Inspect values below and click "Submit".`);
      } else {
        // Enforce bank statement mode strictly with selected bank account
        const bankRows = parsed.map((p, idx) => ({
          ...p,
          id: `staged_bank_${Date.now()}_${idx}`,
          isBankFormat: true,
          account_no: p.account_no && p.account_no !== 'Cash_1' ? p.account_no : selectedAccount,
          accountNo: p.account_no && p.account_no !== 'Cash_1' ? p.account_no : selectedAccount,
        }));
        setRows(bankRows);
        setIsStagedFromFile(true);
        setSuccess(`Loaded ${bankRows.length} bank statement rows from "${file.name}" for review! Inspect values below and click "Submit".`);
      }

      setError('');
      e.target.value = '';
    } catch (err) {
      setError(`Failed to parse file: ${err.message}`);
    }
  };

  const handleDelete = (id) => {
    if (onDeleteTransaction) {
      onDeleteTransaction(id);
      setDeleteConfirmId(null);
    }
  };

  // Calculate live summary stats of staged rows
  const stagedCount = rows.filter(r => r.amount || r.debit || r.credit || r.particulars || r.notes).length;
  const totalDebitSum = rows.reduce((acc, r) => acc + (parseFloat(r.debit || (r.type === 'Dr' ? r.amount : 0)) || 0), 0);
  const totalCreditSum = rows.reduce((acc, r) => acc + (parseFloat(r.credit || (r.type === 'Cr' ? r.amount : 0)) || 0), 0);
  const netMovement = totalCreditSum - totalDebitSum;

  // Filter transactions strictly according to module:
  // Cash Tracker shows ONLY Cash_1 records.
  // Bank Transaction Entry shows ONLY non-Cash_1 records (Bank/Card/Loan accounts).
  const relevantTransactions = (transactions || []).filter(tx => {
    const acc = tx.accountNo || tx.account_no;
    if (isCashTrackerMode) {
      return acc === 'Cash_1';
    } else {
      return acc !== 'Cash_1';
    }
  });

  const recentTransactions = [...relevantTransactions]
    .sort((a, b) => {
      const dateA = a.date || a.tran_date || '';
      const dateB = b.date || b.tran_date || '';
      const dateDiff = dateB.localeCompare(dateA);
      if (dateDiff !== 0) return dateDiff;
      return (b.id || 0) - (a.id || 0);
    })
    .slice(0, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.875rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: isCashTrackerMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              color: isCashTrackerMode ? '#10b981' : '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {isCashTrackerMode ? <Banknote size={24} /> : <Landmark size={24} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
                  {isCashTrackerMode ? 'Cash Tracker & Physical Ledger' : 'Bank Transaction Entry & Ledger'}
                </h2>
                <span className={`badge ${isCashTrackerMode ? 'badge-cr' : 'badge-primary'}`} style={{ fontSize: '0.7rem' }}>
                  {isCashTrackerMode ? '💵 CASH FORMAT' : '🏦 BANK STATEMENT FORMAT'}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                {isCashTrackerMode
                  ? 'Standard Cash Format: Date | Category | Type | Amount | Notes'
                  : 'Standard Bank Format: tran_date | tran_no | account_no | particulars | debit | credit | balance'
                }
              </p>
            </div>
          </div>

          {/* Action Controls: Dedicated to each module — no cross-format switcher pills */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            
            {/* Account Display / Selector */}
            {isCashTrackerMode ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                padding: '0.35rem 0.8rem',
                borderRadius: '8px',
                color: 'var(--accent-cr)'
              }}>
                <Banknote size={15} color="var(--accent-cr)" />
                <span style={{ fontSize: '0.78125rem', fontWeight: '800' }}>Account: Cash (Cash_1)</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-input)', padding: '0.25rem 0.65rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <Landmark size={14} color="#3b82f6" />
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Bank Account:</label>
                <select
                  value={selectedAccount}
                  onChange={(e) => handleAccountChange(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontWeight: '700',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {bankAccountOptions.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Download Template Button */}
            <button
              onClick={() => {
                if (isCashTrackerMode) {
                  downloadCashTransactionTemplate();
                } else {
                  downloadBankTransactionTemplate(selectedAccount);
                }
              }}
              className="btn btn-secondary btn-sm"
              title={isCashTrackerMode
                ? "Download Cash Excel Template (Date, Category, Type, Amount, Notes)"
                : "Download Bank Statement Excel Template (tran_date, tran_no, account_no, particulars, debit, credit, balance)"
              }
              style={{ fontWeight: '700', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Download size={15} />
              <span>{isCashTrackerMode ? 'Download Cash Template' : 'Download Bank Template'}</span>
            </button>

            {/* Import Excel / CSV Button */}
            <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', fontWeight: '700', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Upload size={15} />
              <span>{isCashTrackerMode ? 'Import Cash Excel / CSV' : 'Import Bank Statement'}</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>

            {/* Quick Link to Accounts */}
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('accounts')}
              className="btn btn-ghost btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.78125rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}
              title="Return to Accounts Master"
            >
              <Landmark size={14} color="#3b82f6" />
              <span>Accounts</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Financial Metrics Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.75rem'
      }}>
        <div className="glass-card" style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Staged Line Items
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              {stagedCount} <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>/ {rows.length} rows</span>
            </div>
          </div>
          <FileSpreadsheet size={22} color={isCashTrackerMode ? '#10b981' : 'var(--primary-brand)'} />
        </div>

        <div className="glass-card" style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-dr)' }}>
              {isCashTrackerMode ? 'Total Expenses (Cash Out)' : 'Total Debits (Withdrawals)'}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-dr)' }}>
              ₹{totalDebitSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <TrendingDown size={22} color="var(--accent-dr)" />
        </div>

        <div className="glass-card" style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-cr)' }}>
              {isCashTrackerMode ? 'Total Income (Cash In)' : 'Total Credits (Deposits)'}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-cr)' }}>
              ₹{totalCreditSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <TrendingUp size={22} color="var(--accent-cr)" />
        </div>

        <div className="glass-card" style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Net Cashflow
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: netMovement >= 0 ? 'var(--accent-cr)' : 'var(--accent-dr)' }}>
              {netMovement >= 0 ? '+' : ''}₹{netMovement.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          {isCashTrackerMode ? (
            <Banknote size={22} color={netMovement >= 0 ? 'var(--accent-cr)' : 'var(--accent-dr)'} />
          ) : (
            <Landmark size={22} color={netMovement >= 0 ? 'var(--accent-cr)' : 'var(--accent-dr)'} />
          )}
        </div>
      </div>

      {/* Staged Review Alert Banner */}
      {isStagedFromFile && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          background: isCashTrackerMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
          border: isCashTrackerMode ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(59, 130, 246, 0.35)',
          color: 'var(--text-primary)',
          fontSize: '0.8125rem'
        }}>
          <Eye size={18} color={isCashTrackerMode ? '#10b981' : 'var(--primary-brand)'} style={{ flexShrink: 0 }} />
          <div>
            <strong>File Imported Successfully:</strong> {isCashTrackerMode ? 'Cash transactions' : 'Bank statements'} are loaded into the interactive review grid below. You can edit any field directly before clicking <strong>Submit</strong>.
          </div>
        </div>
      )}

      {/* Notifications */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.625rem 0.875rem',
          borderRadius: '8px',
          background: 'var(--accent-dr-bg)',
          border: '1px solid var(--accent-dr-border)',
          color: 'var(--accent-dr)',
          fontSize: '0.8125rem'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.625rem 0.875rem',
          borderRadius: '8px',
          background: 'var(--accent-cr-bg)',
          border: '1px solid var(--accent-cr-border)',
          color: 'var(--accent-cr)',
          fontSize: '0.8125rem'
        }}>
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Interactive Table Grid */}
      <div className="glass-card" style={{ padding: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.5rem 0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
              {isCashTrackerMode ? 'Interactive Cash Entry Grid' : 'Interactive Bank Statement Entry Grid'}
            </h3>
            <p style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', margin: 0 }}>
              {isCashTrackerMode
                ? 'Enter 1 single line item or multiple batch rows — click Submit when ready'
                : 'Enter 1 single line item or multiple batch rows — click Submit when ready'
              }
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              {isCashTrackerMode ? (
                /* Purely Standard Cash Columns */
                <tr>
                  <th style={{ width: '36px' }}>#</th>
                  <th style={{ minWidth: '125px' }}>Date</th>
                  <th style={{ minWidth: '160px' }}>Category</th>
                  <th style={{ minWidth: '80px' }}>Type</th>
                  <th style={{ minWidth: '115px' }}>Amount (₹)</th>
                  <th style={{ minWidth: '125px' }}>Cost Center</th>
                  <th style={{ minWidth: '125px' }}>Profit Center</th>
                  <th style={{ minWidth: '125px' }}>Budget</th>
                  <th style={{ minWidth: '180px' }}>Notes</th>
                  <th style={{ width: '50px', textAlign: 'center' }}>Action</th>
                </tr>
              ) : (
                /* Purely Bank Statement Columns */
                <tr>
                  <th style={{ width: '36px' }}>#</th>
                  <th style={{ minWidth: '120px' }}>tran_date</th>
                  <th style={{ width: '75px' }}>tran_no</th>
                  <th style={{ minWidth: '140px' }}>account_no</th>
                  <th style={{ minWidth: '200px' }}>particulars</th>
                  <th style={{ minWidth: '100px' }}>debit (₹)</th>
                  <th style={{ minWidth: '100px' }}>credit (₹)</th>
                  <th style={{ minWidth: '100px' }}>balance (₹)</th>
                  <th style={{ minWidth: '150px' }}>Category</th>
                  <th style={{ minWidth: '120px' }}>Cost Center</th>
                  <th style={{ minWidth: '120px' }}>Profit Center</th>
                  <th style={{ minWidth: '120px' }}>Budget</th>
                  <th style={{ minWidth: '110px' }}>Project</th>
                  <th style={{ width: '45px', textAlign: 'center' }}>Action</th>
                </tr>
              )}
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id || idx}>
                  <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{idx + 1}</td>
                  
                  {isCashTrackerMode ? (
                    <>
                      {/* Cash Format Columns */}
                      <td>
                        <input
                          type="date"
                          max={todayStr}
                          value={row.date || ''}
                          onChange={(e) => handleRowChange(idx, 'date', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8125rem', minHeight: '34px' }}
                        />
                      </td>

                      <td>
                        <select
                          value={row.categoryId || (categories.length > 0 ? categories[0].id : '')}
                          onChange={(e) => handleRowChange(idx, 'categoryId', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8125rem', minHeight: '34px' }}
                        >
                          {crCategories.length > 0 && (
                            <optgroup label="🟢 Credit (Income)">
                              {crCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {drCategories.length > 0 && (
                            <optgroup label="🔴 Debit (Expense)">
                              {drCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </td>

                      {/* Cost Center */}
                      <td>
                        <select
                          value={row.costCenter || ''}
                          disabled={row.type === 'Cr'}
                          onChange={(e) => handleRowChange(idx, 'costCenter', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.4rem', fontSize: '0.78125rem', minHeight: '34px' }}
                        >
                          <option value="">{row.type === 'Cr' ? '— (N/A)' : '-- Cost Center --'}</option>
                          {(masters?.cost_centers || []).map(cc => (
                            <option key={cc.code || cc.id} value={cc.name}>{cc.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* Profit Center */}
                      <td>
                        <select
                          value={row.profitCenter || ''}
                          disabled={row.type === 'Dr'}
                          onChange={(e) => handleRowChange(idx, 'profitCenter', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.4rem', fontSize: '0.78125rem', minHeight: '34px' }}
                        >
                          <option value="">{row.type === 'Dr' ? '— (N/A)' : '-- Profit Center --'}</option>
                          {(masters?.profit_centers || []).map(pc => (
                            <option key={pc.code || pc.id} value={pc.name}>{pc.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* Budget */}
                      <td>
                        <select
                          value={row.budget || ''}
                          disabled={row.type === 'Cr'}
                          onChange={(e) => handleRowChange(idx, 'budget', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.4rem', fontSize: '0.78125rem', minHeight: '34px' }}
                        >
                          <option value="">{row.type === 'Cr' ? '— (N/A)' : '-- Budget --'}</option>
                          {(masters?.budgets || []).map(b => (
                            <option key={b.code || b.id} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* Project */}
                      <td>
                        <select
                          value={row.project || ''}
                          onChange={(e) => handleRowChange(idx, 'project', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.4rem', fontSize: '0.78125rem', minHeight: '34px' }}
                        >
                          <option value="">-- Project --</option>
                          {(masters?.projects || []).map(pr => (
                            <option key={pr.code || pr.id} value={pr.name}>{pr.name}</option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <span className={row.type === 'Cr' ? 'badge badge-cr' : 'badge badge-dr'}>
                          {row.type}
                        </span>
                      </td>

                      <td>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={row.amount}
                          onChange={(e) => handleRowChange(idx, 'amount', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8125rem', fontWeight: '600', minHeight: '34px' }}
                        />
                      </td>

                      <td>
                        <select
                          value={row.costCenter || ''}
                          disabled={row.type === 'Cr'}
                          onChange={(e) => handleRowChange(idx, 'costCenter', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.4rem', fontSize: '0.78125rem', minHeight: '34px' }}
                        >
                          <option value="">{row.type === 'Cr' ? '— (N/A)' : '-- Cost Center --'}</option>
                          {(masters?.cost_centers || []).map(cc => (
                            <option key={cc.code || cc.id} value={cc.name}>{cc.name}</option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <select
                          value={row.profitCenter || ''}
                          disabled={row.type === 'Dr'}
                          onChange={(e) => handleRowChange(idx, 'profitCenter', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.4rem', fontSize: '0.78125rem', minHeight: '34px' }}
                        >
                          <option value="">{row.type === 'Dr' ? '— (N/A)' : '-- Profit Center --'}</option>
                          {(masters?.profit_centers || []).map(pc => (
                            <option key={pc.code || pc.id} value={pc.name}>{pc.name}</option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <select
                          value={row.budget || ''}
                          disabled={row.type === 'Cr'}
                          onChange={(e) => handleRowChange(idx, 'budget', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.4rem', fontSize: '0.78125rem', minHeight: '34px' }}
                        >
                          <option value="">{row.type === 'Cr' ? '— (N/A)' : '-- Budget --'}</option>
                          {(masters?.budgets || []).map(b => (
                            <option key={b.code || b.id} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <input
                          type="text"
                          placeholder="Notes / description..."
                          value={row.notes || ''}
                          onChange={(e) => handleRowChange(idx, 'notes', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8125rem', minHeight: '34px' }}
                        />
                      </td>
                    </>
                  ) : (
                    <>
                      {/* Bank Format Columns */}
                      <td>
                        <input
                          type="date"
                          value={row.date || row.tran_date || ''}
                          onChange={(e) => handleRowChange(idx, 'date', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8125rem', minHeight: '34px' }}
                        />
                      </td>

                      <td>
                        <input
                          type="text"
                          value={row.tran_no ?? (idx + 1)}
                          onChange={(e) => handleRowChange(idx, 'tran_no', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.4rem', fontSize: '0.8125rem', textAlign: 'center', minHeight: '34px' }}
                        />
                      </td>

                      <td>
                        <input
                          type="text"
                          value={row.account_no || selectedAccount || ''}
                          onChange={(e) => handleRowChange(idx, 'account_no', e.target.value)}
                          placeholder="e.g. ICICI_DM_..."
                          className="form-control"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8125rem', fontWeight: '600', minHeight: '34px' }}
                        />
                      </td>

                      <td>
                        <input
                          type="text"
                          placeholder="Transaction narration / description..."
                          value={row.particulars || row.notes || ''}
                          onChange={(e) => handleRowChange(idx, 'particulars', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8125rem', minHeight: '34px' }}
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={row.debit !== undefined ? row.debit : ''}
                          onChange={(e) => handleRowChange(idx, 'debit', e.target.value)}
                          className="form-control"
                          style={{
                            padding: '0.3rem 0.5rem',
                            fontSize: '0.8125rem',
                            fontWeight: '700',
                            color: parseFloat(row.debit) > 0 ? 'var(--accent-dr)' : 'var(--text-primary)',
                            minHeight: '34px'
                          }}
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={row.credit !== undefined ? row.credit : ''}
                          onChange={(e) => handleRowChange(idx, 'credit', e.target.value)}
                          className="form-control"
                          style={{
                            padding: '0.3rem 0.5rem',
                            fontSize: '0.8125rem',
                            fontWeight: '700',
                            color: parseFloat(row.credit) > 0 ? 'var(--accent-cr)' : 'var(--text-primary)',
                            minHeight: '34px'
                          }}
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={row.balance !== undefined ? row.balance : ''}
                          onChange={(e) => handleRowChange(idx, 'balance', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8125rem', fontWeight: '600', minHeight: '34px' }}
                        />
                      </td>

                      <td>
                        <select
                          value={row.categoryId || (categories.length > 0 ? categories[0].id : '')}
                          onChange={(e) => handleRowChange(idx, 'categoryId', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8125rem', minHeight: '34px' }}
                        >
                          {crCategories.length > 0 && (
                            <optgroup label="🟢 Credit (Income)">
                              {crCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {drCategories.length > 0 && (
                            <optgroup label="🔴 Debit (Expense)">
                              {drCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </td>
                    </>
                  )}

                  {/* Remove Button */}
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleRemoveRow(idx)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--accent-dr)', padding: '0.2rem', minHeight: 'auto' }}
                      title="Remove Row"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button onClick={handleAddRow} className="btn btn-secondary btn-sm" style={{ fontWeight: '700' }}>
            <Plus size={15} />
            <span>Add Row</span>
          </button>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => onNavigate && onNavigate('accounts')} className="btn btn-ghost btn-sm">
              Cancel
            </button>
            <button onClick={handleSubmitBulk} className="btn btn-primary btn-sm" style={{ fontWeight: '700', padding: '0.45rem 1.15rem' }}>
              <FileSpreadsheet size={15} />
              <span>Submit {stagedCount > 1 ? `(${stagedCount} Rows)` : (stagedCount === 1 ? '(1 Row)' : '')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table (Last 10 Entries) — Filtered strictly for the active module */}
      <div className="glass-card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: isCashTrackerMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              color: isCashTrackerMode ? '#10b981' : 'var(--primary-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <History size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                {isCashTrackerMode ? 'Recent Cash Transactions (Last 10 Entries)' : 'Recent Bank Transactions (Last 10 Entries)'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                {isCashTrackerMode
                  ? 'Live audit trail of your most recently committed physical cash ledger entries'
                  : 'Live audit trail of your most recently committed bank statement entries'
                }
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate && onNavigate('history')}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.78125rem', fontWeight: '700', color: isCashTrackerMode ? '#10b981' : 'var(--primary-brand)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>View All in Audit History</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                {isCashTrackerMode ? (
                  <tr>
                    <th style={{ width: '36px' }}>#</th>
                    <th style={{ minWidth: '110px' }}>Date</th>
                    <th style={{ minWidth: '160px' }}>Category</th>
                    <th style={{ width: '80px' }}>Type</th>
                    <th style={{ minWidth: '120px' }}>Amount (₹)</th>
                    <th style={{ minWidth: '240px' }}>Notes</th>
                    <th style={{ width: '70px', textAlign: 'center' }}>Action</th>
                  </tr>
                ) : (
                  <tr>
                    <th style={{ width: '36px' }}>#</th>
                    <th style={{ minWidth: '110px' }}>Date</th>
                    <th style={{ minWidth: '140px' }}>Account</th>
                    <th style={{ minWidth: '220px' }}>Particulars / Narration</th>
                    <th style={{ minWidth: '150px' }}>Category</th>
                    <th style={{ width: '80px' }}>Type</th>
                    <th style={{ minWidth: '120px' }}>Amount (₹)</th>
                    <th style={{ width: '70px', textAlign: 'center' }}>Action</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {recentTransactions.map((tx, idx) => {
                  const isCr = tx.type === 'Cr';
                  const amountNum = parseFloat(tx.amount || (isCr ? tx.credit : tx.debit) || 0);
                  const accountLabel = tx.accountNo || tx.account_no || 'Cash_1';
                  const notesText = tx.particulars || tx.notes || '-';

                  return (
                    <tr key={tx.id || idx}>
                      <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {tx.date || tx.tran_date}
                      </td>

                      {isCashTrackerMode ? (
                        <>
                          <td>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                              {tx.categoryName || tx.subcategory || tx.category || 'General'}
                            </span>
                          </td>
                          <td>
                            <span className={isCr ? 'badge badge-cr' : 'badge badge-dr'}>
                              {tx.type}
                            </span>
                          </td>
                          <td style={{
                            fontWeight: '800',
                            fontSize: '0.875rem',
                            color: isCr ? 'var(--accent-cr)' : 'var(--accent-dr)',
                            whiteSpace: 'nowrap'
                          }}>
                            {isCr ? '+' : '-'}₹{amountNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td>
                            <div style={{
                              maxWidth: '350px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.8125rem',
                              color: 'var(--text-secondary)'
                            }} title={notesText}>
                              {notesText}
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <span className="badge badge-neutral" style={{ fontSize: '0.71875rem', fontWeight: '700' }}>
                              <Landmark size={11} style={{ marginRight: '4px' }} />
                              {accountLabel}
                            </span>
                          </td>
                          <td>
                            <div style={{
                              maxWidth: '280px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.8125rem',
                              color: 'var(--text-secondary)'
                            }} title={notesText}>
                              {notesText}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                              {tx.categoryName || tx.subcategory || tx.category || 'General'}
                            </span>
                          </td>
                          <td>
                            <span className={isCr ? 'badge badge-cr' : 'badge badge-dr'}>
                              {tx.type}
                            </span>
                          </td>
                          <td style={{
                            fontWeight: '800',
                            fontSize: '0.875rem',
                            color: isCr ? 'var(--accent-cr)' : 'var(--accent-dr)',
                            whiteSpace: 'nowrap'
                          }}>
                            {isCr ? '+' : '-'}₹{amountNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </>
                      )}

                      <td style={{ textAlign: 'center' }}>
                        {deleteConfirmId === tx.id ? (
                          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="btn btn-sm"
                              style={{ background: 'var(--accent-dr)', color: '#fff', padding: '0.15rem 0.45rem', fontSize: '0.6875rem', borderRadius: '4px' }}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '0.15rem 0.35rem', fontSize: '0.6875rem' }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(tx.id)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--accent-dr)', padding: '0.2rem', minHeight: 'auto' }}
                            title="Delete Transaction"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '2rem 1rem',
            background: 'var(--bg-input)',
            borderRadius: '10px',
            border: '1px dashed var(--border-color)',
            color: 'var(--text-muted)'
          }}>
            <History size={28} style={{ margin: '0 auto 0.4rem', opacity: 0.5 }} />
            <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {isCashTrackerMode ? 'No Recent Cash Transactions' : 'No Recent Bank Transactions'}
            </div>
            <div style={{ fontSize: '0.75rem' }}>
              {isCashTrackerMode
                ? 'Use the cash entry grid above to submit your first line items.'
                : 'Use the bank statement grid above to submit your first line items.'
              }
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
