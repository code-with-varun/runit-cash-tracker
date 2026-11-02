import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Landmark,
  CreditCard,
  Wallet,
  Banknote,
  PieChart as PieIcon,
  Activity,
  ArrowRight,
  Upload,
  Presentation,
  ShieldCheck,
  LineChart as LineChartIcon,
  PlusCircle,
  Filter,
  Layers,
  Calendar,
  X,
  RotateCcw,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Check,
  BarChart2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Target
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import * as XLSX from 'xlsx';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const STANDARD_GROUP_TYPES = [
  'HOME NEEDS',
  'UTILITIES',
  'Fuel & Transport',
  'INVESTMENTS',
  'INCOME',
  'SHOPPING & ENTERTAINMENT',
  'CC ROTATIONS',
  'LEVERAGE/LOANS',
  'TAX & TOLL',
  'INSURANCE',
  'Internal & Misc'
];

const TX_TYPES = ['ACTUAL', 'ROTATIONAL', 'COMPENSATIONAL'];
const SUB_TYPES = ['NEEDS', 'WANTS', 'EMERGENCY', 'REPAYMENTS', 'INCOME'];

export default function ExecutiveDashboardView({
  cashBalance = 0,
  cashTransactions = [],
  accounts = [],
  categories = [],
  onNavigate
}) {
  // Slicer States (Power BI Style Multi-Select Filters)
  const [datePreset, setDatePreset] = useState('ALL'); // 'ALL' | 'THIS_MONTH' | '30_DAYS' | '90_DAYS' | 'YTD' | 'CUSTOM'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState(['ALL']);
  const [selectedTxTypes, setSelectedTxTypes] = useState(['ALL']);
  const [selectedFlow, setSelectedFlow] = useState('ALL'); // 'ALL' | 'EXPENSE' | 'INCOME'
  const [selectedGroups, setSelectedGroups] = useState(['ALL']);
  const [selectedSubTypes, setSelectedSubTypes] = useState(['ALL']);
  const [isSlicerPanelOpen, setIsSlicerPanelOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [tableLimit, setTableLimit] = useState('10');
  const [chartViewMode, setChartViewMode] = useState('monthly'); // 'monthly' | 'trend'

  // Detect theme from HTML attribute for chart styling
  const [isLightMode, setIsLightMode] = useState(() => {
    return document.documentElement.getAttribute('data-theme') === 'light';
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLightMode(document.documentElement.getAttribute('data-theme') === 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Quick lookup map for categories taxonomy
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach(c => {
      const name = (c.subcategory || c.name || '').trim().toUpperCase();
      if (name) map[name] = c;
    });
    return map;
  }, [categories]);

  // Normalized transactions with fallback taxonomy lookups
  const normalizedTransactions = useMemo(() => {
    return (cashTransactions || []).map(t => {
      const catKey = (t.subcategory || t.categoryName || t.name || '').trim().toUpperCase();
      const meta = categoryMap[catKey] || {};
      return {
        ...t,
        accountNo: t.accountNo || t.account_no || 'Cash_1',
        categoryName: t.categoryName || t.subcategory || meta.subcategory || 'General',
        subcategory: t.subcategory || t.categoryName || meta.subcategory || 'General',
        groupType: t.groupType || t.group_type || meta.group_type || 'Internal & Misc',
        netType: t.netType || t.net_type || meta.net_type || 'NET EXPENSE',
        subType: t.subType || t.sub_type || meta.sub_type || (t.type === 'Cr' ? 'INCOME' : 'NEEDS'),
        transactionType: t.transactionType || t.transaction_type || meta.transaction_type || 'ACTUAL',
        amountNum: parseFloat(t.amount) || 0
      };
    });
  }, [cashTransactions, categoryMap]);

  // Multi-Select Toggle Helper
  const toggleMultiSelect = (currentList, setList, itemVal) => {
    if (itemVal === 'ALL') {
      setList(['ALL']);
      return;
    }
    let updated = currentList.filter(x => x !== 'ALL');
    if (updated.includes(itemVal)) {
      updated = updated.filter(x => x !== itemVal);
    } else {
      updated.push(itemVal);
    }
    if (updated.length === 0) {
      setList(['ALL']);
    } else {
      setList(updated);
    }
  };

  const handleResetSlicers = () => {
    setDatePreset('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedAccounts(['ALL']);
    setSelectedTxTypes(['ALL']);
    setSelectedFlow('ALL');
    setSelectedGroups(['ALL']);
    setSelectedSubTypes(['ALL']);
    setTableSearch('');
  };

  // Date horizon calculations
  const today = new Date();
  const currentMonthStr = today.toISOString().substring(0, 7);
  const currentYearStr = today.toISOString().substring(0, 4);

  // Filtered Transactions driven by active slicers
  const filteredTransactions = useMemo(() => {
    return normalizedTransactions.filter(t => {
      const txDate = t.date || '';

      // 1. Date Slicer
      if (datePreset === 'THIS_MONTH' && !txDate.startsWith(currentMonthStr)) return false;
      if (datePreset === 'YTD' && !txDate.startsWith(currentYearStr)) return false;
      if (datePreset === '30_DAYS') {
        const d = new Date(txDate);
        const diffDays = (today - d) / (1000 * 60 * 60 * 24);
        if (diffDays > 30 || diffDays < 0) return false;
      }
      if (datePreset === '90_DAYS') {
        const d = new Date(txDate);
        const diffDays = (today - d) / (1000 * 60 * 60 * 24);
        if (diffDays > 90 || diffDays < 0) return false;
      }
      if (datePreset === 'CUSTOM') {
        if (customStartDate && txDate < customStartDate) return false;
        if (customEndDate && txDate > customEndDate) return false;
      }

      // 2. Account Slicer
      if (!selectedAccounts.includes('ALL') && !selectedAccounts.includes(t.accountNo)) {
        return false;
      }

      // 3. Flow Slicer
      if (selectedFlow === 'EXPENSE' && t.type !== 'Dr') return false;
      if (selectedFlow === 'INCOME' && t.type !== 'Cr') return false;

      // 4. Transaction Type Slicer
      if (!selectedTxTypes.includes('ALL') && !selectedTxTypes.includes(t.transactionType)) {
        return false;
      }

      // 5. Group Type Slicer
      if (!selectedGroups.includes('ALL') && !selectedGroups.includes(t.groupType)) {
        return false;
      }

      // 6. Sub Type Slicer
      if (!selectedSubTypes.includes('ALL') && !selectedSubTypes.includes(t.subType)) {
        return false;
      }

      return true;
    });
  }, [
    normalizedTransactions,
    datePreset,
    customStartDate,
    customEndDate,
    selectedAccounts,
    selectedFlow,
    selectedTxTypes,
    selectedGroups,
    selectedSubTypes,
    currentMonthStr,
    currentYearStr
  ]);

  // Sliced KPIs
  const totalInflow = filteredTransactions
    .filter(t => t.type === 'Cr')
    .reduce((sum, t) => sum + t.amountNum, 0);

  const totalOutflow = filteredTransactions
    .filter(t => t.type === 'Dr')
    .reduce((sum, t) => sum + t.amountNum, 0);

  const netCashFlow = totalInflow - totalOutflow;
  const inflowCount = filteredTransactions.filter(t => t.type === 'Cr').length;
  const outflowCount = filteredTransactions.filter(t => t.type === 'Dr').length;

  const savingsRate = totalInflow > 0
    ? Math.max(0, ((totalInflow - totalOutflow) / totalInflow) * 100).toFixed(1)
    : 0;

  // Active Accounts Net Worth
  const targetedAccounts = selectedAccounts.includes('ALL')
    ? accounts
    : accounts.filter(a => selectedAccounts.includes(a.code || a.name));

  const liquidBanks = targetedAccounts
    .filter(a => ['Bank', 'Savings Account', 'Current', 'Current Account', 'Cash', 'Cash Account', 'PPF Account'].includes(a.type))
    .reduce((sum, a) => sum + Number(a.balance || 0), 0);

  const activeLiabilities = targetedAccounts
    .filter(a => ['Card', 'Credit Card', 'Loan', 'Loan Account', 'Payable'].includes(a.type))
    .reduce((sum, a) => sum + Math.abs(Number(a.balance || 0)), 0);

  const activeNetWorth = liquidBanks - activeLiabilities;
  const activeNetWorthLakhs = (activeNetWorth / 100000).toFixed(2);

  // Active Slicer Badges Summary
  const activeSlicerCount = [
    datePreset !== 'ALL',
    !selectedAccounts.includes('ALL'),
    selectedFlow !== 'ALL',
    !selectedTxTypes.includes('ALL'),
    !selectedGroups.includes('ALL'),
    !selectedSubTypes.includes('ALL')
  ].filter(Boolean).length;

  // -------------------------------------------------------------------------
  // CHART 1: Monthly Cashflow Dynamics (Bar & Net Line Combo)
  // -------------------------------------------------------------------------
  const monthlyTimeline = useMemo(() => {
    const map = {};
    filteredTransactions.forEach(t => {
      const monthKey = t.date ? t.date.substring(0, 7) : 'Unknown';
      if (!map[monthKey]) {
        map[monthKey] = { Cr: 0, Dr: 0 };
      }
      if (t.type === 'Cr') map[monthKey].Cr += t.amountNum;
      if (t.type === 'Dr') map[monthKey].Dr += t.amountNum;
    });

    const sorted = Object.keys(map).sort();
    return {
      labels: sorted.length > 0 ? sorted : ['No Data'],
      income: sorted.map(m => map[m].Cr),
      expense: sorted.map(m => map[m].Dr),
      net: sorted.map(m => map[m].Cr - map[m].Dr)
    };
  }, [filteredTransactions]);

  const cashflowChartData = {
    labels: monthlyTimeline.labels,
    datasets: [
      {
        type: 'bar',
        label: 'Inflow (Income)',
        data: monthlyTimeline.income,
        backgroundColor: '#10b981',
        borderRadius: 6,
        barPercentage: 0.6,
        categoryPercentage: 0.8
      },
      {
        type: 'bar',
        label: 'Outflow (Spend)',
        data: monthlyTimeline.expense,
        backgroundColor: '#ef4444',
        borderRadius: 6,
        barPercentage: 0.6,
        categoryPercentage: 0.8
      },
      {
        type: 'line',
        label: 'Net Surplus / Deficit',
        data: monthlyTimeline.net,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2.5,
        tension: 0.35,
        fill: false,
        pointBackgroundColor: '#3b82f6',
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  // -------------------------------------------------------------------------
  // CHART 2: Spending Breakdown by Group Type (Interactive Donut)
  // -------------------------------------------------------------------------
  const groupTypeSummary = useMemo(() => {
    const map = {};
    filteredTransactions.filter(t => t.type === 'Dr').forEach(t => {
      const grp = t.groupType || 'Other Expenses';
      map[grp] = (map[grp] || 0) + t.amountNum;
    });

    const sortedEntries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    const labels = sortedEntries.map(e => e[0]);
    const values = sortedEntries.map(e => e[1]);
    const total = values.reduce((sum, v) => sum + v, 0);

    return { labels, values, total, entries: sortedEntries };
  }, [filteredTransactions]);

  const donutColors = [
    '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444',
    '#06b6d4', '#ec4899', '#14b8a6', '#eab308', '#64748b'
  ];

  const donutChartData = {
    labels: groupTypeSummary.labels.length > 0 ? groupTypeSummary.labels : ['No Debits Recorded'],
    datasets: [
      {
        data: groupTypeSummary.values.length > 0 ? groupTypeSummary.values : [1],
        backgroundColor: groupTypeSummary.values.length > 0 ? donutColors.slice(0, groupTypeSummary.labels.length) : ['rgba(148, 163, 184, 0.2)'],
        borderWidth: 2,
        borderColor: isLightMode ? '#ffffff' : '#121826',
        hoverOffset: 6
      }
    ]
  };

  // -------------------------------------------------------------------------
  // CHART 3: 50/30/20 Financial Discipline Allocation
  // -------------------------------------------------------------------------
  const disciplineMetrics = useMemo(() => {
    let needs = 0;
    let wants = 0;
    let emergency = 0;
    let other = 0;

    filteredTransactions.filter(t => t.type === 'Dr').forEach(t => {
      const sub = (t.subType || '').toUpperCase();
      if (sub === 'NEEDS') needs += t.amountNum;
      else if (sub === 'WANTS') wants += t.amountNum;
      else if (sub === 'EMERGENCY' || sub === 'INVESTMENT') emergency += t.amountNum;
      else other += t.amountNum;
    });

    const totalDebits = needs + wants + emergency + other;
    const needsPct = totalDebits > 0 ? (needs / totalDebits) * 100 : 0;
    const wantsPct = totalDebits > 0 ? (wants / totalDebits) * 100 : 0;
    const emergencyPct = totalDebits > 0 ? (emergency / totalDebits) * 100 : 0;
    const otherPct = totalDebits > 0 ? (other / totalDebits) * 100 : 0;

    return {
      needs, wants, emergency, other, totalDebits,
      needsPct: needsPct.toFixed(1),
      wantsPct: wantsPct.toFixed(1),
      emergencyPct: emergencyPct.toFixed(1),
      otherPct: otherPct.toFixed(1)
    };
  }, [filteredTransactions]);

  // -------------------------------------------------------------------------
  // CHART 4: Account Liquidity & Debt Breakdown (Horizontal Stacked Bar)
  // -------------------------------------------------------------------------
  const accountDistribution = useMemo(() => {
    const list = accounts.map(a => ({
      code: a.code || a.name,
      name: a.name,
      type: a.type,
      balance: Number(a.balance || 0),
      isLiability: ['Card', 'Credit Card', 'Loan', 'Loan Account', 'Payable'].includes(a.type)
    }));

    return {
      labels: list.map(a => a.code),
      liquid: list.map(a => (!a.isLiability && a.balance >= 0 ? a.balance : 0)),
      debt: list.map(a => (a.isLiability || a.balance < 0 ? Math.abs(a.balance) : 0))
    };
  }, [accounts]);

  const accountChartData = {
    labels: accountDistribution.labels.length > 0 ? accountDistribution.labels : ['No Accounts'],
    datasets: [
      {
        label: 'Liquid Funds (₹)',
        data: accountDistribution.liquid,
        backgroundColor: '#10b981',
        borderRadius: 4
      },
      {
        label: 'Outstanding Liabilities (₹)',
        data: accountDistribution.debt,
        backgroundColor: '#ef4444',
        borderRadius: 4
      }
    ]
  };

  // Common Chart.js theme options
  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isLightMode ? '#475569' : '#94a3b8',
          font: { family: 'Inter', size: 11, weight: '600' },
          boxWidth: 12,
          padding: 12
        }
      },
      tooltip: {
        backgroundColor: isLightMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(18, 24, 38, 0.95)',
        titleColor: isLightMode ? '#0f172a' : '#f8fafc',
        bodyColor: isLightMode ? '#475569' : '#cbd5e1',
        borderColor: isLightMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        callbacks: {
          label: (ctx) => {
            const val = ctx.raw || 0;
            return ` ${ctx.dataset.label || ctx.label}: ₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: isLightMode ? '#64748b' : '#94a3b8', font: { size: 10 } }
      },
      y: {
        grid: { color: isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: isLightMode ? '#64748b' : '#94a3b8',
          font: { size: 10 },
          callback: (val) => '₹' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val)
        }
      }
    }
  };

  // Export Sliced Results
  const handleExportSlicedData = () => {
    const wb = XLSX.utils.book_new();
    const rows = filteredTransactions.map((t, idx) => ({
      '#': idx + 1,
      'Date': t.date,
      'Account': t.accountNo,
      'Category': t.categoryName,
      'Subcategory': t.subcategory,
      'Group Type': t.groupType,
      'Transaction Type': t.transactionType,
      'Discipline Sub-Type': t.subType,
      'Net Type': t.netType,
      'Type': t.type === 'Cr' ? 'Credit (Inflow)' : 'Debit (Outflow)',
      'Amount (INR)': t.amountNum,
      'Particulars': t.notes || ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Sliced Transactions');
    XLSX.writeFile(wb, `MoneyMatrix_Dashboard_Sliced_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  // Filtered transactions for the table (with internal search & row limit)
  const displayTableTransactions = useMemo(() => {
    let list = filteredTransactions;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      list = list.filter(t =>
        (t.categoryName || '').toLowerCase().includes(q) ||
        (t.subcategory || '').toLowerCase().includes(q) ||
        (t.notes || '').toLowerCase().includes(q) ||
        (t.accountNo || '').toLowerCase().includes(q) ||
        (t.groupType || '').toLowerCase().includes(q)
      );
    }
    if (tableLimit === 'ALL') return list;
    return list.slice(0, parseInt(tableLimit) || 10);
  }, [filteredTransactions, tableSearch, tableLimit]);

  // Core operating shortcuts
  const erpModules = [
    {
      id: 'accounts',
      title: 'Accounts Master & Balances',
      desc: 'Tracked bank accounts, credit cards, loan accounts, and closing balances',
      icon: Landmark,
      color: '#3b82f6',
      badge: `${accounts.length} Ledgers`
    },
    {
      id: 'categories',
      title: 'Taxonomy & Category Master',
      desc: 'Master spreadsheet datatable of income, expense, and rotational hierarchies',
      icon: Layers,
      color: '#10b981',
      badge: `${categories.length} Verified`
    },
    {
      id: 'networth',
      title: 'Net Worth Engine',
      desc: 'Yearly & Monthly closing balances, asset accumulation, and debt curves',
      icon: TrendingUp,
      color: '#8b5cf6',
      badge: 'Wealth OS'
    },
    {
      id: 'budget-actual',
      title: 'Budget vs. Actual Variance',
      desc: 'Needs, Savings, EMI, and Wants audits with financial deviation alerts',
      icon: PieIcon,
      color: '#f59e0b',
      badge: 'ERP Discipline'
    },
    {
      id: 'payables-receivables',
      title: 'Payables & Receivables',
      desc: 'Track personal loan repayments, borrowings, and peer advances',
      icon: Activity,
      color: '#ec4899',
      badge: 'Commitments'
    },
    {
      id: 'bulk-entry',
      title: 'Excel Bulk Grid Entry',
      desc: 'Batch transaction data entry, Excel clipboard paste, and CSV ingestion',
      icon: Upload,
      color: '#06b6d4',
      badge: 'Batch Grid'
    }
  ];

  return (
    <div style={{ padding: '1.25rem 1.5rem', maxWidth: '1480px', margin: '0 auto' }}>

      {/* 1. TOP HEADER & EXECUTIVE ACTION HERO */}
      <div className="card glass-card executive-hero-banner" style={{
        padding: '1.25rem 1.5rem',
        marginBottom: '1.25rem',
        borderRadius: '14px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '780px' }}>
            <div className="executive-live-badge">
              <ShieldCheck size={13} />
              <span>EXECUTIVE FINANCE OPERATING SYSTEM • LIVE COCKPIT</span>
            </div>

            <h2 style={{ fontSize: '1.375rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Executive Analytics & Slicers Cockpit
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0' }}>
              Multi-dimensional cross-filtering over accounts, living costs, rotational swiping, and net worth growth curves.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsSlicerPanelOpen(!isSlicerPanelOpen)}
              className={`btn btn-sm ${isSlicerPanelOpen ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                borderRadius: '8px'
              }}
            >
              <SlidersHorizontal size={14} />
              <span>{isSlicerPanelOpen ? 'Hide Slicers' : 'Show Slicers'}</span>
              {activeSlicerCount > 0 && (
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isSlicerPanelOpen ? 'rgba(255, 255, 255, 0.25)' : 'var(--primary-brand)',
                  color: '#fff',
                  fontSize: '0.625rem',
                  fontWeight: '800'
                }}>
                  {activeSlicerCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('single-entry')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', borderRadius: '8px' }}
            >
              <PlusCircle size={14} />
              <span>Record Transaction</span>
            </button>

            <button
              onClick={() => onNavigate('bulk-entry')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', borderRadius: '8px' }}
            >
              <Upload size={14} />
              <span>Excel Bulk Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. POWER BI STYLE SLICER PANEL (MULTI-SELECT VISUAL FILTERS) */}
      {isSlicerPanelOpen && (
        <div className="card glass-card" style={{
          padding: '1.25rem',
          marginBottom: '1.25rem',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} color="var(--primary-brand)" />
              <span style={{ fontSize: '0.875rem', fontWeight: '800', letterSpacing: '-0.01em' }}>
                Executive Slicers Control Bar
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                (Multi-select filters cross-slice all charts, KPIs, and audit lines simultaneously)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Sliced: <strong style={{ color: 'var(--text-primary)' }}>{filteredTransactions.length}</strong> of {normalizedTransactions.length} records
              </span>
              {activeSlicerCount > 0 && (
                <button
                  onClick={handleResetSlicers}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.6875rem', color: 'var(--accent-dr)', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <RotateCcw size={12} />
                  <span>Reset All Slicers</span>
                </button>
              )}
            </div>
          </div>

          {/* Slicer Row 1: Time Horizon & Account Slicers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            
            {/* Slicer A: Time Horizon */}
            <div>
              <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.4rem' }}>
                <Calendar size={12} /> Time Horizon Slicer
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {[
                  { id: 'ALL', label: 'All Time' },
                  { id: 'THIS_MONTH', label: 'This Month' },
                  { id: '30_DAYS', label: 'Last 30 Days' },
                  { id: '90_DAYS', label: 'Last 90 Days' },
                  { id: 'YTD', label: 'Year to Date' },
                  { id: 'CUSTOM', label: 'Custom Range' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setDatePreset(p.id)}
                    className={`btn btn-sm ${datePreset === p.id ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.6875rem', padding: '0.25rem 0.55rem', borderRadius: '6px' }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {datePreset === 'CUSTOM' && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="form-control"
                    style={{ fontSize: '0.75rem', height: '30px', padding: '0.2rem 0.4rem' }}
                    placeholder="From Date"
                  />
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="form-control"
                    style={{ fontSize: '0.75rem', height: '30px', padding: '0.2rem 0.4rem' }}
                    placeholder="To Date"
                  />
                </div>
              )}
            </div>

            {/* Slicer B: Account Slicer (Multi-Select) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
                  <Landmark size={12} /> Account Slicer (Multi-Select)
                </label>
                <button
                  onClick={() => setSelectedAccounts(['ALL'])}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.625rem', padding: '1px 4px', color: 'var(--primary-brand)' }}
                >
                  All Accounts
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '72px', overflowY: 'auto' }}>
                <button
                  onClick={() => setSelectedAccounts(['ALL'])}
                  className={`btn btn-sm ${selectedAccounts.includes('ALL') ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.6875rem', padding: '0.25rem 0.55rem', borderRadius: '6px' }}
                >
                  All Ledgers
                </button>
                {accounts.map(acc => {
                  const code = acc.code || acc.name;
                  const isSelected = selectedAccounts.includes(code);
                  return (
                    <button
                      key={code}
                      onClick={() => toggleMultiSelect(selectedAccounts, setSelectedAccounts, code)}
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                      style={{
                        fontSize: '0.6875rem',
                        padding: '0.25rem 0.55rem',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      {isSelected && <Check size={10} />}
                      <span>{code}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Slicer Row 2: Flow, Transaction Nature & 50/30/20 Discipline */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
            
            {/* Flow Slicer */}
            <div>
              <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                Financial Flow
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setSelectedFlow('ALL')}
                  className={`btn btn-sm ${selectedFlow === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.6875rem', padding: '0.25rem 0.55rem', borderRadius: '6px' }}
                >
                  All Flows
                </button>
                <button
                  onClick={() => setSelectedFlow('EXPENSE')}
                  className={`btn btn-sm ${selectedFlow === 'EXPENSE' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.6875rem', padding: '0.25rem 0.55rem', borderRadius: '6px', color: selectedFlow === 'EXPENSE' ? '#fff' : 'var(--accent-dr)' }}
                >
                  Expense (Dr)
                </button>
                <button
                  onClick={() => setSelectedFlow('INCOME')}
                  className={`btn btn-sm ${selectedFlow === 'INCOME' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.6875rem', padding: '0.25rem 0.55rem', borderRadius: '6px', color: selectedFlow === 'INCOME' ? '#fff' : 'var(--accent-cr)' }}
                >
                  Income (Cr)
                </button>
              </div>
            </div>

            {/* Transaction Type Slicer */}
            <div>
              <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                Transaction Type
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                <button
                  onClick={() => setSelectedTxTypes(['ALL'])}
                  className={`btn btn-sm ${selectedTxTypes.includes('ALL') ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.6875rem', padding: '0.25rem 0.55rem', borderRadius: '6px' }}
                >
                  All Types
                </button>
                {TX_TYPES.map(t => {
                  const isSelected = selectedTxTypes.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleMultiSelect(selectedTxTypes, setSelectedTxTypes, t)}
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ fontSize: '0.6875rem', padding: '0.25rem 0.55rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      {isSelected && <Check size={10} />}
                      <span>{t}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discipline Slicer (50/30/20) */}
            <div>
              <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                Budget Discipline (Sub-Type)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                <button
                  onClick={() => setSelectedSubTypes(['ALL'])}
                  className={`btn btn-sm ${selectedSubTypes.includes('ALL') ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.6875rem', padding: '0.25rem 0.55rem', borderRadius: '6px' }}
                >
                  All Disciplines
                </button>
                {SUB_TYPES.map(s => {
                  const isSelected = selectedSubTypes.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleMultiSelect(selectedSubTypes, setSelectedSubTypes, s)}
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ fontSize: '0.6875rem', padding: '0.25rem 0.55rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      {isSelected && <Check size={10} />}
                      <span>{s}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Taxonomy Group Slicer */}
            <div>
              <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                Taxonomy Group ({selectedGroups.includes('ALL') ? 'All' : selectedGroups.length + ' active'})
              </label>
              <select
                value={selectedGroups[0] || 'ALL'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'ALL') setSelectedGroups(['ALL']);
                  else setSelectedGroups([val]);
                }}
                className="form-control"
                style={{ fontSize: '0.75rem', height: '32px', padding: '0.2rem 0.5rem' }}
              >
                <option value="ALL">All Reporting Groups ({STANDARD_GROUP_TYPES.length})</option>
                {STANDARD_GROUP_TYPES.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Slicer Pill Tags Summary Bar */}
          {activeSlicerCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px dashed var(--border-color)' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: '700' }}>Active Slicers:</span>
              
              {datePreset !== 'ALL' && (
                <span className="badge" style={{ background: 'var(--primary-brand-bg)', color: 'var(--primary-brand)', border: '1px solid var(--border-color)', fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Date: {datePreset}
                  <X size={10} style={{ cursor: 'pointer' }} onClick={() => setDatePreset('ALL')} />
                </span>
              )}

              {!selectedAccounts.includes('ALL') && (
                <span className="badge" style={{ background: 'var(--primary-brand-bg)', color: 'var(--primary-brand)', border: '1px solid var(--border-color)', fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Accounts: {selectedAccounts.join(', ')}
                  <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSelectedAccounts(['ALL'])} />
                </span>
              )}

              {selectedFlow !== 'ALL' && (
                <span className="badge" style={{ background: 'var(--primary-brand-bg)', color: 'var(--primary-brand)', border: '1px solid var(--border-color)', fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Flow: {selectedFlow}
                  <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSelectedFlow('ALL')} />
                </span>
              )}

              {!selectedTxTypes.includes('ALL') && (
                <span className="badge" style={{ background: 'var(--primary-brand-bg)', color: 'var(--primary-brand)', border: '1px solid var(--border-color)', fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Tx: {selectedTxTypes.join(', ')}
                  <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSelectedTxTypes(['ALL'])} />
                </span>
              )}

              {!selectedGroups.includes('ALL') && (
                <span className="badge" style={{ background: 'var(--primary-brand-bg)', color: 'var(--primary-brand)', border: '1px solid var(--border-color)', fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Group: {selectedGroups.join(', ')}
                  <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSelectedGroups(['ALL'])} />
                </span>
              )}

              {!selectedSubTypes.includes('ALL') && (
                <span className="badge" style={{ background: 'var(--primary-brand-bg)', color: 'var(--primary-brand)', border: '1px solid var(--border-color)', fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Discipline: {selectedSubTypes.join(', ')}
                  <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSelectedSubTypes(['ALL'])} />
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. DYNAMIC KPI RIBBON (RECALCULATED IN REAL TIME BY SLICERS) */}
      <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        
        {/* KPI 1: Sliced Net Cashflow */}
        <div className="card glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
              Sliced Net Cashflow
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: netCashFlow >= 0 ? 'var(--accent-cr-bg)' : 'var(--accent-dr-bg)' }}>
              {netCashFlow >= 0 ? <TrendingUp size={16} color="var(--accent-cr)" /> : <TrendingDown size={16} color="var(--accent-dr)" />}
            </div>
          </div>
          <div style={{ fontSize: '1.625rem', fontWeight: '800', color: netCashFlow >= 0 ? 'var(--accent-cr)' : 'var(--accent-dr)', letterSpacing: '-0.02em' }}>
            {netCashFlow >= 0 ? '+' : '-'}₹{Math.abs(netCashFlow).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Inflow ₹{totalInflow.toLocaleString('en-IN')} − Outflow ₹{totalOutflow.toLocaleString('en-IN')}
          </div>
        </div>

        {/* KPI 2: Total Sliced Inflow & Outflow */}
        <div className="card glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
              Inflow vs. Outflow Volume
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'var(--primary-brand-bg)' }}>
              <Activity size={16} color="var(--primary-brand)" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <div style={{ fontSize: '1.3125rem', fontWeight: '800', color: 'var(--accent-cr)' }}>
              +₹{totalInflow.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '1.3125rem', fontWeight: '800', color: 'var(--accent-dr)' }}>
              −₹{totalOutflow.toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {inflowCount} Credits Inflow • {outflowCount} Debits Outflow
          </div>
        </div>

        {/* KPI 3: Targeted Accounts Net Worth */}
        <div className="card glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
              Target Accounts Net Worth
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)' }}>
              <Wallet size={16} color="#8b5cf6" />
            </div>
          </div>
          <div style={{ fontSize: '1.625rem', fontWeight: '800', color: activeNetWorth >= 0 ? 'var(--text-primary)' : 'var(--accent-dr)', letterSpacing: '-0.02em' }}>
            ₹{activeNetWorth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {activeNetWorthLakhs} Lakhs • Liquid Assets (₹{liquidBanks.toLocaleString('en-IN')}) − Debt (₹{activeLiabilities.toLocaleString('en-IN')})
          </div>
        </div>

        {/* KPI 4: Financial Retention & Discipline */}
        <div className="card glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
              Financial Retention Rate
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: Number(savingsRate) >= 20 ? 'var(--accent-cr-bg)' : 'rgba(245, 158, 11, 0.15)' }}>
              <Target size={16} color={Number(savingsRate) >= 20 ? 'var(--accent-cr)' : '#f59e0b'} />
            </div>
          </div>
          <div style={{ fontSize: '1.625rem', fontWeight: '800', color: Number(savingsRate) >= 20 ? 'var(--accent-cr)' : '#f59e0b', letterSpacing: '-0.02em' }}>
            {savingsRate}%
          </div>
          <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Needs: {disciplineMetrics.needsPct}% • Wants: {disciplineMetrics.wantsPct}% • Target: 20%+
          </div>
        </div>

      </div>

      {/* 4. FOUR RICH INTERACTIVE EXECUTIVE CHARTS (2x2 GRID) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        
        {/* CHART 1: Monthly Inflow vs Outflow & Net Cashflow Dynamics */}
        <div className="card glass-card" style={{ padding: '1.25rem', minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ fontSize: '0.96875rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart2 size={16} color="var(--primary-brand)" />
                <span>Monthly Cashflow Dynamics & Trajectory</span>
              </h4>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Grouped monthly Inflow (Cr) vs Outflow (Dr) with net surplus trendline
              </p>
            </div>
            <span style={{ fontSize: '0.65625rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
              {monthlyTimeline.labels.length} Periods
            </span>
          </div>

          <div style={{ flex: 1, minHeight: '280px', position: 'relative' }}>
            <Bar data={cashflowChartData} options={commonChartOptions} />
          </div>
        </div>

        {/* CHART 2: Spending Breakdown by Taxonomy Group Type */}
        <div className="card glass-card" style={{ padding: '1.25rem', minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ fontSize: '0.96875rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PieIcon size={16} color="#f59e0b" />
                <span>Expense Allocation by Taxonomy Group</span>
              </h4>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Volume and percentage distribution across spending classification groups
              </p>
            </div>
            <span style={{ fontSize: '0.6875rem', fontWeight: '800', color: 'var(--accent-dr)' }}>
              Total: ₹{groupTypeSummary.total.toLocaleString('en-IN')}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1, alignItems: 'center' }}>
            <div style={{ height: '260px', position: 'relative' }}>
              <Doughnut
                data={donutChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '68%',
                  plugins: {
                    legend: { display: false },
                    tooltip: commonChartOptions.plugins.tooltip
                  }
                }}
              />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{ fontSize: '0.65625rem', color: 'var(--text-muted)', fontWeight: '700' }}>TOTAL OUTFLOW</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  ₹{(groupTypeSummary.total >= 100000 ? (groupTypeSummary.total / 100000).toFixed(2) + 'L' : groupTypeSummary.total.toLocaleString('en-IN'))}
                </div>
              </div>
            </div>

            {/* Ranked legend list */}
            <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.45rem', paddingRight: '4px' }}>
              {groupTypeSummary.entries.length === 0 ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                  No debit records in selected range.
                </div>
              ) : (
                groupTypeSummary.entries.map(([grp, amt], idx) => {
                  const pct = groupTypeSummary.total > 0 ? ((amt / groupTypeSummary.total) * 100).toFixed(1) : 0;
                  const color = donutColors[idx % donutColors.length];
                  return (
                    <div
                      key={grp}
                      style={{
                        padding: '0.35rem 0.5rem',
                        borderRadius: '6px',
                        background: 'var(--bg-input)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.71875rem',
                        borderLeft: `3px solid ${color}`
                      }}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                        <span style={{ fontWeight: '700' }}>{grp}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>₹{amt.toLocaleString('en-IN')}</strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.625rem', marginLeft: '4px' }}>({pct}%)</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* CHART 3: 50/30/20 Financial Discipline Gauge */}
        <div className="card glass-card" style={{ padding: '1.25rem', minHeight: '360px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ fontSize: '0.96875rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Target size={16} color="#8b5cf6" />
                <span>50 / 30 / 20 Budget Discipline Benchmark</span>
              </h4>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Actual spending distribution vs standard financial health ratios
              </p>
            </div>
            <span style={{
              fontSize: '0.65625rem',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '12px',
              background: Number(disciplineMetrics.needsPct) <= 50 ? 'var(--accent-cr-bg)' : 'rgba(239, 68, 68, 0.15)',
              color: Number(disciplineMetrics.needsPct) <= 50 ? 'var(--accent-cr)' : '#ef4444'
            }}>
              {Number(disciplineMetrics.needsPct) <= 50 ? 'Healthy Discipline' : 'Needs Optimization'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'center' }}>
            
            {/* Needs: 50% target */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: '700', color: '#3b82f6' }}>Needs (Essentials, Rent, Utilities, Groceries)</span>
                <span><strong>₹{disciplineMetrics.needs.toLocaleString('en-IN')}</strong> ({disciplineMetrics.needsPct}% vs 50% max)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, disciplineMetrics.needsPct)}%`,
                  background: Number(disciplineMetrics.needsPct) <= 50 ? '#3b82f6' : '#ef4444',
                  borderRadius: '4px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>

            {/* Wants: 30% target */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: '700', color: '#f59e0b' }}>Wants (Dining, Shopping, Entertainment, Subscriptions)</span>
                <span><strong>₹{disciplineMetrics.wants.toLocaleString('en-IN')}</strong> ({disciplineMetrics.wantsPct}% vs 30% max)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, disciplineMetrics.wantsPct)}%`,
                  background: Number(disciplineMetrics.wantsPct) <= 30 ? '#f59e0b' : '#ef4444',
                  borderRadius: '4px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>

            {/* Emergency & Savings: 20% target */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: '700', color: '#10b981' }}>Savings & Emergency Retention</span>
                <span><strong>{savingsRate}%</strong> (Target: 20%+ of Income)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, savingsRate)}%`,
                  background: Number(savingsRate) >= 20 ? '#10b981' : '#f59e0b',
                  borderRadius: '4px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>

            <div style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              fontSize: '0.71875rem',
              color: 'var(--text-muted)',
              lineHeight: 1.4
            }}>
              💡 <strong>Executive AI Insight:</strong> Your current essential needs account for <strong>{disciplineMetrics.needsPct}%</strong> of total spend. Discretionary wants are at <strong>{disciplineMetrics.wantsPct}%</strong>.
            </div>
          </div>
        </div>

        {/* CHART 4: Account Liquidity & Debt Breakdown */}
        <div className="card glass-card" style={{ padding: '1.25rem', minHeight: '360px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ fontSize: '0.96875rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wallet size={16} color="#10b981" />
                <span>Account Balances & Liabilities Spectrum</span>
              </h4>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Liquid balances (green) compared against credit cards and loan liabilities (red)
              </p>
            </div>
            <button
              onClick={() => onNavigate('accounts')}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.6875rem' }}
            >
              Manage Accounts →
            </button>
          </div>

          <div style={{ flex: 1, minHeight: '260px', position: 'relative' }}>
            <Bar
              data={accountChartData}
              options={{
                ...commonChartOptions,
                indexAxis: 'y',
                scales: {
                  x: commonChartOptions.scales.y,
                  y: {
                    grid: { display: false },
                    ticks: { color: isLightMode ? '#475569' : '#94a3b8', font: { size: 10, weight: '700' } }
                  }
                }
              }}
            />
          </div>
        </div>

      </div>

      {/* 5. SLICED TRANSACTIONS AUDIT TABLE WITH QUICK ACTIONS */}
      <div className="card glass-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '800', margin: 0 }}>
              Live Sliced Transactions Audit Feed
            </h4>
            <p style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Showing {displayTableTransactions.length} of {filteredTransactions.length} records matching current slicers
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Search inside table */}
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search matching records..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="form-control"
                style={{ fontSize: '0.75rem', height: '30px', paddingLeft: '1.75rem', width: '200px' }}
              />
            </div>

            {/* Row limit selector */}
            <select
              value={tableLimit}
              onChange={(e) => setTableLimit(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.75rem', height: '30px', width: '100px', padding: '0.2rem 0.4rem' }}
            >
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="25">Top 25</option>
              <option value="ALL">All ({filteredTransactions.length})</option>
            </select>

            <button
              onClick={handleExportSlicedData}
              disabled={filteredTransactions.length === 0}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', height: '30px' }}
            >
              <Download size={13} />
              <span>Export Sliced (.xlsx)</span>
            </button>

            <button
              onClick={() => onNavigate('all-transactions')}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.75rem', height: '30px' }}
            >
              Full Master Audit →
            </button>
          </div>
        </div>

        {displayTableTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <Layers size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.875rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
              No transactions match current slicers
            </p>
            <p style={{ fontSize: '0.75rem', margin: '4px 0 0' }}>
              Try adjusting your date range, accounts, or click "Reset All Slicers" above.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.78125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.6875rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Date</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Account</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Category / Subcat</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Group Type</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Tx Type</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Discipline</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Particulars</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {displayTableTransactions.map((t) => {
                  const isCr = t.type === 'Cr';
                  return (
                    <tr
                      key={t.id}
                      style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-secondary)' }}>{t.date}</td>
                      <td style={{ padding: '0.55rem 0.75rem' }}>
                        <span style={{ fontSize: '0.6875rem', fontWeight: '700', padding: '1px 5px', borderRadius: '4px', background: 'var(--bg-input)' }}>
                          {t.accountNo}
                        </span>
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {t.subcategory || t.categoryName}
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-secondary)' }}>
                        {t.groupType}
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem' }}>
                        <span style={{
                          fontSize: '0.625rem',
                          fontWeight: '700',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          background: t.transactionType === 'ROTATIONAL' ? 'rgba(168, 85, 247, 0.15)' : 'var(--bg-input)',
                          color: t.transactionType === 'ROTATIONAL' ? '#a855f7' : 'var(--text-secondary)'
                        }}>
                          {t.transactionType}
                        </span>
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem' }}>
                        <span style={{
                          fontSize: '0.625rem',
                          fontWeight: '700',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          background: t.subType === 'WANTS' ? 'rgba(245, 158, 11, 0.15)' : (t.subType === 'EMERGENCY' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)'),
                          color: t.subType === 'WANTS' ? '#f59e0b' : (t.subType === 'EMERGENCY' ? '#ef4444' : '#3b82f6')
                        }}>
                          {t.subType || 'NEEDS'}
                        </span>
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.notes || '—'}
                      </td>
                      <td style={{
                        padding: '0.55rem 0.75rem',
                        textAlign: 'right',
                        fontWeight: '800',
                        color: isCr ? 'var(--accent-cr)' : 'var(--accent-dr)'
                      }}>
                        {isCr ? '+' : '−'}₹{t.amountNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. CORE ERP OPERATING MODULES (SHORTCUT CARDS) */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.0625rem', fontWeight: '800', margin: 0 }}>
            Core Operating Capabilities
          </h3>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            Direct Workspace Shortcuts
          </span>
        </div>

        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {erpModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                onClick={() => onNavigate(mod.id)}
                className="card glass-card"
                style={{
                  padding: '1.05rem',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--primary-brand)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `${mod.color}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={16} color={mod.color} />
                    </div>
                    <span style={{
                      fontSize: '0.625rem',
                      fontWeight: '700',
                      padding: '0.12rem 0.4rem',
                      borderRadius: '4px',
                      background: 'var(--bg-input)',
                      color: mod.color
                    }}>
                      {mod.badge}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.90625rem', fontWeight: '700', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                    {mod.title}
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.35, margin: 0 }}>
                    {mod.desc}
                  </p>
                </div>

                <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary-brand)', fontSize: '0.71875rem', fontWeight: '700' }}>
                  <span>Launch Module</span>
                  <ArrowRight size={12} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
