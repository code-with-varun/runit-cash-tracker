import React from 'react';
import {
  LayoutDashboard,
  Banknote,
  Upload,
  Tags,
  Landmark,
  ShieldCheck,
  PlusCircle,
  Menu
} from 'lucide-react';

export default function MobileBottomNav({
  activeTab,
  setActiveTab,
  currentUser,
  onToggleSidebar
}) {
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'bulk-entry', label: 'Entry', icon: PlusCircle, isAction: true },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: isSuperAdmin ? 'superadmin' : 'accounts', label: isSuperAdmin ? 'Admin' : 'Accounts', icon: isSuperAdmin ? ShieldCheck : Landmark },
  ];

  return (
    <nav
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '62px',
        background: 'var(--bg-card-solid)',
        borderTop: '1px solid var(--border-color)',
        display: 'none', // Controlled by media query in CSS (display: flex on max-width: 768px)
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 0.5rem',
        zIndex: 990,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)'
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id || 
          (item.id === 'categories' && activeTab === 'cash-categories') ||
          (item.id === 'single-entry' && activeTab === 'cash-single-entry');

        if (item.isAction) {
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                transform: 'translateY(-10px)',
                cursor: 'pointer'
              }}
              title={item.label}
            >
              <Icon size={20} />
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              border: 'none',
              background: 'transparent',
              color: isActive ? 'var(--primary-brand)' : 'var(--text-muted)',
              fontSize: '0.625rem',
              fontWeight: isActive ? '700' : '500',
              cursor: 'pointer',
              padding: '0.35rem 0.5rem',
              borderRadius: '8px',
              minWidth: '54px'
            }}
          >
            <Icon size={18} color={isActive ? 'var(--primary-brand)' : 'currentColor'} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
