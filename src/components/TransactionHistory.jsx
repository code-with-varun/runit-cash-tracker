import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  Calendar,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { exportTransactionsToExcel } from '../utils/excel';
import { getTodayString } from '../utils/storage';

export default function TransactionHistory({
  transactions,
  categories,
  onUpdateTransaction,
  onDeleteTransaction,
}) {
  const todayStr = getTodayString();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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
  const filteredTransactions = transactions.filter((tx) => {
    // Search term matching notes or category name
    const matchSearch =
      searchTerm === '' ||
      (tx.notes && tx.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.categoryName && tx.categoryName.toLowerCase().includes(searchTerm.toLowerCase()));

    // Type filter
    const matchType = typeFilter === 'All' || tx.type === typeFilter;

    // Category filter
    const matchCat = categoryFilter === 'All' || tx.categoryId === categoryFilter;

    // Date range filter
    const matchFrom = !fromDate || tx.date >= fromDate;
    const matchTo = !toDate || tx.date <= toDate;

    return matchSearch && matchType && matchCat && matchFrom && matchTo;
  });

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header & Export Banner */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--primary-brand-bg)',
              color: 'var(--primary-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <History size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Transaction History & Ledger</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                Showing {filteredTransactions.length} of {transactions.length} total records.
              </p>
            </div>
          </div>

          <button onClick={handleExportExcel} className="btn btn-secondary btn-sm">
            <Download size={16} />
            <span>Export to Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          
          {/* Search Box */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Search size={14} />
              <span>Search Notes / Cat</span>
            </label>
            <input
              type="text"
              placeholder="Filter by keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}
            />
          </div>

          {/* Type Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Type (Cr / Dr)</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-control"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}
            >
              <option value="All">All Types</option>
              <option value="Cr">Credit (Cr) Only</option>
              <option value="Dr">Debit (Dr) Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-control"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">From Date</label>
            <input
              type="date"
              max={todayStr}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="form-control"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}
            />
          </div>

          {/* Date To */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">To Date</label>
            <input
              type="date"
              max={todayStr}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="form-control"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}
            />
          </div>

        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card" style={{ padding: '1rem' }}>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Notes</th>
                <th style={{ textAlign: 'center', width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ fontWeight: '500' }}>{tx.date}</td>
                    <td>{tx.categoryName}</td>
                    <td>
                      <span className={tx.type === 'Cr' ? 'badge badge-cr' : 'badge badge-dr'}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{
                      fontWeight: '700',
                      color: tx.type === 'Cr' ? 'var(--accent-cr)' : 'var(--text-primary)'
                    }}>
                      {tx.type === 'Cr' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{tx.notes || '—'}</td>
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

                        <button
                          onClick={() => setDeleteConfirmId(tx.id)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--accent-dr)', padding: '0.25rem' }}
                          title="Delete Record"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No transactions match your active search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTx && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Edit Transaction Record</h3>
            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  value={editingTx.categoryId}
                  onChange={(e) => {
                    const cat = categories.find((c) => c.id === e.target.value);
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
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
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

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
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
            <AlertTriangle size={36} color="var(--accent-dr)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Delete Transaction?</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
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
