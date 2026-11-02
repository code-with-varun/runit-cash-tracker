import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { resetDataAPI } from '../utils/api';
import { resetToEmptyData } from '../utils/storage';

export default function SystemResetModal({
  isOpen,
  onClose,
  currentUser,
  onResetSuccess
}) {
  if (!isOpen) return null;

  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExecuteReset = async () => {
    setLoading(true);
    setError('');
    try {
      await resetDataAPI();
      resetToEmptyData();
      if (onResetSuccess) {
        onResetSuccess();
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to execute system reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
      padding: '1rem'
    }}>
      <div className="modal-content glass-card" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '1.75rem',
        borderRadius: '16px',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        background: 'var(--bg-card-solid)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RotateCcw size={20} color="#ef4444" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                Per-User System Reset
              </h3>
              <span style={{ fontSize: '0.71875rem', color: '#ef4444', fontWeight: '600' }}>
                Reset workspace to clean empty slate
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.25rem', borderRadius: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Warning Callout */}
        <div style={{
          padding: '1rem',
          borderRadius: '10px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
              This operation executes a complete clean wipe <strong>strictly for user "{currentUser?.username || 'current'}"</strong>:
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem', color: 'var(--text-secondary)' }}>
                <li>All transaction entries and bank ledger records cleared.</li>
                <li>Accounts reset to default <code>Cash_1</code> with <strong>₹0.00</strong> balance.</li>
                <li>Budgets, AP/AR, Loans, Stocks, and Career P&L reset to <strong>₹0.00</strong>.</li>
                <li>Clean empty workspace ready for importing real data.</li>
                <li>Your user credentials and login remain intact.</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            fontSize: '0.8125rem',
            marginBottom: '1rem',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8125rem' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecuteReset}
            disabled={loading}
            className="btn btn-sm"
            style={{
              padding: '0.5rem 1.15rem',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}
          >
            <RotateCcw size={15} />
            <span>{loading ? 'Wiping Workspace...' : 'Confirm System Reset'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
