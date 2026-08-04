import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  TableProperties,
  Tags,
  History,
  Sun,
  Moon,
  Settings,
  Wallet,
  User,
  LogOut,
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
  onOpenSettings,
  currentUser,
  onLogout,
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'single-entry', label: 'Single Entry', icon: PlusCircle },
    { id: 'bulk-entry', label: 'Bulk Entry', icon: TableProperties },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <header className="navbar-container glass-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.875rem' }}>
        
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            flexShrink: 0
          }}>
            <Wallet size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: '700', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
              Cash<span style={{ color: 'var(--accent-cr)' }}>Tracker</span>
            </h1>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0 }}>
              Smart Income & Expense Management
            </p>
          </div>
        </div>

        {/* Navigation Tabs - Touch Scrollable on Mobile */}
        <nav className="nav-tabs-wrapper">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  borderRadius: '8px',
                  background: isActive ? 'var(--primary-brand)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8125rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Theme Toggle, Settings, User Badge & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-sm"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}
          >
            {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#6366f1" />}
          </button>

          <button
            onClick={onOpenSettings}
            className="btn btn-ghost btn-sm"
            title="Settings & Data Management"
            style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}
          >
            <Settings size={17} />
          </button>

          {currentUser && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.25rem 0.625rem',
              borderRadius: '20px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--primary-brand)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '700'
              }}>
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <User size={12} />}
              </div>
              <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.name || currentUser.username}
              </span>
              <button
                onClick={onLogout}
                className="btn btn-ghost btn-sm"
                title="Sign Out"
                style={{ padding: '0.2rem', color: 'var(--accent-dr)', borderRadius: '50%', minHeight: 'auto' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
