import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Landmark,
  Wallet,
  ShieldCheck,
  PlusCircle,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Sparkles,
  Search,
  Eye,
  EyeOff
} from 'lucide-react';

export default function OneViewCardsDeck({
  accounts = [],
  currentUser,
  onNavigateToAccount,
  onNavigateToEntry
}) {
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSensitive, setShowSensitive] = useState(false);

  // Default rich accounts representation if only basic accounts exist
  const enrichedAccounts = useMemo(() => {
    return (accounts || []).map(acc => {
      const type = (acc.type || '').toLowerCase();
      const code = acc.code || acc.id || '';
      const isCard = type.includes('card') || acc.dump_type === 'CREDIT_CARD';
      const isBank = type.includes('savings') || type.includes('current') || acc.dump_type === 'BANK';
      const isLoan = type.includes('loan') || acc.dump_type === 'LOAN';
      const isCash = type.includes('cash') || acc.dump_type === 'FINANCE';

      // Assign theme & branding
      let bankBrand = 'BANK';
      let themeGradient = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
      let logoBg = '#3b82f6';

      if (code.includes('HDFC')) {
        bankBrand = 'HDFC BANK';
        themeGradient = 'linear-gradient(135deg, #004c8f 0%, #002244 100%)';
        logoBg = '#004c8f';
      } else if (code.includes('ICICI')) {
        bankBrand = 'ICICI BANK';
        themeGradient = 'linear-gradient(135deg, #b83a1b 0%, #7c220c 100%)';
        logoBg = '#f97316';
      } else if (code.includes('FED')) {
        bankBrand = 'FEDERAL BANK';
        themeGradient = 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)';
        logoBg = '#0ea5e9';
      } else if (code.includes('SBI')) {
        bankBrand = 'STATE BANK OF INDIA';
        themeGradient = 'linear-gradient(135deg, #0369a1 0%, #0c4a6e 100%)';
        logoBg = '#0284c7';
      } else if (isLoan) {
        bankBrand = 'LOAN / LIEN';
        themeGradient = 'linear-gradient(135deg, #475569 0%, #1e293b 100%)';
        logoBg = '#ef4444';
      } else if (isCash) {
        bankBrand = 'CASH / TREASURY';
        themeGradient = 'linear-gradient(135deg, #065f46 0%, #022c22 100%)';
        logoBg = '#10b981';
      }

      // Card number formatting
      const rawDigits = code.replace(/\D/g, '') || '1234';
      const lastFour = rawDigits.slice(-4).padStart(4, '0');
      const maskedNumber = showSensitive
        ? `4532 8901 3456 ${lastFour}`
        : `XXXX XXXX XXXX ${lastFour}`;

      const holderName = acc.cardholder_name || currentUser?.name || 'VARUNAKSHAY S';

      return {
        ...acc,
        isCard,
        isBank,
        isLoan,
        isCash,
        bankBrand,
        themeGradient,
        logoBg,
        maskedNumber,
        holderName,
        expiry: acc.card_expiry || '02/28',
        cvv: acc.card_cvv || '123',
        limit: Number(acc.credit_limit || (isCard ? 150000 : 0)),
        currentBalance: Number(acc.balance || 0)
      };
    });
  }, [accounts, currentUser, showSensitive]);

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return enrichedAccounts.filter(acc => {
      if (filterType === 'CARDS' && !acc.isCard) return false;
      if (filterType === 'BANK' && !acc.isBank) return false;
      if (filterType === 'LOANS' && !acc.isLoan) return false;
      if (filterType === 'CASH' && !acc.isCash) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (acc.name && acc.name.toLowerCase().includes(q)) ||
               (acc.code && acc.code.toLowerCase().includes(q)) ||
               (acc.bankBrand && acc.bankBrand.toLowerCase().includes(q));
      }
      return true;
    });
  }, [enrichedAccounts, filterType, searchTerm]);

  // Total metrics
  const totalCardsOutstanding = enrichedAccounts
    .filter(a => a.isCard)
    .reduce((sum, a) => sum + (a.currentBalance < 0 ? Math.abs(a.currentBalance) : 0), 0);

  const totalLiquid = enrichedAccounts
    .filter(a => a.isBank || a.isCash)
    .reduce((sum, a) => sum + (a.currentBalance > 0 ? a.currentBalance : 0), 0);

  const totalCreditLimit = enrichedAccounts
    .filter(a => a.isCard)
    .reduce((sum, a) => sum + a.limit, 0);

  return (
    <div style={{ padding: '1.25rem', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Top Banner / Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={22} color="var(--primary-brand)" />
            <span>ONE VIEW — Accounts & Cards Deck</span>
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
            Visual card grid matching your Excel ONE VIEW sheet with bank logos, cardholders, and real-time balances
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={() => setShowSensitive(prev => !prev)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', height: '34px' }}
          >
            {showSensitive ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showSensitive ? 'Mask Numbers' : 'Reveal Numbers'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="card glass-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
            Total Liquid Funds (Bank + Cash)
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--accent-cr)', marginTop: '0.2rem' }}>
            ₹{totalLiquid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {(totalLiquid / 100000).toFixed(1)} Lakhs Available for deployment
          </div>
        </div>

        <div className="card glass-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
            Credit Card Outstanding
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: totalCardsOutstanding > 0 ? '#ef4444' : 'var(--text-primary)', marginTop: '0.2rem' }}>
            ₹{totalCardsOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Total Card Limit: ₹{totalCreditLimit.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="card glass-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
            Active Accounts & Instruments
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--primary-brand)', marginTop: '0.2rem' }}>
            {enrichedAccounts.length} Instruments
          </div>
          <div style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {enrichedAccounts.filter(a => a.isCard).length} Cards • {enrichedAccounts.filter(a => a.isBank).length} Banks • {enrichedAccounts.filter(a => a.isLoan).length} Loans
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Pills Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-input)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `All (${enrichedAccounts.length})` },
            { id: 'CARDS', label: `Cards (${enrichedAccounts.filter(a => a.isCard).length})` },
            { id: 'BANK', label: `Banks (${enrichedAccounts.filter(a => a.isBank).length})` },
            { id: 'LOANS', label: `Loans (${enrichedAccounts.filter(a => a.isLoan).length})` },
            { id: 'CASH', label: `Cash (${enrichedAccounts.filter(a => a.isCash).length})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`btn btn-sm ${filterType === f.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '6px' }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search account code, bank..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ height: '34px', fontSize: '0.75rem', paddingLeft: '32px', width: '220px' }}
          />
        </div>
      </div>

      {/* Cards Deck Grid (Visual Layout matching Excel One View screenshot) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
        gap: '1.25rem'
      }}>
        {filteredAccounts.map((acc, idx) => {
          const isNegative = acc.currentBalance < 0;

          return (
            <div
              key={acc.id || idx}
              style={{
                background: acc.themeGradient,
                borderRadius: '16px',
                padding: '1.35rem',
                color: '#fff',
                position: 'relative',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '200px',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.28)';
              }}
              onClick={() => onNavigateToAccount && onNavigateToAccount(acc.code)}
            >
              {/* Card Header: Brand & Chip */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: acc.logoBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '0.85rem'
                    }}>
                      {acc.bankBrand.slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        {acc.bankBrand}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)' }}>
                        {acc.type || acc.dump_type}
                      </div>
                    </div>
                  </div>

                  {/* EMV Chip & Contactless indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{
                      width: '32px',
                      height: '24px',
                      borderRadius: '4px',
                      background: 'linear-gradient(135deg, #d4af37 0%, #aa820a 100%)',
                      border: '1px solid #ffe082'
                    }} />
                    <span style={{ fontSize: '1rem', opacity: 0.6 }}>)))</span>
                  </div>
                </div>

                {/* Masked Card Number */}
                <div style={{
                  fontSize: '1.15rem',
                  letterSpacing: '0.14em',
                  fontFamily: 'monospace',
                  fontWeight: '700',
                  margin: '0.85rem 0',
                  color: '#f8fafc',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}>
                  {acc.maskedNumber}
                </div>
              </div>

              {/* Card Footer: Holder Name, Expiry, CVV & Balance */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.15)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Cardholder
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: '0.1rem' }}>
                      {acc.holderName}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div>
                      <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                        Expires
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', marginTop: '0.1rem' }}>
                        {acc.expiry}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                        CVV
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', marginTop: '0.1rem' }}>
                        {showSensitive ? acc.cvv : '•••'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Balance Badge */}
                <div style={{
                  marginTop: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '8px'
                }}>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                    {acc.isCard ? 'Outstanding Due:' : 'Current Balance:'}
                  </span>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: '800',
                    color: isNegative ? '#fca5a5' : '#86efac'
                  }}>
                    {isNegative ? `₹-${Math.abs(acc.currentBalance).toLocaleString('en-IN')}` : `₹${acc.currentBalance.toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
