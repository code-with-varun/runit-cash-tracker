import React, { useState } from 'react';
import { Settings, Download, Upload, RefreshCw, X, CheckCircle2, AlertCircle, User, Database } from 'lucide-react';
import { exportFullDataJSON, importFullDataJSON, resetToSampleData, getCurrentUser } from '../utils/storage';
import { resetDataAPI } from '../utils/api';

export default function SettingsModal({
  isOpen,
  onClose,
  onDataReset,
}) {
  if (!isOpen) return null;

  const currentUser = getCurrentUser();
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleDownloadJSON = () => {
    const jsonStr = exportFullDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MoneyMatrix_Backup_${currentUser?.username || 'user'}_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMsg('Full JSON backup downloaded.');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleRestoreJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = importFullDataJSON(event.target.result);
      if (res.success) {
        setMsg('Successfully restored data from JSON backup file!');
        onDataReset();
        setTimeout(() => setMsg(''), 3000);
      } else {
        setError(`Failed to restore: ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  const handleResetSample = async () => {
    if (window.confirm('Reset all categories and transactions for your account in MySQL database?')) {
      try {
        await resetDataAPI();
        resetToSampleData();
        onDataReset();
        setMsg('Reset to sample dataset completed in MySQL database.');
        setTimeout(() => setMsg(''), 3000);
      } catch (err) {
        setError('Failed to reset MySQL dataset.');
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} color="var(--primary-brand)" />
            <span>Settings & Data Backup</span>
          </h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '0.25rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Notifications */}
        {msg && (
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
            <CheckCircle2 size={16} />
            <span>{msg}</span>
          </div>
        )}

        {error && (
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
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Active Account Information */}
        {currentUser && (
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.9375rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <User size={16} color="var(--primary-brand)" />
              <span>Active Account</span>
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: '0 0 0.25rem 0', fontWeight: '600' }}>
              {currentUser.name} <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>({currentUser.username})</span>
            </p>
            <p style={{ fontSize: '0.78125rem', color: 'var(--accent-cr)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: '500' }}>
              <Database size={14} />
              <span>Connected to MySQL Database (<code>money_matrix_db</code>)</span>
            </p>
          </div>
        )}

        {/* Section 2: JSON Data Backup & Restore */}
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.9375rem', marginBottom: '0.5rem' }}>Full Data Backup & Restore (JSON)</h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Export all categories and transaction history into a JSON file, or restore from a backup.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={handleDownloadJSON} className="btn btn-secondary btn-sm">
              <Download size={16} />
              <span>Download JSON Backup</span>
            </button>

            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              <Upload size={16} />
              <span>Restore JSON Backup</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreJSON}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {/* Section 3: Reset Sample Data */}
        <div>
          <h4 style={{ fontSize: '0.9375rem', marginBottom: '0.5rem' }}>Reset Sample Dataset</h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Reset your account's storage to pre-populated default categories and sample transactions.
          </p>
          <button onClick={handleResetSample} className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-dr)' }}>
            <RefreshCw size={15} />
            <span>Reset to Sample Data</span>
          </button>
        </div>

      </div>
    </div>
  );
}

