import React, { useState } from 'react';
import { TableProperties, Plus, Trash2, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { getTodayString } from '../utils/storage';
import { parseTransactionsExcel } from '../utils/excel';

export default function BulkEntryGrid({ categories, onAddBulkTransactions, onNavigate }) {
  const todayStr = getTodayString();

  const createBlankRow = () => {
    const firstCat = categories && categories.length > 0 ? categories[0] : { id: 'cat_general', name: 'General', type: 'Dr' };
    return {
      id: Date.now() + Math.random(),
      date: todayStr,
      categoryId: firstCat.id,
      categoryName: firstCat.name,
      type: firstCat.type,
      amount: '',
      notes: '',
    };
  };

  const [rows, setRows] = useState([createBlankRow(), createBlankRow(), createBlankRow()]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddRow = () => {
    setRows([...rows, createBlankRow()]);
  };

  const handleRemoveRow = (index) => {
    if (rows.length === 1) {
      setError('At least one row must remain in the grid.');
      return;
    }
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated);
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...rows];
    const targetRow = { ...updated[index] };

    if (field === 'categoryId') {
      const selectedCat = categories.find((c) => c.id === value);
      if (selectedCat) {
        targetRow.categoryId = selectedCat.id;
        targetRow.categoryName = selectedCat.name;
        targetRow.type = selectedCat.type; // Auto-assign Cr/Dr
      }
    } else if (field === 'date') {
      if (value > todayStr) {
        setError('Future dates are strictly blocked. Reset to Today.');
        targetRow.date = todayStr;
      } else {
        setError('');
        targetRow.date = value;
      }
    } else {
      targetRow[field] = value;
    }

    updated[index] = targetRow;
    setRows(updated);
  };

  const handleSubmitBulk = () => {
    setError('');
    setSuccess('');

    // Validation
    const validRows = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const parsedAmount = parseFloat(r.amount);

      // Skip completely empty rows
      if (!r.amount && !r.notes) continue;

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setError(`Row #${i + 1}: Amount must be a positive number.`);
        return;
      }

      if (r.date > todayStr) {
        setError(`Row #${i + 1}: Future date strictly blocked.`);
        return;
      }

      validRows.push({
        date: r.date,
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        type: r.type,
        amount: parsedAmount,
        notes: r.notes.trim(),
      });
    }

    if (validRows.length === 0) {
      setError('Please fill in at least one transaction row with a valid amount.');
      return;
    }

    onAddBulkTransactions(validRows);
    setSuccess(`Successfully imported ${validRows.length} transactions into storage!`);
    setRows([createBlankRow(), createBlankRow(), createBlankRow()]);

    setTimeout(() => {
      setSuccess('');
    }, 4000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const parsed = await parseTransactionsExcel(file, categories);
      if (parsed.length === 0) {
        setError('No valid transactions found in uploaded file.');
        return;
      }
      onAddBulkTransactions(parsed);
      setSuccess(`Successfully imported ${parsed.length} transactions from Excel file!`);
      e.target.value = '';
    } catch (err) {
      setError(`Failed to parse Excel file: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner */}
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
              <TableProperties size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Bulk Transaction Entry Grid</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                Interactive multi-line entry grid & Excel (.xlsx / .csv) file import.
              </p>
            </div>
          </div>

          {/* Excel File Upload Button */}
          <div>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              <Upload size={16} />
              <span>Import Excel / CSV</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: 'var(--accent-dr-bg)',
          border: '1px solid var(--accent-dr-border)',
          color: 'var(--accent-dr)',
          fontSize: '0.875rem'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: 'var(--accent-cr-bg)',
          border: '1px solid var(--accent-cr-border)',
          color: 'var(--accent-cr)',
          fontSize: '0.875rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Interactive Spreadsheet Table Grid */}
      <div className="glass-card" style={{ padding: '1rem' }}>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th style={{ minWidth: '140px' }}>Date</th>
                <th style={{ minWidth: '180px' }}>Category</th>
                <th style={{ minWidth: '100px' }}>Type</th>
                <th style={{ minWidth: '140px' }}>Amount (₹)</th>
                <th style={{ minWidth: '200px' }}>Notes</th>
                <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{idx + 1}</td>
                  
                  {/* Date Input */}
                  <td>
                    <input
                      type="date"
                      max={todayStr}
                      value={row.date}
                      onChange={(e) => handleRowChange(idx, 'date', e.target.value)}
                      className="form-control"
                      style={{ padding: '0.375rem 0.625rem', fontSize: '0.8125rem' }}
                    />
                  </td>

                  {/* Category Dropdown */}
                  <td>
                    <select
                      value={row.categoryId}
                      onChange={(e) => handleRowChange(idx, 'categoryId', e.target.value)}
                      className="form-control"
                      style={{ padding: '0.375rem 0.625rem', fontSize: '0.8125rem' }}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Type Badge */}
                  <td>
                    <span className={row.type === 'Cr' ? 'badge badge-cr' : 'badge badge-dr'}>
                      {row.type}
                    </span>
                  </td>

                  {/* Amount Input */}
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={row.amount}
                      onChange={(e) => handleRowChange(idx, 'amount', e.target.value)}
                      className="form-control"
                      style={{ padding: '0.375rem 0.625rem', fontSize: '0.8125rem', fontWeight: '600' }}
                    />
                  </td>

                  {/* Notes Input */}
                  <td>
                    <input
                      type="text"
                      placeholder="Notes..."
                      value={row.notes}
                      onChange={(e) => handleRowChange(idx, 'notes', e.target.value)}
                      className="form-control"
                      style={{ padding: '0.375rem 0.625rem', fontSize: '0.8125rem' }}
                    />
                  </td>

                  {/* Remove Button */}
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleRemoveRow(idx)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--accent-dr)', padding: '0.25rem' }}
                      title="Remove Row"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button onClick={handleAddRow} className="btn btn-secondary btn-sm">
            <Plus size={16} />
            <span>Add Row</span>
          </button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => onNavigate('dashboard')} className="btn btn-ghost">
              Cancel
            </button>
            <button onClick={handleSubmitBulk} className="btn btn-primary">
              <FileSpreadsheet size={16} />
              <span>Submit Bulk Import</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
