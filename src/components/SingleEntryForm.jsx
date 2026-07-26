import React, { useState, useEffect } from 'react';
import { PlusCircle, Calendar, Tag, DollarSign, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { getTodayString } from '../utils/storage';

export default function SingleEntryForm({ categories, onAddTransaction, onNavigate }) {
  const todayStr = getTodayString();

  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [type, setType] = useState('Dr');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayStr);
  const [notes, setNotes] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-select first category on load
  useEffect(() => {
    if (categories && categories.length > 0 && !categoryId) {
      const firstCat = categories[0];
      setCategoryId(firstCat.id);
      setCategoryName(firstCat.name);
      setType(firstCat.type);
    }
  }, [categories, categoryId]);

  // Handle Category selection & Auto-assign Type
  const handleCategoryChange = (e) => {
    const selectedId = e.target.value;
    setCategoryId(selectedId);
    const catObj = categories.find((c) => c.id === selectedId);
    if (catObj) {
      setCategoryName(catObj.name);
      setType(catObj.type); // Auto-assigned Cr/Dr
    }
  };

  // Date Change with Validation
  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    if (selectedDate > todayStr) {
      setErrorMsg('Future dates are strictly blocked. Date reset to Today.');
      setDate(todayStr);
    } else {
      setErrorMsg('');
      setDate(selectedDate);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validation
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }

    if (date > todayStr) {
      setErrorMsg('Future dates are strictly blocked. Please select today or a past date.');
      return;
    }

    const newTx = {
      date,
      categoryId,
      categoryName,
      type,
      amount: parsedAmount,
      notes: notes.trim(),
    };

    onAddTransaction(newTx);

    setSuccessMsg(`Successfully added ${type === 'Cr' ? 'Credit' : 'Debit'} entry of ₹${parsedAmount}`);
    setAmount('');
    setNotes('');

    // Clear message after 3 seconds
    setTimeout(() => {
      setSuccessMsg('');
    }, 3000);
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="glass-card">
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
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
            <PlusCircle size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Single Transaction Entry</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
              Add a single income (Cr) or expense (Dr) entry to your ledger.
            </p>
          </div>
        </div>

        {/* Feedback Notifications */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: 'var(--accent-dr-bg)',
            border: '1px solid var(--accent-dr-border)',
            color: 'var(--accent-dr)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: 'var(--accent-cr-bg)',
            border: '1px solid var(--accent-cr-border)',
            color: 'var(--accent-cr)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem'
          }}>
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          
          {/* Category Dropdown & Auto-Assigned Type */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Tag size={15} />
              <span>Select Category</span>
            </label>
            <select
              value={categoryId}
              onChange={handleCategoryChange}
              className="form-control"
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type === 'Cr' ? 'Credit / Income' : 'Debit / Expense'})
                </option>
              ))}
            </select>
          </div>

          {/* Auto-assigned Type Display Badge */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Auto-Assigned Type</label>
            <div>
              <span className={type === 'Cr' ? 'badge badge-cr' : 'badge badge-dr'} style={{ fontSize: '0.875rem', padding: '0.375rem 0.875rem' }}>
                {type === 'Cr' ? 'Credit (Cr) - Income' : 'Debit (Dr) - Expense'}
              </span>
            </div>
          </div>

          {/* Amount & Date Picker Grid */}
          <div className="grid-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <DollarSign size={15} />
                <span>Amount (₹)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 1500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Calendar size={15} />
                <span>Date (Future dates blocked)</span>
              </label>
              <input
                type="date"
                max={todayStr} // Blocks future dates in native HTML datepicker calendar
                value={date}
                onChange={handleDateChange}
                className="form-control"
                required
              />
            </div>
          </div>

          {/* Notes Field */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <FileText size={15} />
              <span>Notes / Description (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly grocery list payment"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-control"
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="submit"
              className={type === 'Cr' ? 'btn btn-success' : 'btn btn-danger'}
              style={{ flex: 1, padding: '0.75rem' }}
            >
              <PlusCircle size={18} />
              <span>Add Record</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
