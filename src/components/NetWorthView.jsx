import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Landmark,
  CreditCard,
  Wallet,
  ShieldAlert,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Download,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { getClosingBalancesAPI } from '../utils/api';
import DataTablePagination, { useDataTablePagination } from './DataTablePagination';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function NetWorthView({
  accounts = [],
  transactions = [],
  cashBalance = 0,
  onNavigateToImport
}) {
  // Mode: 'yearly' | 'monthly' | 'daily'
  const [closingMode, setClosingMode] = useState('yearly');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [closingData, setClosingData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Compute live current assets and liabilities from real accounts
  const liquidAssets = accounts
    .filter(a => a.type === 'Cash' || a.type === 'Savings Account' || a.type === 'Current Account' || a.dump_type === 'FINANCE' || a.dump_type === 'BANK')
    .reduce((sum, a) => sum + Number(a.balance || 0), 0);

  const ccDebt = accounts
    .filter(a => a.type === 'Credit Card' || a.dump_type === 'CREDIT_CARD')
    .reduce((sum, a) => sum + (Number(a.balance || 0) < 0 ? Math.abs(Number(a.balance)) : 0), 0);

  const loanDebt = accounts
    .filter(a => a.type === 'Loan Account' || a.dump_type === 'LOAN')
    .reduce((sum, a) => sum + (Number(a.balance || 0) < 0 ? Math.abs(Number(a.balance)) : 0), 0);

  const totalLiabilities = ccDebt + loanDebt;
  const currentNetWorth = liquidAssets - totalLiabilities;
  const currentNetWorthLakhs = (currentNetWorth / 100000).toFixed(1);

  // Fetch or calculate closing balances dynamically
  useEffect(() => {
    let isMounted = true;
    async function loadClosingData() {
      setLoading(true);
      try {
        const yr = selectedYear !== 'ALL' ? selectedYear : null;
        const res = await getClosingBalancesAPI(closingMode, yr);
        if (isMounted && res && res.data && res.data.length > 0) {
          setClosingData(res.data);
        } else {
          // Fallback to client-side reconstruction
          generateClientClosingData(closingMode, yr);
        }
      } catch (err) {
        console.warn("Could not fetch remote closing snapshots, falling back to local:", err.message);
        generateClientClosingData(closingMode, selectedYear !== 'ALL' ? selectedYear : null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    const handleReset = () => {
      setClosingData([]);
      loadClosingData();
    };
    window.addEventListener('moneymatrix_data_reset', handleReset);

    loadClosingData();
    return () => {
      isMounted = false;
      window.removeEventListener('moneymatrix_data_reset', handleReset);
    };
  }, [closingMode, selectedYear, transactions.length, accounts.length]);

  // Client-side fallback calculation matching exact Excel closing formulas
  const generateClientClosingData = (mode, yrFilter) => {
    if (!transactions || transactions.length === 0) {
      setClosingData([]);
      return;
    }

    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (mode === 'yearly') {
      const years = {};
      sorted.forEach(t => {
        const y = new Date(t.date).getFullYear();
        if (y) years[y] = true;
      });
      if (Object.keys(years).length === 0) {
        years[2024] = true;
      }

      const rows = Object.keys(years).sort().map(yStr => {
        const yr = Number(yStr);
        const yEnd = `${yr}-12-31`;
        return calculateSnapshotAtDate(yEnd, `31-Dec-${String(yr).slice(-2)}`, `${yr}-12-Dec`, yr);
      });
      setClosingData(rows);
    } else if (mode === 'monthly') {
      const months = {};
      sorted.forEach(t => {
        const ym = t.date.slice(0, 7);
        if (ym) months[ym] = true;
      });
      if (yrFilter) {
        for (let m = 1; m <= 12; m++) {
          months[`${yrFilter}-${String(m).padStart(2, '0')}`] = true;
        }
      }

      const rows = Object.keys(months).sort().map(ym => {
        const [yStr, mStr] = ym.split('-');
        const y = Number(yStr);
        const d = new Date(y, Number(mStr), 0);
        const lastDay = d.getDate();
        const mName = d.toLocaleString('en-US', { month: 'short' });
        const yEnd = `${ym}-${lastDay}`;
        return calculateSnapshotAtDate(yEnd, `${lastDay}-${mName}-${yStr.slice(-2)}`, `${y}-${mStr}-${mName}`, y);
      });
      setClosingData(rows);
    } else {
      // Daily
      const dates = {};
      sorted.forEach(t => {
        if (t.date) dates[t.date] = true;
      });
      const rows = Object.keys(dates).sort().map(dStr => {
        const d = new Date(dStr);
        const dFmt = `${String(d.getDate()).padStart(2, '0')}-${d.toLocaleString('en-US', { month: 'short' })}-${String(d.getFullYear()).slice(-2)}`;
        return calculateSnapshotAtDate(dStr, dFmt, dStr, d.getFullYear());
      });
      setClosingData(rows);
    }
  };

  const calculateSnapshotAtDate = (dateLimit, dateLabel, labLabel, year) => {
    let familyBal = 0;
    let ccLiability = 0;
    let loanDebt = 0;

    const accBalances = {};
    accounts.forEach(a => {
      accBalances[a.code] = { ...a, running: 0 };
    });

    transactions.forEach(t => {
      if (t.date <= dateLimit) {
        const code = t.account_no || 'Cash_1';
        if (!accBalances[code]) {
          accBalances[code] = { code, type: 'Savings Account', running: 0 };
        }
        const amt = Number(t.amount || 0);
        if (t.type === 'Cr') {
          accBalances[code].running += amt;
        } else {
          accBalances[code].running -= amt;
        }
      }
    });

    Object.values(accBalances).forEach(acc => {
      const bal = acc.running;
      const t = (acc.type || '') + ' ' + (acc.dump_type || '');
      if (/credit|cc/i.test(t)) {
        if (bal < 0) ccLiability += bal;
      } else if (/loan/i.test(t)) {
        if (bal < 0) loanDebt += bal;
      } else {
        familyBal += bal;
      }
    });

    const netWorth = familyBal + ccLiability + loanDebt;
    return {
      date: dateLabel,
      full_date: dateLimit,
      year,
      lab: labLabel,
      family_closing_balance: familyBal,
      cc_liability: ccLiability,
      loans: loanDebt,
      networth: netWorth,
      networth_lakhs: Number((netWorth / 100000).toFixed(1)),
      loans_lakhs: Number((loanDebt / 100000).toFixed(1)),
      cc_liability_lakhs: Number((ccLiability / 100000).toFixed(1)),
      savings_bal_lakhs: Number((familyBal / 100000).toFixed(1))
    };
  };

  // Filtered Closing Data
  const filteredClosingRows = useMemo(() => {
    return closingData.filter(row => {
      if (selectedYear !== 'ALL' && row.year && String(row.year) !== String(selectedYear)) {
        return false;
      }
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        return (row.date && row.date.toLowerCase().includes(q)) || (row.lab && row.lab.toLowerCase().includes(q));
      }
      return true;
    });
  }, [closingData, selectedYear, searchFilter]);

  // Pagination for large monthly / daily datasets
  const {
    paginatedItems,
    currentPage,
    totalPages,
    pageSize,
    totalRecords,
    setCurrentPage,
    setPageSize
  } = useDataTablePagination(filteredClosingRows, 15);

  // Available Years for filter dropdown
  const availableYears = useMemo(() => {
    const s = new Set();
    closingData.forEach(r => {
      if (r.year) s.add(r.year);
    });
    return Array.from(s).sort((a, b) => b - a);
  }, [closingData]);

  // Export Closing Sheet to Excel exactly with the 10 headers from the master sheet
  const handleExportClosingExcel = () => {
    if (filteredClosingRows.length === 0) {
      alert("No closing records to export.");
      return;
    }

    const exportData = filteredClosingRows.map(r => ({
      'DATE': r.date,
      'LAB': r.lab,
      'FAMILY CLOSING BALANCE': r.family_closing_balance,
      'CC LIABLITY': r.cc_liability,
      'LOANS': r.loans,
      'NETWORTH': r.networth,
      'NETWORTH in lakhs': r.networth_lakhs,
      'LOANS in lakhs': r.loans_lakhs,
      'CC LIABLITY in lakhs': r.cc_liability_lakhs,
      'SAVINGS BAL in lakhs': r.savings_bal_lakhs,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${closingMode.toUpperCase()}_CLOSING`);
    XLSX.writeFile(wb, `MoneyMatrix_${closingMode.toUpperCase()}_Closing_Balances.xlsx`);
  };

  // Trajectory Chart Data
  const chartData = useMemo(() => {
    const sorted = [...filteredClosingRows].sort((a, b) => new Date(a.full_date) - new Date(b.full_date));
    return {
      labels: sorted.map(d => d.lab || d.date),
      datasets: [
        {
          label: 'Net Worth (₹)',
          data: sorted.map(d => d.networth),
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168, 85, 247, 0.15)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#a855f7'
        },
        {
          label: 'Family Liquid Assets (₹)',
          data: sorted.map(d => d.family_closing_balance),
          borderColor: '#10b981',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [4, 4],
          pointRadius: 3,
          pointBackgroundColor: '#10b981'
        },
        {
          label: 'CC Liability (₹)',
          data: sorted.map(d => d.cc_liability),
          borderColor: '#ef4444',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          pointRadius: 3,
          pointBackgroundColor: '#ef4444'
        }
      ]
    };
  }, [filteredClosingRows]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ₹${Number(context.raw || 0).toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', callback: (val) => `₹${(val / 1000).toFixed(0)}k` }
      }
    }
  };

  const fmtCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    const n = Number(val);
    if (n < 0) {
      return `₹-${Math.abs(n).toLocaleString('en-IN')}`;
    }
    return `₹${n.toLocaleString('en-IN')}`;
  };

  const fmtLakhs = (val) => {
    if (val === undefined || val === null) return '₹0.0';
    const n = Number(val);
    if (n < 0) {
      return `₹-${Math.abs(n).toFixed(1)}`;
    }
    return `₹${n.toFixed(1)}`;
  };

  return (
    <div style={{ padding: '1.25rem', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* KPI Summary Cards */}
      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        
        {/* Net Worth Card */}
        <div className="card glass-card" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Current Net Worth
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: currentNetWorth >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}>
              {currentNetWorth >= 0 ? <TrendingUp size={16} color="#10b981" /> : <TrendingDown size={16} color="#ef4444" />}
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: currentNetWorth >= 0 ? 'var(--accent-cr)' : 'var(--accent-dr)', letterSpacing: '-0.02em' }}>
            {fmtCurrency(currentNetWorth)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{currentNetWorthLakhs} Lakhs</strong> (Liquid Assets + Liabilities)
          </div>
        </div>

        {/* Family Liquid Balances Card */}
        <div className="card glass-card" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Family Liquid Assets
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)' }}>
              <Landmark size={16} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-cr)', letterSpacing: '-0.02em' }}>
            {fmtCurrency(liquidAssets)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{(liquidAssets / 100000).toFixed(1)} Lakhs</strong> (Savings, Current & Cash_1)
          </div>
        </div>

        {/* Total Debt & CC Liabilities */}
        <div className="card glass-card" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Debt Liabilities
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)' }}>
              <ShieldAlert size={16} color="#ef4444" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: totalLiabilities > 0 ? '#ef4444' : 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {fmtCurrency(-totalLiabilities)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
            CC: <strong style={{ color: '#ef4444' }}>{fmtCurrency(-ccDebt)}</strong> • Loans: <strong style={{ color: '#ef4444' }}>{fmtCurrency(-loanDebt)}</strong>
          </div>
        </div>

      </div>

      {/* Trajectory Growth Chart */}
      <div className="card glass-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
              Net Worth & Closing Balance Trajectory
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
              Interactive growth curves rendered across closing snapshot dates
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-input)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setClosingMode('yearly')}
                className={`btn btn-sm ${closingMode === 'yearly' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '6px' }}
              >
                Yearwise
              </button>
              <button
                onClick={() => setClosingMode('monthly')}
                className={`btn btn-sm ${closingMode === 'monthly' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '6px' }}
              >
                Monthwise
              </button>
              <button
                onClick={() => setClosingMode('daily')}
                className={`btn btn-sm ${closingMode === 'daily' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '6px' }}
              >
                Daywise
              </button>
            </div>
          </div>
        </div>

        {filteredClosingRows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <PieChart size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.25rem' }}>
              No Closing Snapshots Available
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', maxWidth: '380px', margin: '0 auto 1rem' }}>
              Record transactions or finalize a date to generate closing snapshots.
            </p>
          </div>
        ) : (
          <div style={{ height: '320px', width: '100%' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>

      {/* Enterprise Closing Balances Master Table Section */}
      <div className="card glass-card" style={{ padding: '1.25rem' }}>
        
        {/* Table Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
              {closingMode.toUpperCase()} CLOSING BALANCE & NET WORTH LEDGER
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
              Exact 10-column financial master schema matching your Excel reference sheets
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* Year Selector */}
            {closingMode !== 'yearly' && availableYears.length > 0 && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="form-control"
                style={{ height: '34px', fontSize: '0.75rem', padding: '0.2rem 0.6rem', width: '130px' }}
              >
                <option value="ALL">All Years</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}

            {/* Search Filter */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search date, label..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="form-control"
                style={{ height: '34px', fontSize: '0.75rem', paddingLeft: '32px', width: '180px' }}
              />
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportClosingExcel}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', height: '34px', fontSize: '0.75rem' }}
              title="Download closing sheet to Excel (.xlsx)"
            >
              <Download size={14} />
              <span>Export Sheet</span>
            </button>
          </div>
        </div>

        {/* Master 10-Column Data Table */}
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', whiteSpace: 'nowrap', textAlign: 'left' }}>
            
            {/* Color-Banded Headers matching Excel Master */}
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                <th style={{ background: '#1e293b', color: '#fff', padding: '0.75rem 0.85rem', fontWeight: '800', minWidth: '95px' }}>
                  DATE
                </th>
                <th style={{ background: '#334155', color: '#fff', padding: '0.75rem 0.85rem', fontWeight: '800', minWidth: '110px' }}>
                  LAB
                </th>
                <th style={{ background: '#86efac', color: '#064e3b', padding: '0.75rem 0.85rem', fontWeight: '800', textAlign: 'right', minWidth: '160px' }}>
                  FAMILY CLOSING BALANCE
                </th>
                <th style={{ background: '#fef08a', color: '#713f12', padding: '0.75rem 0.85rem', fontWeight: '800', textAlign: 'right', minWidth: '120px' }}>
                  CC LIABLITY
                </th>
                <th style={{ background: '#f87171', color: '#ffffff', padding: '0.75rem 0.85rem', fontWeight: '800', textAlign: 'right', minWidth: '110px' }}>
                  LOANS
                </th>
                <th style={{ background: '#a855f7', color: '#ffffff', padding: '0.75rem 0.85rem', fontWeight: '800', textAlign: 'right', minWidth: '130px' }}>
                  NETWORTH
                </th>
                <th style={{ background: '#7e22ce', color: '#ffffff', padding: '0.75rem 0.85rem', fontWeight: '800', textAlign: 'right', minWidth: '140px' }}>
                  NETWORTH in lakhs
                </th>
                <th style={{ background: '#dc2626', color: '#ffffff', padding: '0.75rem 0.85rem', fontWeight: '800', textAlign: 'right', minWidth: '125px' }}>
                  LOANS in lakhs
                </th>
                <th style={{ background: '#d97706', color: '#ffffff', padding: '0.75rem 0.85rem', fontWeight: '800', textAlign: 'right', minWidth: '150px' }}>
                  CC LIABLITY in lakhs
                </th>
                <th style={{ background: '#10b981', color: '#ffffff', padding: '0.75rem 0.85rem', fontWeight: '800', textAlign: 'right', minWidth: '155px' }}>
                  SAVINGS BAL in lakhs
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No closing balance records found for the selected criteria.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((r, idx) => {
                  const isNetNegative = r.networth < 0;
                  const isCcNegative = r.cc_liability < 0;
                  const isLoanNegative = r.loans < 0;

                  return (
                    <tr
                      key={idx}
                      style={{
                        background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-card-solid)',
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* DATE */}
                      <td style={{ padding: '0.65rem 0.85rem', fontWeight: '700', color: 'var(--text-primary)', borderRight: '1px solid var(--border-color)' }}>
                        {r.date}
                      </td>

                      {/* LAB */}
                      <td style={{ padding: '0.65rem 0.85rem', color: 'var(--text-secondary)', borderRight: '1px solid var(--border-color)' }}>
                        {r.lab}
                      </td>

                      {/* FAMILY CLOSING BALANCE */}
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: '700', color: r.family_closing_balance >= 0 ? 'var(--accent-cr)' : 'var(--accent-dr)', borderRight: '1px solid var(--border-color)' }}>
                        {fmtCurrency(r.family_closing_balance)}
                      </td>

                      {/* CC LIABLITY */}
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: '700', color: isCcNegative ? '#dc2626' : 'var(--text-muted)', borderRight: '1px solid var(--border-color)' }}>
                        {fmtCurrency(r.cc_liability)}
                      </td>

                      {/* LOANS */}
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: '700', color: isLoanNegative ? '#dc2626' : 'var(--text-muted)', borderRight: '1px solid var(--border-color)' }}>
                        {fmtCurrency(r.loans)}
                      </td>

                      {/* NETWORTH */}
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: '800', color: isNetNegative ? '#dc2626' : 'var(--text-primary)', borderRight: '1px solid var(--border-color)' }}>
                        {fmtCurrency(r.networth)}
                      </td>

                      {/* NETWORTH in lakhs */}
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: '700', color: isNetNegative ? '#dc2626' : 'var(--text-primary)', borderRight: '1px solid var(--border-color)' }}>
                        {fmtLakhs(r.networth_lakhs)}
                      </td>

                      {/* LOANS in lakhs */}
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: '600', color: isLoanNegative ? '#dc2626' : 'var(--text-muted)', borderRight: '1px solid var(--border-color)' }}>
                        {fmtLakhs(r.loans_lakhs)}
                      </td>

                      {/* CC LIABLITY in lakhs */}
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: '600', color: isCcNegative ? '#dc2626' : 'var(--text-muted)', borderRight: '1px solid var(--border-color)' }}>
                        {fmtLakhs(r.cc_liability_lakhs)}
                      </td>

                      {/* SAVINGS BAL in lakhs */}
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: '700', color: r.savings_bal_lakhs >= 0 ? 'var(--accent-cr)' : 'var(--accent-dr)' }}>
                        {fmtLakhs(r.savings_bal_lakhs)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Data Table Pagination */}
        {filteredClosingRows.length > 0 && (
          <div style={{ marginTop: '0.85rem' }}>
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalRecords={totalRecords}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[15, 30, 50, 100]}
            />
          </div>
        )}

      </div>

    </div>
  );
}
