import React, { useState } from 'react';
import { Tags, Plus, Trash2, Download, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { exportCategoriesToExcel, parseCategoriesExcel } from '../utils/excel';

export default function CategoryManager({
  categories,
  onAddCategory,
  onDeleteCategory,
  onBulkAddCategories,
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Dr');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Category name cannot be empty.');
      return;
    }

    // Check duplicate
    const exists = categories.some(
      (c) => c.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (exists) {
      setError(`A category named "${name.trim()}" already exists.`);
      return;
    }

    onAddCategory({ name: name.trim(), type });
    setSuccess(`Added category "${name.trim()}" (${type})`);
    setName('');

    setTimeout(() => setSuccess(''), 3000);
  };

  const handleExportExcel = () => {
    exportCategoriesToExcel(categories);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const parsedCats = await parseCategoriesExcel(file);
      if (parsedCats.length === 0) {
        setError('No valid categories found in uploaded Excel file.');
        return;
      }

      onBulkAddCategories(parsedCats);
      setSuccess(`Imported ${parsedCats.length} categories from Excel file!`);
      e.target.value = '';
    } catch (err) {
      setError(`Failed to import categories: ${err.message}`);
    }
  };

  const crCategories = categories.filter((c) => c.type === 'Cr');
  const drCategories = categories.filter((c) => c.type === 'Dr');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Banner */}
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
              <Tags size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Category & Type Management</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                Configure custom income (Cr) and expense (Dr) category classifications.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              <Upload size={16} />
              <span>Import Excel</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
            <button onClick={handleExportExcel} className="btn btn-secondary btn-sm">
              <Download size={16} />
              <span>Export Categories (.xlsx)</span>
            </button>
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

      {/* Add New Category Form */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Add New Category</h3>
        <form onSubmit={handleAddSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '200px', margin: 0 }}>
            <label className="form-label">Category Name</label>
            <input
              type="text"
              placeholder="e.g. Dividend Returns, Grocery..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="form-group" style={{ width: '180px', margin: 0 }}>
            <label className="form-label">Type (Cr / Dr)</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="form-control"
            >
              <option value="Cr">Credit (Cr) - Income</option>
              <option value="Dr">Debit (Dr) - Expense</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            <Plus size={18} />
            <span>Add Category</span>
          </button>
        </form>
      </div>

      {/* Category List Grid (Credit vs Debit) */}
      <div className="grid-2">
        {/* Credit Categories List */}
        <div className="glass-card" style={{ borderTop: '4px solid var(--accent-cr)' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Credit Categories (Cr)</span>
            <span className="badge badge-cr">{crCategories.length}</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {crCategories.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.625rem 0.875rem',
                  background: 'var(--bg-input)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <span style={{ fontWeight: '500' }}>{c.name}</span>
                <button
                  onClick={() => onDeleteCategory(c.id)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--accent-dr)', padding: '0.25rem' }}
                  title="Delete Category"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Debit Categories List */}
        <div className="glass-card" style={{ borderTop: '4px solid var(--accent-dr)' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Debit Categories (Dr)</span>
            <span className="badge badge-dr">{drCategories.length}</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {drCategories.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.625rem 0.875rem',
                  background: 'var(--bg-input)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <span style={{ fontWeight: '500' }}>{c.name}</span>
                <button
                  onClick={() => onDeleteCategory(c.id)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--accent-dr)', padding: '0.25rem' }}
                  title="Delete Category"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
