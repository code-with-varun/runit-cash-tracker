import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Landmark,
  CreditCard,
  Wallet,
  Banknote,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  Trash2,
  Download,
  Calendar,
  Layers,
  Database,
  Edit2,
  FileSpreadsheet,
  Upload,
  X,
  FileText,
  ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { addAccountAPI, addBulkAccountsAPI, updateAccountAPI, deleteAccountAPI } from '../utils/api';
import { exportAccountMasterToExcel, downloadAccountMasterTemplate, parseAccountsExcel } from '../utils/excel';
import SlicerBar from './SlicerBar';
import DataTablePagination, { useDataTablePagination } from './DataTablePagination';

export default function AccountManagerView({
  accounts = [],
  categories = [],
  onReloadAccounts,
  onReloadTransactions,
  onSelectAccount,
  onNavigateToCash,
  onNavigateToMasterAudit,
  onNavigateToSingleEntry,
  onNavigateToBulkEntry,
  cashBalance = 0,
  cashTransactionsCount = 0
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dumpFilter, setDumpFilter] = useState('ALL');
  const [balanceFilter, setBalanceFilter] = useState('ALL');


  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ isOpen: false, account: null });
  const [openAddTxDropdownId, setOpenAddTxDropdownId] = useState(null);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleClickOutside = () => setOpenAddTxDropdownId(null);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpenAddTxDropdownId(null);
    };
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // New account form
  const [accName, setAccName] = useState('');
  const [accCode, setAccCode] = useState('');
  const [accType, setAccType] = useState('Savings Account');
  const [accDumpType, setAccDumpType] = useState('FINANCE');
  const [accStatus, setAccStatus] = useState('active');
  const [accBalance, setAccBalance] = useState('0');
  const [loading, setLoading] = useState(false);

  // Edit account form state
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editType, setEditType] = useState('Savings Account');
  const [editDumpType, setEditDumpType] = useState('FINANCE');
  const [editStatus, setEditStatus] = useState('active');

  const accountsFileInputRef = useRef(null);

  const handleAccountsExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const parsed = await parseAccountsExcel(file);
      if (parsed.length === 0) {
        alert("No valid accounts found in the uploaded file. Please use the downloaded template.");
        return;
      }

      const res = await addBulkAccountsAPI(parsed);
      alert(res.message || `Successfully imported ${parsed.length} accounts!`);
      if (onReloadAccounts) await onReloadAccounts();
      e.target.value = '';
    } catch (err) {
      alert("Failed to import accounts: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!accName.trim()) {
      alert("Please provide an account name.");
      return;
    }
    const code = accCode.trim() || accName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    setLoading(true);
    try {
      await addAccountAPI({
        name: accName.trim(),
        code: code,
        type: accType,
        dump_type: accDumpType,
        status: accStatus,
        initialBalance: parseFloat(accBalance) || 0,
      });
      setIsAddModalOpen(false);
      setAccName('');
      setAccCode('');
      setAccType('Savings Account');
      setAccDumpType('FINANCE');
      setAccStatus('active');
      setAccBalance('0');
      if (onReloadAccounts) await onReloadAccounts();
    } catch (err) {
      alert("Failed to add account: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (acc) => {
    setEditModal({ isOpen: true, account: acc });
    setEditName(acc.name || '');
    setEditCode(acc.code || '');
    setEditType(acc.type || 'Savings Account');
    setEditDumpType(acc.dump_type || 'FINANCE');
    setEditStatus(acc.status || 'active');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setLoading(true);
    try {
      await updateAccountAPI({
        id: editModal.account.id,
        name: editName.trim(),
        code: editCode.trim() || editModal.account.code,
        type: editType,
        dump_type: editDumpType,
        status: editStatus
      });
      setEditModal({ isOpen: false, account: null });
      if (onReloadAccounts) await onReloadAccounts();
    } catch (err) {
      alert("Failed to update account: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (acc) => {
    const newStatus = acc.status === 'closed' ? 'active' : 'closed';
    try {
      await updateAccountAPI({
        id: acc.id,
        status: newStatus
      });
      if (onReloadAccounts) await onReloadAccounts();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleDeleteAccount = async (acc) => {
    if (acc.code === 'Cash_1') {
      alert("Cash_1 is your primary cash ledger and cannot be deleted.");
      return;
    }
    if (!window.confirm(`Delete account "${acc.name}"? Transactions associated with this account will remain in master records.`)) {
      return;
    }
    try {
      await deleteAccountAPI(acc.id);
      if (onReloadAccounts) await onReloadAccounts();
    } catch (err) {
      alert("Failed to delete account: " + err.message);
    }
  };

  // Aggregate stats from real accounts
  const totalLiquid = accounts
    .filter(a => ['Cash', 'Cash Account', 'Savings Account', 'Current Account', 'PPF Account'].includes(a.type))
    .reduce((sum, a) => sum + Number(a.balance || 0), 0);

  const totalCCDebt = accounts
    .filter(a => ['Credit Card', 'Pay Later Account'].includes(a.type))
    .reduce((sum, a) => sum + (Number(a.balance || 0) < 0 ? Math.abs(Number(a.balance)) : 0), 0);

  const totalLoans = accounts
    .filter(a => ['Loan Account'].includes(a.type))
    .reduce((sum, a) => sum + (Number(a.balance || 0) < 0 ? Math.abs(Number(a.balance)) : 0), 0);

  const netFamilyBalance = totalLiquid - totalCCDebt;

  // Slicer count aggregates
  const typeCounts = useMemo(() => {
    const counts = {};
    accounts.forEach(a => {
      if (a.type) counts[a.type] = (counts[a.type] || 0) + 1;
    });
    return counts;
  }, [accounts]);

  const statusCounts = useMemo(() => {
    const counts = { active: 0, closed: 0 };
    accounts.forEach(a => {
      const s = (a.status || 'active').toLowerCase();
      if (s === 'closed') counts.closed++;
      else counts.active++;
    });
    return counts;
  }, [accounts]);

  const dumpCounts = useMemo(() => {
    const counts = {};
    accounts.forEach(a => {
      const d = (a.dump_type || 'FINANCE').toUpperCase();
      counts[d] = (counts[d] || 0) + 1;
    });
    return counts;
  }, [accounts]);

  const balanceCounts = useMemo(() => {
    const counts = { positive: 0, negative: 0, zero: 0 };
    accounts.forEach(a => {
      const b = Number(a.balance || 0);
      if (b > 0) counts.positive++;
      else if (b < 0) counts.negative++;
      else counts.zero++;
    });
    return counts;
  }, [accounts]);

  const matchesMulti = (filterVal, itemVal) => {
    if (!filterVal || filterVal === 'ALL') return true;
    if (Array.isArray(filterVal)) {
      if (filterVal.length === 0 || filterVal.includes('ALL')) return true;
      return filterVal.includes(itemVal);
    }
    return filterVal === itemVal;
  };

  const matchesStatusMulti = (filterVal, statusVal) => {
    const s = (statusVal || 'active').toLowerCase();
    if (!filterVal || filterVal === 'ALL') return true;
    if (Array.isArray(filterVal)) {
      if (filterVal.length === 0 || filterVal.includes('ALL')) return true;
      return filterVal.some(v => v.toLowerCase() === s);
    }
    return filterVal.toLowerCase() === s;
  };

  const matchesDumpMulti = (filterVal, dumpVal) => {
    const d = (dumpVal || 'FINANCE').toUpperCase();
    if (!filterVal || filterVal === 'ALL') return true;
    if (Array.isArray(filterVal)) {
      if (filterVal.length === 0 || filterVal.includes('ALL')) return true;
      return filterVal.some(v => v.toUpperCase() === d);
    }
    return filterVal.toUpperCase() === d;
  };

  const matchesBalanceMulti = (filterVal, balanceNum) => {
    const b = Number(balanceNum || 0);
    const bType = b > 0 ? 'positive' : (b < 0 ? 'negative' : 'zero');
    if (!filterVal || filterVal === 'ALL') return true;
    if (Array.isArray(filterVal)) {
      if (filterVal.length === 0 || filterVal.includes('ALL')) return true;
      return filterVal.includes(bType);
    }
    return filterVal === bType;
  };

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = (acc.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (acc.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (acc.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (acc.dump_type || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = matchesMulti(typeFilter, acc.type);
    const matchesStatus = matchesStatusMulti(statusFilter, acc.status);
    const matchesDump = matchesDumpMulti(dumpFilter, acc.dump_type);
    const matchesBalance = matchesBalanceMulti(balanceFilter, acc.balance);
    return matchesSearch && matchesType && matchesStatus && matchesDump && matchesBalance;
  });

  // Reusable DataTable Pagination Hook
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedAccounts,
    PaginationComponent,
    getSortHeaderProps,
    renderSortIndicator
  } = useDataTablePagination(filteredAccounts, 10);

  // Slicer Groups Configuration
  const accountSlicerGroups = [
    {
      id: 'type',
      label: 'Account Type',
      icon: Landmark,
      selected: typeFilter,
      onChange: setTypeFilter,
      options: [
        { value: 'ALL', label: 'All Types', count: accounts.length },
        ...Object.keys(typeCounts).map(t => ({
          value: t,
          label: t.replace(' Account', ''),
          count: typeCounts[t]
        }))
      ]
    },
    {
      id: 'status',
      label: 'Status',
      icon: CheckCircle2,
      selected: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'ALL', label: 'All Statuses', count: accounts.length },
        { value: 'active', label: 'Active', count: statusCounts.active, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
        { value: 'closed', label: 'Closed', count: statusCounts.closed, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
      ]
    },
    {
      id: 'dump',
      label: 'Dump Type',
      icon: Database,
      selected: dumpFilter,
      onChange: setDumpFilter,
      options: [
        { value: 'ALL', label: 'All Dumps', count: accounts.length },
        ...Object.keys(dumpCounts).map(d => ({
          value: d,
          label: d,
          count: dumpCounts[d]
        }))
      ]
    },
    {
      id: 'balance',
      label: 'Balance',
      icon: Wallet,
      selected: balanceFilter,
      onChange: setBalanceFilter,
      options: [
        { value: 'ALL', label: 'All Balances', count: accounts.length },
        { value: 'positive', label: 'Surplus (> ₹0)', count: balanceCounts.positive, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
        { value: 'negative', label: 'Debt (< ₹0)', count: balanceCounts.negative, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
        { value: 'zero', label: 'Zero (₹0)', count: balanceCounts.zero }
      ]
    }
  ];


  const getAccountIcon = (type) => {
    switch (type) {
      case 'Cash':
      case 'Cash Account': return Banknote;
      case 'Savings Account':
      case 'PPF Account':
      case 'PF Account': return Landmark;
      case 'Current Account': return Wallet;
      case 'Credit Card':
      case 'Pay Later Account': return CreditCard;
      case 'Loan Account': return AlertCircle;
      case 'Demat Account':
      case 'Trading Account': return Layers;
      default: return Landmark;
    }
  };

  const getAccountBadgeColor = (type) => {
    switch (type) {
      case 'Cash':
      case 'Cash Account': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' };
      case 'Savings Account':
      case 'PPF Account':
      case 'PF Account': return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' };
      case 'Current Account': return { bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4' };
      case 'Credit Card':
      case 'Pay Later Account': return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' };
      case 'Loan Account': return { bg: 'rgba(236, 72, 153, 0.15)', text: '#ec4899' };
      case 'Demat Account':
      case 'Trading Account': return { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7' };
      default: return { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8' };
    }
  };

  const getDumpTypeBadge = (dumpType = 'FINANCE') => {
    const dt = dumpType.toUpperCase();
    if (dt === 'POWERUS') return { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7' };
    if (dt === 'EPFO') return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' };
    return { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6' };
  };

  return (
    <div style={{ padding: '1.25rem', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
              Bank Account Master
            </h2>
            <span style={{
              fontSize: '0.6875rem',
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              fontWeight: '700'
            }}>
              {accounts.length} Ledgers
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
            Unified Standard Accounts (FINAL STD AC) • Live dynamic closing balances & date spans
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.78125rem',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
            }}
          >
            <PlusCircle size={15} />
            <span>+ Add Account</span>
          </button>

          <button
            onClick={downloadAccountMasterTemplate}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.78125rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
            title="Download blank Excel template to fill and import multiple accounts"
          >
            <FileSpreadsheet size={14} color="#10b981" />
            <span>Download Template (.xlsx)</span>
          </button>

          <label
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.78125rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              cursor: 'pointer'
            }}
            title="Upload filled accounts Excel file to import"
          >
            <Upload size={14} />
            <span>Import Accounts</span>
            <input
              type="file"
              ref={accountsFileInputRef}
              accept=".xlsx, .xls, .csv"
              onChange={handleAccountsExcelUpload}
              style={{ display: 'none' }}
            />
          </label>

          <button
            onClick={() => exportAccountMasterToExcel(accounts)}
            className="btn btn-ghost btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.78125rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
            title="Download registered accounts Excel (.xlsx)"
          >
            <Download size={14} />
            <span>Export Master (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Top Aggregation Cards */}
      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        
        {/* Liquid Balances */}
        <div className="card glass-card" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Liquid Funds (Banks + Cash)
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)' }}>
              <Landmark size={16} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-cr)', letterSpacing: '-0.02em' }}>
            ₹{totalLiquid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Includes <strong style={{ color: 'var(--text-primary)' }}>₹{Number(cashBalance).toLocaleString('en-IN')}</strong> in Cash_1 Ledger
          </div>
        </div>

        {/* Credit Card Outstanding */}
        <div className="card glass-card" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Credit Card Outstanding
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)' }}>
              <CreditCard size={16} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: totalCCDebt > 0 ? 'var(--accent-dr)' : 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            ₹{totalCCDebt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Total Pay Later & Cards Utilized
          </div>
        </div>

        {/* Net Family Position */}
        <div className="card glass-card" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Net Liquid Position
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)' }}>
              <Wallet size={16} color="#3b82f6" />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: netFamilyBalance >= 0 ? 'var(--accent-cr)' : 'var(--accent-dr)', letterSpacing: '-0.02em' }}>
            ₹{netFamilyBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Liquid assets minus revolving liabilities
          </div>
        </div>

      </div>

      {/* Interactive Analytical Slicers Bar */}
      <SlicerBar
        groups={accountSlicerGroups}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by STD AC Code, Account Name or Type..."
        totalCount={accounts.length}
        filteredCount={filteredAccounts.length}
        defaultCollapsed={true}
        onResetAll={() => {
          setSearchTerm('');
          setTypeFilter(['ALL']);
          setStatusFilter(['ALL']);
          setDumpFilter(['ALL']);
          setBalanceFilter(['ALL']);
        }}
        title="Bank Account Master Slicers"
      />

      {/* Accounts Master Table */}
      <div className="card glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: 0 }}>
              Master Standard Accounts ({filteredAccounts.length})
            </h3>
            <span style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
              Click status badges to toggle ACTIVE / CLOSED • Use line-item buttons to Add Transactions or View Ledgers
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: '700' }}>
            Template: FINAL STD AC Schema
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th {...getSortHeaderProps('code')} style={{ padding: '0.65rem' }}>
                  FINAL STD AC {renderSortIndicator('code')}
                </th>
                <th {...getSortHeaderProps('name')} style={{ padding: '0.65rem' }}>
                  Account Name {renderSortIndicator('name')}
                </th>
                <th {...getSortHeaderProps('type')} style={{ padding: '0.65rem' }}>
                  Account Type {renderSortIndicator('type')}
                </th>
                <th {...getSortHeaderProps('dump_type')} style={{ padding: '0.65rem' }}>
                  Dump Type {renderSortIndicator('dump_type')}
                </th>
                <th {...getSortHeaderProps('status')} style={{ padding: '0.65rem', textAlign: 'center' }}>
                  Status {renderSortIndicator('status')}
                </th>
                <th {...getSortHeaderProps('txCount')} style={{ padding: '0.65rem', textAlign: 'center' }}>
                  TX COUNT {renderSortIndicator('txCount')}
                </th>
                <th {...getSortHeaderProps('startDate')} style={{ padding: '0.65rem' }}>
                  Date Span {renderSortIndicator('startDate')}
                </th>
                <th {...getSortHeaderProps('balance')} style={{ padding: '0.65rem', textAlign: 'right' }}>
                  Closing Balance {renderSortIndicator('balance')}
                </th>
                <th style={{ padding: '0.65rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAccounts.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No bank accounts match the selected slicers and search criteria.
                  </td>
                </tr>
              ) : (
                paginatedAccounts.map((acc, idx) => {

              const Icon = getAccountIcon(acc.type);
              const badge = getAccountBadgeColor(acc.type);
              const dumpBadge = getDumpTypeBadge(acc.dump_type);
              const isCash = acc.code === 'Cash_1' || acc.type === 'Cash' || acc.type === 'Cash Account';
              const balanceNum = Number(acc.balance || 0);
              const isClosed = (acc.status || '').toLowerCase() === 'closed';
              const isNearBottom = idx >= Math.max(filteredAccounts.length - 2, 0);

              return (
                <tr
                  key={acc.id}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    opacity: isClosed ? 0.65 : 1,
                    transition: 'opacity 0.2s'
                  }}
                >
                  {/* FINAL STD AC */}
                  <td style={{ padding: '0.65rem', fontFamily: 'monospace', fontWeight: '700', color: 'var(--text-primary)' }}>
                    <code>{acc.code}</code>
                  </td>

                  {/* Account Name with Icon */}
                  <td style={{ padding: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: badge.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon size={14} color={badge.text} />
                      </div>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                        {acc.name}
                      </span>
                    </div>
                  </td>

                  {/* Account Type */}
                  <td style={{ padding: '0.65rem' }}>
                    <span style={{
                      padding: '0.15rem 0.45rem',
                      borderRadius: '5px',
                      background: badge.bg,
                      color: badge.text,
                      fontSize: '0.6875rem',
                      fontWeight: '700'
                    }}>
                      {acc.type}
                    </span>
                  </td>

                  {/* Dump Type */}
                  <td style={{ padding: '0.65rem' }}>
                    <span style={{
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      background: dumpBadge.bg,
                      color: dumpBadge.text,
                      fontSize: '0.6875rem',
                      fontWeight: '700'
                    }}>
                      {(acc.dump_type || 'FINANCE').toUpperCase()}
                    </span>
                  </td>

                  {/* Status (Clickable Toggle) */}
                  <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleToggleStatus(acc)}
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.6875rem',
                        fontWeight: '800',
                        border: 'none',
                        cursor: 'pointer',
                        background: !isClosed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: !isClosed ? '#10b981' : '#ef4444'
                      }}
                      title="Click to toggle ACTIVE / CLOSED"
                    >
                      {!isClosed ? 'ACTIVE' : 'CLOSED'}
                    </button>
                  </td>

                  {/* TX COUNT */}
                  <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: '700' }}>
                    {acc.txCount || 0}
                  </td>

                  {/* Date Span */}
                  <td style={{ padding: '0.65rem', fontSize: '0.71875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {acc.startDate && acc.endDate ? (
                      <span>{acc.startDate} → {acc.endDate}</span>
                    ) : (
                      <span style={{ fontStyle: 'italic', opacity: 0.6 }}>No txns</span>
                    )}
                  </td>

                  {/* Closing Balance */}
                  <td style={{ padding: '0.65rem', textAlign: 'right' }}>
                    <span style={{
                      fontWeight: '800',
                      fontSize: '0.875rem',
                      color: balanceNum >= 0 ? 'var(--accent-cr)' : 'var(--accent-dr)'
                    }}>
                      ₹{balanceNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </td>

                  {/* Actions for this specific account */}
                  <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      
                      {/* Action 1: Add Transactions (Direct to Transaction Entry) */}
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectAccount) onSelectAccount(acc.code);
                          if (onNavigateToBulkEntry) onNavigateToBulkEntry(acc.code);
                        }}
                        className="btn btn-sm"
                        style={{
                          fontSize: '0.71875rem',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '6px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#ffffff',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                        }}
                        title={`Add transaction / bulk import for ${acc.code} in Transaction Entry`}
                      >
                        <PlusCircle size={12} />
                        <span>Add Txn</span>
                      </button>

                      {/* Action 2: View Ledger */}
                      <button
                        onClick={() => {
                          if (onSelectAccount) onSelectAccount(acc.code);
                          if (onNavigateToMasterAudit) onNavigateToMasterAudit(acc.code);
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{
                          fontSize: '0.71875rem',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                        title={`View master ledger filtered to ${acc.code}`}
                      >
                        <Layers size={12} color="#3b82f6" />
                        <span>Ledger</span>
                      </button>

                      {/* Action 3: Edit / Rename Account */}
                      <button
                        onClick={() => handleOpenEdit(acc)}
                        className="btn btn-ghost btn-sm"
                        title="Edit / Rename Account"
                        style={{ padding: '0.25rem 0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                      >
                        <Edit2 size={12} />
                      </button>

                      {/* Action 4: Delete Account */}
                      {!isCash && (
                        <button
                          onClick={() => handleDeleteAccount(acc)}
                          className="btn btn-ghost btn-sm"
                          title="Delete Account"
                          style={{ padding: '0.25rem 0.4rem', color: 'var(--accent-dr)' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
          </tbody>
        </table>
      </div>

      {/* DataTable Pagination Bar */}
      <PaginationComponent itemLabel="accounts" pageSizeOptions={[10, 25, 50, 'ALL']} />
    </div>


      {/* MODAL 1: Add New Account Master */}
      {isAddModalOpen && (
        <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '460px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1875rem', fontWeight: '800', margin: 0 }}>
                Add Bank Account Master
              </h3>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                FINAL STD AC Entry
              </span>
            </div>

            <form onSubmit={handleAddAccount} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                  Account Name
                </label>
                <input
                  type="text"
                  required
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  placeholder="e.g. SBI Thulasi Savings"
                  className="form-control"
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                  FINAL STD AC Code (Unique Account Identifier)
                </label>
                <input
                  type="text"
                  value={accCode}
                  onChange={(e) => setAccCode(e.target.value)}
                  placeholder="e.g. SBI_THULASI_0144 (Auto-generated if empty)"
                  className="form-control"
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                    Account Type
                  </label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value)}
                    className="form-control"
                    style={{ fontSize: '0.8125rem' }}
                  >
                    <option value="Savings Account">Savings Account</option>
                    <option value="Current Account">Current Account</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Loan Account">Loan Account</option>
                    <option value="Cash Account">Cash Account</option>
                    <option value="PPF Account">PPF Account</option>
                    <option value="Demat Account">Demat Account</option>
                    <option value="Trading Account">Trading Account</option>
                    <option value="PF Account">PF Account</option>
                    <option value="Pay Later Account">Pay Later Account</option>
                    <option value="MERCHANT ACCOUNT">Merchant Account</option>
                    <option value="Points Account">Points Account</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                    Dump Type
                  </label>
                  <select
                    value={accDumpType}
                    onChange={(e) => setAccDumpType(e.target.value)}
                    className="form-control"
                    style={{ fontSize: '0.8125rem' }}
                  >
                    <option value="FINANCE">FINANCE</option>
                    <option value="POWERUS">POWERUS</option>
                    <option value="EPFO">EPFO</option>
                    <option value="MANUAL">MANUAL</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                    Status
                  </label>
                  <select
                    value={accStatus}
                    onChange={(e) => setAccStatus(e.target.value)}
                    className="form-control"
                    style={{ fontSize: '0.8125rem' }}
                  >
                    <option value="active">ACTIVE</option>
                    <option value="closed">CLOSED</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                    Opening Balance (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={accBalance}
                    onChange={(e) => setAccBalance(e.target.value)}
                    placeholder="0.00"
                    className="form-control"
                    style={{ fontSize: '0.8125rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-sm"
                >
                  {loading ? 'Saving...' : 'Save Account Master'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Account Master */}
      {editModal.isOpen && (
        <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '460px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1875rem', fontWeight: '800', margin: 0 }}>
                Edit Account Details
              </h3>
              <button onClick={() => setEditModal({ isOpen: false, account: null })} className="btn btn-ghost btn-sm" style={{ padding: '0.25rem' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                  Account Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="form-control"
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                  STD AC Code
                </label>
                <input
                  type="text"
                  required
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  className="form-control"
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                    Type
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="form-control"
                    style={{ fontSize: '0.8125rem' }}
                  >
                    <option value="Savings Account">Savings Account</option>
                    <option value="Current Account">Current Account</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Loan Account">Loan Account</option>
                    <option value="Cash Account">Cash Account</option>
                    <option value="PPF Account">PPF Account</option>
                    <option value="Demat Account">Demat Account</option>
                    <option value="Trading Account">Trading Account</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="form-control"
                    style={{ fontSize: '0.8125rem' }}
                  >
                    <option value="active">ACTIVE</option>
                    <option value="closed">CLOSED</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, account: null })}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-sm"
                >
                  {loading ? 'Saving...' : 'Update Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* End of Account Manager */}
    </div>
  );
}
