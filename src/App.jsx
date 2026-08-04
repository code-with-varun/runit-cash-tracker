import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import SingleEntryForm from './components/SingleEntryForm';
import BulkEntryGrid from './components/BulkEntryGrid';
import CategoryManager from './components/CategoryManager';
import TransactionHistory from './components/TransactionHistory';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';

import {
  getCategoriesAPI,
  addCategoryAPI,
  deleteCategoryAPI,
  bulkAddCategoriesAPI,
  getTransactionsAPI,
  addTransactionAPI,
  addBulkTransactionsAPI,
  updateTransactionAPI,
  deleteTransactionAPI,
} from './utils/api';

import { getCurrentUser, logoutUser } from './utils/storage';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cashtracker_theme') || 'dark';
  });

  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sync Theme with HTML attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cashtracker_theme', theme);
  }, [theme]);

  // Load Data on Mount or when currentUser changes
  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser]);

  const refreshData = async () => {
    try {
      const fetchedCats = await getCategoriesAPI();
      const fetchedTxs = await getTransactionsAPI();
      setCategories(fetchedCats || []);
      setTransactions(fetchedTxs || []);
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
    refreshData();
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setCategories([]);
    setTransactions([]);
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

  return (
    <div className="app-container">
      
      {/* Require Authentication Modal if no user is signed in */}
      {!currentUser && (
        <AuthModal onAuthSuccess={handleAuthSuccess} />
      )}

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <Dashboard
            transactions={transactions}
            categories={categories}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'single-entry' && (
          <SingleEntryForm
            categories={categories}
            onAddTransaction={handleAddTransaction}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'bulk-entry' && (
          <BulkEntryGrid
            categories={categories}
            onAddBulkTransactions={handleAddBulkTransactions}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'categories' && (
          <CategoryManager
            categories={categories}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onBulkAddCategories={handleBulkAddCategories}
          />
        )}

        {activeTab === 'history' && (
          <TransactionHistory
            transactions={transactions}
            categories={categories}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}
      </main>

      {/* Settings & Backup Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDataReset={refreshData}
      />

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '1.5rem',
        fontSize: '0.8125rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-color)',
        marginTop: '2rem'
      }}>
        <p>Cash Tracker — Express & MongoDB Atlas Backend with Local Storage Fallback</p>
      </footer>
    </div>
  );
}
