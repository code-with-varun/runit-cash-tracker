import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  PlusCircle,
  Upload,
  Check,
  X,
  Clock,
  ShieldCheck,
  Tag,
  FastForward,
  Edit2,
  Landmark
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { updateTransactionAPI, deleteTransactionAPI, bulkAuditTransactionsAPI } from '../utils/api';
import SlicerBar from './SlicerBar';
import DataTablePagination, { useDataTablePagination } from './DataTablePagination';

export default function MasterTransactionsView({

  transactions = [],
  categories = [],
  accounts = [],
  activeAccount = 'ALL',
  onSelectAccount,
  onNavigateToEntry,
  onNavigateToImport,
  onReloadTransactions,
  onNavigateToValidation
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [accountFilter, setAccountFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'draft' | 'verified' | 'frozen'
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [datePreset, setDatePreset] = useState('ALL'); // 'ALL' | 'TODAY' | 'THIS_MONTH' | '30_DAYS' | 'CUSTOM'
  const [dateFilter, setDateFilter] = useState('');
  const [selectedTxIds, setSelectedTxIds] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [msg, setMsg] = useState('');

  // Slicer counts
  const draftCount = transactions.filter(t => (t.auditStatus || t.audit_status || 'draft') === 'draft').length;
  const verifiedCount = transactions.filter(t => (t.auditStatus || t.audit_status) === 'verified').length;
  const frozenCount = transactions.filter(t => (t.auditStatus || t.audit_status) === 'frozen').length;
  const typeCounts = useMemo(() => ({
    Cr: transactions.filter(t => t.type === 'Cr').length,
    Dr: transactions.filter(t => t.type === 'Dr').length
  }), [transactions]);

  // Filtered transactions
  const filtered = useMemo(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const thisMonthStr = todayStr.substring(0, 7);

    return transactions.filter(tx => {
      const particulars = (tx.notes || tx.particulars || '').toLowerCase();
      const cat = (tx.categoryName || tx.subcategory || '').toLowerCase();
      const grp = (tx.groupType || tx.group_type || '').toLowerCase();
      const acc = (tx.accountNo || tx.account_no || 'Cash_1').toLowerCase();
      const utr = (tx.utrNo || tx.utr_no || '').toLowerCase();
      const tNo = (tx.tranNo || tx.tran_no || '').toLowerCase();

      const matchesSearch = !searchTerm ||
                            particulars.includes(searchTerm.toLowerCase()) ||
                            cat.includes(searchTerm.toLowerCase()) ||
                            grp.includes(searchTerm.toLowerCase()) ||
                            acc.includes(searchTerm.toLowerCase()) ||
                            utr.includes(searchTerm.toLowerCase()) ||
                            tNo.includes(searchTerm.toLowerCase());

      const matchesMulti = (filterVal, itemVal) => {
        if (!filterVal || filterVal === 'ALL') return true;
        if (Array.isArray(filterVal)) {
          if (filterVal.length === 0 || filterVal.includes('ALL')) return true;
          return filterVal.includes(itemVal);
        }
        return filterVal === itemVal;
      };

      const currentAcc = tx.accountNo || tx.account_no || 'Cash_1';
      const matchesAccount = matchesMulti(accountFilter, currentAcc);
      const currentStatus = tx.auditStatus || tx.audit_status || 'draft';
      const matchesStatus = matchesMulti(statusFilter, currentStatus);
      const matchesType = matchesMulti(typeFilter, tx.type);

      const txDate = tx.date || tx.tran_date || '';
      let matchesDate = true;
      if (datePreset === 'TODAY') {
        matchesDate = txDate === todayStr;
      } else if (datePreset === 'THIS_MONTH') {
        matchesDate = txDate.startsWith(thisMonthStr);
      } else if (datePreset === '30_DAYS') {
        const d = new Date(txDate);
        const diffDays = (new Date() - d) / (1000 * 60 * 60 * 24);
        matchesDate = diffDays >= 0 && diffDays <= 30;
      } else if (datePreset === 'CUSTOM' || dateFilter) {
        matchesDate = !dateFilter || txDate === dateFilter;
      }

      return matchesSearch && matchesAccount && matchesStatus && matchesType && matchesDate;
    });
  }, [transactions, searchTerm, accountFilter, statusFilter, typeFilter, datePreset, dateFilter]);

  // Aggregate KPI stats
  const totalVolume = filtered.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  // DataTable Pagination & Column Sorting Hook
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    PaginationComponent,
    getSortHeaderProps,
    renderSortIndicator
  } = useDataTablePagination(filtered, 25);

  // Toggle selection for current page
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTxIds(paginatedItems.map(t => t.id));
    } else {
      setSelectedTxIds([]);
    }
  };

  // Slicer Groups Configuration
  const transactionSlicerGroups = [
    {
      id: 'status',
      label: 'Audit Status',
      icon: ShieldCheck,
      selected: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'ALL', label: 'All Statuses', count: transactions.length },
        { value: 'draft', label: 'Draft', count: draftCount, color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' },
        { value: 'verified', label: 'Verified', count: verifiedCount, color: 'var(--primary-brand)', bg: 'rgba(59, 130, 246, 0.15)' },
        { value: 'frozen', label: 'Locked / Frozen', count: frozenCount, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' }
      ]
    },
    {
      id: 'flow',
      label: 'Flow Type',
      icon: Layers,
      selected: typeFilter,
      onChange: setTypeFilter,
      options: [
        { value: 'ALL', label: 'All Types (Cr & Dr)', count: transactions.length },
        { value: 'Cr', label: 'Credit (Inflow)', count: typeCounts.Cr, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
        { value: 'Dr', label: 'Debit (Outflow)', count: typeCounts.Dr, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' }
      ]
    },
    {
      id: 'account',
      label: 'Account Ledger',
      icon: Landmark,
      selected: accountFilter,
      onChange: (val) => {
        setAccountFilter(val);
        if (onSelectAccount) onSelectAccount(val);
      },
      options: [
        { value: 'ALL', label: 'All Ledgers', count: transactions.length },
        ...accounts.map(acc => ({
          value: acc.code,
          label: acc.code,
          count: transactions.filter(t => (t.accountNo || t.account_no) === acc.code).length
        }))
      ]
    },
    {
      id: 'datePreset',
      label: 'Date Horizon',
      icon: Calendar,
      selected: datePreset,
      onChange: (val) => {
        setDatePreset(val);
        if (val !== 'CUSTOM') setDateFilter('');
      },
      options: [
        { value: 'ALL', label: 'All Time' },
        { value: 'TODAY', label: 'Today' },
        { value: 'THIS_MONTH', label: 'This Month' },
        { value: '30_DAYS', label: 'Last 30 Days' },
        { value: 'CUSTOM', label: 'Pick Date' }
      ]
    }
  ];


  const handleToggleSelectRow = (id) => {
    setSelectedTxIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Inline Category / Subcategory update
  const handleCategoryChange = async (tx, newSubcategory) => {
    if ((tx.auditStatus || tx.audit_status) === 'frozen') {
      alert("This transaction is frozen and locked from category modifications.");
      return;
    }

    const matchedCat = categories.find(c => (c.subcategory || c.name) === newSubcategory);
    try {
      await updateTransactionAPI({
        id: tx.id,
        categoryId: matchedCat?.id || null,
        categoryName: matchedCat?.name || newSubcategory,
        subcategory: matchedCat?.subcategory || newSubcategory,
        groupType: matchedCat?.group_type || null,
        netType: matchedCat?.net_type || null,
        subType: matchedCat?.sub_type || null,
        transactionType: matchedCat?.transaction_type || 'ACTUAL',
      });
      if (onReloadTransactions) onReloadTransactions();
    } catch (err) {
      alert("Failed to update category: " + err.message);
    }
  };

  // Toggle Single Row Audit Status
  const handleToggleRowAudit = async (tx) => {
    const current = tx.auditStatus || tx.audit_status || 'draft';
    let nextStatus = 'verified';
    if (current === 'draft') nextStatus = 'verified';
    else if (current === 'verified') nextStatus = 'frozen';
    else if (current === 'frozen') nextStatus = 'draft';

    try {
      await updateTransactionAPI({
        id: tx.id,
        auditStatus: nextStatus
      });
      if (onReloadTransactions) onReloadTransactions();
    } catch (err) {
      alert("Failed to update audit status: " + err.message);
    }
  };

  // Batch Audit Action
  const handleBatchAudit = async (newStatus) => {
    if (selectedTxIds.length === 0) {
      alert("Please select at least one transaction row.");
      return;
    }

    setLoadingAction(true);
    try {
      await bulkAuditTransactionsAPI({
        ids: selectedTxIds,
        auditStatus: newStatus
      });
      setMsg(`Updated ${selectedTxIds.length} records to ${newStatus.toUpperCase()}!`);
      setSelectedTxIds([]);
      if (onReloadTransactions) await onReloadTransactions();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert("Failed to execute batch audit: " + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Export Master Sheet with all 36 headers
  const handleExportExcel = () => {
    if (filtered.length === 0) {
      alert("No transactions to export.");
      return;
    }
    const exportData = filtered.map((tx, idx) => ({
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
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MASTER TRANSACTIONS');
    XLSX.writeFile(wb, `MoneyMatrix_Master_Transactions_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  return (
    <div style={{ padding: '1.25rem', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* Top Banner & KPI Ribbon */}
      <div className="card glass-card executive-hero-banner" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <div className="executive-live-badge">
              <ShieldCheck size={13} />
              <span>CONSOLIDATED MASTER LEDGER (36 HEADERS)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Master Transactions Repository
              </h2>
              <span style={{
                fontSize: '0.6875rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '6px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                fontWeight: '700'
              }}>
                {filtered.length} Filtered / {transactions.length} Total
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
              Consolidated read-only master repository for all accounts. Use this view for global search, auditing, analytics, and exporting reports. (Line-by-line verification and daily locks are handled in Daily Validation).
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {onNavigateToValidation && (
              <button
                onClick={onNavigateToValidation}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}
              >
                <FastForward size={14} />
                <span>Daily Validation & Lock</span>
              </button>
            )}

            <button
              onClick={handleExportExcel}
              disabled={filtered.length === 0}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
            >
              <FileSpreadsheet size={14} />
              <span>Export Master Excel (36 Columns)</span>
            </button>
          </div>
        </div>

        {/* Audit Status Counters Ribbon */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-color)'
        }}>
          <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: 'var(--bg-input)' }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
              Total Master Records
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
              {transactions.length}
            </div>
          </div>

          <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
            <div style={{ fontSize: '0.6875rem', color: '#f59e0b', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} />
              <span>Draft / Unaudited</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f59e0b', marginTop: '2px' }}>
              {draftCount}
            </div>
          </div>

          <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
            <div style={{ fontSize: '0.6875rem', color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} />
              <span>Verified Taxonomy</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#3b82f6', marginTop: '2px' }}>
              {verifiedCount}
            </div>
          </div>

          <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <div style={{ fontSize: '0.6875rem', color: '#10b981', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={12} />
              <span>Locked & Frozen</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#10b981', marginTop: '2px' }}>
              {frozenCount}
            </div>
          </div>
        </div>
      </div>

      {/* Analytical Slicer Bar & Batch Operations */}
      <SlicerBar
        groups={transactionSlicerGroups}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search particulars, UTR, category, tran_no, account..."
        totalCount={transactions.length}
        filteredCount={filtered.length}
        defaultCollapsed={true}
        onResetAll={() => {
          setSearchTerm('');
          setStatusFilter('ALL');
          setTypeFilter('ALL');
          setAccountFilter('ALL');
          setDatePreset('ALL');
          setDateFilter('');
        }}
        title="Master Audit Slicers"
        extraActions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {datePreset === 'CUSTOM' && (
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="form-control"
                style={{ width: 'auto', fontSize: '0.78125rem', height: '30px', padding: '0.2rem 0.5rem' }}
                title="Filter by specific date"
              />
            )}


          </div>
        }
      />


      {msg && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: 'var(--accent-cr-bg)',
          color: 'var(--accent-cr)',
          border: '1px solid var(--accent-cr-border)',
          fontSize: '0.8125rem',
          fontWeight: '600'
        }}>
          {msg}
        </div>
      )}

      {/* Main Table with 36 Headers Color Bands */}
      <div className="card glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ overflowX: 'auto', maxHeight: '70vh' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left', whiteSpace: 'nowrap' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              <tr>
                <th style={{ background: '#334155', color: '#fff', padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selectedTxIds.length > 0 && paginatedItems.length > 0 && paginatedItems.every(t => selectedTxIds.includes(t.id))}
                    onChange={handleSelectAll}
                  />
                </th>



                {/* 1. Date group */}
                <th {...getSortHeaderProps('date_group')} style={{ background: '#475569', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  Date group {renderSortIndicator('date_group')}
                </th>

                {/* 2. TEMP UPLOAD ID */}
                <th {...getSortHeaderProps('temp_upload_id')} style={{ background: '#00b4d8', color: '#fff', padding: '0.65rem 0.75rem', fontWeight: '800' }}>
                  TEMP UPLOAD ID {renderSortIndicator('temp_upload_id')}
                </th>

                {/* 3 to 21: Core Transaction Fields */}
                <th {...getSortHeaderProps('tran_date')} style={{ background: '#1d4ed8', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  tran_date {renderSortIndicator('tran_date')}
                </th>
                <th {...getSortHeaderProps('tran_no')} style={{ background: '#1d4ed8', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  tran_no {renderSortIndicator('tran_no')}
                </th>
                <th {...getSortHeaderProps('account_no')} style={{ background: '#1d4ed8', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  account_no {renderSortIndicator('account_no')}
                </th>
                <th {...getSortHeaderProps('particulars')} style={{ background: '#1d4ed8', color: '#fff', padding: '0.65rem 1rem', minWidth: '180px' }}>
                  particulars {renderSortIndicator('particulars')}
                </th>
                <th {...getSortHeaderProps('debit')} style={{ background: '#1d4ed8', color: '#fff', padding: '0.65rem 0.75rem', textAlign: 'right' }}>
                  debit (₹) {renderSortIndicator('debit')}
                </th>
                <th {...getSortHeaderProps('credit')} style={{ background: '#1d4ed8', color: '#fff', padding: '0.65rem 0.75rem', textAlign: 'right' }}>
                  credit (₹) {renderSortIndicator('credit')}
                </th>
                <th {...getSortHeaderProps('balance')} style={{ background: '#1d4ed8', color: '#fff', padding: '0.65rem 0.75rem', textAlign: 'right' }}>
                  balance (₹) {renderSortIndicator('balance')}
                </th>
                <th {...getSortHeaderProps('SUB_CATEGORY')} style={{ background: '#1d4ed8', color: '#fff', padding: '0.65rem 0.75rem', minWidth: '140px' }}>
                  SUB_CATEGORY {renderSortIndicator('SUB_CATEGORY')}
                </th>
                <th {...getSortHeaderProps('tagging')} style={{ background: '#1d4ed8', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  tagging {renderSortIndicator('tagging')}
                </th>
                <th {...getSortHeaderProps('jobUtils')} style={{ background: '#1d4ed8', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  JOB UTILS {renderSortIndicator('jobUtils')}
                </th>
                <th {...getSortHeaderProps('compensationType')} style={{ background: '#1d4ed8', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  COMPENSATION TYPE {renderSortIndicator('compensationType')}
                </th>
                <th {...getSortHeaderProps('type')} style={{ background: '#1d4ed8', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  transaction_type {renderSortIndicator('type')}
                </th>
                <th {...getSortHeaderProps('splitRef')} style={{ background: '#1d4ed8', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  SPLIT_REF {renderSortIndicator('splitRef')}
                </th>
                <th {...getSortHeaderProps('infoType')} style={{ background: '#1d4ed8', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  info_type {renderSortIndicator('infoType')}
                </th>
                <th {...getSortHeaderProps('infoStatus')} style={{ background: '#1d4ed8', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  info_status {renderSortIndicator('infoStatus')}
                </th>
                <th {...getSortHeaderProps('eid')} style={{ background: '#1d4ed8', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  eid {renderSortIndicator('eid')}
                </th>
                <th {...getSortHeaderProps('allocationEid')} style={{ background: '#1d4ed8', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  allocation_eid {renderSortIndicator('allocationEid')}
                </th>
                <th {...getSortHeaderProps('jobTimeline')} style={{ background: '#1d4ed8', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  job_timeline {renderSortIndicator('jobTimeline')}
                </th>
                <th {...getSortHeaderProps('remarks')} style={{ background: '#1d4ed8', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  remarks {renderSortIndicator('remarks')}
                </th>

                {/* 22 to 23: Account Type & Suffix */}
                <th {...getSortHeaderProps('account_type')} style={{ background: '#f97316', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  account_type {renderSortIndicator('account_type')}
                </th>
                <th {...getSortHeaderProps('suffix')} style={{ background: '#f97316', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  suffix {renderSortIndicator('suffix')}
                </th>

                {/* 24: KEYWORD TAGGING */}
                <th {...getSortHeaderProps('keywordTagging')} style={{ background: '#facc15', color: '#0f172a', padding: '0.65rem 0.75rem', fontWeight: '800' }}>
                  KEYWORD TAGGING {renderSortIndicator('keywordTagging')}
                </th>

                {/* 25 to 33: Taxonomy & Date Helpers */}
                <th {...getSortHeaderProps('subCatHelper')} style={{ background: '#fb923c', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  Sub_cat_helper {renderSortIndicator('subCatHelper')}
                </th>
                <th {...getSortHeaderProps('method')} style={{ background: '#fb923c', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  method {renderSortIndicator('method')}
                </th>
                <th {...getSortHeaderProps('mode')} style={{ background: '#fb923c', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  mode {renderSortIndicator('mode')}
                </th>
                <th {...getSortHeaderProps('category')} style={{ background: '#fb923c', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  category {renderSortIndicator('category')}
                </th>
                <th {...getSortHeaderProps('netType')} style={{ background: '#fb923c', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  NET TYPE {renderSortIndicator('netType')}
                </th>
                <th {...getSortHeaderProps('month')} style={{ background: '#fb923c', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  month {renderSortIndicator('month')}
                </th>
                <th {...getSortHeaderProps('year')} style={{ background: '#fb923c', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  year {renderSortIndicator('year')}
                </th>
                <th {...getSortHeaderProps('weekNo')} style={{ background: '#fb923c', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  week_no {renderSortIndicator('weekNo')}
                </th>
                <th {...getSortHeaderProps('yearMonth')} style={{ background: '#fb923c', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  year_month {renderSortIndicator('yearMonth')}
                </th>

                {/* 34: tran_type_helper */}
                <th {...getSortHeaderProps('tranTypeHelper')} style={{ background: '#facc15', color: '#0f172a', padding: '0.65rem 0.75rem', fontWeight: '800' }}>
                  tran_type_helper {renderSortIndicator('tranTypeHelper')}
                </th>

                {/* 35 to 36: Status & UTR NO */}
                <th {...getSortHeaderProps('status')} style={{ background: '#1e40af', color: '#fff', padding: '0.65rem 0.75rem', fontWeight: '800' }}>
                  status {renderSortIndicator('status')}
                </th>
                <th {...getSortHeaderProps('utr_no')} style={{ background: '#1e40af', color: '#fff', padding: '0.65rem 0.75rem' }}>
                  UTR NO {renderSortIndicator('utr_no')}
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={38} style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((tx, idx) => {
                  const status = tx.auditStatus || tx.audit_status || 'draft';
                  const isFrozen = status === 'frozen';
                  const isVerified = status === 'verified';
                  const isSelected = selectedTxIds.includes(tx.id);

                  return (
                    <tr
                      key={tx.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(59, 130, 246, 0.08)' : (idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)'),
                        opacity: isFrozen ? 0.92 : 1,
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(tx.id)}
                        />
                      </td>



                      {/* 1. Date group */}
                      <td style={{ padding: '0.55rem 0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                        {tx.dateGroup || tx.date_group || '1'}
                      </td>

                      {/* 2. TEMP UPLOAD ID */}
                      <td style={{ padding: '0.55rem 0.75rem', fontFamily: 'monospace', color: '#00b4d8', fontWeight: '700' }}>
                        {tx.tempUploadId || tx.temp_upload_id || `TEMP_${tx.date}_${tx.id}`}
                      </td>

                      {/* 3. tran_date */}
                      <td style={{ padding: '0.55rem 0.75rem', fontWeight: '600' }}>
                        {tx.date || tx.tran_date}
                      </td>

                      {/* 4. tran_no */}
                      <td style={{ padding: '0.55rem 0.75rem', fontFamily: 'monospace', fontWeight: '600' }}>
                        {tx.tranNo || tx.tran_no || `TXN_${str_pad(tx.id)}`}
                      </td>

                      {/* 5. account_no */}
                      <td style={{ padding: '0.55rem 0.75rem', fontWeight: '700' }}>
                        <span style={{
                          padding: '0.15rem 0.45rem',
                          borderRadius: '6px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: 'var(--primary-brand)',
                          fontSize: '0.6875rem'
                        }}>
                          {tx.accountNo || tx.account_no || 'Cash_1'}
                        </span>
                      </td>

                      {/* 6. particulars */}
                      <td style={{ padding: '0.55rem 0.75rem', minWidth: '180px', fontWeight: '500' }}>
                        {tx.notes || tx.particulars || '—'}
                      </td>

                      {/* 7. debit */}
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: '700', color: tx.type === 'Dr' ? 'var(--accent-dr)' : 'var(--text-muted)' }}>
                        {tx.type === 'Dr' ? `₹${Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>

                      {/* 8. credit */}
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: '700', color: tx.type === 'Cr' ? 'var(--accent-cr)' : 'var(--text-muted)' }}>
                        {tx.type === 'Cr' ? `₹${Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>

                      {/* 9. balance */}
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>
                        ₹{Number(tx.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* 10. SUB_CATEGORY */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>
                        {isFrozen ? (
                          <span style={{ fontWeight: '700' }}>{tx.subcategory || tx.categoryName || 'GENERAL'}</span>
                        ) : (
                          <select
                            value={tx.subcategory || tx.categoryName || ''}
                            onChange={(e) => handleCategoryChange(tx, e.target.value)}
                            className="form-control"
                            style={{ height: '28px', fontSize: '0.75rem', padding: '0.1rem 0.3rem' }}
                          >
                            {categories.map(c => (
                              <option key={c.id} value={c.subcategory || c.name}>{c.subcategory || c.name}</option>
                            ))}
                          </select>
                        )}
                      </td>

                      {/* 11. tagging */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>{tx.tagging || '—'}</td>

                      {/* 12. JOB UTILS */}
                      <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-secondary)' }}>{tx.jobUtils || tx.job_utils || '—'}</td>

                      {/* 13. COMPENSATION TYPE */}
                      <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-secondary)' }}>{tx.compensationType || tx.compensation_type || '—'}</td>

                      {/* 14. transaction_type */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: '700',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          background: tx.transactionType === 'ROTATIONAL' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                          color: tx.transactionType === 'ROTATIONAL' ? '#eab308' : 'var(--primary-brand)'
                        }}>
                          {tx.transactionType || tx.transaction_type || 'ACTUAL'}
                        </span>
                      </td>

                      {/* 15. SPLIT_REF */}
                      <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-muted)' }}>{tx.splitRef || tx.split_ref || '—'}</td>

                      {/* 16. info_type */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>{tx.infoType || tx.info_type || 'BOTH'}</td>

                      {/* 17. info_status */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>{tx.infoStatus || tx.info_status || '—'}</td>

                      {/* 18. eid */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>{tx.eid || '—'}</td>

                      {/* 19. allocation_eid */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>{tx.allocationEid || tx.allocation_eid || '—'}</td>

                      {/* 20. job_timeline */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>{tx.jobTimeline || tx.job_timeline || '—'}</td>

                      {/* 21. remarks */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>{tx.remarks || tx.notes || '—'}</td>

                      {/* 22. account_type */}
                      <td style={{ padding: '0.55rem 0.75rem', fontWeight: '600' }}>{tx.accountType || tx.account_type || 'Cash'}</td>

                      {/* 23. suffix */}
                      <td style={{ padding: '0.55rem 0.75rem', fontWeight: '700' }}>
                        <span style={{ color: tx.type === 'Cr' ? 'var(--accent-cr)' : 'var(--accent-dr)' }}>
                          {tx.suffix || (tx.type === 'Cr' ? 'CR' : 'DR')}
                        </span>
                      </td>

                      {/* 24. KEYWORD TAGGING */}
                      <td style={{ padding: '0.55rem 0.75rem', fontWeight: '600', color: '#b45309' }}>
                        {tx.keywordTagging || tx.keyword_tagging || '—'}
                      </td>

                      {/* 25. Sub_cat_helper */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>{tx.subCatHelper || tx.sub_cat_helper || '—'}</td>

                      {/* 26. method */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>{tx.method || 'UPI'}</td>

                      {/* 27. mode */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>{tx.mode || 'ONLINE'}</td>

                      {/* 28. category */}
                      <td style={{ padding: '0.55rem 0.75rem', fontWeight: '600' }}>{tx.category || 'General'}</td>

                      {/* 29. NET TYPE */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>{tx.netType || tx.net_type || '—'}</td>

                      {/* 30. month */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>{tx.month || (tx.date ? tx.date.substring(5, 7) : '—')}</td>

                      {/* 31. year */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>{tx.year || (tx.date ? tx.date.substring(0, 4) : '—')}</td>

                      {/* 32. week_no */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>{tx.weekNo || tx.week_no || '—'}</td>

                      {/* 33. year_month */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>{tx.yearMonth || tx.year_month || (tx.date ? tx.date.substring(0, 7) : '—')}</td>

                      {/* 34. tran_type_helper */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>{tx.tranTypeHelper || tx.tran_type_helper || '—'}</td>

                      {/* 35. status */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>
                        {isFrozen ? (
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
                            <Lock size={10} />
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
                            <Check size={10} />
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
                            <span>DRAFT</span>
                          </span>
                        )}
                      </td>

                      {/* 36. UTR NO */}
                      <td style={{ padding: '0.55rem 0.75rem', fontFamily: 'monospace' }}>
                        {tx.utrNo || tx.utr_no || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* DataTable Pagination Bar */}
        <PaginationComponent itemLabel="transactions" pageSizeOptions={[15, 25, 50, 100, 'ALL']} />
      </div>
    </div>

  );
}

function str_pad(val) {
  if (!val) return '000001';
  return String(val).padStart(6, '0');
}
