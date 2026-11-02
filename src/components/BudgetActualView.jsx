import React, { useState, useMemo, useEffect } from 'react';
import {
  PieChart as PieIcon,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  PlusCircle,
  Tags,
  Download,
  Calendar,
  Layers,
  Save,
  RotateCcw,
  Sparkles,
  BarChart2,
  LineChart as LineChartIcon
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
import { Line, Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { getBudgetsAPI, saveBudgetsAPI } from '../utils/api';

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

export default function BudgetActualView({
  transactions = [],
  categories = [],
  onNavigateToCategories,
  onNavigateToEntry
}) {
  const [activeTab, setActiveTab] = useState('operational'); // 'operational' | 'divisions' | 'matrix'
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedSubCategory, setSelectedSubCategory] = useState('SALARY');
  const [matrixSide, setMatrixSide] = useState('CR'); // 'CR' | 'DR'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Budget data state
  const [operationalData, setOperationalData] = useState([]);
  const [divisionsData, setDivisionsData] = useState([]);
  const [matrixData, setMatrixData] = useState({ DR: {}, CR: {} });

  // Load Budget & Actuals Data from API
  const loadBudgetData = async () => {
    setLoading(true);
    try {
      const res = await getBudgetsAPI(selectedYear, selectedSubCategory);
      if (res && res.success) {
        setOperationalData(res.operational || []);
        setDivisionsData(res.divisions || []);
        setMatrixData(res.matrix || { DR: {}, CR: {} });
      }
    } catch (err) {
      console.warn("Failed to load budget API:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgetData();
    const handleReset = () => loadBudgetData();
    window.addEventListener('moneymatrix_data_reset', handleReset);
    return () => window.removeEventListener('moneymatrix_data_reset', handleReset);
  }, [selectedYear, selectedSubCategory, transactions.length]);

  // Overall KPI metrics
  const totalAllocated = useMemo(() => {
    return operationalData.reduce((sum, grp) => sum + (grp.total_allocated || 0), 0);
  }, [operationalData]);

  const totalActuals = useMemo(() => {
    return operationalData.reduce((sum, grp) => sum + (grp.total_actuals || 0), 0);
  }, [operationalData]);

  const overallUtilization = totalAllocated > 0 ? ((totalActuals / totalAllocated) * 100).toFixed(1) : 0;

  // Handle inline modification of target values
  const handleItemChange = (groupName, itemSubcat, field, val) => {
    const num = parseFloat(val) || 0;
    setOperationalData(prev => {
      return prev.map(grp => {
        if (grp.group_name !== groupName) return grp;
        const updatedItems = grp.items.map(item => {
          if (item.subcategory !== itemSubcat) return item;
          const updated = { ...item, [field]: num };
          if (field === 'allocated') {
            updated.utilization = num > 0 ? Number(((updated.actuals / num) * 100).toFixed(1)) : 0;
          }
          return updated;
        });

        const newAllocated = updatedItems.reduce((s, i) => s + i.allocated, 0);
        const newActuals = updatedItems.reduce((s, i) => s + i.actuals, 0);
        const newUtil = newAllocated > 0 ? Number(((newActuals / newAllocated) * 100).toFixed(1)) : 0;

        return {
          ...grp,
          items: updatedItems,
          total_allocated: newAllocated,
          total_actuals: newActuals,
          total_utilization: newUtil
        };
      });
    });
  };

  // Save budget modifications to database
  const handleSaveBudgets = async () => {
    setSaving(true);
    try {
      const targets = [];
      operationalData.forEach(grp => {
        grp.items.forEach(item => {
          targets.push({
            subcategory: item.subcategory,
            group_type: grp.group_name,
            division: 'EXPENSE',
            forecast: item.forecast,
            estimated: item.estimated,
            allocated: item.allocated,
            target: item.allocated
          });
        });
      });

      await saveBudgetsAPI({ year: selectedYear, targets });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Failed to save budget targets: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Export Budget & Actuals to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Operational Sheet
    const opExport = [];
    operationalData.forEach(grp => {
      grp.items.forEach(i => {
        opExport.push({
          'GROUP': grp.group_name,
          'SUBCATEGORY': i.subcategory,
          'FORECAST': i.forecast,
          'ESTIMATED': i.estimated,
          'ALLOCATED': i.allocated,
          'ACTUALS': i.actuals,
          'UTILIZATION %': `${i.utilization}%`
        });
      });
    });
    const wsOp = XLSX.utils.json_to_sheet(opExport);
    XLSX.utils.book_append_sheet(wb, wsOp, `Operational_${selectedYear}`);

    // 2. Divisions Sheet
    const divExport = [];
    divisionsData.forEach(div => {
      div.items.forEach(i => {
        divExport.push({
          'DIVISION': div.division_name,
          'SUBCATEGORY': i.subcategory,
          'TARGET': i.target,
          'ACTUAL': i.actual,
          'ACH %': `${i.ach_pct}%`,
          'BAL %': `${i.bal_pct}%`
        });
      });
    });
    const wsDiv = XLSX.utils.json_to_sheet(divExport);
    XLSX.utils.book_append_sheet(wb, wsDiv, `Divisions_${selectedYear}`);

    XLSX.writeFile(wb, `MoneyMatrix_Budget_vs_Actuals_${selectedYear}.xlsx`);
  };

  // Matrix Years list (2010 to 2024)
  const matrixYears = useMemo(() => {
    const yrs = [];
    for (let y = 2010; y <= 2024; y++) {
      yrs.push(y);
    }
    return yrs;
  }, []);

  const monthsList = [
    { code: '01', label: '01_Jan' },
    { code: '02', label: '02_Feb' },
    { code: '03', label: '03_Mar' },
    { code: '04', label: '04_Apr' },
    { code: '05', label: '05_May' },
    { code: '06', label: '06_Jun' },
    { code: '07', label: '07_Jul' },
    { code: '08', label: '08_Aug' },
    { code: '09', label: '09_Sep' },
    { code: '10', label: '10_Oct' },
    { code: '11', label: '11_Nov' },
    { code: '12', label: '12_Dec' },
  ];

  // Matrix totals
  const currentMatrixSideData = matrixData[matrixSide] || {};

  const matrixYearTotals = useMemo(() => {
    const totals = {};
    matrixYears.forEach(y => {
      totals[y] = 0;
      monthsList.forEach(m => {
        totals[y] += (currentMatrixSideData[m.code]?.[y] || 0);
      });
    });
    return totals;
  }, [currentMatrixSideData, matrixYears]);

  const grandMatrixTotal = Object.values(matrixYearTotals).reduce((a, b) => a + b, 0);

  // Multi-Year Trend Chart for selected subcategory
  const trendChartData = useMemo(() => {
    return {
      labels: matrixYears.map(String),
      datasets: [
        {
          label: `${selectedSubCategory} Annual Trajectory (₹)`,
          data: matrixYears.map(y => matrixYearTotals[y] || 0),
          borderColor: matrixSide === 'CR' ? '#10b981' : '#ef4444',
          backgroundColor: matrixSide === 'CR' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: matrixSide === 'CR' ? '#10b981' : '#ef4444'
        }
      ]
    };
  }, [matrixYears, matrixYearTotals, selectedSubCategory, matrixSide]);

  // Seasonal Monthly Distribution Chart
  const seasonalChartData = useMemo(() => {
    return {
      labels: monthsList.map(m => m.label),
      datasets: [
        {
          label: `${selectedSubCategory} (${selectedYear}) Monthly Distribution`,
          data: monthsList.map(m => currentMatrixSideData[m.code]?.[selectedYear] || 0),
          backgroundColor: matrixSide === 'CR' ? '#3b82f6' : '#f97316',
          borderRadius: 4
        }
      ]
    };
  }, [monthsList, currentMatrixSideData, selectedYear, selectedSubCategory, matrixSide]);

  // Helper for utilization styling matching Excel
  const getUtilizationBadge = (pct) => {
    if (pct <= 0) return { bg: 'transparent', color: 'var(--text-muted)' };
    if (pct < 50) return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
    if (pct <= 80) return { bg: 'rgba(234, 179, 8, 0.18)', color: '#b45309' };
    return { bg: 'rgba(239, 68, 68, 0.18)', color: '#ef4444' };
  };

  // Partition operational groups into left & right columns
  const leftColGroups = operationalData.filter(g => ['HOME NEEDS', 'SHOPPING & ENTERTAINMENT', 'UTILITIES'].includes(g.group_name));
  const rightColGroups = operationalData.filter(g => ['TAX & TOLL', 'INSURANCE', 'INVESTMENTS', 'FUEL & TRANSPORT'].includes(g.group_name));

  return (
    <div style={{ padding: '1.25rem', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Top Header & Year Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={22} color="var(--primary-brand)" />
            <span>Budget vs. Actuals & Category Matrix</span>
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
            Interactive financial control matrix matching your Excel Simple Finance Dashboard & NWF models
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Year Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-input)', padding: '0.2rem 0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: '800', outline: 'none' }}
            >
              {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map(y => (
                <option key={y} value={y} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveBudgets}
            disabled={saving}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', height: '34px', fontSize: '0.75rem' }}
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : saveSuccess ? 'Saved ✅' : 'Save Targets'}</span>
          </button>

          {/* Export Button */}
          <button
            onClick={handleExportExcel}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', height: '34px', fontSize: '0.75rem' }}
          >
            <Download size={14} />
            <span>Export (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Top Variance Cards */}
      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="card glass-card" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
              Allocated Budget Ceiling ({selectedYear})
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)' }}>
              <Target size={16} color="#3b82f6" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#3b82f6', letterSpacing: '-0.02em' }}>
            ₹{totalAllocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {(totalAllocated / 100000).toFixed(1)} Lakhs allocated across operational groups
          </div>
        </div>

        <div className="card glass-card" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
              Actual Expenditure
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)' }}>
              <TrendingDown size={16} color="#ef4444" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ef4444', letterSpacing: '-0.02em' }}>
            ₹{totalActuals.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Cumulative debits recorded for {selectedYear}
          </div>
        </div>

        <div className="card glass-card" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
              Overall Budget Utilization
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: Number(overallUtilization) > 90 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)' }}>
              <PieIcon size={16} color={Number(overallUtilization) > 90 ? '#ef4444' : '#10b981'} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: Number(overallUtilization) > 90 ? '#ef4444' : 'var(--accent-cr)', letterSpacing: '-0.02em' }}>
            {overallUtilization}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {totalAllocated - totalActuals >= 0 ? `₹${(totalAllocated - totalActuals).toLocaleString('en-IN')} headroom left` : `Exceeded by ₹${Math.abs(totalAllocated - totalActuals).toLocaleString('en-IN')}`}
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-input)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem', width: 'fit-content' }}>
        <button
          onClick={() => setActiveTab('operational')}
          className={`btn btn-sm ${activeTab === 'operational' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.75rem', padding: '0.3rem 0.85rem', borderRadius: '6px' }}
        >
          Operational Groups ({selectedYear})
        </button>
        <button
          onClick={() => setActiveTab('divisions')}
          className={`btn btn-sm ${activeTab === 'divisions' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.75rem', padding: '0.3rem 0.85rem', borderRadius: '6px' }}
        >
          Macro Divisions & Targets
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`btn btn-sm ${activeTab === 'matrix' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.75rem', padding: '0.3rem 0.85rem', borderRadius: '6px' }}
        >
          Month × Year Matrix Pivot
        </button>
      </div>

      {/* TAB 1: OPERATIONAL GROUPS MASTER VIEW */}
      {activeTab === 'operational' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.25rem' }}>
          
          {/* Left Column Groups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {leftColGroups.map(grp => renderOperationalGroupTable(grp, handleItemChange, getUtilizationBadge))}
          </div>

          {/* Right Column Groups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {rightColGroups.map(grp => renderOperationalGroupTable(grp, handleItemChange, getUtilizationBadge))}
          </div>

        </div>
      )}

      {/* TAB 2: MACRO DIVISIONS BREAKDOWN VIEW */}
      {activeTab === 'divisions' && (
        <div className="card glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
              Macro Divisions Target Achievement & Utilization ({selectedYear})
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
              High-level classification by Income, Needs, Emergency, Repayments, Wants, and Savings
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
            {divisionsData.map(div => (
              <div key={div.division_name} style={{ borderRadius: '10px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <div style={{ background: '#1d4ed8', color: '#fff', padding: '0.65rem 0.85rem', fontWeight: '800', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{div.division_name}</span>
                  <span>Target: ₹{div.total_target.toLocaleString('en-IN')} • Actual: ₹{div.total_actual.toLocaleString('en-IN')}</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ background: '#1e293b', color: '#94a3b8' }}>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Subcategory</th>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Target</th>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Actual</th>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Ach %</th>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Bal %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {div.items.map((i, idx) => {
                      const isOver = i.ach_pct > 100;
                      return (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-card-solid)', borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: '700' }}>{i.subcategory}</td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>₹{i.target.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '700', color: i.actual > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {i.actual > 0 ? `₹${i.actual.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '700', color: isOver ? '#ef4444' : '#10b981' }}>
                            {i.ach_pct}%
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                            {i.bal_pct}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MONTH X YEAR MATRIX PIVOT WITH CATEGORY SLICER */}
      {activeTab === 'matrix' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Slicer & Flow Control Bar */}
          <div className="card glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Select Sub-Category:
              </span>
              <select
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                className="form-control"
                style={{ height: '34px', fontSize: '0.8rem', fontWeight: '700', padding: '0.2rem 0.6rem', width: '220px' }}
              >
                {['SALARY', 'PETROL', 'PFM', 'GROCERIES', 'FOOD/SNACKS', 'EDUCATION FEES', 'LOAN', 'LOAN REPAYMENT', 'ADVANCE', 'REIMBURSABLE', 'ELECTRONICS', 'MOBILE RECHARGE', 'EB BILL'].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* DR vs CR Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-input)', padding: '0.2rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => setMatrixSide('CR')}
                  className={`btn btn-sm ${matrixSide === 'CR' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.65rem' }}
                >
                  CR (Credit / Inflow)
                </button>
                <button
                  onClick={() => setMatrixSide('DR')}
                  className={`btn btn-sm ${matrixSide === 'DR' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.65rem' }}
                >
                  DR (Debit / Expense)
                </button>
              </div>
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Historical Grand Total: <strong style={{ color: matrixSide === 'CR' ? 'var(--accent-cr)' : 'var(--accent-dr)', fontSize: '1rem' }}>₹{grandMatrixTotal.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.25rem' }}>
            <div className="card glass-card" style={{ padding: '1.15rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', margin: '0 0 0.75rem', color: 'var(--text-primary)' }}>
                Multi-Year Trajectory Trend (2010 – 2024)
              </h4>
              <div style={{ height: '220px' }}>
                <Line data={trendChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' } } } }} />
              </div>
            </div>

            <div className="card glass-card" style={{ padding: '1.15rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', margin: '0 0 0.75rem', color: 'var(--text-primary)' }}>
                Seasonal Monthly Distribution ({selectedYear})
              </h4>
              <div style={{ height: '220px' }}>
                <Bar data={seasonalChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' } } } }} />
              </div>
            </div>
          </div>

          {/* Cross-Tab Matrix Pivot Table */}
          <div className="card glass-card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              {selectedSubCategory} — Month × Year Cross-Tab Matrix ({matrixSide})
            </h4>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.71875rem', whiteSpace: 'nowrap', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: '#1d4ed8', color: '#fff' }}>
                  <th style={{ padding: '0.55rem 0.65rem', textAlign: 'left', minWidth: '85px' }}>Month</th>
                  {matrixYears.map(y => (
                    <th key={y} style={{ padding: '0.55rem 0.6rem', minWidth: '70px', textAlign: 'right' }}>{y}</th>
                  ))}
                  <th style={{ padding: '0.55rem 0.75rem', minWidth: '90px', background: '#1e3a8a', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {monthsList.map((m, idx) => {
                  let rowTotal = 0;
                  return (
                    <tr key={m.code} style={{ background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-card-solid)', borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.5rem 0.65rem', textAlign: 'left', fontWeight: '700', color: 'var(--text-primary)', borderRight: '1px solid var(--border-color)' }}>
                        {m.label}
                      </td>
                      {matrixYears.map(y => {
                        const val = currentMatrixSideData[m.code]?.[y] || 0;
                        rowTotal += val;
                        return (
                          <td key={y} style={{ padding: '0.5rem 0.6rem', color: val > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {val > 0 ? val.toLocaleString('en-IN') : '—'}
                          </td>
                        );
                      })}
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: '800', background: 'rgba(59, 130, 246, 0.08)', color: rowTotal > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {rowTotal > 0 ? rowTotal.toLocaleString('en-IN') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#1e293b', color: '#fff', fontWeight: '800' }}>
                  <td style={{ padding: '0.65rem', textAlign: 'left' }}>Total</td>
                  {matrixYears.map(y => (
                    <td key={y} style={{ padding: '0.65rem 0.6rem', textAlign: 'right' }}>
                      {matrixYearTotals[y] > 0 ? matrixYearTotals[y].toLocaleString('en-IN') : '—'}
                    </td>
                  ))}
                  <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', background: '#0f172a', color: matrixSide === 'CR' ? '#86efac' : '#fca5a5' }}>
                    ₹{grandMatrixTotal.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>
      )}

    </div>
  );
}

// Sub-component renderer for an Operational Group Card (e.g. HOME NEEDS)
function renderOperationalGroupTable(grp, onCellChange, getUtilizationBadge) {
  return (
    <div key={grp.group_name} style={{ borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      
      {/* Header Banner */}
      <div style={{ background: '#1d4ed8', color: '#fff', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: '800', fontSize: '0.85rem', letterSpacing: '0.03em' }}>{grp.group_name}</span>
        <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
          Allocated: ₹{grp.total_allocated.toLocaleString('en-IN')} • Actual: ₹{grp.total_actuals.toLocaleString('en-IN')} ({grp.total_utilization}%)
        </span>
      </div>

      {/* Subheader matching Excel */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
        <thead>
          <tr style={{ background: '#1e293b', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', minWidth: '150px' }}>Category</th>
            <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right', minWidth: '85px' }}>Forecast</th>
            <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right', minWidth: '85px' }}>Estimated</th>
            <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right', minWidth: '85px' }}>Allocated</th>
            <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right', minWidth: '85px' }}>Actuals</th>
            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', minWidth: '85px' }}>Utilization</th>
          </tr>
        </thead>
        <tbody>
          {grp.items.map((item, idx) => {
            const utilStyle = getUtilizationBadge(item.utilization);
            return (
              <tr
                key={item.subcategory}
                style={{
                  background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-card-solid)',
                  borderBottom: '1px solid var(--border-color)'
                }}
              >
                <td style={{ padding: '0.55rem 0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {item.subcategory}
                </td>

                {/* Forecast Input */}
                <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>
                  <input
                    type="number"
                    value={item.forecast || ''}
                    onChange={(e) => onCellChange(grp.group_name, item.subcategory, 'forecast', e.target.value)}
                    placeholder="—"
                    style={{ width: '75px', textAlign: 'right', fontSize: '0.75rem', padding: '0.2rem', background: 'transparent', border: '1px solid transparent', color: 'var(--text-primary)', borderRadius: '4px' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary-brand)'}
                    onBlur={(e) => e.target.style.borderColor = 'transparent'}
                  />
                </td>

                {/* Estimated Input */}
                <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>
                  <input
                    type="number"
                    value={item.estimated || ''}
                    onChange={(e) => onCellChange(grp.group_name, item.subcategory, 'estimated', e.target.value)}
                    placeholder="—"
                    style={{ width: '75px', textAlign: 'right', fontSize: '0.75rem', padding: '0.2rem', background: 'transparent', border: '1px solid transparent', color: 'var(--text-primary)', borderRadius: '4px' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary-brand)'}
                    onBlur={(e) => e.target.style.borderColor = 'transparent'}
                  />
                </td>

                {/* Allocated Input */}
                <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>
                  <input
                    type="number"
                    value={item.allocated || ''}
                    onChange={(e) => onCellChange(grp.group_name, item.subcategory, 'allocated', e.target.value)}
                    placeholder="—"
                    style={{ width: '75px', textAlign: 'right', fontSize: '0.75rem', padding: '0.2rem', background: 'transparent', border: '1px solid transparent', color: 'var(--text-primary)', borderRadius: '4px', fontWeight: '700' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary-brand)'}
                    onBlur={(e) => e.target.style.borderColor = 'transparent'}
                  />
                </td>

                {/* Actuals (from transactions) */}
                <td style={{ padding: '0.55rem 0.65rem', textAlign: 'right', fontWeight: '700', color: item.actuals > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {item.actuals > 0 ? `₹${item.actuals.toLocaleString('en-IN')}` : '—'}
                </td>

                {/* Utilization % */}
                <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>
                  <span style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    background: utilStyle.bg,
                    color: utilStyle.color
                  }}>
                    {item.utilization}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
