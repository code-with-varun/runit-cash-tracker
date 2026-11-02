import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  TableProperties,
  Tags,
  History,
  Banknote,
  Database,
  ArrowRight
} from 'lucide-react';
import Dashboard from './Dashboard';
import SingleEntryForm from './SingleEntryForm';
import BulkEntryGrid from './BulkEntryGrid';
import CategoryManager from './CategoryManager';
import TransactionHistory from './TransactionHistory';

export default function CashLedgerWorkspace({
  activeSubTab = 'cash-dashboard',
  onNavigateSubTab,
  transactions = [],
  categories = [],
  onAddTransaction,
  onAddBulkTransactions,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddCategory,
  onDeleteCategory,
  onBulkAddCategories
}) {
  const tabs = [
    { id: 'cash-dashboard', label: 'Cash Overview', icon: LayoutDashboard },
    { id: 'cash-bulk-entry', label: 'Transaction Entry', icon: TableProperties },
    { id: 'cash-categories', label: 'Category Master', icon: Tags },
    { id: 'cash-history', label: 'Audit History', icon: History },
  ];

  const handleInnerNavigate = (key) => {
    switch (key) {
      case 'single-entry':
      case 'bulk-entry': onNavigateSubTab('cash-bulk-entry'); break;
      case 'history': onNavigateSubTab('cash-history'); break;
      case 'categories': onNavigateSubTab('cash-categories'); break;
      default: onNavigateSubTab('cash-dashboard');
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.25rem 1.75rem 2rem' }}>
      
      {/* Subtab Navigation Pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.875rem',
        marginBottom: '1.5rem',
        padding: '0.75rem 1rem',
        borderRadius: '12px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)'
      }}>
        {/* Navigation tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigateSubTab(tab.id)}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  borderRadius: '8px',
                  background: isActive ? 'var(--primary-brand)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.8125rem',
                  padding: '0.45rem 0.85rem'
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live sync badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cr)', display: 'inline-block' }} />
          <span>Ledger <strong>Cash_1</strong> • MySQL DB Active</span>
        </div>
      </div>

      {/* Workspace Content */}
      <div className="cash-workspace-body">
        {activeSubTab === 'cash-dashboard' && (
          <Dashboard
            transactions={transactions}
            categories={categories}
            onNavigate={handleInnerNavigate}
          />
        )}

        {(activeSubTab === 'cash-bulk-entry' || activeSubTab === 'cash-single-entry') && (
          <BulkEntryGrid
            categories={categories}
            activeAccount="Cash_1"
            transactions={transactions}
            onAddBulkTransactions={onAddBulkTransactions}
            onDeleteTransaction={onDeleteTransaction}
            onNavigate={handleInnerNavigate}
          />
        )}

        {activeSubTab === 'cash-categories' && (
          <CategoryManager
            categories={categories}
            onAddCategory={onAddCategory}
            onDeleteCategory={onDeleteCategory}
            onBulkAddCategories={onBulkAddCategories}
          />
        )}

        {activeSubTab === 'cash-history' && (
          <TransactionHistory
            transactions={transactions}
            categories={categories}
            onUpdateTransaction={onUpdateTransaction}
            onDeleteTransaction={onDeleteTransaction}
          />
        )}
      </div>

    </div>
  );
}
