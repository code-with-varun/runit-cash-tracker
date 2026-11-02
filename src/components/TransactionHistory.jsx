import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Download,
  Trash2,
  Edit2,
  AlertTriangle,
  Landmark,
  Layers,
  Calendar,
  Tag,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { exportTransactionsToExcel } from '../utils/excel';
import { getTodayString } from '../utils/storage';
import SlicerBar from './SlicerBar';
import DataTablePagination, { useDataTablePagination } from './DataTablePagination';

export default function TransactionHistory({
  transactions = [],
  categories = [],
  accounts = [],
  onUpdateTransaction,
  onDeleteTransaction,
  cashOnly = false
}) {
  const todayStr = getTodayString();
  const thisMonthStr = todayStr.substring(0, 7);

  const crCategories = categories ? categories.filter((c) => c.type === 'Cr') : [];
  const drCategories = categories ? categories.filter((c) => c.type === 'Dr') : [];

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [accountFilter, setAccountFilter] = useState(cashOnly ? 'Cash_1' : 'ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [datePreset, setDatePreset] = useState('ALL');
  const [customDate, setCustomDate] = useState('');

  // Editing Modal State
  const [editingTx, setEditingTx] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Format Currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search term matching notes, particulars, category, or account
      const query = searchTerm.toLowerCase();
      const p = (tx.particulars || tx.notes || '').toLowerCase();
      const c = (tx.categoryName || tx.subcategory || tx.category || '').toLowerCase();
      const a = (tx.accountNo || tx.account_no || '').toLowerCase();
      const matchSearch =
        searchTerm === '' ||
        p.includes(query) ||
        c.includes(query) ||
        a.includes(query);

      const matchesMulti = (filterVal, itemVal) => {
        if (!filterVal || filterVal === 'ALL') return true;
        if (Array.isArray(filterVal)) {
          if (filterVal.length === 0 || filterVal.includes('ALL')) return true;
          return filterVal.includes(itemVal);
        }
        return filterVal === itemVal;
      };

      // Account filter
      const currentAcc = tx.accountNo || tx.account_no || 'Cash_1';
      if (cashOnly && currentAcc !== 'Cash_1') return false;
      const matchAcc = matchesMulti(accountFilter, currentAcc);

      // Type filter
      const matchType = matchesMulti(typeFilter, tx.type);

      // Category filter
      const matchCat = categoryFilter === 'ALL' || 
                        String(tx.categoryId) === String(categoryFilter) ||
                        tx.categoryName === categoryFilter ||
                        tx.subcategory === categoryFilter;

      // Date preset filter
      const txDate = tx.date || tx.tran_date || '';
      let matchDate = true;
      if (datePreset === 'TODAY') {
        matchDate = txDate === todayStr;
      } else if (datePreset === 'THIS_MONTH') {
        matchDate = txDate.startsWith(thisMonthStr);
      } else if (datePreset === '30_DAYS') {
        const d = new Date(txDate);
        const diffDays = (new Date() - d) / (1000 * 60 * 60 * 24);
        matchDate = diffDays >= 0 && diffDays <= 30;
      } else if (datePreset === 'CUSTOM' && customDate) {
        matchDate = txDate === customDate;
      }

      return matchSearch && matchAcc && matchType && matchCat && matchDate;
    });
  }, [transactions, searchTerm, accountFilter, typeFilter, categoryFilter, datePreset, customDate, todayStr, thisMonthStr]);

  // Reusable DataTable Pagination Hook
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedTransactions,
    PaginationComponent,
    getSortHeaderProps,
    renderSortIndicator
  } = useDataTablePagination(filteredTransactions, 15);

  // Dynamic Slicer Counts
  const typeCounts = useMemo(() => {
    const counts = { Cr: 0, Dr: 0 };
    transactions.forEach(t => {
      if (t.type === 'Cr') counts.Cr++;
      else if (t.type === 'Dr') counts.Dr++;
    });
    return counts;
  }, [transactions]);

  const accountCounts = useMemo(() => {
    const counts = {};
    transactions.forEach(t => {
      const a = t.accountNo || t.account_no || 'Cash_1';
      counts[a] = (counts[a] || 0) + 1;
    });
    return counts;
  }, [transactions]);

  const historySlicerGroups = [
    {
      id: 'type',
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
      onChange: setAccountFilter,
      options: [
        { value: 'ALL', label: 'All Accounts', count: transactions.length },
        ...accounts.map(a => {
          const code = a.code || a.id || a.name;
          return {
            value: code,
            label: a.name || code,
            count: accountCounts[code] || 0
          };
        })
      ]
    },
    {
      id: 'date',
      label: 'Date Timeline',
      icon: Calendar,
      selected: datePreset,
      onChange: setDatePreset,
      options: [
        { value: 'ALL', label: 'All Dates' },
        { value: 'TODAY', label: 'Today', count: transactions.filter(t => (t.date || t.tran_date) === todayStr).length },
        { value: 'THIS_MONTH', label: 'This Month', count: transactions.filter(t => (t.date || t.tran_date || '').startsWith(thisMonthStr)).length },
        { value: '30_DAYS', label: 'Last 30 Days' },
        { value: 'CUSTOM', label: 'Custom Date' }
      ]
    }
  ];

  const handleExportExcel = () => {
    exportTransactionsToExcel(filteredTransactions);
  };

  const handleOpenEdit = (tx) => {
    setEditingTx({ ...tx });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingTx) return;
    onUpdateTransaction(editingTx);
    setEditingTx(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header & Export Banner */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--primary-brand-bg)',
              color: 'var(--primary-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <History size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', margin: 0 }}>Transaction History & Ledger</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Showing {filteredTransactions.length} of {transactions.length} total records.
              </p>
            </div>
          </div>

          <button onClick={handleExportExcel} className="btn btn-secondary btn-sm" style={{ width: 'auto' }}>
            <Download size={15} />
            <span>Export to Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Analytical Slicer Bar & Search */}
      <SlicerBar
        groups={historySlicerGroups}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search notes, category, account, particulars..."
        totalCount={transactions.length}
        filteredCount={filteredTransactions.length}
        defaultCollapsed={true}
        onResetAll={() => {
          setSearchTerm('');
          setAccountFilter('ALL');
          setTypeFilter('ALL');
          setCategoryFilter('ALL');
          setDatePreset('ALL');
          setCustomDate('');
        }}
        title="Audit History Slicers"
        extraActions={
          datePreset === 'CUSTOM' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="form-control"
              style={{ width: 'auto', fontSize: '0.78125rem', height: '32px', padding: '0.2rem 0.5rem' }}
              title="Pick specific date"
            />
          )
        }
      />

      {/* Data Table with Pagination */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div className="table-responsive">
          <table className="custom-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th {...getSortHeaderProps('date')}>Date {renderSortIndicator('date')}</th>
                <th {...getSortHeaderProps('account_no')}>Account {renderSortIndicator('account_no')}</th>
                <th {...getSortHeaderProps('category')}>Category {renderSortIndicator('category')}</th>
                <th {...getSortHeaderProps('type')}>Type {renderSortIndicator('type')}</th>
                <th {...getSortHeaderProps('amount')}>Amount {renderSortIndicator('amount')}</th>
                <th {...getSortHeaderProps('particulars')}>Particulars / Notes {renderSortIndicator('particulars')}</th>
                <th style={{ textAlign: 'center', width: '90px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((tx, idx) => {
                  const rowNum = (currentPage - 1) * (pageSize === 'ALL' ? filteredTransactions.length : Number(pageSize)) + idx + 1;
                  return (
                    <tr key={tx.id || idx}>
                      <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{rowNum}</td>
                      <td style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>{tx.date || tx.tran_date}</td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: '0.71875rem', fontWeight: '700' }}>
                          <Landmark size={11} style={{ marginRight: '4px' }} />
                          {tx.accountNo || tx.account_no || 'Cash_1'}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {tx.categoryName || tx.subcategory || tx.category || 'General'}
                      </td>
                      <td>
                        <span className={tx.type === 'Cr' ? 'badge badge-cr' : 'badge badge-dr'}>
                          {tx.type}
                        </span>
                      </td>
                      <td style={{
                        fontWeight: '700',
                        whiteSpace: 'nowrap',
                        color: tx.type === 'Cr' ? 'var(--accent-cr)' : 'var(--text-primary)'
                      }}>
                        {tx.type === 'Cr' ? '+' : '-'}{formatCurrency(tx.amount || tx.credit || tx.debit || 0)}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{tx.particulars || tx.notes || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem' }}>
                          <button
                            onClick={() => handleOpenEdit(tx)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0.25rem' }}
                            title="Edit Record"
                          >
                            <Edit2 size={15} />
                          </button>

                          {deleteConfirmId === tx.id ? (
                            <div style={{ display: 'flex', gap: '2px' }}>
                              <button
                                onClick={() => {
                                  onDeleteTransaction(tx.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="btn btn-sm"
                                style={{ background: 'var(--accent-dr)', color: '#fff', padding: '0.15rem 0.4rem', fontSize: '0.6875rem' }}
                              >
                                Del
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
                              style={{ color: 'var(--accent-dr)', padding: '0.25rem' }}
                              title="Delete Record"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No transactions match your active search filters or slicers.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* DataTable Pagination Bar */}
        <PaginationComponent itemLabel="transactions" pageSizeOptions={[15, 25, 50, 100, 'ALL']} />
      </div>

      {/* Edit Modal */}
      {editingTx && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Edit Transaction Record</h3>
            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  value={editingTx.categoryId}
                  onChange={(e) => {
                    const cat = categories.find((c) => String(c.id) === String(e.target.value));
                    if (cat) {
                      setEditingTx({
                        ...editingTx,
                        categoryId: cat.id,
                        categoryName: cat.name,
                        type: cat.type,
                      });
                    }
                  }}
                  className="form-control"
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
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingTx.amount}
                    onChange={(e) => setEditingTx({ ...editingTx, amount: parseFloat(e.target.value) || 0 })}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date (Future dates blocked)</label>
                  <input
                    type="date"
                    max={todayStr}
                    value={editingTx.date}
                    onChange={(e) => setEditingTx({ ...editingTx, date: e.target.value > todayStr ? todayStr : e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <input
                  type="text"
                  value={editingTx.notes}
                  onChange={(e) => setEditingTx({ ...editingTx, notes: e.target.value })}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditingTx(null)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <AlertTriangle size={32} color="var(--accent-dr)" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Delete Transaction?</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Are you sure you want to permanently remove this transaction entry from local storage?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  onDeleteTransaction(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="btn btn-danger"
                style={{ flex: 1 }}
              >
                Yes, Delete
              </button>
              <button onClick={() => setDeleteConfirmId(null)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
