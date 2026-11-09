
export function evaluateTransactionValidation(tx) {
  const isExpense = tx.type === 'Dr';
  const isIncome = tx.type === 'Cr';
  const isRotational = (tx.transactionType || tx.transaction_type) === 'ROTATIONAL';

  if (isRotational) {
    return { status: 'valid', badge: 'ROTATIONAL', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', message: 'Internal rotational transfer' };
  }

  if (isExpense) {
    const hasProfitCenter = Boolean(tx.profitCenter || tx.profit_center);
    const hasCostCenter = Boolean(tx.costCenter || tx.cost_center);
    const hasBudget = Boolean(tx.budget);

    if (hasProfitCenter) {
      return { status: 'error', badge: 'CONFLICT', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', message: 'Profit Center invalid on Expense item' };
    }
    if (!hasCostCenter && !hasBudget) {
      return { status: 'warning', badge: 'UNTAGGED', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', message: 'Missing Cost Center & Budget' };
    }
    if (!hasCostCenter) {
      return { status: 'warning', badge: 'NO COST CENTER', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', message: 'Missing Cost Center (Who consumed?)' };
    }
    if (!hasBudget) {
      return { status: 'warning', badge: 'NO BUDGET', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', message: 'Missing Budget (Which plan?)' };
    }
    return { status: 'valid', badge: 'VALIDATED', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', message: 'Fully Tagged Expense' };
  }

  if (isIncome) {
    const hasCostCenter = Boolean(tx.costCenter || tx.cost_center);
    const hasProfitCenter = Boolean(tx.profitCenter || tx.profit_center);

    if (hasCostCenter) {
      return { status: 'error', badge: 'CONFLICT', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', message: 'Cost Center invalid on Income item' };
    }
    if (!hasProfitCenter) {
      return { status: 'warning', badge: 'NO PROFIT CENTER', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', message: 'Missing Profit Center (Who earned?)' };
    }
    return { status: 'valid', badge: 'VALIDATED', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', message: 'Fully Tagged Income' };
  }

  return { status: 'valid', badge: 'VALID', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', message: 'Valid' };
}

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Zap,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  FastForward,
  RotateCcw,
  Download,
  PlusCircle,
  Filter,
  Search,
  Check,
  X,
  AlertCircle,
  Tag,
  ArrowRight,
  Trash2,
  Edit2,
  Layers,
  Sparkles,
  HelpCircle,
  Landmark,
  TrendingUp,
  TrendingDown,
  Scale,
  ListFilter,
  CheckSquare,
  Square
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { updateTransactionAPI, deleteTransactionAPI, bulkAuditTransactionsAPI, addTransactionAPI } from '../utils/api';
import SlicerBar from './SlicerBar';
import DataTablePagination, { useDataTablePagination } from './DataTablePagination';

export default function TransactionValidationView({
  transactions = [],
  categories = [],
  accounts = [],
  masters = { budgets: [], cost_centers: [], profit_centers: [], projects: [] },
  onReloadTransactions,
  onNavigateToEntry
}) {
  // Extract all distinct dates that have transactions (sorted descending: newest first)
  const availableDates = useMemo(() => {
    const dates = new Set();
    transactions.forEach(t => {
      const d = t.date || t.tran_date;
      if (d) dates.add(d);
    });
    return Array.from(dates).sort((a, b) => new Date(b) - new Date(a));
  }, [transactions]);

  // Selected Date state (defaults to latest available date or today)
  const [selectedDate, setSelectedDate] = useState(() => {
    if (availableDates.length > 0) return availableDates[0];
    return new Date().toISOString().substring(0, 10);
  });

  // Keep selected date valid if availableDates change and selectedDate is not set
  useEffect(() => {
    if (!selectedDate && availableDates.length > 0) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  const [accountFilter, setAccountFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [flowTypeFilter, setFlowTypeFilter] = useState('ALL');
  const [searchParticulars, setSearchParticulars] = useState('');
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: 'success' });
  const [editingRowId, setEditingRowId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);
  const [bulkSelectedSubcat, setBulkSelectedSubcat] = useState('');
  const [bulkCostCenter, setBulkCostCenter] = useState('');
  const [bulkProfitCenter, setBulkProfitCenter] = useState('');
  const [bulkBudget, setBulkBudget] = useState('');
  const [bulkProject, setBulkProject] = useState('');
  const [validationFilter, setValidationFilter] = useState('ALL');
  const [onlyPendingDatesFilter, setOnlyPendingDatesFilter] = useState(false);
  const [fastAuditMode, setFastAuditMode] = useState(true);
  const [showAnalyticsCards, setShowAnalyticsCards] = useState(false); // Fast validation mode (0 horizontal scroll) vs 19-col Detailed Ledger

  // Fallback dimension master options
  const costCenterOptions = useMemo(() => {
    if (masters?.cost_centers && masters.cost_centers.length > 0) return masters.cost_centers;
    return [
      { name: 'Self' }, { name: 'Home' }, { name: 'Vehicle' },
      { name: 'Family' }, { name: 'Health' }, { name: 'Education' },
      { name: 'Business' }, { name: 'Tech/Office' }
    ];
  }, [masters?.cost_centers]);

  const profitCenterOptions = useMemo(() => {
    if (masters?.profit_centers && masters.profit_centers.length > 0) return masters.profit_centers;
    return [
      { name: 'Varun Salary' }, { name: 'Freelance & Consulting' },
      { name: 'Real Estate / Rental' }, { name: 'Investments & Portfolio' },
      { name: 'Other Income' }
    ];
  }, [masters?.profit_centers]);

  const budgetOptions = useMemo(() => {
    if (masters?.budgets && masters.budgets.length > 0) return masters.budgets;
    return [
      { name: 'Home & Living Budget' }, { name: 'Food & Dining Budget' },
      { name: 'Mobility & Fuel Budget' }, { name: 'Discretionary Lifestyle' },
      { name: 'Emergency & Health' }, { name: 'Education & Growth' },
      { name: 'Savings & Investments' }
    ];
  }, [masters?.budgets]);

  const projectOptions = useMemo(() => {
    if (masters?.projects && masters.projects.length > 0) return masters.projects;
    return [
      { name: 'General Household' }, { name: 'Vehicle Maintenance' },
      { name: 'Home Renovation' }, { name: 'Vacation & Travel' }
    ];
  }, [masters?.projects]);

  // All transactions strictly for selected date (for aggregate metrics & slicer counts)
  const rawDateTxs = useMemo(() => {
    return transactions.filter(t => (t.date || t.tran_date) === selectedDate);
  }, [transactions, selectedDate]);

  // Filter transactions for the selected date
  const dateTransactions = useMemo(() => {
    return rawDateTxs.filter(t => {
      const matchesMulti = (filterVal, itemVal) => {
        if (!filterVal || filterVal === 'ALL') return true;
        if (Array.isArray(filterVal)) {
          if (filterVal.length === 0 || filterVal.includes('ALL')) return true;
          return filterVal.includes(itemVal);
        }
        return filterVal === itemVal;
      };

      const acc = t.accountNo || t.account_no || 'Cash_1';
      if (!matchesMulti(accountFilter, acc)) return false;

      const st = t.auditStatus || t.audit_status || 'draft';
      if (!matchesMulti(statusFilter, st)) return false;

      if (!matchesMulti(flowTypeFilter, t.type)) return false;

      if (searchParticulars) {
        const query = searchParticulars.toLowerCase();
        const p = (t.notes || t.particulars || '').toLowerCase();
        const sub = (t.subcategory || t.categoryName || '').toLowerCase();
        const no = (t.tranNo || t.tran_no || '').toLowerCase();
        const utr = (t.utrNo || t.utr_no || '').toLowerCase();
        if (!p.includes(query) && !sub.includes(query) && !no.includes(query) && !utr.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [rawDateTxs, accountFilter, statusFilter, flowTypeFilter, searchParticulars]);

  // DataTable Pagination Hook for Line Items
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedDateTransactions,
    PaginationComponent,
    getSortHeaderProps,
    renderSortIndicator
  } = useDataTablePagination(dateTransactions, 15);

  // Slicer Groups for Daily Transactions
  const dateAccountCounts = useMemo(() => {
    const counts = {};
    rawDateTxs.forEach(t => {
      const acc = t.accountNo || t.account_no || 'Cash_1';
      counts[acc] = (counts[acc] || 0) + 1;
    });
    return counts;
  }, [rawDateTxs]);

  const validationSlicerGroups = [
    {
      id: 'status',
      label: 'Audit Status',
      icon: ShieldCheck,
      selected: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'ALL', label: 'All Statuses', count: rawDateTxs.length },
        { value: 'draft', label: 'Draft / Pending', count: rawDateTxs.filter(t => (t.auditStatus || t.audit_status || 'draft') === 'draft').length, color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' },
        { value: 'verified', label: 'Verified', count: rawDateTxs.filter(t => (t.auditStatus || t.audit_status) === 'verified').length, color: 'var(--primary-brand)', bg: 'rgba(59, 130, 246, 0.15)' },
        { value: 'locked', label: 'Locked / Finalized', count: rawDateTxs.filter(t => (t.auditStatus || t.audit_status) === 'frozen').length, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' }
      ]
    },
    {
      id: 'flow',
      label: 'Flow Type',
      icon: Layers,
      selected: flowTypeFilter,
      onChange: setFlowTypeFilter,
      options: [
        { value: 'ALL', label: 'All Types (Cr & Dr)', count: rawDateTxs.length },
        { value: 'Cr', label: 'Credit (Inflow)', count: rawDateTxs.filter(t => t.type === 'Cr').length, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
        { value: 'Dr', label: 'Debit (Outflow)', count: rawDateTxs.filter(t => t.type === 'Dr').length, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' }
      ]
    },
    {
      id: 'account',
      label: 'Target Account',
      icon: Landmark,
      selected: accountFilter,
      onChange: setAccountFilter,
      options: [
        { value: 'ALL', label: 'All Accounts', count: rawDateTxs.length },
        ...accounts.map(a => {
          const code = a.code || a.id || a.name;
          return {
            value: code,
            label: a.name || code,
            count: dateAccountCounts[code] || 0
          };
        }).filter(o => o.count > 0 || accounts.length <= 10)
      ]
    }
  ];

  // Daily statistics for selected date
  const dayStats = useMemo(() => {
    const allForDate = transactions.filter(t => (t.date || t.tran_date) === selectedDate);
    const totalLines = allForDate.length;
    let totalCredits = 0;
    let totalDebits = 0;
    let crCount = 0;
    let drCount = 0;
    let draftCount = 0;
    let verifiedCount = 0;
    let lockedCount = 0;

    allForDate.forEach(t => {
      const amt = Number(t.amount || 0);
      if (t.type === 'Cr') {
        totalCredits += amt;
        crCount++;
      } else {
        totalDebits += amt;
        drCount++;
      }

      const st = t.auditStatus || t.audit_status || 'draft';
      if (st === 'frozen' || st === 'locked') lockedCount++;
      else if (st === 'verified') verifiedCount++;
      else draftCount++;
    });

    const netFlow = totalCredits - totalDebits;
    const isFullyLocked = totalLines > 0 && lockedCount === totalLines;
    const isFullyVerified = totalLines > 0 && (verifiedCount + lockedCount === totalLines);
    const progressPct = totalLines > 0 ? Math.round(((verifiedCount + lockedCount) / totalLines) * 100) : 0;

    return {
      totalLines,
      totalCredits,
      totalDebits,
      crCount,
      drCount,
      netFlow,
      draftCount,
      verifiedCount,
      lockedCount,
      isFullyLocked,
      isFullyVerified,
      progressPct
    };
  }, [transactions, selectedDate]);

  // Dates with pending review (sorted descending: newest first)
  const datesWithPending = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const st = t.auditStatus || t.audit_status || 'draft';
      const d = t.date || t.tran_date;
      if (d && st === 'draft') {
        map[d] = (map[d] || 0) + 1;
      }
    });
    return Object.keys(map).sort((a, b) => new Date(b) - new Date(a)).map(d => ({
      date: d,
      pendingCount: map[d]
    }));
  }, [transactions]);

  // All dates summary for the "Jump to Date" quick selector
  const allDatesSummary = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const d = t.date || t.tran_date;
      if (!d) return;
      if (!map[d]) {
        map[d] = { total: 0, pending: 0, verified: 0, locked: 0 };
      }
      map[d].total++;
      const st = t.auditStatus || t.audit_status || 'draft';
      if (st === 'frozen' || st === 'locked') map[d].locked++;
      else if (st === 'verified') map[d].verified++;
      else map[d].pending++;
    });

    return Object.keys(map).sort((a, b) => new Date(b) - new Date(a)).map(d => ({
      date: d,
      ...map[d]
    }));
  }, [transactions]);

  // Stepping date logic: direction = -1 means Older (Prev), direction = 1 means Newer (Next)
  const handleStepDate = (direction) => {
    if (!selectedDate) {
      if (availableDates.length > 0) setSelectedDate(availableDates[0]);
      return;
    }
    const currIndex = availableDates.indexOf(selectedDate);
    if (currIndex !== -1) {
      // availableDates is sorted descending: [newer, older]
      // Older date (direction -1) => currIndex + 1
      // Newer date (direction 1) => currIndex - 1
      const targetIndex = direction === -1 ? currIndex + 1 : currIndex - 1;
      if (targetIndex >= 0 && targetIndex < availableDates.length) {
        setSelectedDate(availableDates[targetIndex]);
        return;
      }
    }
    // Fallback calendar day addition/subtraction
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + direction);
    setSelectedDate(d.toISOString().substring(0, 10));
  };

  // Jump to Next Available Date that has Pending (draft) items
  const handleJumpNextPending = () => {
    if (datesWithPending.length === 0) {
      showToast("🎉 All transaction dates are 100% verified and locked!", "success");
      return;
    }

    // Find next date in datesWithPending after or different from selectedDate
    const nextPending = datesWithPending.find(item => item.date < selectedDate) || datesWithPending[0];
    if (nextPending) {
      setSelectedDate(nextPending.date);
      showToast(`Navigated to ${nextPending.date} (${nextPending.pendingCount} pending items)`, "info");
    }
  };

  const handleJumpToday = () => {
    const today = new Date().toISOString().substring(0, 10);
    setSelectedDate(today);
  };

  const handleJumpLatest = () => {
    if (availableDates.length > 0) {
      setSelectedDate(availableDates[0]);
    }
  };

  const showToast = (text, type = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage({ text: '', type: 'success' }), 4000);
  };

  // Toggle selection for active page
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRowIds(paginatedDateTransactions.map(t => t.id));
    } else {
      setSelectedRowIds([]);
    }
  };

  const handleToggleRow = (id) => {
    setSelectedRowIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Single Row Verification toggle
  const handleVerifyRow = async (tx) => {
    try {
      setActionLoading(true);
      await updateTransactionAPI({
        id: tx.id,
        auditStatus: 'verified'
      });
      showToast(`Line #${tx.tranNo || tx.id} verified successfully!`);
      if (onReloadTransactions) await onReloadTransactions();
    } catch (err) {
      alert("Failed to verify transaction: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Single Row Lock toggle
  const handleLockRow = async (tx) => {
    try {
      setActionLoading(true);
      await updateTransactionAPI({
        id: tx.id,
        auditStatus: 'frozen'
      });
      showToast(`Line #${tx.tranNo || tx.id} locked & finalized!`);
      if (onReloadTransactions) await onReloadTransactions();
    } catch (err) {
      alert("Failed to lock transaction: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Single Row Unlock toggle
  const handleUnlockRow = async (tx) => {
    try {
      setActionLoading(true);
      await updateTransactionAPI({
        id: tx.id,
        auditStatus: 'verified'
      });
      showToast(`Line #${tx.tranNo || tx.id} unlocked for editing!`, "info");
      if (onReloadTransactions) await onReloadTransactions();
    } catch (err) {
      alert("Failed to unlock transaction: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Fast-Audit: Direct Category selection without opening edit mode
  const handleQuickSubcatChange = async (tx, newSubcat) => {
    if ((tx.auditStatus || tx.audit_status) === 'frozen') {
      alert("This transaction is locked. Please unlock it first to edit.");
      return;
    }
    if (!newSubcat) return;

    try {
      setActionLoading(true);
      const matchedCat = categories.find(c => (c.subcategory || c.name) === newSubcat);
      const isExp = tx.type === 'Dr';
      const isInc = tx.type === 'Cr';
      const sub = (newSubcat || '').toUpperCase();

      // Auto-suggest cost center / budget for expense, profit center for income
      let recCostCenter = tx.costCenter || tx.cost_center;
      let recProfitCenter = tx.profitCenter || tx.profit_center;
      let recBudget = tx.budget;

      if (isExp) {
        recProfitCenter = null;
        if (!recCostCenter) {
          if (sub.includes('PETROL') || sub.includes('TRANSPORT') || sub.includes('BIKE') || sub.includes('CAR')) {
            recCostCenter = 'Vehicle';
            recBudget = recBudget || 'Travel Budget';
          } else if (sub.includes('FOOD') || sub.includes('SNACK') || sub.includes('DINING')) {
            recCostCenter = 'Self';
            recBudget = recBudget || 'Food Budget';
          } else if (sub.includes('GROCERIES') || sub.includes('HOUSE') || sub.includes('MAINTENANCE')) {
            recCostCenter = 'Home';
            recBudget = recBudget || 'Home Budget';
          } else if (sub.includes('MEDICAL') || sub.includes('HEALTH')) {
            recCostCenter = 'Health';
            recBudget = recBudget || 'Healthcare Budget';
          } else if (sub.includes('EDUCATION') || sub.includes('LEARNING')) {
            recCostCenter = 'Education';
            recBudget = recBudget || 'Home Budget';
          } else {
            recCostCenter = 'Self';
            recBudget = recBudget || 'Home Budget';
          }
        }
      } else if (isInc) {
        recCostCenter = null;
        recBudget = null;
        if (!recProfitCenter) {
          if (sub.includes('SALARY') || sub.includes('PAYROLL')) recProfitCenter = 'Salary';
          else if (sub.includes('FREELANCE') || sub.includes('CONSULTING')) recProfitCenter = 'Freelancing';
          else if (sub.includes('DIVIDEND') || sub.includes('INTEREST')) recProfitCenter = 'Investments';
          else recProfitCenter = 'Salary';
        }
      }

      await updateTransactionAPI({
        id: tx.id,
        categoryId: matchedCat?.id || null,
        categoryName: matchedCat?.name || newSubcat,
        subcategory: matchedCat?.subcategory || newSubcat,
        category: matchedCat?.category || null,
        division: matchedCat?.division || null,
        groupType: matchedCat?.group_type || matchedCat?.division || null,
        netType: matchedCat?.net_type || matchedCat?.sub_type || null,
        subType: matchedCat?.sub_type || null,
        transactionType: matchedCat?.transaction_type || tx.transactionType || 'ACTUAL',
        costCenter: recCostCenter,
        profitCenter: recProfitCenter,
        budget: recBudget
      });

      showToast(`Line #${tx.tranNo || tx.id}: Category set to "${newSubcat}"`);
      if (onReloadTransactions) await onReloadTransactions();
    } catch (err) {
      alert("Failed to update category: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Fast-Audit: Direct Field change (Cost Center, Profit Center, Budget, Project, UTR)
  const handleQuickDimensionChange = async (tx, field, value) => {
    if ((tx.auditStatus || tx.audit_status) === 'frozen') {
      alert("This transaction is locked. Please unlock it first to edit.");
      return;
    }
    try {
      setActionLoading(true);
      const payload = { id: tx.id };
      if (field === 'costCenter') payload.costCenter = value || null;
      if (field === 'profitCenter') payload.profitCenter = value || null;
      if (field === 'budget') payload.budget = value || null;
      if (field === 'project') payload.project = value || null;
      if (field === 'utrNo') payload.utrNo = value || null;

      await updateTransactionAPI(payload);
      showToast(`Line #${tx.tranNo || tx.id}: ${field} updated`);
      if (onReloadTransactions) await onReloadTransactions();
    } catch (err) {
      alert("Failed to update " + field + ": " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Fast-Audit: Auto-classify all draft lines for this date using intelligent particular rules
  const handleAutoClassifyDate = async () => {
    const drafts = dateTransactions.filter(t => (t.auditStatus || t.audit_status) === 'draft');
    if (drafts.length === 0) {
      showToast("No draft transactions on this date to classify.", "info");
      return;
    }

    try {
      setActionLoading(true);
      let count = 0;
      for (const tx of drafts) {
        const text = tx.notes || tx.particulars || '';
        if (!text) continue;

        // Auto-match against categories
        const upper = text.toUpperCase();
        let matched = null;
        for (const c of categories) {
          const sub = (c.subcategory || c.name || '').toUpperCase();
          if (sub && upper.includes(sub)) {
            matched = c;
            break;
          }
        }

        if (matched) {
          await updateTransactionAPI({
            id: tx.id,
            categoryId: matched.id,
            categoryName: matched.name,
            subcategory: matched.subcategory || matched.name,
            category: matched.category,
            division: matched.division,
            groupType: matched.group_type || matched.division,
            subType: matched.sub_type,
            transactionType: matched.transaction_type || 'ACTUAL'
          });
          count++;
        }
      }

      showToast(`Auto-classified ${count} transaction line(s)!`);
      if (onReloadTransactions) await onReloadTransactions();
    } catch (err) {
      alert("Auto-classify failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Start inline editing
  const handleStartEdit = (tx) => {
    if ((tx.auditStatus || tx.audit_status) === 'frozen') {
      alert("This transaction is locked. Please unlock it first to edit.");
      return;
    }
    setEditingRowId(tx.id);
    setEditFormData({
      subcategory: tx.subcategory || tx.categoryName || '',
      transactionType: tx.transactionType || 'ACTUAL',
      budget: tx.budget || '',
      costCenter: tx.costCenter || tx.cost_center || '',
      profitCenter: tx.profitCenter || tx.profit_center || '',
      project: tx.project || '',
      notes: tx.notes || tx.particulars || '',
      tagging: tx.tagging || '',
      utrNo: tx.utrNo || tx.utr_no || '',
      amount: tx.amount || 0,
      remarks: tx.remarks || '',
      type: tx.type
    });
  };

  // Save inline edits
  const handleSaveEdit = async (txId) => {
    try {
      setActionLoading(true);
      const matchedCat = categories.find(c => (c.subcategory || c.name) === editFormData.subcategory);
      const isExpense = editFormData.type === 'Dr';
      const isIncome = editFormData.type === 'Cr';

      // Enforce transaction-wise dimension rules
      let finalCostCenter = editFormData.costCenter;
      let finalProfitCenter = editFormData.profitCenter;
      if (isExpense) {
        finalProfitCenter = null; // Expenses cannot have Profit Center
      } else if (isIncome) {
        finalCostCenter = null; // Income cannot have Cost Center
      }

      await updateTransactionAPI({
        id: txId,
        categoryId: matchedCat?.id || null,
        categoryName: matchedCat?.name || editFormData.subcategory,
        subcategory: matchedCat?.subcategory || editFormData.subcategory,
        category: matchedCat?.category || null,
        division: matchedCat?.division || null,
        groupType: matchedCat?.group_type || matchedCat?.division || null,
        netType: matchedCat?.net_type || matchedCat?.sub_type || null,
        subType: matchedCat?.sub_type || null,
        transactionType: editFormData.transactionType || matchedCat?.transaction_type || 'ACTUAL',
        budget: editFormData.budget || null,
        costCenter: finalCostCenter,
        profitCenter: finalProfitCenter,
        project: editFormData.project || null,
        notes: editFormData.notes,
        remarks: editFormData.remarks,
        tagging: editFormData.tagging,
        utrNo: editFormData.utrNo,
        amount: Number(editFormData.amount || 0)
      });
      setEditingRowId(null);
      showToast("Transaction updated successfully!");
      if (onReloadTransactions) await onReloadTransactions();
    } catch (err) {
      alert("Failed to save changes: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Actions on Selected Rows
  const handleBulkVerifySelected = async () => {
    if (selectedRowIds.length === 0) return;
    try {
      setActionLoading(true);
      await bulkAuditTransactionsAPI({
        ids: selectedRowIds,
        auditStatus: 'verified'
      });
      showToast(`Verified ${selectedRowIds.length} selected transaction(s)!`);
      setSelectedRowIds([]);
      if (onReloadTransactions) await onReloadTransactions();
    } catch (err) {
      alert("Failed to verify selected: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkLockSelected = async () => {
    if (selectedRowIds.length === 0) return;
    try {
      setActionLoading(true);
      await bulkAuditTransactionsAPI({
        ids: selectedRowIds,
        auditStatus: 'frozen'
      });
      showToast(`🔒 Locked ${selectedRowIds.length} selected transaction(s)!`);
      setSelectedRowIds([]);
      if (onReloadTransactions) await onReloadTransactions();
    } catch (err) {
      alert("Failed to lock selected: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDeleteSelected = async () => {
    if (selectedRowIds.length === 0) return;
    const targetLines = dateTransactions.filter(t => selectedRowIds.includes(t.id));
    const lockedCount = targetLines.filter(t => (t.auditStatus || t.audit_status) === 'frozen').length;
    if (lockedCount > 0) {
      alert(`Cannot delete ${lockedCount} locked transactions. Please unlock them first.`);
      return;
    }
    if (!confirm(`Are you sure you want to delete ${selectedRowIds.length} transaction(s)?`)) return;

    try {
      setActionLoading(true);
      for (const id of selectedRowIds) {
        await deleteTransactionAPI(id);
      }
      showToast(`Deleted ${selectedRowIds.length} transactions.`);
      setSelectedRowIds([]);
      if (onReloadTransactions) await onReloadTransactions();
    } catch (err) {
      alert("Failed to delete transactions: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyBulkCategory = async () => {
    if (!bulkSelectedSubcat || selectedRowIds.length === 0) return;
    try {
      setActionLoading(true);
      const matchedCat = categories.find(c => (c.subcategory || c.name) === bulkSelectedSubcat);
      for (const id of selectedRowIds) {
        const line = dateTransactions.find(t => t.id === id);
        const isExp = line?.type === 'Dr';
        const isInc = line?.type === 'Cr';

        const updatePayload = { id };
        if (bulkSelectedSubcat) {
          updatePayload.categoryId = matchedCat?.id || null;
          updatePayload.categoryName = matchedCat?.name || bulkSelectedSubcat;
          updatePayload.subcategory = matchedCat?.subcategory || bulkSelectedSubcat;
          updatePayload.category = matchedCat?.category || null;
          updatePayload.division = matchedCat?.division || null;
          updatePayload.groupType = matchedCat?.group_type || matchedCat?.division || null;
          updatePayload.subType = matchedCat?.sub_type || null;
          updatePayload.transactionType = matchedCat?.transaction_type || 'ACTUAL';
        }
        if (bulkCostCenter && !isInc) updatePayload.costCenter = bulkCostCenter;
        if (bulkProfitCenter && !isExp) updatePayload.profitCenter = bulkProfitCenter;
        if (bulkBudget && !isInc) updatePayload.budget = bulkBudget;
        if (bulkProject) updatePayload.project = bulkProject;

        await updateTransactionAPI(updatePayload);
      }
      showToast(`Applied "${bulkSelectedSubcat}" to ${selectedRowIds.length} line(s)!`);
      setIsBulkCategoryModalOpen(false);
      setSelectedRowIds([]);
      if (onReloadTransactions) await onReloadTransactions();
    } catch (err) {
      alert("Failed to bulk categorize: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  
  // Smart Auto-Fix & Validate Date Dimensions
  const handleAutoFixDimensions = async () => {
    const unverifiedLines = dateTransactions.filter(t => (t.auditStatus || t.audit_status) !== 'frozen');
    if (unverifiedLines.length === 0) {
      showToast("No editable transactions found on this date.", "info");
      return;
    }

    try {
      setActionLoading(true);
      let fixedCount = 0;

      for (const tx of unverifiedLines) {
        const isExp = tx.type === 'Dr';
        const isInc = tx.type === 'Cr';
        const sub = (tx.subcategory || tx.categoryName || '').toUpperCase();
        const payload = { id: tx.id };
        let needsUpdate = false;

        // Rule 1: Clean up conflict (Profit Center on Expense)
        if (isExp && (tx.profitCenter || tx.profit_center)) {
          payload.profitCenter = null;
          needsUpdate = true;
        }

        // Rule 2: Clean up conflict (Cost Center on Income)
        if (isInc && (tx.costCenter || tx.cost_center)) {
          payload.costCenter = null;
          needsUpdate = true;
        }

        // Rule 3: Suggest Cost Center on Expense if missing
        if (isExp && !(tx.costCenter || tx.cost_center)) {
          if (sub.includes('PETROL') || sub.includes('TRANSPORT') || sub.includes('BIKE') || sub.includes('CAR')) {
            payload.costCenter = 'Vehicle';
            payload.budget = tx.budget || 'Travel Budget';
          } else if (sub.includes('GROCERIES') || sub.includes('HOUSE') || sub.includes('MAINTENANCE')) {
            payload.costCenter = 'Home';
            payload.budget = tx.budget || 'Home Budget';
          } else if (sub.includes('FOOD') || sub.includes('SNACK') || sub.includes('DINING')) {
            payload.costCenter = 'Self';
            payload.budget = tx.budget || 'Food Budget';
          } else if (sub.includes('MEDICAL') || sub.includes('HEALTH')) {
            payload.costCenter = 'Health';
            payload.budget = tx.budget || 'Healthcare Budget';
          } else if (sub.includes('EDUCATION') || sub.includes('LEARNING')) {
            payload.costCenter = 'Education';
            payload.budget = tx.budget || 'Home Budget';
          } else {
            payload.costCenter = 'Self';
            payload.budget = tx.budget || 'Home Budget';
          }
          needsUpdate = true;
        }

        // Rule 4: Suggest Profit Center on Income if missing
        if (isInc && !(tx.profitCenter || tx.profit_center)) {
          if (sub.includes('SALARY') || sub.includes('PAYROLL')) {
            payload.profitCenter = 'Salary';
          } else if (sub.includes('CASHBACK') || sub.includes('REWARD')) {
            payload.profitCenter = 'Cashback & Rewards';
          } else if (sub.includes('INVESTMENT') || sub.includes('RETURN') || sub.includes('DIVIDEND')) {
            payload.profitCenter = 'Investments';
          } else if (sub.includes('FREELANCE')) {
            payload.profitCenter = 'Freelancing';
          } else {
            payload.profitCenter = 'Salary';
          }
          needsUpdate = true;
        }

        if (needsUpdate) {
          await updateTransactionAPI(payload);
          fixedCount++;
        }
      }

      showToast(`Auto-validated & optimized dimensions for ${fixedCount} transaction line(s)!`);
      if (onReloadTransactions) await onReloadTransactions();
    } catch (err) {
      alert("Auto-fix failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Batch Verify for Date
  const handleBatchVerifyDate = async () => {
    const unverifiedIds = dateTransactions
      .filter(t => (t.auditStatus || t.audit_status || 'draft') === 'draft')
      .map(t => t.id);

    if (unverifiedIds.length === 0) {
      showToast("All items on this date are already verified!", "info");
      return;
    }

    try {
      setActionLoading(true);
      await bulkAuditTransactionsAPI({
        ids: unverifiedIds,
        auditStatus: 'verified'
      });
      showToast(`Verified all ${unverifiedIds.length} line items for ${selectedDate}!`);
      if (onReloadTransactions) await onReloadTransactions();
    } catch (err) {
      alert("Failed to batch verify: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Batch Lock & Finalize Date
  const handleBatchLockDate = async () => {
    const targetIds = dateTransactions.map(t => t.id);
    if (targetIds.length === 0) {
      alert("No transactions on this date to lock.");
      return;
    }

    if (!confirm(`Are you sure you want to finalize and lock all ${targetIds.length} transactions for ${selectedDate}? Once locked, line items cannot be modified unless unlocked.`)) {
      return;
    }

    try {
      setActionLoading(true);
      await bulkAuditTransactionsAPI({
        ids: targetIds,
        auditStatus: 'frozen'
      });
      showToast(`🔒 ${selectedDate} finalized! All ${targetIds.length} lines locked.`);
      if (onReloadTransactions) await onReloadTransactions();
    } catch (err) {
      alert("Failed to lock date: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Batch Unlock Date
  const handleBatchUnlockDate = async () => {
    const targetIds = dateTransactions.map(t => t.id);
    if (targetIds.length === 0) return;

    try {
      setActionLoading(true);
      await bulkAuditTransactionsAPI({
        ids: targetIds,
        auditStatus: 'verified'
      });
      showToast(`Reopened ${selectedDate}. Lines are now editable.`, "info");
      if (onReloadTransactions) await onReloadTransactions();
    } catch (err) {
      alert("Failed to unlock date: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete draft line
  const handleDeleteLine = async (tx) => {
    if ((tx.auditStatus || tx.audit_status) === 'frozen') {
      alert("Cannot delete a locked transaction.");
      return;
    }
    if (!confirm(`Delete transaction #${tx.tranNo || tx.id} (${tx.notes || tx.particulars})?`)) return;

    try {
      setActionLoading(true);
      await deleteTransactionAPI(tx.id);
      showToast("Transaction deleted.");
      if (onReloadTransactions) await onReloadTransactions();
    } catch (err) {
      alert("Failed to delete transaction: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Export Daily Excel Sheet with exact 36 headers
  const handleExportDaySheet = () => {
    if (dateTransactions.length === 0) {
      alert("No line items for this date to export.");
      return;
    }

    const exportRows = dateTransactions.map((tx, idx) => ({
      'Date group': tx.dateGroup || tx.date_group || '1',
      'TEMP UPLOAD ID': tx.tempUploadId || tx.temp_upload_id || `TEMP_${tx.date}_${tx.id}`,
      'tran_date': tx.date || tx.tran_date,
      'tran_no': tx.tranNo || tx.tran_no || `TXN_${str_pad(tx.id)}`,
      'account_no': tx.accountNo || tx.account_no || 'Cash_1',
      'particulars': tx.notes || tx.particulars || '',
      'debit': tx.type === 'Dr' ? Number(tx.amount || 0).toFixed(2) : '0.00',
      'credit': tx.type === 'Cr' ? Number(tx.amount || 0).toFixed(2) : '0.00',
      'balance': Number(tx.balance || 0).toFixed(2),
      'SUB_CATEGORY': tx.subcategory || tx.categoryName || 'GENERAL',
      'tagging': tx.tagging || '',
      'JOB UTILS': tx.jobUtils || tx.job_utils || '',
      'COMPENSATION TYPE': tx.compensationType || tx.compensation_type || '',
      'transaction_type': tx.transactionType || tx.transaction_type || 'ACTUAL',
      'SPLIT_REF': tx.splitRef || tx.split_ref || '',
      'info_type': tx.infoType || tx.info_type || 'BOTH',
      'info_status': tx.infoStatus || tx.info_status || '',
      'eid': tx.eid || '',
      'allocation_eid': tx.allocationEid || tx.allocation_eid || '',
      'job_timeline': tx.jobTimeline || tx.job_timeline || '',
      'remarks': tx.remarks || tx.notes || '',
      'account_type': tx.accountType || tx.account_type || 'Cash',
      'suffix': tx.suffix || (tx.type === 'Cr' ? 'CR' : 'DR'),
      'KEYWORD TAGGING': tx.keywordTagging || tx.keyword_tagging || '',
      'Sub_cat_helper': tx.subCatHelper || tx.sub_cat_helper || '',
      'method': tx.method || 'UPI',
      'mode': tx.mode || 'ONLINE',
      'category': tx.category || 'General',
      'NET TYPE': tx.netType || tx.net_type || '',
      'month': tx.month || (tx.date ? tx.date.substring(5, 7) : ''),
      'year': tx.year || (tx.date ? tx.date.substring(0, 4) : ''),
      'week_no': tx.weekNo || tx.week_no || '',
      'year_month': tx.yearMonth || tx.year_month || (tx.date ? tx.date.substring(0, 7) : ''),
      'tran_type_helper': tx.tranTypeHelper || tx.tran_type_helper || '',
      'status': (tx.auditStatus || tx.audit_status || 'draft').toUpperCase(),
      'UTR NO': tx.utrNo || tx.utr_no || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `AUDIT_${selectedDate}`);
    XLSX.writeFile(wb, `MoneyMatrix_Validation_${selectedDate}.xlsx`);
  };

  // Filtered list of dates for dropdown jump
  const dropdownDateOptions = useMemo(() => {
    if (onlyPendingDatesFilter) {
      return allDatesSummary.filter(d => d.pending > 0);
    }
    return allDatesSummary;
  }, [allDatesSummary, onlyPendingDatesFilter]);

  return (
    <div style={{ padding: '1rem 1.25rem', maxWidth: '1680px', margin: '0 auto' }}>

      {/* Sleek Unified Header & Simple Date Navigator */}
      <div className="card glass-card" style={{
        padding: '0.85rem 1.25rem',
        marginBottom: '1rem',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem' }}>
          
          {/* Left: View Title & Live Day Scope */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, var(--primary-brand), #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
              flexShrink: 0
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  Daily Transaction Validation
                </h2>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.6875rem',
                  fontWeight: '800',
                  background: dayStats.isFullyLocked ? 'var(--accent-cr-bg)' : dayStats.isFullyVerified ? 'rgba(59, 130, 246, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                  color: dayStats.isFullyLocked ? 'var(--accent-cr)' : dayStats.isFullyVerified ? 'var(--primary-brand)' : '#b45309',
                  border: `1px solid ${dayStats.isFullyLocked ? 'var(--accent-cr-border)' : dayStats.isFullyVerified ? 'rgba(59, 130, 246, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`
                }}>
                  {dayStats.isFullyLocked ? '🔒 Day Finalized & Locked' : dayStats.isFullyVerified ? '✅ All 100% Verified' : `⚠️ ${dayStats.draftCount} Pending`}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span><strong>{dayStats.totalLines}</strong> lines</span>
                <span>•</span>
                <span style={{ color: 'var(--accent-cr)', fontWeight: '700' }}>+{dayStats.crCount} Cr (₹{dayStats.totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })})</span>
                <span>•</span>
                <span style={{ color: 'var(--accent-dr)', fontWeight: '700' }}>-{dayStats.drCount} Dr (₹{dayStats.totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })})</span>
                <span>•</span>
                <span>Net: <strong style={{ color: dayStats.netFlow >= 0 ? 'var(--accent-cr)' : 'var(--accent-dr)' }}>₹{dayStats.netFlow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
              </div>
            </div>
          </div>

          {/* Center: Simple Date Navigator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'var(--bg-card-solid)',
            padding: '0.3rem 0.5rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            flexWrap: 'wrap'
          }}>
            {/* Prev */}
            <button
              onClick={() => handleStepDate(-1)}
              className="btn btn-secondary btn-sm"
              style={{ minHeight: '30px', padding: '0.2rem 0.55rem', fontSize: '0.75rem', fontWeight: '700' }}
              title="Previous Date (Older)"
            >
              <ChevronLeft size={15} />
              <span className="hidden-sm">Prev</span>
            </button>

            {/* Calendar Date Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.15rem 0.45rem',
              background: 'var(--bg-input)',
              borderRadius: '6px',
              border: '1px solid var(--border-color)'
            }}>
              <CalendarIcon size={14} style={{ color: 'var(--primary-brand)' }} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontWeight: '700',
                  fontSize: '0.8125rem',
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Next */}
            <button
              onClick={() => handleStepDate(1)}
              className="btn btn-secondary btn-sm"
              style={{ minHeight: '30px', padding: '0.2rem 0.55rem', fontSize: '0.75rem', fontWeight: '700' }}
              title="Next Date (Newer)"
            >
              <span className="hidden-sm">Next</span>
              <ChevronRight size={15} />
            </button>

            {/* Quick Date Dropdown */}
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-control"
              style={{
                height: '30px',
                fontSize: '0.75rem',
                fontWeight: '600',
                padding: '0.1rem 0.4rem',
                maxWidth: '190px',
                borderRadius: '6px'
              }}
            >
              {dropdownDateOptions.map(d => (
                <option key={d.date} value={d.date}>
                  {d.date} {d.pending > 0 ? `(${d.pending} pend)` : '✓'}
                </option>
              ))}
            </select>

            <button
              onClick={handleJumpToday}
              className="btn btn-secondary btn-sm"
              style={{ minHeight: '30px', padding: '0.2rem 0.5rem', fontSize: '0.71875rem' }}
              title="Jump to Today"
            >
              Today
            </button>

            {/* Next Pending Button */}
            {datesWithPending.length > 0 && (
              <button
                onClick={handleJumpNextPending}
                className="btn btn-primary btn-sm"
                style={{
                  minHeight: '30px',
                  padding: '0.2rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: 'var(--primary-brand)',
                  color: '#fff'
                }}
                title="Jump to next date with pending items"
              >
                <FastForward size={13} />
                <span>Next Pending ({datesWithPending.length})</span>
              </button>
            )}
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleAutoClassifyDate}
              disabled={actionLoading || dateTransactions.length === 0}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              title="Automatically classify subcategories from bank particulars"
            >
              <Sparkles size={13} style={{ color: '#eab308' }} />
              <span>Auto-Classify</span>
            </button>

            {dayStats.draftCount > 0 && (
              <button
                onClick={handleBatchVerifyDate}
                disabled={actionLoading}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-brand)', border: '1px solid var(--primary-brand)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                title="Verify all pending lines for this date"
              >
                <Check size={14} />
                <span>Verify All ({dayStats.draftCount})</span>
              </button>
            )}

            {dayStats.isFullyLocked ? (
              <button
                onClick={handleBatchUnlockDate}
                disabled={actionLoading}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', fontWeight: '700', color: '#eab308' }}
              >
                <Unlock size={13} />
                <span>Unlock Day</span>
              </button>
            ) : (
              <button
                onClick={handleBatchLockDate}
                disabled={actionLoading || dayStats.totalLines === 0}
                className="btn btn-success btn-sm"
                style={{ fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                title="Freeze and finalize this day"
              >
                <Lock size={13} />
                <span>Lock Day</span>
              </button>
            )}

            <button
              onClick={handleExportDaySheet}
              className="btn btn-secondary btn-sm"
              title="Export formatted Excel sheet"
              style={{ padding: '0.25rem 0.5rem' }}
            >
              <Download size={14} />
            </button>

            <button
              onClick={() => setShowAnalyticsCards(prev => !prev)}
              className={`btn btn-sm ${showAnalyticsCards ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.71875rem', padding: '0.25rem 0.55rem' }}
              title="Toggle detailed KPI cards"
            >
              📊 Stats
            </button>
          </div>
        </div>

        {/* Collapsible KPI Scoreboard (Only when requested via Stats button) */}
        {showAnalyticsCards && (
          <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
            <div className="validation-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="validation-kpi-card">
                <div className="kpi-label"><ShieldCheck size={14} style={{ color: 'var(--primary-brand)' }} /><span>Day Scope</span></div>
                <div className="kpi-val">{dayStats.totalLines} lines</div>
                <div className="kpi-sub"><span>Draft: {dayStats.draftCount}</span><span>Verified: {dayStats.verifiedCount}</span><span>Locked: {dayStats.lockedCount}</span></div>
              </div>
              <div className="validation-kpi-card">
                <div className="kpi-label"><TrendingUp size={14} style={{ color: 'var(--accent-cr)' }} /><span>Day Inflow (Cr)</span></div>
                <div className="kpi-val" style={{ color: 'var(--accent-cr)' }}>+₹{dayStats.totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="kpi-sub"><span>{dayStats.crCount} Credit Line{dayStats.crCount === 1 ? '' : 's'}</span></div>
              </div>
              <div className="validation-kpi-card">
                <div className="kpi-label"><TrendingDown size={14} style={{ color: 'var(--accent-dr)' }} /><span>Day Outflow (Dr)</span></div>
                <div className="kpi-val" style={{ color: 'var(--accent-dr)' }}>-₹{dayStats.totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="kpi-sub"><span>{dayStats.drCount} Debit Line{dayStats.drCount === 1 ? '' : 's'}</span></div>
              </div>
              <div className="validation-kpi-card">
                <div className="kpi-label"><Scale size={14} /><span>Net Day Cashflow</span></div>
                <div className="kpi-val" style={{ color: dayStats.netFlow >= 0 ? 'var(--accent-cr)' : 'var(--accent-dr)' }}>
                  {dayStats.netFlow >= 0 ? '+' : ''}₹{dayStats.netFlow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="kpi-sub"><span>{dayStats.netFlow >= 0 ? '▲ Net Liquidity Surplus' : '▼ Net Cash Reduction'}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Feedback */}
      {statusMessage.text && (
        <div style={{
          marginBottom: '0.85rem',
          padding: '0.65rem 1rem',
          borderRadius: '8px',
          background: statusMessage.type === 'success' ? 'var(--accent-cr-bg)' : 'rgba(59, 130, 246, 0.12)',
          border: `1px solid ${statusMessage.type === 'success' ? 'var(--accent-cr-border)' : 'rgba(59, 130, 246, 0.3)'}`,
          color: statusMessage.type === 'success' ? 'var(--accent-cr)' : 'var(--primary-brand)',
          fontSize: '0.8125rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={16} />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Bulk Action Pill Bar */}
      {selectedRowIds.length > 0 && (
        <div className="bulk-action-pill-bar" style={{ marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              background: 'var(--primary-brand)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: '800',
              padding: '0.2rem 0.6rem',
              borderRadius: '20px'
            }}>
              {selectedRowIds.length} Selected
            </span>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Bulk Actions:
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleBulkVerifySelected}
              disabled={actionLoading}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-brand)' }}
            >
              <Check size={14} style={{ marginRight: '0.2rem' }} />
              <span>Verify Selected</span>
            </button>
            <button
              onClick={handleBulkLockSelected}
              disabled={actionLoading}
              className="btn btn-success btn-sm"
              style={{ fontSize: '0.75rem', fontWeight: '700' }}
            >
              <Lock size={14} style={{ marginRight: '0.2rem' }} />
              <span>Lock Selected</span>
            </button>
            <button
              onClick={() => setIsBulkCategoryModalOpen(true)}
              disabled={actionLoading}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', fontWeight: '700' }}
            >
              <Tag size={14} style={{ marginRight: '0.2rem' }} />
              <span>Set Dimensions</span>
            </button>
            <button
              onClick={handleBulkDeleteSelected}
              disabled={actionLoading}
              className="btn btn-danger btn-sm"
              style={{ fontSize: '0.75rem', fontWeight: '700' }}
            >
              <Trash2 size={14} style={{ marginRight: '0.2rem' }} />
              <span>Delete</span>
            </button>
            <button
              onClick={() => setSelectedRowIds([])}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Slim Search & Filter Strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.65rem',
        marginBottom: '0.75rem'
      }}>
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchParticulars}
              onChange={(e) => setSearchParticulars(e.target.value)}
              placeholder="Filter particulars, subcategory, UTR..."
              className="form-control"
              style={{
                paddingLeft: '32px',
                height: '32px',
                fontSize: '0.78125rem',
                borderRadius: '8px'
              }}
            />
            {searchParticulars && (
              <button
                onClick={() => setSearchParticulars('')}
                style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Buttons & Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {/* Quick Flow Filter */}
          <div style={{ display: 'inline-flex', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-color)', padding: '2px' }}>
            <button
              onClick={() => setFlowTypeFilter('ALL')}
              style={{
                background: flowTypeFilter === 'ALL' ? 'var(--primary-brand)' : 'transparent',
                color: flowTypeFilter === 'ALL' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.71875rem',
                fontWeight: flowTypeFilter === 'ALL' ? '700' : '500',
                cursor: 'pointer'
              }}
            >
              All ({rawDateTxs.length})
            </button>
            <button
              onClick={() => setFlowTypeFilter('Dr')}
              style={{
                background: flowTypeFilter === 'Dr' ? 'var(--accent-dr)' : 'transparent',
                color: flowTypeFilter === 'Dr' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.71875rem',
                fontWeight: flowTypeFilter === 'Dr' ? '700' : '500',
                cursor: 'pointer'
              }}
            >
              Debits ({dayStats.drCount})
            </button>
            <button
              onClick={() => setFlowTypeFilter('Cr')}
              style={{
                background: flowTypeFilter === 'Cr' ? 'var(--accent-cr)' : 'transparent',
                color: flowTypeFilter === 'Cr' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.71875rem',
                fontWeight: flowTypeFilter === 'Cr' ? '700' : '500',
                cursor: 'pointer'
              }}
            >
              Credits ({dayStats.crCount})
            </button>
          </div>

          {/* Quick Status Filter */}
          <div style={{ display: 'inline-flex', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-color)', padding: '2px' }}>
            <button
              onClick={() => setStatusFilter('ALL')}
              style={{
                background: statusFilter === 'ALL' ? 'var(--primary-brand)' : 'transparent',
                color: statusFilter === 'ALL' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.71875rem',
                fontWeight: statusFilter === 'ALL' ? '700' : '500',
                cursor: 'pointer'
              }}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              style={{
                background: statusFilter === 'draft' ? '#eab308' : 'transparent',
                color: statusFilter === 'draft' ? '#000' : 'var(--text-secondary)',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.71875rem',
                fontWeight: statusFilter === 'draft' ? '700' : '500',
                cursor: 'pointer'
              }}
            >
              Pending ({dayStats.draftCount})
            </button>
          </div>

          {/* View Mode Switcher */}
          <div style={{ display: 'inline-flex', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-color)', padding: '2px', marginLeft: '0.25rem' }}>
            <button
              onClick={() => setFastAuditMode(true)}
              style={{
                background: fastAuditMode ? 'var(--primary-brand)' : 'transparent',
                color: fastAuditMode ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.71875rem',
                fontWeight: fastAuditMode ? '800' : '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <Zap size={11} />
              <span>Fast View</span>
            </button>
            <button
              onClick={() => setFastAuditMode(false)}
              style={{
                background: !fastAuditMode ? 'var(--primary-brand)' : 'transparent',
                color: !fastAuditMode ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.71875rem',
                fontWeight: !fastAuditMode ? '800' : '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <Layers size={11} />
              <span>Full Ledger (19)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Validation Table Card */}
      <div className="card glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        
        {dateTransactions.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <CalendarIcon size={44} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              No Transactions Recorded For {selectedDate}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.4rem auto 1.25rem', maxWidth: '480px' }}>
              There are no transactions recorded for this date matching your active filters.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleJumpNextPending}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: '700' }}
              >
                <FastForward size={14} style={{ marginRight: '0.3rem' }} />
                <span>Jump to Next Pending Date ({datesWithPending.length})</span>
              </button>
              <button
                onClick={handleJumpLatest}
                className="btn btn-secondary btn-sm"
              >
                <span>Jump to Latest Date</span>
              </button>
            </div>
          </div>
        ) : fastAuditMode ? (
          /* FAST AUDIT VIEW: FULL PARTICULARS + CR/DR ADAPTIVE DIMENSIONS */
          <div style={{ overflowX: 'auto', maxHeight: '74vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78125rem', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
                <tr>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.65rem 0.4rem', textAlign: 'center', width: '36px' }}>
                    <input
                      type="checkbox"
                      checked={selectedRowIds.length > 0 && paginatedDateTransactions.length > 0 && paginatedDateTransactions.every(t => selectedRowIds.includes(t.id))}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.65rem 0.55rem', width: '75px' }}>
                    # / DATE
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.65rem 0.75rem', minWidth: '320px' }}>
                    FULL PARTICULARS & ACCOUNT
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.65rem 0.65rem', textAlign: 'right', width: '115px' }}>
                    AMOUNT (₹)
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.65rem 0.65rem', width: '215px' }}>
                    SUB-CATEGORY
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.65rem 0.65rem', width: '165px' }}>
                    COST / PROFIT CENTER
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.65rem 0.65rem', width: '155px' }}>
                    BUDGET PLAN
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.65rem 0.65rem', width: '150px' }}>
                    PROJECT / UTR
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.65rem 0.65rem', textAlign: 'center', width: '125px' }}>
                    STATUS & VERIFY
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.65rem 0.4rem', textAlign: 'center', width: '38px' }}>
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedDateTransactions.map((tx, idx) => {
                  const isLocked = (tx.auditStatus || tx.audit_status) === 'frozen';
                  const isVerified = (tx.auditStatus || tx.audit_status) === 'verified';
                  const isSelected = selectedRowIds.includes(tx.id);
                  const currentSubcat = tx.subcategory || tx.categoryName || '';
                  const matchedCat = categories.find(c => (c.subcategory || c.name) === currentSubcat);
                  const val = evaluateTransactionValidation(tx);

                  return (
                    <tr
                      key={tx.id}
                      style={{
                        background: isSelected ? 'rgba(59, 130, 246, 0.12)' : (idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-card-solid)'),
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '0.65rem 0.4rem', textAlign: 'center', verticalAlign: 'top' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRow(tx.id)}
                        />
                      </td>

                      {/* Line & Date */}
                      <td style={{ padding: '0.65rem 0.55rem', verticalAlign: 'top' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: '800', color: 'var(--primary-brand)', fontSize: '0.75rem' }}>
                          #{tx.tranNo || tx.tran_no || tx.id}
                        </div>
                        <div style={{ fontSize: '0.65625rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {tx.date || tx.tran_date}
                        </div>
                      </td>

                      {/* Full Particulars & Account (NO TRUNCATION!) */}
                      <td style={{ padding: '0.65rem 0.75rem', verticalAlign: 'top' }}>
                        <div style={{
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          fontSize: '0.8125rem',
                          lineHeight: '1.4',
                          wordBreak: 'break-word',
                          whiteSpace: 'normal'
                        }}>
                          {tx.notes || tx.particulars || '—'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '5px', flexWrap: 'wrap' }}>
                          <span className="badge badge-neutral" style={{ fontSize: '0.6875rem', padding: '1px 6px', fontWeight: '700' }}>
                            <Landmark size={10} style={{ marginRight: '3px' }} />
                            {tx.accountNo || tx.account_no || 'Cash_1'}
                          </span>
                          <span style={{
                            fontSize: '0.625rem',
                            fontWeight: '800',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: (tx.transactionType || tx.transaction_type) === 'ROTATIONAL' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(59, 130, 246, 0.12)',
                            color: (tx.transactionType || tx.transaction_type) === 'ROTATIONAL' ? '#b45309' : 'var(--primary-brand)'
                          }}>
                            {(tx.transactionType || tx.transaction_type) === 'ROTATIONAL' ? 'ROTATIONAL' : 'ACTUAL'}
                          </span>
                          {tx.tagging && (
                            <span style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: '4px', background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                              #{tx.tagging}
                            </span>
                          )}
                          {val.badge !== 'VALIDATED' && val.badge !== 'ROTATIONAL' && (
                            <span style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: '4px', background: val.bg, color: val.color, fontWeight: '800' }} title={val.message}>
                              {val.badge}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount & Type */}
                      <td style={{ padding: '0.65rem 0.65rem', textAlign: 'right', verticalAlign: 'top' }}>
                        <div style={{
                          fontWeight: '800',
                          fontSize: '0.875rem',
                          color: tx.type === 'Cr' ? 'var(--accent-cr)' : 'var(--accent-dr)'
                        }}>
                          {tx.type === 'Cr' ? '+' : '-'}₹{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <span className={tx.type === 'Cr' ? 'badge badge-cr' : 'badge badge-dr'} style={{ fontSize: '0.625rem', padding: '0 5px', marginTop: '2px' }}>
                          {tx.type === 'Cr' ? 'Credit (Inflow)' : 'Debit (Outflow)'}
                        </span>
                      </td>

                      {/* Sub-Category Direct Selector */}
                      <td style={{ padding: '0.65rem 0.65rem', verticalAlign: 'top' }}>
                        <select
                          value={currentSubcat}
                          disabled={isLocked || actionLoading}
                          onChange={(e) => handleQuickSubcatChange(tx, e.target.value)}
                          className="form-control"
                          style={{
                            height: '30px',
                            fontSize: '0.78125rem',
                            fontWeight: '700',
                            padding: '0.15rem 0.45rem',
                            borderColor: !currentSubcat ? '#f59e0b' : 'var(--border-color)',
                            background: isLocked ? 'var(--bg-input-disabled)' : 'var(--bg-input)'
                          }}
                        >
                          <option value="">-- Select SubCategory ({categories.length}) --</option>
                          {Array.from(new Set(categories.map(c => c.division || 'LIVING'))).map(div => (
                            <optgroup key={div} label={`📁 ${div}`}>
                              {categories.filter(c => (c.division || 'LIVING') === div).map(cat => (
                                <option key={cat.id} value={cat.subcategory || cat.name}>
                                  {cat.subcategory || cat.name} {cat.category ? `(${cat.category})` : ''}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>

                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--primary-brand)', fontWeight: '700' }}>
                            {matchedCat?.division || tx.division || 'LIVING'}
                          </span>
                          <span>&gt;</span>
                          <span>{matchedCat?.category || tx.category || 'General'}</span>
                          {matchedCat?.sub_type && (
                            <span style={{ color: 'var(--text-secondary)' }}>({matchedCat.sub_type})</span>
                          )}
                        </div>
                      </td>

                      {/* Cost Center (Dr) or Profit Center (Cr) */}
                      <td style={{ padding: '0.65rem 0.65rem', verticalAlign: 'top' }}>
                        {tx.type === 'Dr' ? (
                          <div>
                            <div style={{ fontSize: '0.625rem', fontWeight: '800', color: 'var(--primary-brand)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <span>🏢 COST CENTER</span>
                            </div>
                            <select
                              value={tx.costCenter || tx.cost_center || ''}
                              disabled={isLocked || actionLoading}
                              onChange={(e) => handleQuickDimensionChange(tx, 'costCenter', e.target.value)}
                              className="form-control"
                              style={{
                                height: '28px',
                                fontSize: '0.75rem',
                                padding: '0.15rem 0.35rem',
                                borderColor: !(tx.costCenter || tx.cost_center) ? '#f59e0b' : 'var(--border-color)'
                              }}
                            >
                              <option value="">-- Cost Center --</option>
                              {costCenterOptions.map(cc => (
                                <option key={cc.code || cc.id || cc.name} value={cc.name}>{cc.name}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: '0.625rem', fontWeight: '800', color: 'var(--accent-cr)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <span>💼 PROFIT CENTER (INCOME)</span>
                            </div>
                            <select
                              value={tx.profitCenter || tx.profit_center || ''}
                              disabled={isLocked || actionLoading}
                              onChange={(e) => handleQuickDimensionChange(tx, 'profitCenter', e.target.value)}
                              className="form-control"
                              style={{
                                height: '28px',
                                fontSize: '0.75rem',
                                padding: '0.15rem 0.35rem',
                                borderColor: !(tx.profitCenter || tx.profit_center) ? '#f59e0b' : 'var(--accent-cr-border)',
                                background: 'rgba(16, 185, 129, 0.05)'
                              }}
                            >
                              <option value="">-- Profit Center --</option>
                              {profitCenterOptions.map(pc => (
                                <option key={pc.code || pc.id || pc.name} value={pc.name}>{pc.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </td>

                      {/* Budget Plan (Expense Only) */}
                      <td style={{ padding: '0.65rem 0.65rem', verticalAlign: 'top' }}>
                        {tx.type === 'Dr' ? (
                          <div>
                            <div style={{ fontSize: '0.625rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                              <span>🎯 BUDGET</span>
                            </div>
                            <select
                              value={tx.budget || ''}
                              disabled={isLocked || actionLoading}
                              onChange={(e) => handleQuickDimensionChange(tx, 'budget', e.target.value)}
                              className="form-control"
                              style={{
                                height: '28px',
                                fontSize: '0.75rem',
                                padding: '0.15rem 0.35rem'
                              }}
                            >
                              <option value="">-- Budget Plan --</option>
                              {budgetOptions.map(b => (
                                <option key={b.code || b.id || b.name} value={b.name}>{b.name}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div style={{ height: '28px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.71875rem', fontStyle: 'italic' }}>
                            — (N/A for Credit)
                          </div>
                        )}
                      </td>

                      {/* Project & UTR */}
                      <td style={{ padding: '0.65rem 0.65rem', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <select
                            value={tx.project || ''}
                            disabled={isLocked || actionLoading}
                            onChange={(e) => handleQuickDimensionChange(tx, 'project', e.target.value)}
                            className="form-control"
                            style={{ height: '26px', fontSize: '0.71875rem', padding: '0.1rem 0.35rem' }}
                          >
                            <option value="">-- Project (Opt) --</option>
                            {projectOptions.map(p => (
                              <option key={p.code || p.id || p.name} value={p.name}>{p.name}</option>
                            ))}
                          </select>

                          <input
                            type="text"
                            defaultValue={tx.utrNo || tx.utr_no || ''}
                            placeholder="UTR / Ref #"
                            disabled={isLocked || actionLoading}
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              if (val !== (tx.utrNo || tx.utr_no || '')) {
                                handleQuickDimensionChange(tx, 'utrNo', val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.target.blur();
                            }}
                            style={{
                              width: '100%',
                              height: '24px',
                              fontSize: '0.6875rem',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '5px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-input)',
                              color: 'var(--text-primary)',
                              fontFamily: 'monospace'
                            }}
                          />
                        </div>
                      </td>

                      {/* Status & Verify Action */}
                      <td style={{ padding: '0.65rem 0.65rem', textAlign: 'center', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {isLocked ? (
                            <>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '12px',
                                background: 'var(--accent-cr-bg)',
                                color: 'var(--accent-cr)',
                                fontSize: '0.6875rem',
                                fontWeight: '800'
                              }}>
                                <Lock size={10} />
                                <span>LOCKED</span>
                              </span>
                              <button
                                onClick={() => handleUnlockRow(tx)}
                                disabled={actionLoading}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '0.15rem 0.35rem', fontSize: '0.6875rem', color: '#eab308' }}
                                title="Unlock row"
                              >
                                <Unlock size={11} />
                              </button>
                            </>
                          ) : isVerified ? (
                            <>
                              <button
                                onClick={() => handleUnlockRow(tx)}
                                disabled={actionLoading}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '12px',
                                  background: 'rgba(59, 130, 246, 0.15)',
                                  color: 'var(--primary-brand)',
                                  fontSize: '0.6875rem',
                                  fontWeight: '800',
                                  border: '1px solid rgba(59, 130, 246, 0.3)',
                                  cursor: 'pointer'
                                }}
                                title="Click to unverify back to draft"
                              >
                                <CheckCircle2 size={11} />
                                <span>VERIFIED</span>
                              </button>
                              <button
                                onClick={() => handleLockRow(tx)}
                                disabled={actionLoading}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '0.15rem 0.35rem', fontSize: '0.6875rem', color: 'var(--accent-cr)' }}
                                title="Lock & Freeze line"
                              >
                                <Lock size={11} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleVerifyRow(tx)}
                              disabled={actionLoading}
                              className="btn btn-primary btn-sm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.25rem 0.65rem',
                                fontSize: '0.75rem',
                                fontWeight: '800',
                                borderRadius: '6px'
                              }}
                              title="Verify line item"
                            >
                              <Check size={13} />
                              <span>Verify</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Delete Action */}
                      <td style={{ padding: '0.65rem 0.4rem', textAlign: 'center', verticalAlign: 'top' }}>
                        {!isLocked && (
                          <button
                            onClick={() => handleDeleteRow(tx)}
                            disabled={actionLoading}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px',
                              borderRadius: '4px'
                            }}
                            title="Delete transaction line"
                          >
                            <Trash2 size={13} style={{ color: 'var(--accent-dr)', opacity: 0.7 }} />
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
          /* DETAILED 19-COLUMN VIEW (Full Horizontal Scroll for Detailed Audit) */
          <div style={{ overflowX: 'auto', maxHeight: '72vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left', whiteSpace: 'nowrap' }}>
              
              {/* Header with Color Bands Matching Enterprise Standard Schema */}
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
                <tr>
                  {/* Select Checkbox */}
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.5rem', textAlign: 'center', width: '40px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                    <input
                      type="checkbox"
                      checked={selectedRowIds.length > 0 && paginatedDateTransactions.length > 0 && paginatedDateTransactions.every(t => selectedRowIds.includes(t.id))}
                      onChange={handleSelectAll}
                    />
                  </th>

                  {/* Audit Actions */}
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', textAlign: 'center', minWidth: '130px', borderRight: '1px solid rgba(255,255,255,0.15)', fontWeight: '800' }}>
                    AUDIT ACTION
                  </th>

                  {/* Status (Audit Lifecycle) */}
                  <th {...getSortHeaderProps('status')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', fontWeight: '800', textAlign: 'center', minWidth: '95px' }}>
                    STATUS {renderSortIndicator('status')}
                  </th>

                  {/* Validation Rules Badge */}
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', fontWeight: '800', textAlign: 'center', minWidth: '115px' }}>
                    VALIDATION
                  </th>

                  {/* tran_date */}
                  <th {...getSortHeaderProps('tran_date')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '105px' }}>
                    DATE {renderSortIndicator('tran_date')}
                  </th>

                  {/* tran_no */}
                  <th {...getSortHeaderProps('tran_no')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '85px' }}>
                    TRAN # {renderSortIndicator('tran_no')}
                  </th>

                  {/* account_no */}
                  <th {...getSortHeaderProps('account_no')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '135px' }}>
                    ACCOUNT {renderSortIndicator('account_no')}
                  </th>

                  {/* particulars */}
                  <th {...getSortHeaderProps('particulars')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 1rem', minWidth: '200px' }}>
                    PARTICULARS {renderSortIndicator('particulars')}
                  </th>

                  {/* debit */}
                  <th {...getSortHeaderProps('debit')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', textAlign: 'right', minWidth: '100px' }}>
                    DEBIT (₹) {renderSortIndicator('debit')}
                  </th>

                  {/* credit */}
                  <th {...getSortHeaderProps('credit')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', textAlign: 'right', minWidth: '100px' }}>
                    CREDIT (₹) {renderSortIndicator('credit')}
                  </th>

                  {/* balance */}
                  <th {...getSortHeaderProps('balance')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', textAlign: 'right', minWidth: '105px' }}>
                    BALANCE (₹) {renderSortIndicator('balance')}
                  </th>

                  {/* TAXONOMY HIERARCHY */}
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '150px' }}>
                    DIVISION / GROUP
                  </th>

                  {/* SUB_CATEGORY */}
                  <th {...getSortHeaderProps('SUB_CATEGORY')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '160px' }}>
                    SUB-CATEGORY {renderSortIndicator('SUB_CATEGORY')}
                  </th>

                  {/* COST CENTER */}
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '125px' }}>
                    COST CENTER
                  </th>

                  {/* PROFIT CENTER */}
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '125px' }}>
                    PROFIT CENTER
                  </th>

                  {/* BUDGET */}
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '130px' }}>
                    BUDGET
                  </th>

                  {/* PROJECT */}
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '125px' }}>
                    PROJECT
                  </th>

                  {/* transaction_type */}
                  <th {...getSortHeaderProps('transaction_type')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '105px' }}>
                    TX TYPE {renderSortIndicator('transaction_type')}
                  </th>

                  {/* UTR NO */}
                  <th {...getSortHeaderProps('utr_no')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '120px' }}>
                    UTR / REF # {renderSortIndicator('utr_no')}
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedDateTransactions.map((tx, idx) => {
                  const isLocked = (tx.auditStatus || tx.audit_status) === 'frozen';
                  const isVerified = (tx.auditStatus || tx.audit_status) === 'verified';
                  const isEditing = editingRowId === tx.id;
                  const isSelected = selectedRowIds.includes(tx.id);

                  // Row background color & border
                  const rowBg = isSelected
                    ? 'rgba(59, 130, 246, 0.12)'
                    : idx % 2 === 0
                    ? 'var(--bg-card)'
                    : 'var(--bg-card-solid)';

                  return (
                    <tr
                      key={tx.id}
                      style={{
                        background: rowBg,
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', width: '40px', borderRight: '1px solid var(--border-color)' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRow(tx.id)}
                        />
                      </td>

                      {/* Row Action Buttons */}
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center', minWidth: '130px', borderRight: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          {isLocked ? (
                            <button
                              onClick={() => handleUnlockRow(tx)}
                              disabled={actionLoading}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.6875rem', color: '#eab308' }}
                              title="Unlock this line for editing"
                            >
                              <Unlock size={12} style={{ marginRight: '0.2rem' }} />
                              <span>Unlock</span>
                            </button>
                          ) : isVerified ? (
                            <>
                              <button
                                onClick={() => handleLockRow(tx)}
                                disabled={actionLoading}
                                className="btn btn-success btn-sm"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.6875rem', fontWeight: '700' }}
                                title="Lock & Finalize this verified line"
                              >
                                <Lock size={12} style={{ marginRight: '0.2rem' }} />
                                <span>Lock</span>
                              </button>
                              <button
                                onClick={() => handleStartEdit(tx)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '0.2rem 0.45rem', fontSize: '0.6875rem' }}
                                title="Edit Line"
                              >
                                <Edit2 size={12} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleVerifyRow(tx)}
                                disabled={actionLoading}
                                className="btn btn-primary btn-sm"
                                style={{ padding: '0.2rem 0.55rem', fontSize: '0.6875rem', fontWeight: '700' }}
                                title="Verify this transaction"
                              >
                                <Check size={12} style={{ marginRight: '0.2rem' }} />
                                <span>Verify</span>
                              </button>
                              <button
                                onClick={() => handleStartEdit(tx)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '0.2rem 0.45rem', fontSize: '0.6875rem' }}
                                title="Edit Line"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteLine(tx)}
                                className="btn btn-danger btn-sm"
                                style={{ padding: '0.2rem 0.45rem', fontSize: '0.6875rem' }}
                                title="Delete Draft Line"
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}

                          {isEditing && (
                            <button
                              onClick={() => handleSaveEdit(tx.id)}
                              className="btn btn-success btn-sm"
                              style={{ padding: '0.2rem 0.55rem', fontSize: '0.6875rem', fontWeight: '700' }}
                            >
                              Save
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 1. Status */}
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>
                        {isLocked ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '12px',
                            background: 'var(--accent-cr-bg)',
                            color: 'var(--accent-cr)',
                            fontSize: '0.6875rem',
                            fontWeight: '800'
                          }}>
                            <Lock size={11} />
                            <span>LOCKED</span>
                          </span>
                        ) : isVerified ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '12px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: 'var(--primary-brand)',
                            fontSize: '0.6875rem',
                            fontWeight: '800'
                          }}>
                            <CheckCircle2 size={11} />
                            <span>VERIFIED</span>
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '12px',
                            background: 'rgba(234, 179, 8, 0.15)',
                            color: '#eab308',
                            fontSize: '0.6875rem',
                            fontWeight: '800'
                          }}>
                            <AlertCircle size={11} />
                            <span>DRAFT</span>
                          </span>
                        )}
                      </td>

                      {/* Dimension Validation Status */}
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>
                        {(() => {
                          const v = evaluateTransactionValidation(tx);
                          return (
                            <span
                              title={v.message}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '12px',
                                background: v.bg,
                                color: v.color,
                                fontSize: '0.65625rem',
                                fontWeight: '800',
                                border: `1px solid ${v.color}33`,
                                cursor: 'help'
                              }}
                            >
                              {v.badge}
                            </span>
                          );
                        })()}
                      </td>

                      {/* 2. tran_date */}
                      <td style={{ padding: '0.55rem 0.75rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {tx.date || tx.tran_date}
                      </td>

                      {/* 3. tran_no */}
                      <td style={{ padding: '0.55rem 0.75rem', fontFamily: 'monospace', fontWeight: '700' }}>
                        {tx.tranNo || tx.tran_no || tx.id}
                      </td>

                      {/* 4. account_no */}
                      <td style={{ padding: '0.55rem 0.75rem', fontWeight: '700' }}>
                        <span className="badge badge-neutral" style={{ fontSize: '0.71875rem', fontWeight: '700' }}>
                          <Landmark size={11} style={{ marginRight: '4px' }} />
                          {tx.accountNo || tx.account_no || 'Cash_1'}
                        </span>
                      </td>

                      {/* 5. particulars */}
                      <td style={{ padding: '0.55rem 0.75rem', minWidth: '220px', fontWeight: '500' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.notes}
                            onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                            className="form-control"
                            style={{ height: '30px', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tx.notes || tx.particulars}>
                              {tx.notes || tx.particulars || '—'}
                            </span>
                            {tx.tagging && (
                              <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-brand)', fontWeight: '700' }}>
                                #{tx.tagging}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 6. debit */}
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: '700', color: tx.type === 'Dr' ? 'var(--accent-dr)' : 'var(--text-muted)' }}>
                        {tx.type === 'Dr' ? `₹${Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>

                      {/* 7. credit */}
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: '700', color: tx.type === 'Cr' ? 'var(--accent-cr)' : 'var(--text-muted)' }}>
                        {tx.type === 'Cr' ? `₹${Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>

                      {/* 8. balance */}
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>
                        ₹{Number(tx.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* 9. Taxonomy Hierarchy (Division > Category) */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>
                        {(() => {
                          const matchedCat = categories.find(c => (c.subcategory || c.name) === (tx.subcategory || tx.categoryName));
                          const div = matchedCat?.division || tx.division || 'LIVING';
                          const cat = matchedCat?.category || tx.category || 'General';
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--primary-brand)', letterSpacing: '0.04em' }}>
                                {div}
                              </span>
                              <span style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                                {cat}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* 10. SUB_CATEGORY */}
                      <td style={{ padding: '0.55rem 0.75rem', minWidth: '160px' }}>
                        {isEditing ? (
                          <select
                            value={editFormData.subcategory}
                            onChange={(e) => {
                              const newSub = e.target.value;
                              const cMatch = categories.find(c => (c.subcategory || c.name) === newSub);
                              setEditFormData({
                                ...editFormData,
                                subcategory: newSub,
                                transactionType: cMatch?.transaction_type || editFormData.transactionType
                              });
                            }}
                            className="form-control"
                            style={{ height: '30px', fontSize: '0.75rem', padding: '0.2rem' }}
                          >
                            {categories.map(c => (
                              <option key={c.id} value={c.subcategory || c.name}>
                                {c.subcategory || c.name} {c.category ? `(${c.category})` : ''}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                            {tx.subcategory || tx.categoryName || 'GENERAL'}
                          </span>
                        )}
                      </td>

                      {/* 11. COST CENTER (Consumed By) */}
                      <td style={{ padding: '0.55rem 0.75rem', minWidth: '125px' }}>
                        {tx.type === 'Cr' ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>— (N/A)</span>
                        ) : isEditing ? (
                          <select
                            value={editFormData.costCenter}
                            onChange={(e) => setEditFormData({ ...editFormData, costCenter: e.target.value })}
                            className="form-control"
                            style={{ height: '30px', fontSize: '0.75rem', padding: '0.2rem' }}
                          >
                            <option value="">-- None --</option>
                            {(masters?.cost_centers || []).map(cc => (
                              <option key={cc.code || cc.id} value={cc.name}>{cc.name} ({cc.code})</option>
                            ))}
                          </select>
                        ) : (
                          (tx.costCenter || tx.cost_center) ? (
                            <span className="badge badge-neutral" style={{ fontSize: '0.71875rem', fontWeight: '700' }}>
                              {tx.costCenter || tx.cost_center}
                            </span>
                          ) : (
                            <span style={{ color: '#f59e0b', fontSize: '0.7rem', fontWeight: '600' }}>⚠ Not set</span>
                          )
                        )}
                      </td>

                      {/* 12. PROFIT CENTER (Earned By) */}
                      <td style={{ padding: '0.55rem 0.75rem', minWidth: '125px' }}>
                        {tx.type === 'Dr' ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>— (N/A)</span>
                        ) : isEditing ? (
                          <select
                            value={editFormData.profitCenter}
                            onChange={(e) => setEditFormData({ ...editFormData, profitCenter: e.target.value })}
                            className="form-control"
                            style={{ height: '30px', fontSize: '0.75rem', padding: '0.2rem' }}
                          >
                            <option value="">-- None --</option>
                            {(masters?.profit_centers || []).map(pc => (
                              <option key={pc.code || pc.id} value={pc.name}>{pc.name} ({pc.code})</option>
                            ))}
                          </select>
                        ) : (
                          (tx.profitCenter || tx.profit_center) ? (
                            <span className="badge badge-cr" style={{ fontSize: '0.71875rem', fontWeight: '700' }}>
                              {tx.profitCenter || tx.profit_center}
                            </span>
                          ) : (
                            <span style={{ color: '#f59e0b', fontSize: '0.7rem', fontWeight: '600' }}>⚠ Not set</span>
                          )
                        )}
                      </td>

                      {/* 13. BUDGET (Plan Bucket) */}
                      <td style={{ padding: '0.55rem 0.75rem', minWidth: '130px' }}>
                        {tx.type === 'Cr' ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>— (N/A)</span>
                        ) : isEditing ? (
                          <select
                            value={editFormData.budget}
                            onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })}
                            className="form-control"
                            style={{ height: '30px', fontSize: '0.75rem', padding: '0.2rem' }}
                          >
                            <option value="">-- None --</option>
                            {(masters?.budgets || []).map(b => (
                              <option key={b.code || b.id} value={b.name}>{b.name}</option>
                            ))}
                          </select>
                        ) : (
                          tx.budget ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--primary-brand)', fontWeight: '700' }}>
                              {tx.budget}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>—</span>
                          )
                        )}
                      </td>

                      {/* 14. PROJECT (Purpose) */}
                      <td style={{ padding: '0.55rem 0.75rem', minWidth: '125px' }}>
                        {isEditing ? (
                          <select
                            value={editFormData.project}
                            onChange={(e) => setEditFormData({ ...editFormData, project: e.target.value })}
                            className="form-control"
                            style={{ height: '30px', fontSize: '0.75rem', padding: '0.2rem' }}
                          >
                            <option value="">-- None --</option>
                            {(masters?.projects || []).map(pr => (
                              <option key={pr.code || pr.id} value={pr.name}>{pr.name}</option>
                            ))}
                          </select>
                        ) : (
                          tx.project ? (
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                              {tx.project}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>—</span>
                          )
                        )}
                      </td>

                      {/* 15. transaction_type */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>
                        {isEditing ? (
                          <select
                            value={editFormData.transactionType}
                            onChange={(e) => setEditFormData({ ...editFormData, transactionType: e.target.value })}
                            className="form-control"
                            style={{ height: '30px', fontSize: '0.75rem' }}
                          >
                            <option value="ACTUAL">ACTUAL</option>
                            <option value="ROTATIONAL">ROTATIONAL</option>
                            <option value="COMPENSATIONAL">COMPENSATIONAL</option>
                          </select>
                        ) : (
                          <span style={{
                            fontSize: '0.6875rem',
                            fontWeight: '800',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: tx.transactionType === 'ROTATIONAL' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                            color: tx.transactionType === 'ROTATIONAL' ? '#eab308' : 'var(--primary-brand)'
                          }}>
                            {tx.transactionType || tx.transaction_type || 'ACTUAL'}
                          </span>
                        )}
                      </td>

                      {/* 16. UTR NO */}
                      <td style={{ padding: '0.55rem 0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="UTR / Ref..."
                            value={editFormData.utrNo}
                            onChange={(e) => setEditFormData({ ...editFormData, utrNo: e.target.value })}
                            className="form-control"
                            style={{ height: '30px', fontSize: '0.75rem', padding: '0.2rem 0.4rem', width: '130px' }}
                          />
                        ) : (
                          tx.utrNo || tx.utr_no || '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* DataTable Pagination Bar */}
        {dateTransactions.length > 0 && (
          <PaginationComponent itemLabel="line items" pageSizeOptions={[15, 25, 50, 100, 'ALL']} />
        )}
      </div>

      {/* Quick Bulk Category Modal */}
      {isBulkCategoryModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card glass-card" style={{
            width: '95%',
            maxWidth: '520px',
            padding: '1.5rem',
            borderRadius: '14px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            border: '1px solid var(--border-color)',
            animation: 'slideDown 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Tag size={18} style={{ color: 'var(--primary-brand)' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  Set Management Dimensions For {selectedRowIds.length} Line(s)
                </h3>
              </div>
              <button
                onClick={() => setIsBulkCategoryModalOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.2rem 0.4rem', border: 'none' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Apply category taxonomy and management dimensions across all {selectedRowIds.length} selected transaction lines.
              Dimension validation rules will strictly preserve the boundary: Expenses consume Cost Centers & Budgets, whereas Income generates Profit Centers.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              {/* Category */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Select Taxonomy Sub-Category:
                </label>
                <select
                  value={bulkSelectedSubcat}
                  onChange={(e) => setBulkSelectedSubcat(e.target.value)}
                  className="form-control"
                  style={{ height: '38px', fontSize: '0.85rem' }}
                >
                  <option value="">-- Choose Category ({categories.length} available) --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.subcategory || c.name}>
                      {c.subcategory || c.name} {c.category ? `(${c.category})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cost Center */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Cost Center (Expenses):
                </label>
                <select
                  value={bulkCostCenter}
                  onChange={(e) => setBulkCostCenter(e.target.value)}
                  className="form-control"
                  style={{ height: '36px', fontSize: '0.8125rem' }}
                >
                  <option value="">-- Leave Unchanged / None --</option>
                  {(masters?.cost_centers || []).map(cc => (
                    <option key={cc.code || cc.id} value={cc.name}>{cc.name} ({cc.code})</option>
                  ))}
                </select>
              </div>

              {/* Profit Center */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Profit Center (Income):
                </label>
                <select
                  value={bulkProfitCenter}
                  onChange={(e) => setBulkProfitCenter(e.target.value)}
                  className="form-control"
                  style={{ height: '36px', fontSize: '0.8125rem' }}
                >
                  <option value="">-- Leave Unchanged / None --</option>
                  {(masters?.profit_centers || []).map(pc => (
                    <option key={pc.code || pc.id} value={pc.name}>{pc.name} ({pc.code})</option>
                  ))}
                </select>
              </div>

              {/* Budget */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Budget Bucket (Expenses):
                </label>
                <select
                  value={bulkBudget}
                  onChange={(e) => setBulkBudget(e.target.value)}
                  className="form-control"
                  style={{ height: '36px', fontSize: '0.8125rem' }}
                >
                  <option value="">-- Leave Unchanged / None --</option>
                  {(masters?.budgets || []).map(b => (
                    <option key={b.code || b.id} value={b.name}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>

              {/* Project */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Project / Purpose:
                </label>
                <select
                  value={bulkProject}
                  onChange={(e) => setBulkProject(e.target.value)}
                  className="form-control"
                  style={{ height: '36px', fontSize: '0.8125rem' }}
                >
                  <option value="">-- Leave Unchanged / None --</option>
                  {(masters?.projects || []).map(pr => (
                    <option key={pr.code || pr.id} value={pr.name}>{pr.name} ({pr.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setIsBulkCategoryModalOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.4rem 0.9rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleApplyBulkCategory}
                disabled={(!bulkSelectedSubcat && !bulkCostCenter && !bulkProfitCenter && !bulkBudget && !bulkProject) || actionLoading}
                className="btn btn-primary btn-sm"
                style={{ padding: '0.4rem 1.1rem', fontWeight: '700' }}
              >
                {actionLoading ? 'Applying...' : `Apply to ${selectedRowIds.length} Line(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function str_pad(val) {
  if (!val) return '000001';
  return String(val).padStart(6, '0');
}
