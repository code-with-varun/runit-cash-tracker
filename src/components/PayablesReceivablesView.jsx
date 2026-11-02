import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Save,
  RotateCcw,
  Sparkles,
  Calculator,
  Landmark,
  ShieldAlert,
  Search,
  Layers
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
  Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { getApArMatrixAPI, saveApArMatrixAPI, getLoansAPI, createLoanAPI, seedApArAPI, seedLoansAPI } from '../utils/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function PayablesReceivablesView() {
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'yearwise_pl' | 'loans'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // AP/AR Matrix Data (Initialized empty on reset)
  const [counterparties, setCounterparties] = useState([]);
  const [matrixData, setMatrixData] = useState({});
  const [rawEditableData, setRawEditableData] = useState({});
  const [yearwisePL, setYearwisePL] = useState([]);

  // Loans State
  const [loansList, setLoansList] = useState([]);
  const [activeLoanAccount, setActiveLoanAccount] = useState('RBL_PL_3531');
  const [activeLoanData, setActiveLoanData] = useState(null);
  const [loanSchedule, setLoanSchedule] = useState([]);
  const [statementLedger, setStatementLedger] = useState([]);
  const [loanViewMode, setLoanViewMode] = useState('statement'); // 'statement' | 'amortization'
  const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);

  // New Loan Form State
  const [newAccNo, setNewAccNo] = useState('');
  const [newLender, setNewLender] = useState('');
  const [newPrincipal, setNewPrincipal] = useState('282000');
  const [newRate, setNewRate] = useState('14.5');
  const [newTenure, setNewTenure] = useState('36');
  const [newDate, setNewDate] = useState('2020-03-07');

  // Load AP/AR Data
  const loadApArData = async () => {
    setLoading(true);
    try {
      const res = await getApArMatrixAPI();
      if (res && res.success) {
        if (res.counterparties && res.counterparties.length > 0) {
          setCounterparties(res.counterparties);
        }
        setMatrixData(res.matrix || {});
        setRawEditableData(res.raw_data || {});
        setYearwisePL(res.yearwise_pl || []);
      }
    } catch (err) {
      console.warn("Failed to load AP/AR API:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load Loans Data
  const loadLoansData = async (accNo = null) => {
    try {
      const res = await getLoansAPI(accNo || activeLoanAccount);
      if (res && res.success) {
        setLoansList(res.loans || []);
        if (res.active_loan) {
          setActiveLoanData(res.active_loan);
          setActiveLoanAccount(res.active_loan.account_no);
        }
        setLoanSchedule(res.schedule || []);
        setStatementLedger(res.statement_ledger || []);
      }
    } catch (err) {
      console.warn("Failed to load loans API:", err.message);
    }
  };

  useEffect(() => {
    loadApArData();
    loadLoansData();
    const handleReset = () => {
      loadApArData();
      loadLoansData();
    };
    window.addEventListener('moneymatrix_data_reset', handleReset);
    return () => window.removeEventListener('moneymatrix_data_reset', handleReset);
  }, []);

  // Seed Demo AP/AR counterparties & baseline matrix
  const handleSeedApAr = async () => {
    setLoading(true);
    try {
      await seedApArAPI();
      await loadApArData();
    } catch (err) {
      alert("Failed to populate demo counterparties: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Seed Demo Loan (RBL_PL_3531)
  const handleSeedLoans = async () => {
    setLoading(true);
    try {
      await seedLoansAPI();
      await loadLoansData('RBL_PL_3531');
    } catch (err) {
      alert("Failed to populate demo loan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update cell in matrix
  const handleMatrixCellChange = (rowKey, cp, val) => {
    const num = parseFloat(val) || 0;
    setRawEditableData(prev => {
      const updatedRow = { ...(prev[rowKey] || {}), [cp]: num };
      return { ...prev, [rowKey]: updatedRow };
    });
  };

  // Recalculate dynamic matrix from rawEditableData
  const calculatedMatrix = useMemo(() => {
    const res = {};
    counterparties.forEach(cp => {
      const loan = Number(rawEditableData['LOAN']?.[cp] || 0);
      const leverage = Number(rawEditableData['LEVERAGE']?.[cp] || 0);
      const advance = Number(rawEditableData['ADVANCE']?.[cp] || 0);
      const shared = Number(rawEditableData['SHARED_SPENDING']?.[cp] || 0);
      const repay = Number(rawEditableData['LOAN_REPAYMENT']?.[cp] || 0);
      const apDiff = (loan + leverage + advance + shared) - repay;

      const rotOutOthers = Number(rawEditableData['CC_ROTATION_OUT_OTHERS']?.[cp] || 0);
      const rotInOthers = Number(rawEditableData['CC_ROTATION_IN_OTHERS']?.[cp] || 0);
      const rotInVarun = Number(rawEditableData['CC_ROTATION_IN_VARUN']?.[cp] || 0);
      const rotOutVarun = Number(rawEditableData['CC_ROTATION_OUT_VARUN']?.[cp] || 0);
      const rotDiff = (rotInVarun + rotInOthers) - (rotOutVarun + rotOutOthers);

      const reimb = Number(rawEditableData['REIMBURSABLE']?.[cp] || 0);
      const lto = Number(rawEditableData['LTO']?.[cp] || 0);
      const claim = Number(rawEditableData['REIMBURSEMENT_CLAIM']?.[cp] || 0);
      const arDiff = (reimb + lto) - claim;

      const netOutstanding = apDiff + rotDiff - arDiff;

      res[cp] = {
        loan, leverage, advance, shared, repay, apDiff,
        rotOutOthers, rotInOthers, rotInVarun, rotOutVarun, rotDiff,
        reimb, lto, claim, arDiff, netOutstanding
      };
    });
    return res;
  }, [rawEditableData, counterparties]);

  // Matrix Grand Totals across all counterparties
  const matrixRowTotals = useMemo(() => {
    const totals = {
      loan: 0, leverage: 0, advance: 0, shared: 0, repay: 0, apDiff: 0,
      rotOutOthers: 0, rotInOthers: 0, rotInVarun: 0, rotOutVarun: 0, rotDiff: 0,
      reimb: 0, lto: 0, claim: 0, arDiff: 0, netOutstanding: 0
    };
    counterparties.forEach(cp => {
      const c = calculatedMatrix[cp] || {};
      totals.loan += (c.loan || 0);
      totals.leverage += (c.leverage || 0);
      totals.advance += (c.advance || 0);
      totals.shared += (c.shared || 0);
      totals.repay += (c.repay || 0);
      totals.apDiff += (c.apDiff || 0);
      totals.rotOutOthers += (c.rotOutOthers || 0);
      totals.rotInOthers += (c.rotInOthers || 0);
      totals.rotInVarun += (c.rotInVarun || 0);
      totals.rotOutVarun += (c.rotOutVarun || 0);
      totals.rotDiff += (c.rotDiff || 0);
      totals.reimb += (c.reimb || 0);
      totals.lto += (c.lto || 0);
      totals.claim += (c.claim || 0);
      totals.arDiff += (c.arDiff || 0);
      totals.netOutstanding += (c.netOutstanding || 0);
    });
    return totals;
  }, [calculatedMatrix, counterparties]);

  // Save Matrix Overrides
  const handleSaveMatrix = async () => {
    setSaving(true);
    try {
      await saveApArMatrixAPI(rawEditableData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Failed to save AP/AR matrix: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Export AP/AR & Net P/L to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. AP/AR Matrix Sheet
    const matrixExport = [
      { Particulars: 'LOAN', ...Object.fromEntries(counterparties.map(cp => [cp, calculatedMatrix[cp]?.loan])), TOTAL: matrixRowTotals.loan },
      { Particulars: 'LEVERAGE', ...Object.fromEntries(counterparties.map(cp => [cp, calculatedMatrix[cp]?.leverage])), TOTAL: matrixRowTotals.leverage },
      { Particulars: 'ADVANCE', ...Object.fromEntries(counterparties.map(cp => [cp, calculatedMatrix[cp]?.advance])), TOTAL: matrixRowTotals.advance },
      { Particulars: 'SHARED SPENDING (For VARUN by Others)', ...Object.fromEntries(counterparties.map(cp => [cp, calculatedMatrix[cp]?.shared])), TOTAL: matrixRowTotals.shared },
      { Particulars: 'LOAN REPAYMENT', ...Object.fromEntries(counterparties.map(cp => [cp, calculatedMatrix[cp]?.repay])), TOTAL: matrixRowTotals.repay },
      { Particulars: 'AP Difference', ...Object.fromEntries(counterparties.map(cp => [cp, calculatedMatrix[cp]?.apDiff])), TOTAL: matrixRowTotals.apDiff },
      { Particulars: 'CC ROTATION OUT (others)', ...Object.fromEntries(counterparties.map(cp => [cp, calculatedMatrix[cp]?.rotOutOthers])), TOTAL: matrixRowTotals.rotOutOthers },
      { Particulars: 'CC ROTATION IN (others)', ...Object.fromEntries(counterparties.map(cp => [cp, calculatedMatrix[cp]?.rotInOthers])), TOTAL: matrixRowTotals.rotInOthers },
      { Particulars: 'CC ROTATION IN (Varun)', ...Object.fromEntries(counterparties.map(cp => [cp, calculatedMatrix[cp]?.rotInVarun])), TOTAL: matrixRowTotals.rotInVarun },
      { Particulars: 'CC ROTATION OUT (Varun)', ...Object.fromEntries(counterparties.map(cp => [cp, calculatedMatrix[cp]?.rotOutVarun])), TOTAL: matrixRowTotals.rotOutVarun },
      { Particulars: 'Rotation Difference', ...Object.fromEntries(counterparties.map(cp => [cp, calculatedMatrix[cp]?.rotDiff])), TOTAL: matrixRowTotals.rotDiff },
      { Particulars: 'REIMBURSABLE', ...Object.fromEntries(counterparties.map(cp => [cp, calculatedMatrix[cp]?.reimb])), TOTAL: matrixRowTotals.reimb },
      { Particulars: 'LTO (Loan To Others)', ...Object.fromEntries(counterparties.map(cp => [cp, calculatedMatrix[cp]?.lto])), TOTAL: matrixRowTotals.lto },
      { Particulars: 'REIMBURSMENT CLAIM', ...Object.fromEntries(counterparties.map(cp => [cp, calculatedMatrix[cp]?.claim])), TOTAL: matrixRowTotals.claim },
      { Particulars: 'AR Difference', ...Object.fromEntries(counterparties.map(cp => [cp, calculatedMatrix[cp]?.arDiff])), TOTAL: matrixRowTotals.arDiff },
      { Particulars: 'Outstanding', ...Object.fromEntries(counterparties.map(cp => [cp, calculatedMatrix[cp]?.netOutstanding])), TOTAL: matrixRowTotals.netOutstanding },
    ];
    const wsMatrix = XLSX.utils.json_to_sheet(matrixExport);
    XLSX.utils.book_append_sheet(wb, wsMatrix, 'AP_AR_Matrix');

    // 2. Yearwise Net P/L Sheet
    const wsPL = XLSX.utils.json_to_sheet(yearwisePL);
    XLSX.utils.book_append_sheet(wb, wsPL, 'Yearwise_Net_PL');

    // 3. Loan Statement Ledger Sheet
    if (statementLedger.length > 0) {
      const wsLoan = XLSX.utils.json_to_sheet(statementLedger);
      XLSX.utils.book_append_sheet(wb, wsLoan, activeLoanAccount || 'Loan_Statement');
    }

    XLSX.writeFile(wb, `MoneyMatrix_AP_AR_Loans_Report.xlsx`);
  };

  // Create new loan
  const handleCreateLoan = async (e) => {
    e.preventDefault();
    if (!newAccNo || !newPrincipal) {
      alert("Account code and principal are required.");
      return;
    }
    try {
      await createLoanAPI({
        account_no: newAccNo,
        lender_name: newLender || 'Lender Loan',
        principal_amount: parseFloat(newPrincipal),
        interest_rate_pct: parseFloat(newRate),
        tenure_months: parseInt(newTenure),
        sanction_date: newDate
      });
      alert("Loan created successfully with PMT amortization schedule!");
      setIsAddLoanModalOpen(false);
      loadLoansData(newAccNo);
    } catch (err) {
      alert("Failed to create loan: " + err.message);
    }
  };

  // Yearwise Net P/L Chart Data
  const plChartData = useMemo(() => {
    return {
      labels: yearwisePL.map(r => String(r.year)),
      datasets: [
        {
          type: 'line',
          label: 'Net P/L (₹)',
          data: yearwisePL.map(r => r.net_pl),
          borderColor: '#a855f7',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#a855f7'
        },
        {
          type: 'bar',
          label: 'Net Income (₹)',
          data: yearwisePL.map(r => r.net_income),
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
          borderRadius: 4
        },
        {
          type: 'bar',
          label: 'Net Expense (₹)',
          data: yearwisePL.map(r => r.net_expense),
          backgroundColor: 'rgba(239, 68, 68, 0.75)',
          borderRadius: 4
        }
      ]
    };
  }, [yearwisePL]);

  const fmtCurrency = (val) => {
    if (val === undefined || val === null || val === '') return '—';
    const n = Number(val);
    if (n === 0) return '—';
    if (n < 0) return `₹-${Math.abs(n).toLocaleString('en-IN')}`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  return (
    <div style={{ padding: '1.25rem', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Top Header */}
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
            <Activity size={22} color="var(--primary-brand)" />
            <span>Payables, Receivables & Loans Engine</span>
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
            Multi-person counterparty reconciliation matrix, Yearwise Net P/L ledger, and PMT loan amortization
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {activeTab === 'matrix' && (
            <button
              onClick={handleSaveMatrix}
              disabled={saving}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', height: '34px', fontSize: '0.75rem' }}
            >
              <Save size={14} />
              <span>{saving ? 'Saving...' : saveSuccess ? 'Saved ✅' : 'Save Overrides'}</span>
            </button>
          )}

          {activeTab === 'loans' && (
            <button
              onClick={() => setIsAddLoanModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', height: '34px', fontSize: '0.75rem' }}
            >
              <Plus size={14} />
              <span>New Loan (PMT)</span>
            </button>
          )}

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

      {/* Top Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-input)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem', width: 'fit-content' }}>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`btn btn-sm ${activeTab === 'matrix' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.75rem', padding: '0.3rem 0.85rem', borderRadius: '6px' }}
        >
          AP / AR Counterparty Matrix
        </button>
        <button
          onClick={() => setActiveTab('yearwise_pl')}
          className={`btn btn-sm ${activeTab === 'yearwise_pl' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.75rem', padding: '0.3rem 0.85rem', borderRadius: '6px' }}
        >
          Yearwise Net P/L (2010–2024)
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`btn btn-sm ${activeTab === 'loans' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.75rem', padding: '0.3rem 0.85rem', borderRadius: '6px' }}
        >
          Loan Accounts & PMT Amortization
        </button>
      </div>

      {/* TAB 1: AP / AR COUNTERPARTY MATRIX VIEW */}
      {activeTab === 'matrix' && (
        <div className="card glass-card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
          
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                Multi-Person Debt & Claim Reconciliation Matrix
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                Exact matrix matching your Excel sheet with AP differences, CC rotations, AR claims, and net balances
              </p>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Total Net Outstanding: <strong style={{ color: matrixRowTotals.netOutstanding < 0 ? '#ef4444' : 'var(--accent-cr)', fontSize: '1rem' }}>{fmtCurrency(matrixRowTotals.netOutstanding)}</strong>
            </div>
          </div>

          {counterparties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: 'var(--bg-card-solid)', borderRadius: '12px', border: '1px dashed var(--border-color)', margin: '1rem 0' }}>
              <User size={40} color="var(--primary-brand)" style={{ margin: '0 auto 0.75rem', opacity: 0.85 }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
                AP / AR Counterparty Matrix Empty
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto', lineHeight: 1.5 }}>
                The ledger is in a clean reset state. Counterparties and reconciliation amounts will appear automatically when you import your transactions or AP/AR master sheet.
              </p>
            </div>
          ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', whiteSpace: 'nowrap', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: '#1e293b', color: '#fff', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', minWidth: '220px', background: '#0f172a' }}>
                  Particulars
                </th>
                {counterparties.map(cp => (
                  <th key={cp} style={{ padding: '0.65rem 0.75rem', minWidth: '95px', textAlign: 'right' }}>
                    {cp}
                  </th>
                ))}
                <th style={{ padding: '0.65rem 0.85rem', minWidth: '110px', background: '#1e3a8a', textAlign: 'right', fontWeight: '800' }}>
                  TOTAL
                </th>
              </tr>
            </thead>

            <tbody>
              
              {/* SECTION 1: AP (PAYABLES) */}
              {renderMatrixInputRow('LOAN', 'LOAN (Payable)', '#1e40af', calculatedMatrix, counterparties, rawEditableData, handleMatrixCellChange, matrixRowTotals.loan)}
              {renderMatrixInputRow('LEVERAGE', 'LEVERAGE', '#1e40af', calculatedMatrix, counterparties, rawEditableData, handleMatrixCellChange, matrixRowTotals.leverage)}
              {renderMatrixInputRow('ADVANCE', 'ADVANCE', '#1e40af', calculatedMatrix, counterparties, rawEditableData, handleMatrixCellChange, matrixRowTotals.advance)}
              {renderMatrixInputRow('SHARED_SPENDING', 'SHARED SPENDING (For VARUN by Others)', '#1e40af', calculatedMatrix, counterparties, rawEditableData, handleMatrixCellChange, matrixRowTotals.shared)}
              {renderMatrixInputRow('LOAN_REPAYMENT', 'LOAN REPAYMENT', '#15803d', calculatedMatrix, counterparties, rawEditableData, handleMatrixCellChange, matrixRowTotals.repay, '#86efac', '#064e3b')}

              {/* AP Difference Bar (Golden Yellow) */}
              <tr style={{ background: '#fef08a', color: '#713f12', fontWeight: '800', borderTop: '1px solid #eab308', borderBottom: '1px solid #eab308' }}>
                <td style={{ padding: '0.6rem 0.85rem', textAlign: 'left', fontWeight: '800' }}>AP Difference</td>
                {counterparties.map(cp => {
                  const val = calculatedMatrix[cp]?.apDiff || 0;
                  return (
                    <td key={cp} style={{ padding: '0.6rem 0.75rem', color: val < 0 ? '#dc2626' : '#713f12' }}>
                      {fmtCurrency(val)}
                    </td>
                  );
                })}
                <td style={{ padding: '0.6rem 0.85rem', color: matrixRowTotals.apDiff < 0 ? '#dc2626' : '#713f12' }}>
                  {fmtCurrency(matrixRowTotals.apDiff)}
                </td>
              </tr>

              {/* SECTION 2: CC ROTATIONS */}
              {renderMatrixInputRow('CC_ROTATION_OUT_OTHERS', 'CC ROTATION OUT (others)', '#1e40af', calculatedMatrix, counterparties, rawEditableData, handleMatrixCellChange, matrixRowTotals.rotOutOthers)}
              {renderMatrixInputRow('CC_ROTATION_IN_OTHERS', 'CC ROTATION IN (others)', '#1e40af', calculatedMatrix, counterparties, rawEditableData, handleMatrixCellChange, matrixRowTotals.rotInOthers)}
              {renderMatrixInputRow('CC_ROTATION_IN_VARUN', 'CC ROTATION IN (Varun)', '#1e40af', calculatedMatrix, counterparties, rawEditableData, handleMatrixCellChange, matrixRowTotals.rotInVarun)}
              {renderMatrixInputRow('CC_ROTATION_OUT_VARUN', 'CC ROTATION OUT (Varun)', '#15803d', calculatedMatrix, counterparties, rawEditableData, handleMatrixCellChange, matrixRowTotals.rotOutVarun, '#86efac', '#064e3b')}

              {/* Rotation Difference Bar (Golden Yellow) */}
              <tr style={{ background: '#fef08a', color: '#713f12', fontWeight: '800', borderTop: '1px solid #eab308', borderBottom: '1px solid #eab308' }}>
                <td style={{ padding: '0.6rem 0.85rem', textAlign: 'left', fontWeight: '800' }}>Rotation Difference</td>
                {counterparties.map(cp => {
                  const val = calculatedMatrix[cp]?.rotDiff || 0;
                  return (
                    <td key={cp} style={{ padding: '0.6rem 0.75rem', color: val < 0 ? '#dc2626' : '#713f12' }}>
                      {fmtCurrency(val)}
                    </td>
                  );
                })}
                <td style={{ padding: '0.6rem 0.85rem', color: matrixRowTotals.rotDiff < 0 ? '#dc2626' : '#713f12' }}>
                  {fmtCurrency(matrixRowTotals.rotDiff)}
                </td>
              </tr>

              {/* SECTION 3: AR (RECEIVABLES) */}
              {renderMatrixInputRow('REIMBURSABLE', 'REIMBURSABLE', '#1e40af', calculatedMatrix, counterparties, rawEditableData, handleMatrixCellChange, matrixRowTotals.reimb)}
              {renderMatrixInputRow('LTO', 'LTO (Loan To Others)', '#1e40af', calculatedMatrix, counterparties, rawEditableData, handleMatrixCellChange, matrixRowTotals.lto)}
              {renderMatrixInputRow('REIMBURSEMENT_CLAIM', 'REIMBURSMENT CLAIM', '#1e40af', calculatedMatrix, counterparties, rawEditableData, handleMatrixCellChange, matrixRowTotals.claim)}

              {/* AR Difference Bar (Golden Yellow) */}
              <tr style={{ background: '#fef08a', color: '#713f12', fontWeight: '800', borderTop: '1px solid #eab308', borderBottom: '1px solid #eab308' }}>
                <td style={{ padding: '0.6rem 0.85rem', textAlign: 'left', fontWeight: '800' }}>AR Difference</td>
                {counterparties.map(cp => {
                  const val = calculatedMatrix[cp]?.arDiff || 0;
                  return (
                    <td key={cp} style={{ padding: '0.6rem 0.75rem', color: val < 0 ? '#dc2626' : '#713f12' }}>
                      {fmtCurrency(val)}
                    </td>
                  );
                })}
                <td style={{ padding: '0.6rem 0.85rem', color: matrixRowTotals.arDiff < 0 ? '#dc2626' : '#713f12' }}>
                  {fmtCurrency(matrixRowTotals.arDiff)}
                </td>
              </tr>

              {/* SECTION 4: FINAL NET OUTSTANDING (BOLD GOLDEN YELLOW BAR) */}
              <tr style={{ background: '#fde047', color: '#713f12', fontWeight: '900', fontSize: '0.8125rem', borderTop: '2px solid #ca8a04', borderBottom: '2px solid #ca8a04' }}>
                <td style={{ padding: '0.75rem 0.85rem', textAlign: 'left', fontWeight: '900' }}>Outstanding</td>
                {counterparties.map(cp => {
                  const val = calculatedMatrix[cp]?.netOutstanding || 0;
                  return (
                    <td key={cp} style={{ padding: '0.75rem 0.75rem', color: val < 0 ? '#dc2626' : '#713f12' }}>
                      {fmtCurrency(val)}
                    </td>
                  );
                })}
                <td style={{ padding: '0.75rem 0.85rem', color: matrixRowTotals.netOutstanding < 0 ? '#dc2626' : '#713f12' }}>
                  {fmtCurrency(matrixRowTotals.netOutstanding)}
                </td>
              </tr>

            </tbody>
          </table>
          )}
        </div>
      )}

      {/* TAB 2: YEARWISE NET P/L (2010 to 2024) */}
      {activeTab === 'yearwise_pl' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Chart View */}
          <div className="card glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: '0 0 0.85rem', color: 'var(--text-primary)' }}>
              Annual Net Profit & Loss Trajectory (2010 – 2024)
            </h3>
            <div style={{ height: '260px' }}>
              <Bar data={plChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' } } } }} />
            </div>
          </div>

          {/* Master Table */}
          <div className="card glass-card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
              Yearwise Financial Profit & Loss Master Ledger
            </h3>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', whiteSpace: 'nowrap', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: '#1d4ed8', color: '#fff', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', minWidth: '70px', background: '#1e3a8a' }}>YEAR</th>
                  <th style={{ padding: '0.65rem 0.75rem', minWidth: '90px' }}>LOANS</th>
                  <th style={{ padding: '0.65rem 0.75rem', minWidth: '85px' }}>LEVERAGE</th>
                  <th style={{ padding: '0.65rem 0.75rem', minWidth: '100px' }}>NET INCOME</th>
                  <th style={{ padding: '0.65rem 0.75rem', minWidth: '95px' }}>RECEIVABLES</th>
                  <th style={{ padding: '0.65rem 0.75rem', minWidth: '85px' }}>ASSETS</th>
                  <th style={{ padding: '0.65rem 0.75rem', minWidth: '100px' }}>NET EXPENSE</th>
                  <th style={{ padding: '0.65rem 0.85rem', minWidth: '105px', background: '#0f172a', fontWeight: '800' }}>NET P/L</th>
                </tr>
              </thead>
              <tbody>
                {yearwisePL.map((r, idx) => {
                  const isPositive = r.net_pl >= 0;
                  return (
                    <tr key={r.year} style={{ background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-card-solid)', borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.55rem 0.85rem', textAlign: 'left', fontWeight: '800', color: 'var(--text-primary)', borderRight: '1px solid var(--border-color)' }}>
                        {r.year}
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', color: r.loans > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {r.loans > 0 ? r.loans.toLocaleString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', color: r.leverage > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {r.leverage > 0 ? r.leverage.toLocaleString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', fontWeight: '700', color: r.net_income > 0 ? 'var(--accent-cr)' : 'var(--text-muted)' }}>
                        {r.net_income > 0 ? r.net_income.toLocaleString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', color: r.receivables > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {r.receivables > 0 ? r.receivables.toLocaleString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', color: r.assets > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {r.assets > 0 ? r.assets.toLocaleString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', fontWeight: '700', color: r.net_expense > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                        {r.net_expense > 0 ? r.net_expense.toLocaleString('en-IN') : '—'}
                      </td>
                      <td style={{
                        padding: '0.55rem 0.85rem',
                        fontWeight: '800',
                        background: isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: isPositive ? '#10b981' : '#ef4444'
                      }}>
                        {r.net_pl !== 0 ? (isPositive ? `+${r.net_pl.toLocaleString('en-IN')}` : `${r.net_pl.toLocaleString('en-IN')}`) : '0'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 3: LOAN ACCOUNTS & PMT AMORTIZATION */}
      {activeTab === 'loans' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {loansList.length === 0 ? (
            <div className="card glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
              <Landmark size={42} color="var(--primary-brand)" style={{ margin: '0 auto 0.75rem', opacity: 0.85 }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
                No Loan Accounts in Ledger
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                The ledger is in a clean reset state. Register new loan accounts with auto PMT amortization schedules, or import your loan ledgers once ready.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setIsAddLoanModalOpen(true)}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', fontWeight: '700' }}
                >
                  <Plus size={16} />
                  <span>Add New Loan</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Active Loan Switcher & KPI Banner */}
              <div className="card glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Select Loan Account:
                    </span>
                    <select
                      value={activeLoanAccount}
                      onChange={(e) => {
                        setActiveLoanAccount(e.target.value);
                        loadLoansData(e.target.value);
                      }}
                      className="form-control"
                      style={{ height: '34px', fontSize: '0.8rem', fontWeight: '800', padding: '0.2rem 0.6rem', width: '220px' }}
                    >
                      {loansList.map(l => (
                        <option key={l.account_no} value={l.account_no}>
                          {l.account_no} ({l.lender_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* View Mode Toggle: Statement vs Amortization */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-input)', padding: '0.2rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <button
                      onClick={() => setLoanViewMode('statement')}
                      className={`btn btn-sm ${loanViewMode === 'statement' ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.65rem' }}
                    >
                      Statement Ledger View
                    </button>
                    <button
                      onClick={() => setLoanViewMode('amortization')}
                      className={`btn btn-sm ${loanViewMode === 'amortization' ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.65rem' }}
                    >
                      PMT Schedule (001–036)
                    </button>
                  </div>
                </div>

                {/* Loan Overview Cards */}
                {activeLoanData && (
                  <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: 'var(--bg-card-solid)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Principal Disbursed</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    ₹{Number(activeLoanData.principal_amount).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    Sanction Date: {activeLoanData.sanction_date}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monthly EMI (PMT)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#3b82f6' }}>
                    ₹{Number(activeLoanData.monthly_emi).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    Tenure: {activeLoanData.tenure_months} Mos @ {activeLoanData.interest_rate_pct}% p.a.
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Processing Fee & GST</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ef4444' }}>
                    ₹{(Number(activeLoanData.processing_fee) + Number(activeLoanData.gst_on_fee)).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    Fee: ₹{Number(activeLoanData.processing_fee).toLocaleString('en-IN')} • GST: ₹{Number(activeLoanData.gst_on_fee).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* VIEW MODE 1: STATEMENT LEDGER (Matching User Image 3) */}
          {loanViewMode === 'statement' && (
            <div className="card glass-card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                {activeLoanAccount} — Statement Ledger View
              </h3>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: '#1e293b', color: '#fff', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', minWidth: '120px' }}>transaction_date</th>
                    <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', minWidth: '130px' }}>account_no</th>
                    <th style={{ padding: '0.65rem 1rem', textAlign: 'left', minWidth: '280px' }}>particulars</th>
                    <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', minWidth: '110px' }}>debit</th>
                    <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', minWidth: '110px' }}>credit</th>
                    <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', minWidth: '110px' }}>balance</th>
                  </tr>
                </thead>
                <tbody>
                  {statementLedger.map((row, idx) => (
                    <tr
                      key={idx}
                      style={{
                        background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-card-solid)',
                        borderBottom: '1px solid var(--border-color)'
                      }}
                    >
                      <td style={{ padding: '0.6rem 0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {row.transaction_date}
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem', color: 'var(--text-secondary)' }}>
                        {row.account_no}
                      </td>
                      <td style={{ padding: '0.6rem 1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {row.particulars}
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem', textAlign: 'right', fontWeight: '700', color: row.debit > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                        {row.debit > 0 ? row.debit.toLocaleString('en-IN') : '0'}
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem', textAlign: 'right', fontWeight: '700', color: row.credit > 0 ? 'var(--accent-cr)' : 'var(--text-muted)' }}>
                        {row.credit > 0 ? row.credit.toLocaleString('en-IN') : '0'}
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                        0
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW MODE 2: AMORTIZATION SCHEDULE (001–036) */}
          {loanViewMode === 'amortization' && (
            <div className="card glass-card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                {activeLoanAccount} — PMT Amortization Schedule (001–{activeLoanData?.tenure_months || 36})
              </h3>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: '#1d4ed8', color: '#fff', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', minWidth: '70px' }}>Instalment</th>
                    <th style={{ padding: '0.6rem 0.85rem', textAlign: 'left', minWidth: '105px' }}>Due Date</th>
                    <th style={{ padding: '0.6rem 0.85rem', textAlign: 'right', minWidth: '110px' }}>Opening Bal</th>
                    <th style={{ padding: '0.6rem 0.85rem', textAlign: 'right', minWidth: '110px' }}>EMI (PMT)</th>
                    <th style={{ padding: '0.6rem 0.85rem', textAlign: 'right', minWidth: '110px' }}>Principal</th>
                    <th style={{ padding: '0.6rem 0.85rem', textAlign: 'right', minWidth: '110px' }}>Interest</th>
                    <th style={{ padding: '0.6rem 0.85rem', textAlign: 'right', minWidth: '110px' }}>Closing Bal</th>
                    <th style={{ padding: '0.6rem 0.85rem', textAlign: 'center', minWidth: '90px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loanSchedule.map((inst, idx) => (
                    <tr
                      key={inst.id || idx}
                      style={{
                        background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-card-solid)',
                        borderBottom: '1px solid var(--border-color)'
                      }}
                    >
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center', fontWeight: '800' }}>
                        {sprintf3(inst.installment_no, activeLoanData?.tenure_months || 36)}
                      </td>
                      <td style={{ padding: '0.55rem 0.85rem', color: 'var(--text-primary)' }}>
                        {inst.due_date}
                      </td>
                      <td style={{ padding: '0.55rem 0.85rem', textAlign: 'right' }}>
                        ₹{Number(inst.opening_balance).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.55rem 0.85rem', textAlign: 'right', fontWeight: '800', color: '#3b82f6' }}>
                        ₹{Number(inst.emi_amount).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.55rem 0.85rem', textAlign: 'right', color: 'var(--accent-cr)' }}>
                        ₹{Number(inst.principal_component).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.55rem 0.85rem', textAlign: 'right', color: '#ef4444' }}>
                        ₹{Number(inst.interest_component).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.55rem 0.85rem', textAlign: 'right', fontWeight: '700' }}>
                        ₹{Number(inst.closing_balance).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.55rem 0.85rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '12px',
                          fontSize: '0.6875rem',
                          fontWeight: '800',
                          background: inst.status === 'PAID' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                          color: inst.status === 'PAID' ? '#10b981' : '#eab308'
                        }}>
                          {inst.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          </>
          )}

        </div>
      )}

      {/* Modal: New Loan / PMT Amortization Calculator */}
      {isAddLoanModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card glass-card" style={{ width: '100%', maxWidth: '480px', padding: '1.5rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0 0 1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calculator size={20} color="var(--primary-brand)" />
              <span>Create New Loan (PMT Engine)</span>
            </h3>

            <form onSubmit={handleCreateLoan} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Account Code (e.g. RBL_PL_3531)</label>
                <input
                  type="text"
                  required
                  value={newAccNo}
                  onChange={(e) => setNewAccNo(e.target.value.toUpperCase())}
                  className="form-control"
                  placeholder="e.g. HDFC_JUMBO_4421"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Lender / Loan Name</label>
                <input
                  type="text"
                  required
                  value={newLender}
                  onChange={(e) => setNewLender(e.target.value)}
                  className="form-control"
                  placeholder="e.g. HDFC Bank Jumbo Loan"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Principal (₹)</label>
                  <input
                    type="number"
                    required
                    value={newPrincipal}
                    onChange={(e) => setNewPrincipal(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Tenure (Months)</label>
                  <input
                    type="number"
                    required
                    value={newTenure}
                    onChange={(e) => setNewTenure(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Sanction Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              {/* Calculated PMT Preview */}
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', marginTop: '0.25rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Calculated Monthly EMI (PMT):</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#3b82f6', marginTop: '0.1rem' }}>
                  ₹{Number(calculatePMTLocal(parseFloat(newRate) || 0, parseInt(newTenure) || 1, parseFloat(newPrincipal) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddLoanModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Generate Amortization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Sub-component for matrix editable row
function renderMatrixInputRow(rowKey, label, baseColor, calculatedMatrix, counterparties, rawEditableData, onCellChange, totalVal, customBg = null, customColor = null) {
  return (
    <tr
      key={rowKey}
      style={{
        background: customBg || 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        color: customColor || 'var(--text-primary)'
      }}
    >
      <td style={{ padding: '0.55rem 0.85rem', textAlign: 'left', fontWeight: '700', borderRight: '1px solid var(--border-color)' }}>
        {label}
      </td>
      {counterparties.map(cp => {
        const val = rawEditableData[rowKey]?.[cp] || 0;
        return (
          <td key={cp} style={{ padding: '0.35rem 0.45rem', textAlign: 'right' }}>
            <input
              type="number"
              value={val || ''}
              onChange={(e) => onCellChange(rowKey, cp, e.target.value)}
              placeholder="—"
              style={{
                width: '75px',
                textAlign: 'right',
                fontSize: '0.75rem',
                padding: '0.2rem',
                background: 'transparent',
                border: '1px solid transparent',
                color: customColor || 'var(--text-primary)',
                borderRadius: '4px',
                fontWeight: val > 0 ? '700' : 'normal'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-brand)'}
              onBlur={(e) => e.target.style.borderColor = 'transparent'}
            />
          </td>
        );
      })}
      <td style={{ padding: '0.55rem 0.85rem', textAlign: 'right', fontWeight: '800', background: 'rgba(59, 130, 246, 0.08)' }}>
        {totalVal > 0 ? `₹${totalVal.toLocaleString('en-IN')}` : '—'}
      </td>
    </tr>
  );
}

function sprintf3(num, maxTenure) {
  return `${String(num).padStart(3, '0')}/${String(maxTenure).padStart(3, '0')}`;
}

function calculatePMTLocal(ratePct, nper, pv) {
  const r = (ratePct / 100.0) / 12.0;
  if (r === 0 || nper <= 0) return (pv / (nper || 1)).toFixed(2);
  const pmt = pv * (r * Math.pow(1 + r, nper)) / (Math.pow(1 + r, nper) - 1);
  return pmt.toFixed(2);
}
