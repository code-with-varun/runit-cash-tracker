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

  const crCategories = categories ? categories.filter((c) => c.type === 'Cr') : [];
  const drCategories = categories ? categories.filter((c) => c.type === 'Dr') : [];

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
    <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
      <div className="glass-card">
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.875rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'var(--primary-brand-bg)',
            color: 'var(--primary-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <PlusCircle size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', margin: 0 }}>Single Transaction Entry</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
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
            padding: '0.625rem 0.875rem',
            borderRadius: '8px',
            background: 'var(--accent-dr-bg)',
            border: '1px solid var(--accent-dr-border)',
            color: 'var(--accent-dr)',
            fontSize: '0.8125rem',
            marginBottom: '1rem'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 0.875rem',
            borderRadius: '8px',
            background: 'var(--accent-cr-bg)',
            border: '1px solid var(--accent-cr-border)',
            color: 'var(--accent-cr)',
            fontSize: '0.8125rem',
            marginBottom: '1rem'
          }}>
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          
          {/* Category Dropdown & Auto-Assigned Type */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Tag size={14} />
              <span>Select Category</span>
            </label>
            <select
              value={categoryId}
              onChange={handleCategoryChange}
              className="form-control"
              required
            >
              {crCategories.length > 0 && (
                <optgroup label="🟢 Credit (Income)">
                  {crCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {drCategories.length > 0 && (
                <optgroup label="🔴 Debit (Expense)">
                  {drCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Auto-assigned Type Display Badge */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Auto-Assigned Type</label>
            <div>
              <span className={type === 'Cr' ? 'badge badge-cr' : 'badge badge-dr'} style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}>
                {type === 'Cr' ? 'Credit (Cr) - Income' : 'Debit (Dr) - Expense'}
              </span>
            </div>
          </div>

          {/* Amount & Date Picker Grid */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <DollarSign size={14} />
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
                <Calendar size={14} />
                <span>Date (Future dates blocked)</span>
              </label>
              <input
                type="date"
                max={todayStr}
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
              <FileText size={14} />
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
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className={type === 'Cr' ? 'btn btn-success' : 'btn btn-danger'}
              style={{ flex: 1, padding: '0.625rem 1rem' }}
            >
              <PlusCircle size={17} />
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
