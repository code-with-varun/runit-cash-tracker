import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  PlusCircle,
  Upload,
  Banknote,
  Sun,
  Moon,
  Settings,
  LogOut,
  User,
  ChevronDown,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';

export default function TopHeader({
  activeTab,
  setActiveTab,
  activeAccount,
  setActiveAccount,
  onToggleSidebar,
  transactionsCount = 0,
  cashBalance = 0,
  theme,
  toggleTheme,
  onOpenSettings,
  onOpenReset,
  currentUser,
  onLogout,
  onExportCompleteExcel
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTabDetails = (tab) => {
    switch (tab) {
      case 'cash-tracker':
        return { title: 'Cash Tracker & Physical Ledger', subtitle: 'Cash-in-hand accounting, daily store expenses & petty cash balance register' };
      case 'superadmin':
        return { title: 'Super Admin Console', subtitle: 'Platform user administration, access control & system metrics' };
      case 'dashboard':
        return { title: 'Executive Finance Cockpit', subtitle: '360° Real-time personal wealth & cash overview' };
      case 'one-view':
        return { title: 'ONE VIEW Cards & Accounts Deck', subtitle: 'Live visual debit & credit card tiles, EMV chip preview, card limits & live balances' };
      case 'accounts':
        return { title: 'Bank Accounts & Balances', subtitle: 'Master ledger of savings, credit cards, current & loans' };
      case 'all-transactions':
        return { title: 'Master Transactions (Auditing)', subtitle: 'Consolidated multi-account auditing, categorization & freezing' };
      case 'transaction-validation':
        return { title: 'Daily Transaction Validation & Finalization', subtitle: 'Date-wise auditing, taxonomy validation, verification & daily balance lock' };
      case 'networth':
        return { title: 'Net Worth & Closing Balance Engine', subtitle: 'Monthly & yearly closing balances and asset vs liability curves' };
      case 'budget-actual':
        return { title: 'Budget vs. Actual Analysis', subtitle: 'Category variances, financial deviations & spending discipline' };
      case 'payables-receivables':
        return { title: 'Accounts Payable & Receivable (AP / AR)', subtitle: 'Multi-person matrix, loan amortizations & yearwise net P/L' };
      case 'portfolio':
        return { title: 'Investments & Stocks', subtitle: 'Stock holdings, LTCG 1-year tax maturity, NSE client control ledger & trade bills' };
      case 'career-pnl':
        return { title: 'Career P&L (Business or Professional)', subtitle: 'Organisation-level career tenures, CTC progression, cumulative wealth retention & daily velocity' };
      case 'reports':
        return { title: 'Power BI & Executive Outputs', subtitle: 'Dynamic Power BI integration, PowerPoint decks & PDF summaries' };
      case 'bulk-entry':
      case 'cash-bulk-entry':
      case 'single-entry':
      case 'cash-single-entry':
        return { title: 'Bank Transactions (Account Wise)', subtitle: 'Bank statement batch entry, auto-classification & account ledger reconciliation' };
      case 'categories':
      case 'cash-categories':
        return { title: 'Category & Management Masters', subtitle: '64-Category taxonomy, Budgets (B001-B008), Cost Centers (CC001-CC008), Profit Centers & Projects' };
      case 'cash-history':
        return { title: 'Cash Audit History (Cash Only)', subtitle: 'Search, filter, edit, and export physical cash ledger records' };
      case 'history':
        return { title: 'Ledger Audit History', subtitle: 'Search, filter, edit, and export transactions across accounts' };
      default:
        return { title: 'MoneyMatrix AI', subtitle: 'The Operating System for Personal Wealth' };
    }
  };

  const details = getTabDetails(activeTab);

  return (
    <header style={{
      padding: '0.8rem 1.75rem',
      background: 'var(--bg-card)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      position: 'sticky',
      top: 0,
      zIndex: 80
    }}>
      {/* Left: Hamburger & breadcrumb hierarchy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <button
          onClick={onToggleSidebar}
          className="btn btn-ghost btn-sm"
          style={{ padding: '0.4rem', borderRadius: '8px', color: 'var(--text-secondary)' }}
          title="Toggle Navigation Menu"
        >
          <Menu size={18} />
        </button>

        <div>
          <h1 style={{ fontSize: '1.1875rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            {details.title}
          </h1>
        </div>
      </div>

      {/* Right Navbar Controls: Cash Tracker Button, Theme, Settings, Quick Ingest, User Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        
        {/* Cash Tracker Quick Action Button */}
        <button
          onClick={() => {
            if (setActiveAccount) setActiveAccount('Cash_1');
            if (setActiveTab) setActiveTab('cash-tracker');
          }}
          className={`btn btn-sm ${activeTab === 'cash-tracker' ? 'btn-primary' : 'btn-ghost'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.32rem 0.8rem',
            borderRadius: '9999px',
            background: activeTab === 'cash-tracker'
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'var(--bg-input)',
            border: activeTab === 'cash-tracker'
              ? '1px solid #10b981'
              : '1px solid var(--border-color)',
            color: activeTab === 'cash-tracker' ? '#ffffff' : 'var(--text-primary)',
            fontSize: '0.75rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'cash-tracker' ? '0 2px 10px rgba(16, 185, 129, 0.4)' : 'none'
          }}
          title="Open Cash Tracker (Cash_1 Ledger in Cash Format)"
        >
          <Banknote size={15} color={activeTab === 'cash-tracker' ? '#ffffff' : '#10b981'} />
          <span>Cash Tracker</span>
          <span style={{
            fontWeight: '800',
            color: activeTab === 'cash-tracker' ? '#ffffff' : (cashBalance >= 0 ? 'var(--accent-cr)' : 'var(--accent-dr)'),
            padding: '1px 6px',
            borderRadius: '6px',
            background: activeTab === 'cash-tracker' ? 'rgba(0,0,0,0.2)' : 'rgba(16, 185, 129, 0.12)',
            fontSize: '0.71875rem'
          }}>
            ₹{Number(cashBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </button>

        {/* Complete Excel Backup Quick Action */}
        <button
          onClick={onExportCompleteExcel}
          className="btn btn-secondary btn-sm"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.32rem 0.8rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '700',
            color: 'var(--primary-brand)',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            cursor: 'pointer'
          }}
          title="Export Complete Multi-Sheet Excel Backup (User Profile, 36-Col Ledger, Accounts, Taxonomy, Budgets, Cost Centers, Profit Centers, Projects)"
        >
          <FileSpreadsheet size={15} />
          <span className="hidden-sm">Complete Backup (.xlsx)</span>
        </button>

        {/* User Profile Pill & Dropdown (Top-Right) */}
        {currentUser && (
          <div style={{ position: 'relative' }} ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="btn btn-ghost btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.25rem 0.65rem 0.25rem 0.35rem',
                borderRadius: '9999px',
                border: '1px solid var(--border-color)',
                background: isUserMenuOpen ? 'var(--bg-card-solid)' : 'transparent',
                transition: 'all 0.2s'
              }}
              title="User Profile & Settings"
            >
              {/* Avatar circle */}
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: currentUser.role === 'superadmin' 
                    ? 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' 
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '0.8125rem'
                }}>
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              <div style={{ textAlign: 'left', lineHeight: 1.15 }} className="hidden-sm">
                <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block' }}>
                  {currentUser.name || currentUser.username}
                </span>
                <span style={{ fontSize: '0.625rem', color: currentUser.role === 'superadmin' ? '#a78bfa' : 'var(--text-muted)', fontWeight: '600' }}>
                  {currentUser.role === 'superadmin' ? 'Super Admin' : 'Personal User'}
                </span>
              </div>

              <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: isUserMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '240px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                padding: '0.5rem',
                zIndex: 100
              }}>
                {/* User Info Header */}
                <div style={{ padding: '0.65rem 0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.35rem' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {currentUser.name}
                  </div>
                  <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
                    @{currentUser.username} • {currentUser.role}
                  </div>
                </div>

                {/* Dropdown Actions */}
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    toggleTheme();
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px'
                  }}
                >
                  {theme === 'dark' ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#6366f1" />}
                  <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    if (onExportCompleteExcel) onExportCompleteExcel();
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    color: 'var(--primary-brand)'
                  }}
                >
                  <FileSpreadsheet size={15} />
                  <span>Export Complete Excel (.xlsx)</span>
                </button>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    if (onOpenSettings) onOpenSettings();
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px'
                  }}
                >
                  <Settings size={15} />
                  <span>Settings & Backup</span>
                </button>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    if (onOpenReset) onOpenReset();
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    color: '#f59e0b'
                  }}
                >
                  <RotateCcw size={15} />
                  <span>System Reset (Empty State)</span>
                </button>

                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.35rem 0' }}></div>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    color: 'var(--accent-dr)'
                  }}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </header>
  );
}
