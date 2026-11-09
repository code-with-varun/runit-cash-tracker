import React, { useState } from 'react';
import {
  LayoutDashboard,
  Wallet,
  Landmark,
  CreditCard,
  PieChart,
  TrendingUp,
  LineChart,
  Activity,
  Presentation,
  Upload,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Home,
  Layers,
  Banknote,
  PlusCircle,
  TableProperties,
  Tags,
  History,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Briefcase
} from 'lucide-react';
import brandIcon from '../assets/branding/money-matrix-icon.png';

export default function Sidebar({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenReset,
  currentUser,
  onViewLanding,
  isCollapsed,
  setIsCollapsed,
  accounts = [],
  activeAccount,
  setActiveAccount
}) {
  const defaultAccountsList = [
    { id: 'Cash_1', name: 'Cash_1 (Physical Cash)', type: 'Cash' },
    { id: 'ICICI_DM_3142', name: 'ICICI_DM_3142 (Savings)', type: 'Bank' },
    { id: 'FED_SB_9998', name: 'FED_SB_9998 (Federal SB)', type: 'Bank' },
    { id: 'HDFC_CC_0733', name: 'HDFC_CC_0733 (Credit Card)', type: 'Card' },
    { id: 'ICICI_CC_8003', name: 'ICICI_CC_HP_8003 (Credit Card)', type: 'Card' },
    { id: 'ICICI_CUR_0498', name: 'ICICI_CUR_0498 (Current)', type: 'Current' },
    { id: 'SELVA_LOAN', name: 'SELVA_LOANS (Payable)', type: 'Loan' },
  ];

  const displayAccounts = (accounts && accounts.length > 0)
    ? accounts.map(a => ({ id: a.code || a.name, name: `${a.name} (${a.code || a.type})` }))
    : defaultAccountsList;

  // Navigation sections rearranged exactly per user specification:
  // 1. Dashboards & Reporting
  // 2. Cash Management (Cash Tracker, Audit History - Cash Only)
  // 3. Master & Ledgers (Master Transactions, Daily Validation, Bank Transactions Account Wise, Category Master, Accounts Master)
  // 4. System (System Reset, Super Admin Console)
  const navSections = [
    {
      title: 'DASHBOARDS & REPORTING',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'one-view', label: 'One View', icon: CreditCard, pill: 'Cards' },
        { id: 'networth', label: 'Networth + Balance sheet', icon: TrendingUp },
        { id: 'budget-actual', label: 'Budget vs actuals', icon: PieChart },
        { id: 'payables-receivables', label: 'Payables & receivables', icon: Activity },
        { id: 'portfolio', label: 'Investments & stocks', icon: LineChart },
        { id: 'career-pnl', label: 'Career P&L (Business or Professional)', icon: Briefcase, pill: 'P&L' },
        { id: 'reports', label: 'Power BI & Reports', icon: Presentation },
      ]
    },
    {
      title: 'CASH MANAGEMENT',
      items: [
        { id: 'cash-tracker', label: 'Cash Tracker', icon: Banknote, pill: 'Cash_1' },
        { id: 'cash-history', label: 'Audit History (Cash Only)', icon: History, pill: 'Cash' },
      ]
    },
    {
      title: 'MASTER ENTRIES & VERIFICATION',
      items: [
        { id: 'all-transactions', label: 'Master Transactions', icon: Layers, badge: 'Audit' },
        { id: 'transaction-validation', label: 'Daily Validation', icon: CheckCircle2, pill: 'Verify' },
        { id: 'bulk-entry', label: 'Bank Transactions (Account Wise)', icon: TableProperties, pill: 'Bank' },
        { id: 'categories', label: 'Category & Masters', icon: Tags, pill: 'Budgets & CC' },
        { id: 'accounts', label: 'Accounts Master', icon: Landmark, pill: 'Core' },
      ]
    },
    {
      title: 'DATA INSERTIONS & SYSTEM',
      items: [
        { id: 'export-complete-excel', label: 'Complete Excel Backup', icon: FileSpreadsheet, pill: '.xlsx' },
        { id: 'system-reset', label: 'System Reset', icon: RotateCcw, pill: 'Empty' },
        ...(currentUser?.role === 'superadmin' ? [
          { id: 'superadmin', label: 'Super Admin Console', icon: ShieldCheck, badge: 'Admin' }
        ] : []),
      ]
    }
  ];

  const handleNavClick = (itemId) => {
    if (itemId === 'export-complete-excel') {
      if (onExportCompleteExcel) {
        onExportCompleteExcel();
      }
      return;
    }
    if (itemId === 'system-reset') {
      if (onOpenReset) {
        onOpenReset();
      }
      return;
    }
    if (itemId === 'cash-tracker') {
      if (setActiveAccount) setActiveAccount('Cash_1');
    } else if (itemId === 'bulk-entry') {
      if (activeAccount === 'Cash_1') {
        const firstBank = (accounts || []).find(a => a.code !== 'Cash_1' && a.id !== 'Cash_1')?.code || 'ICICI_DM_3142';
        if (setActiveAccount) setActiveAccount(firstBank);
      }
    }
    setActiveTab(itemId);
  };

  return (
    <aside
      className={`moneymatrix-sidebar ${isCollapsed ? 'collapsed' : ''}`}
      style={{
        width: isCollapsed ? '64px' : '248px',
        minWidth: isCollapsed ? '64px' : '248px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 90,
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none'
      }}
    >
      {/* Brand Header */}
      <div style={{
        padding: isCollapsed ? '1rem 0.5rem' : '1.15rem 1.15rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        gap: '0.65rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
          <img
            src={brandIcon}
            alt="MoneyMatrix Logo"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              objectFit: 'contain',
              flexShrink: 0,
              filter: 'drop-shadow(0 2px 8px rgba(16, 185, 129, 0.35))'
            }}
          />
          {!isCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontSize: '1rem',
                fontWeight: '900',
                letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary-brand) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.2
              }}>
                MoneyMatrix
              </div>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="btn btn-ghost btn-sm"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          style={{
            padding: '0.3rem',
            borderRadius: '6px',
            color: 'var(--text-muted)',
            display: isCollapsed ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ChevronLeft size={16} />
        </button>
      </div>


      {/* Navigation Sections */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        padding: isCollapsed ? '0.65rem 0.35rem' : '0.85rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        {navSections.map((sec, sIdx) => (
          <div key={sec.title || sIdx}>
            {/* Section Header */}
            {!isCollapsed && sec.title && (
              <div style={{
                fontSize: '0.625rem',
                fontWeight: '800',
                color: 'var(--text-muted)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '0 0.5rem',
                marginBottom: '0.35rem'
              }}>
                {sec.title}
              </div>
            )}

            {/* Menu Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {sec.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isReset = item.id === 'system-reset';

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`btn btn-ghost btn-sm ${isActive ? 'active' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                    style={{
                      width: '100%',
                      justifyContent: isCollapsed ? 'center' : 'space-between',
                      padding: isCollapsed ? '0.6rem 0' : '0.5rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      fontWeight: isActive ? '800' : '600',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.12) 100%)'
                        : 'transparent',
                      color: isActive
                        ? 'var(--primary-brand)'
                        : (isReset ? '#f59e0b' : 'var(--text-secondary)'),
                      border: isActive
                        ? '1px solid rgba(16, 185, 129, 0.3)'
                        : '1px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                      <Icon
                        size={17}
                        color={isActive ? 'var(--primary-brand)' : (isReset ? '#f59e0b' : 'currentColor')}
                        style={{ flexShrink: 0 }}
                      />
                      {!isCollapsed && (
                        <span style={{
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden'
                        }}>
                          {item.label}
                        </span>
                      )}
                    </div>

                    {!isCollapsed && item.pill && (
                      <span style={{
                        fontSize: '0.625rem',
                        fontWeight: '800',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '9999px',
                        background: isReset ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: isReset ? '#f59e0b' : 'var(--accent-cr)',
                        letterSpacing: '0.02em'
                      }}>
                        {item.pill}
                      </span>
                    )}

                    {!isCollapsed && item.badge && (
                      <span style={{
                        fontSize: '0.625rem',
                        fontWeight: '800',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '9999px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#3b82f6',
                        letterSpacing: '0.02em'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Clean Bottom Footer (No User or Theme - Moved to Top Navbar) */}
      <div style={{
        padding: isCollapsed ? '0.65rem 0.35rem' : '0.75rem 1rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        background: 'var(--bg-card-solid)'
      }}>
        {/* Small version pill & expand button if collapsed */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          fontSize: '0.6875rem',
          color: 'var(--text-muted)'
        }}>
          {!isCollapsed && (
            <span style={{ fontWeight: '600', letterSpacing: '0.02em' }}>
              MoneyMatrix AI v2.4
            </span>
          )}
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="btn btn-ghost btn-sm"
              title="Expand Sidebar"
              style={{ padding: '0.25rem', borderRadius: '6px' }}
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
