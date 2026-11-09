import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import ExecutiveDashboardView from './components/ExecutiveDashboardView';
import OneViewCardsDeck from './components/OneViewCardsDeck';
import AccountManagerView from './components/AccountManagerView';
import MasterTransactionsView from './components/MasterTransactionsView';
import TransactionValidationView from './components/TransactionValidationView';
import NetWorthView from './components/NetWorthView';
import BudgetActualView from './components/BudgetActualView';
import PayablesReceivablesView from './components/PayablesReceivablesView';
import PortfolioLedgerView from './components/PortfolioLedgerView';
import CareerPnlView from './components/CareerPnlView';
import ExecutiveReportsView from './components/ExecutiveReportsView';
import SingleEntryForm from './components/SingleEntryForm';
import BulkEntryGrid from './components/BulkEntryGrid';
import CategoryManager from './components/CategoryManager';
import TransactionHistory from './components/TransactionHistory';
import SuperAdminView from './components/SuperAdminView';
import MobileBottomNav from './components/MobileBottomNav';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';
import SystemResetModal from './components/SystemResetModal';
import LandingPage from './components/LandingPage';
import { Tags, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

import {
  getCategoriesAPI,
  addCategoryAPI,
  updateCategoryAPI,
  deleteCategoryAPI,
  bulkAddCategoriesAPI,
  getTransactionsAPI,
  addTransactionAPI,
  addBulkTransactionsAPI,
  updateTransactionAPI,
  deleteTransactionAPI,
  getAccountsAPI,
  getMastersAPI,
} from './utils/api';

import { getCurrentUser, logoutUser } from './utils/storage';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('moneymatrix_theme') || localStorage.getItem('cashtracker_theme') || 'dark';
  });

  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [currentView, setCurrentView] = useState(() => currentUser ? 'app' : 'landing'); // 'landing' | 'app'
  const [authModalState, setAuthModalState] = useState({ isOpen: false, mode: 'login' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeAccount, setActiveAccount] = useState('Cash_1');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.innerWidth < 1024);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [masters, setMasters] = useState({ budgets: [], cost_centers: [], profit_centers: [], projects: [] });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Sync Theme with HTML attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('moneymatrix_theme', theme);
  }, [theme]);

  // Redirect deprecated excel-import tab to bulk-entry
  useEffect(() => {
    if (activeTab === 'excel-import') {
      setActiveTab('bulk-entry');
    }
  }, [activeTab]);

  // Load Data on Mount or when currentUser changes
  useEffect(() => {
    if (currentUser) {
      refreshData();
      if (currentUser.role === 'superadmin' && activeTab === 'dashboard') {
        setActiveTab('superadmin');
      }
    }
  }, [currentUser]);

  const refreshData = async () => {
    try {
      const [fetchedCats, fetchedTxs, fetchedAccs, fetchedMasters] = await Promise.all([
        getCategoriesAPI().catch(() => []),
        getTransactionsAPI().catch(() => []),
        getAccountsAPI().catch(() => []),
        getMastersAPI().catch(() => ({ budgets: [], cost_centers: [], profit_centers: [], projects: [] }))
      ]);
      setCategories(fetchedCats || []);
      setTransactions(fetchedTxs || []);
      setAccounts(fetchedAccs || []);
      if (fetchedMasters) {
        setMasters({
          budgets: fetchedMasters.budgets || [],
          cost_centers: fetchedMasters.cost_centers || [],
          profit_centers: fetchedMasters.profit_centers || [],
          projects: fetchedMasters.projects || []
        });
      }
    } catch (err) {
      console.error('Error refreshing data from API:', err);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Auth Operations
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setAuthModalState({ isOpen: false, mode: 'login' });
    setCurrentView('app');
    if (user.role === 'superadmin') {
      setActiveTab('superadmin');
    } else {
      setActiveTab('dashboard');
    }
    refreshData();
  };

  
  const handleExportCompleteExcel = async () => {
    try {
      const filename = await exportCompleteMasterExcel({
        currentUser,
        transactions,
        accounts,
        categories,
        masters
      });
      alert(`🎉 Complete Excel Backup generated and downloaded successfully!\n\nFile: ${filename}\n\nAll database tables and masters (User Profile, 36-Column Ledger, Accounts, Taxonomy, Budgets, Cost Centers, Profit Centers, Projects) have been exported into separate sheets.`);
    } catch (err) {
      console.error('Complete export error:', err);
      alert('Failed to generate complete backup: ' + err.message);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setCategories([]);
    setTransactions([]);
    setAccounts([]);
    setCurrentView('landing');
  };

  // Category Operations
  const handleAddCategory = async (cat) => {
    await addCategoryAPI(cat);
    refreshData();
  };

  const handleDeleteCategory = async (id) => {
    await deleteCategoryAPI(id);
    refreshData();
  };

  const handleUpdateCategory = async (cat) => {
    await updateCategoryAPI(cat);
    refreshData();
  };

  const handleBulkAddCategories = async (newCats) => {
    await bulkAddCategoriesAPI(newCats);
    refreshData();
  };

  // Transaction Operations
  const handleAddTransaction = async (tx) => {
    await addTransactionAPI(tx);
    refreshData();
  };

  const handleAddBulkTransactions = async (txList) => {
    await addBulkTransactionsAPI(txList);
    refreshData();
  };

  const handleUpdateTransaction = async (tx) => {
    await updateTransactionAPI(tx);
    refreshData();
  };

  const handleDeleteTransaction = async (id) => {
    await deleteTransactionAPI(id);
    refreshData();
  };

  // Calculate liquid cash balance from active MySQL transactions
  const totalIncome = transactions.filter(t => t.type === 'Cr').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'Dr').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const cashBalance = totalIncome - totalExpense;

  // View: Landing Page (Pre-login or when triggered via Overview)
  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          onOpenAuth={(mode = 'login') => setAuthModalState({ isOpen: true, mode })}
          onEnterApp={() => {
            if (currentUser) {
              setCurrentView('app');
            } else {
              setAuthModalState({ isOpen: true, mode: 'login' });
            }
          }}
          currentUser={currentUser}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        {authModalState.isOpen && (
          <AuthModal
            initialMode={authModalState.mode}
            onAuthSuccess={handleAuthSuccess}
            onClose={() => setAuthModalState({ isOpen: false, mode: 'login' })}
          />
        )}
      </>
    );
  }

  // View: Main Personal Finance ERP Workspace
  return (
    <div className="moneymatrix-workspace">
      
      {/* Fallback AuthModal if session invalid */}
      {!currentUser && (
        <AuthModal
          initialMode="login"
          onAuthSuccess={handleAuthSuccess}
          onClose={() => setCurrentView('landing')}
        />
      )}

      {/* Enterprise Side Navigation Bar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenReset={() => setIsResetModalOpen(true)}
        currentUser={currentUser}
        onViewLanding={() => setCurrentView('landing')}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        accounts={accounts}
        activeAccount={activeAccount}
        setActiveAccount={setActiveAccount}
        onExportCompleteExcel={handleExportCompleteExcel}
      />

      {/* Right Main Working Area */}
      <div className="moneymatrix-main-area">
        
        {/* Top Header Cockpit (Pinned at top) */}
        <TopHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeAccount={activeAccount}
          setActiveAccount={setActiveAccount}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          cashBalance={cashBalance}
          transactionsCount={transactions.length}
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenReset={() => setIsResetModalOpen(true)}
          currentUser={currentUser}
          onLogout={handleLogout}
          onExportCompleteExcel={handleExportCompleteExcel}
        />

        {/* Dynamic ERP Module View (Smooth Independent Scroll) */}
        <main className="moneymatrix-main-content">

          {activeTab === 'superadmin' && (
            <SuperAdminView currentUser={currentUser} />
          )}

          {activeTab === 'dashboard' && (
            <ExecutiveDashboardView
              cashBalance={cashBalance}
              cashTransactions={transactions}
              accounts={accounts}
              categories={categories}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'one-view' && (
            <OneViewCardsDeck
              accounts={accounts}
              currentUser={currentUser}
              onNavigateToAccount={(accCode) => {
                setActiveAccount(accCode);
                setActiveTab('bulk-entry');
              }}
              onNavigateToEntry={(accCode) => {
                setActiveAccount(accCode);
                setActiveTab('bulk-entry');
              }}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountManagerView
              accounts={accounts}
              categories={categories}
              cashBalance={cashBalance}
              cashTransactionsCount={transactions.length}
              onNavigateToCash={() => {
                setActiveAccount('Cash_1');
                setActiveTab('cash-tracker');
              }}
              onReloadAccounts={refreshData}
              onReloadTransactions={refreshData}
              onSelectAccount={(accCode) => {
                setActiveAccount(accCode);
              }}
              onNavigateToMasterAudit={(accCode) => {
                setActiveAccount(accCode);
                setActiveTab('all-transactions');
              }}
              onNavigateToSingleEntry={(accCode) => {
                if (accCode === 'Cash_1') {
                  setActiveAccount('Cash_1');
                  setActiveTab('cash-tracker');
                } else {
                  if (accCode) setActiveAccount(accCode);
                  setActiveTab('bulk-entry');
                }
              }}
              onNavigateToBulkEntry={(accCode) => {
                if (accCode === 'Cash_1') {
                  setActiveAccount('Cash_1');
                  setActiveTab('cash-tracker');
                } else {
                  if (accCode) setActiveAccount(accCode);
                  setActiveTab('bulk-entry');
                }
              }}
            />
          )}

          {activeTab === 'all-transactions' && (
            <MasterTransactionsView
              transactions={transactions}
              categories={categories}
              activeAccount={activeAccount}
              accounts={accounts}
              onSelectAccount={setActiveAccount}
              onNavigateToEntry={() => setActiveTab('bulk-entry')}
              onNavigateToImport={() => setActiveTab('bulk-entry')}
              onNavigateToValidation={() => setActiveTab('transaction-validation')}
              onReloadTransactions={refreshData}
            />
          )}

          {activeTab === 'transaction-validation' && (
            <TransactionValidationView
              transactions={transactions}
              categories={categories}
              accounts={accounts}
              masters={masters}
              onReloadTransactions={refreshData}
              onNavigateToEntry={() => setActiveTab('bulk-entry')}
            />
          )}

          {activeTab === 'networth' && (
            <NetWorthView cashBalance={cashBalance} accounts={accounts} transactions={transactions} />
          )}

          {activeTab === 'budget-actual' && (
            <BudgetActualView
              transactions={transactions}
              categories={categories}
              masters={masters}
              onNavigateToCategories={() => setActiveTab('cash-categories')}
              onNavigateToEntry={() => setActiveTab('bulk-entry')}
            />
          )}

          {activeTab === 'payables-receivables' && (
            <PayablesReceivablesView />
          )}

          {activeTab === 'portfolio' && (
            <PortfolioLedgerView />
          )}

          {activeTab === 'career-pnl' && (
            <CareerPnlView />
          )}

          {activeTab === 'reports' && (
            <ExecutiveReportsView
              transactions={transactions}
              categories={categories}
            />
          )}

          {/* Unified Transaction Entry & Ledger (Dedicated Cash Tracker vs Dedicated Bank Transaction Entry) */}
          {(activeTab === 'bulk-entry' || activeTab === 'cash-tracker' || activeTab === 'cash-bulk-entry' || activeTab === 'single-entry' || activeTab === 'cash-single-entry') && (
            <div style={{ padding: '1.5rem', width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
              <BulkEntryGrid
                categories={categories}
                accounts={accounts}
                masters={masters}
                activeAccount={activeTab === 'cash-tracker' ? 'Cash_1' : (activeAccount === 'Cash_1' ? ((accounts || []).find(a => a.code !== 'Cash_1' && a.id !== 'Cash_1')?.code || 'ICICI_DM_3142') : activeAccount)}
                initialFormatMode={activeTab === 'cash-tracker' ? 'cash' : 'bank'}
                isCashTrackerMode={activeTab === 'cash-tracker'}
                transactions={transactions}
                onAddBulkTransactions={handleAddBulkTransactions}
                onDeleteTransaction={handleDeleteTransaction}
                onNavigate={setActiveTab}
              />
            </div>
          )}

          {/* Global Category Master & Management Dimensions */}
          {(activeTab === 'categories' || activeTab === 'cash-categories') && (
            <div style={{ padding: '1.5rem', width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
              <CategoryManager
                categories={categories}
                masters={masters}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
                onBulkAddCategories={handleBulkAddCategories}
                onReloadCategories={refreshData}
                onReloadMasters={refreshData}
              />
            </div>
          )}

          {/* Transaction Audit History (Consolidated vs Cash Only) */}
          {(activeTab === 'history' || activeTab === 'cash-history') && (
            <div style={{ padding: '1.5rem', width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
              <TransactionHistory
                key={activeTab}
                transactions={transactions}
                categories={categories}
                accounts={accounts}
                cashOnly={activeTab === 'cash-history'}
                onUpdateTransaction={handleUpdateTransaction}
                onDeleteTransaction={handleDeleteTransaction}
              />
            </div>
          )}
        </main>

        {/* Global Footer */}
        <footer style={{
          padding: '1.25rem 2rem',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          background: 'var(--bg-card-solid)'
        }}>
          <div>
            <strong>MoneyMatrix AI</strong> — The Operating System for Personal Wealth • Track. Analyze. Grow.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem' }}>
            <span>Local MySQL DB Active</span>
            <span>•</span>
            <span>NWF Engine Connected</span>
          </div>
        </footer>

      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDataReset={refreshData}
      />

      {/* Per-User System Reset Modal (Empty State) */}
      <SystemResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        currentUser={currentUser}
        onResetSuccess={() => {
          refreshData();
          setActiveTab('dashboard');
        }}
      />

      {/* Mobile-First Bottom Action Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
      />

    </div>
  );
}
