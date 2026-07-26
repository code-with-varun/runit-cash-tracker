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
  getCategories,
  addCategory,
  deleteCategory,
  saveCategories,
  getTransactions,
  addTransaction,
  addBulkTransactions,
  updateTransaction,
  deleteTransaction,
  getCurrentUser,
  logoutUser,
} from './utils/storage';

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

  const refreshData = () => {
    setCategories(getCategories());
    setTransactions(getTransactions());
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
  const handleAddCategory = (cat) => {
    addCategory(cat);
    setCategories(getCategories());
  };

  const handleDeleteCategory = (id) => {
    deleteCategory(id);
    setCategories(getCategories());
  };

  const handleBulkAddCategories = (newCats) => {
    const current = getCategories();
    const merged = [...current];

    newCats.forEach((nc) => {
      if (!merged.some((c) => c.name.toLowerCase() === nc.name.toLowerCase())) {
        merged.push({
          id: `cat_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          name: nc.name,
          type: nc.type,
        });
      }
    });

    saveCategories(merged);
    setCategories(merged);
  };

  // Transaction Operations
  const handleAddTransaction = (tx) => {
    addTransaction(tx);
    setTransactions(getTransactions());
  };

  const handleAddBulkTransactions = (txList) => {
    addBulkTransactions(txList);
    setTransactions(getTransactions());
  };

  const handleUpdateTransaction = (tx) => {
    updateTransaction(tx);
    setTransactions(getTransactions());
  };

  const handleDeleteTransaction = (id) => {
    deleteTransaction(id);
    setTransactions(getTransactions());
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
        <p>Cash Tracker — Multi-User Privacy-First Front-End Application</p>
      </footer>
    </div>
  );
}

