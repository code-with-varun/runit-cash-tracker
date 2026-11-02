import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Cpu,
  Layers,
  BarChart3,
  CreditCard,
  Landmark,
  Wallet,
  Banknote,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  Lock,
  Activity,
  Zap,
  Presentation,
  FileDown,
  PieChart,
  LineChart,
  ChevronRight,
  Sun,
  Moon,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import brandIcon from '../assets/branding/money-matrix-icon.png';

export default function LandingPage({
  onOpenAuth,
  onEnterApp,
  currentUser,
  theme,
  toggleTheme,
}) {
  const [activeTabPreview, setActiveTabPreview] = useState('overview');

  const capabilities = [
    {
      icon: Layers,
      title: 'Unified Account Management',
      desc: 'Consolidate multiple Savings, Current, Credit Card, Loan, and Cash ledgers into a single source of truth.',
      color: '#3b82f6',
      badge: 'Core Engine'
    },
    {
      icon: Banknote,
      title: 'Cash & Expense Tracking',
      desc: 'Precision Credit (Cr) & Debit (Dr) ledger with single quick-entry and high-speed Excel bulk grid pasting.',
      color: '#10b981',
      badge: 'Live Now'
    },
    {
      icon: PieChart,
      title: 'Budget vs. Actual Analysis',
      desc: 'Automatic financial deviation reporting and Needs vs. Savings vs. Wants allocation audits.',
      color: '#f59e0b',
      badge: 'Analytics'
    },
    {
      icon: TrendingUp,
      title: 'Net Worth Tracking',
      desc: '360° visibility over liquid cash, investments, assets, and liabilities calculated in real time.',
      color: '#8b5cf6',
      badge: 'Wealth OS'
    },
    {
      icon: LineChart,
      title: 'Portfolio & Stock Ledger',
      desc: 'Track equity orders, holdings balances, buy/sell executions, and capital gains alongside liquid cash.',
      color: '#ec4899',
      badge: 'Investments'
    },
    {
      icon: Activity,
      title: 'Accounts Payable & Receivable',
      desc: 'Clear tracking of scheduled receivables and upcoming commitments to maintain peak cash-flow health.',
      color: '#06b6d4',
      badge: 'Cash Flow'
    },
    {
      icon: Cpu,
      title: 'AI Auto-Categorization & Validation',
      desc: 'Intelligent rule engines and AI models validate formats, dates, and automatic transaction classification.',
      color: '#10b981',
      badge: 'AI Powered'
    },
    {
      icon: Presentation,
      title: 'Executive Power BI & PDF Reports',
      desc: 'Direct consolidation pipelines to Power BI dynamic reports, automated PowerPoint decks, and PDF summaries.',
      color: '#6366f1',
      badge: 'Reporting'
    },
  ];

  const accountMatrix = [
    { type: 'Cash Tracker', name: 'Cash_1', status: 'Live & Active', icon: Banknote, color: '#10b981', desc: 'Daily physical cash transactions, store purchases, and petty cash' },
    { type: 'Savings Account', name: 'Savings_1', status: 'Connected', icon: Landmark, color: '#3b82f6', desc: 'Primary liquid savings, emergency fund, and bank interest accruals' },
    { type: 'Savings Account', name: 'Savings_2', status: 'Connected', icon: Landmark, color: '#3b82f6', desc: 'Secondary high-yield savings & recurring deposits' },
    { type: 'Current Account', name: 'Current_1', status: 'Ready', icon: Wallet, color: '#06b6d4', desc: 'Business operations, freelance receivables, and client invoicing' },
    { type: 'Current Account', name: 'Current_2', status: 'Ready', icon: Wallet, color: '#06b6d4', desc: 'Secondary operational account & GST / tax reserve' },
    { type: 'Credit Card', name: 'CC_1', status: 'Monitored', icon: CreditCard, color: '#f59e0b', desc: 'Primary rewards card, dining, and online subscriptions' },
    { type: 'Credit Card', name: 'CC_2', status: 'Monitored', icon: CreditCard, color: '#f59e0b', desc: 'Travel card, international payments, and airport lounge perks' },
    { type: 'Credit Card', name: 'CC_3', status: 'Monitored', icon: CreditCard, color: '#f59e0b', desc: 'Utility bills, fuel cashback, and routine recurring payments' },
    { type: 'Loan Account', name: 'Loan_1', status: 'Amortizing', icon: ShieldCheck, color: '#ec4899', desc: 'Home mortgage, amortization tracking, and principal reduction' },
    { type: 'Loan Account', name: 'Loan_2', status: 'Amortizing', icon: ShieldCheck, color: '#ec4899', desc: 'Vehicle / personal loan with scheduled EMI payoff milestones' },
  ];

  const pipelineStages = [
    {
      stage: '01. Data Ingestion',
      title: 'NWF Engine (Net Worth File)',
      items: [
        'Accounts Summary & Consolidations',
        'Account-Wise Data Streams (1 to 4)',
        'Stock Ledger, Orders & Asset Balances',
        'VSTACK & Power Query Auto-Consolidation'
      ],
      icon: FileSpreadsheet,
      accent: '#3b82f6'
    },
    {
      stage: '02. Machine Verification',
      title: 'Portal & AI Validation',
      items: [
        'Date-Wise Strict Integrity Check',
        'AI Transaction Anomaly Validation',
        'Programmatic Category Auto-Tagging',
        'Duplicate & Reconciliation Guard'
      ],
      icon: Cpu,
      accent: '#10b981'
    },
    {
      stage: '03. Financial Modeling',
      title: 'Cost & Deviation Engine',
      items: [
        'Budget vs. Actual Variance Tracking',
        'Needs, Savings, EMI & Wants Audit',
        'Job-Wise & Project Cost Allocation',
        'Closing Balance (Day / Month / Year)'
      ],
      icon: BarChart3,
      accent: '#f59e0b'
    },
    {
      stage: '04. Executive Outputs',
      title: 'Power BI & Visual Deck',
      items: [
        'Power BI Dynamic Executive Connectors',
        'Automated Monthly PowerPoint Decks',
        'Static High-Res Boardroom PDF Briefs',
        'Predictive Wealth Growth Curves'
      ],
      icon: Presentation,
      accent: '#8b5cf6'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      
      {/* Background Decorative Ambient Glows */}
      <div style={{
        position: 'fixed',
        top: '-10%',
        left: '20%',
        width: '550px',
        height: '550px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 70%)',
        filter: 'blur(70px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'fixed',
        top: '40%',
        right: '-10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Landing Navbar */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.875rem 1.5rem',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          {/* Logo & Brand Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img
              src={brandIcon}
              alt="MoneyMatrix AI"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                objectFit: 'cover'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.03em', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                  Money<span style={{ color: 'var(--accent-cr)' }}>Matrix</span>
                </span>
                <span style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                  color: '#ffffff',
                  fontSize: '0.625rem',
                  fontWeight: '800',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '6px',
                  letterSpacing: '0.05em'
                }}>
                  AI
                </span>
              </div>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>
                Your Personal CFO
              </p>
            </div>
          </div>

          {/* Center Navigation Links (Hidden on small mobile) */}
          <div className="landing-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <a href="#capabilities" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500', transition: 'color 0.2s' }}>Capabilities</a>
            <a href="#accounts" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500', transition: 'color 0.2s' }}>Accounts Matrix</a>
            <a href="#pipeline" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500', transition: 'color 0.2s' }}>Data Pipeline</a>
            <a href="#philosophy" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500', transition: 'color 0.2s' }}>Philosophy</a>
          </div>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-sm"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}
            >
              {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#6366f1" />}
            </button>

            {currentUser ? (
              <button
                onClick={onEnterApp}
                className="btn btn-primary btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  padding: '0.5rem 1rem'
                }}
              >
                <span>Open Cash Ledger</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.8125rem' }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="btn btn-primary btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                    border: 'none',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                    fontSize: '0.8125rem'
                  }}
                >
                  Get Started Free
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main style={{ position: 'relative', zIndex: 1 }}>
        
        {/* ============================================================== */}
        {/* HERO SECTION                                                   */}
        {/* ============================================================== */}
        <section style={{
          padding: '4.5rem 1.5rem 3.5rem 1.5rem',
          textAlign: 'center',
          maxWidth: '1100px',
          margin: '0 auto'
        }}>
          {/* Tagline Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.875rem',
            borderRadius: '999px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--accent-cr)',
            fontSize: '0.78125rem',
            fontWeight: '600',
            marginBottom: '1.5rem'
          }}>
            <Sparkles size={14} />
            <span>The Operating System for Personal Wealth</span>
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5.5vw, 4.25rem)',
            fontWeight: '900',
            lineHeight: 1.1,
            letterSpacing: '-0.035em',
            marginBottom: '1.25rem'
          }}>
            Track. Analyze.{' '}
            <span style={{
              background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>
              Grow.
            </span>
          </h1>

          {/* Sub-tagline & Paragraph */}
          <p style={{
            fontSize: 'clamp(1.125rem, 2vw, 1.35rem)',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
            letterSpacing: '-0.01em'
          }}>
            Your Personal CFO Powered by Data & AI
          </p>
          <p style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            maxWidth: '720px',
            margin: '0 auto 2.25rem auto',
            lineHeight: 1.6
          }}>
            MoneyMatrix AI is a comprehensive <strong>Personal ERP</strong> designed to unify banking, credit cards, loans, investments, budgeting, cash flow, and net worth management into a single intelligent ecosystem.
          </p>

          {/* Call to Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '3.5rem'
          }}>
            <button
              onClick={() => currentUser ? onEnterApp() : onOpenAuth('register')}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                fontSize: '1rem',
                padding: '0.8rem 1.75rem',
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                fontWeight: '700'
              }}
            >
              <span>{currentUser ? 'Enter Cash Ledger (Cash_1)' : 'Launch MoneyMatrix AI Free'}</span>
              <ArrowRight size={18} />
            </button>

            {!currentUser && (
              <button
                onClick={() => onOpenAuth('login')}
                className="btn btn-secondary"
                style={{
                  fontSize: '1rem',
                  padding: '0.8rem 1.75rem',
                  borderRadius: '12px',
                  fontWeight: '600'
                }}
              >
                Sign In to Portal
              </button>
            )}

            <a
              href="#pipeline"
              className="btn btn-ghost"
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                padding: '0.8rem 1.25rem'
              }}
            >
              <span>View Data Engine & Sheets</span>
              <ChevronRight size={16} />
            </a>
          </div>

          {/* Interactive Executive Cockpit Mockup */}
          <div className="glass-card" style={{
            padding: '1.75rem',
            textAlign: 'left',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35), 0 0 40px rgba(16, 185, 129, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Top Cockpit Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '1rem',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: 'var(--accent-cr)',
                  boxShadow: '0 0 10px var(--accent-cr)'
                }} />
                <span style={{ fontSize: '0.875rem', fontWeight: '700', letterSpacing: '-0.01em' }}>
                  MoneyMatrix AI • Executive Wealth Cockpit
                </span>
                <span style={{
                  fontSize: '0.6875rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  background: 'var(--accent-cr-bg)',
                  color: 'var(--accent-cr)',
                  border: '1px solid var(--accent-cr-border)',
                  fontWeight: '600'
                }}>
                  MySQL Live Connected
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.375rem' }}>
                {['overview', 'nwf-sheet', 'cost-audit'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTabPreview(tab)}
                    style={{
                      background: activeTabPreview === tab ? 'var(--primary-brand)' : 'var(--bg-input)',
                      color: activeTabPreview === tab ? '#fff' : 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {tab.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Preview Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ background: 'var(--bg-input)', padding: '1.125rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.35rem 0' }}>Consolidated Net Worth</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>₹48,25,000</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-cr)', fontWeight: '600' }}>↑ +14.2% MoM Wealth Growth</span>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '1.125rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Active Ledger (Cash_1)</p>
                  <span style={{ fontSize: '0.625rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '1px 5px', borderRadius: '4px' }}>LIVE</span>
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 0.25rem 0', color: 'var(--accent-cr)' }}>₹70,350</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>10 Cr/Dr Entries Reconciled</span>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '1.125rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.35rem 0' }}>Total Banking & Cards</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 0.25rem 0', color: '#3b82f6' }}>₹14,50,000</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Savings_1 & Current_1</span>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '1.125rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.35rem 0' }}>AI Verification Precision</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 0.25rem 0', color: '#8b5cf6' }}>99.8%</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-cr)' }}>0 Validation Deviations</span>
              </div>
            </div>

            {/* Visual Stream Bar / Mini Summary */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              fontSize: '0.8125rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Cpu size={18} color="var(--accent-cr)" />
                <span><strong>AI Validation Engine:</strong> Programmatic taggings & automated bank statement categorization active.</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ background: 'var(--bg-card)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem' }}>#NWF_Consolidation</span>
                <span style={{ background: 'var(--bg-card)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem' }}>#BudgetVsActuals</span>
                <span style={{ background: 'var(--bg-card)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem' }}>#PowerBI_Ready</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* CORE CAPABILITIES (Personal Finance OS)                         */}
        {/* ============================================================== */}
        <section id="capabilities" style={{
          padding: '4rem 1.5rem',
          maxWidth: '1280px',
          margin: '0 auto'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3rem auto' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--primary-brand)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Core Capabilities
            </span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0.5rem 0 1rem 0' }}>
              Built for Discipline, Precision & Growth
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
              MoneyMatrix AI transforms raw financial transactions into actionable insights, helping individuals manage money with the same rigor used by corporate treasury teams.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}>
            {capabilities.map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <div
                  key={idx}
                  className="glass-card"
                  style={{
                    padding: '1.5rem',
                    borderRadius: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.2s ease, border-color 0.2s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: `${cap.color}18`,
                        color: cap.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={22} />
                      </div>
                      <span style={{
                        fontSize: '0.6875rem',
                        fontWeight: '700',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        background: `${cap.color}15`,
                        color: cap.color
                      }}>
                        {cap.badge}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                      {cap.title}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {cap.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================== */}
        {/* UNIFIED ACCOUNT ARCHITECTURE (Image 2 Structure)                 */}
        {/* ============================================================== */}
        <section id="accounts" style={{
          padding: '4rem 1.5rem',
          maxWidth: '1280px',
          margin: '0 auto',
          borderTop: '1px solid var(--border-color)'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 2.5rem auto' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--accent-cr)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Multi-Account Structure
            </span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0.5rem 0 1rem 0' }}>
              Every Instrument. One Central Operating System.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Seamlessly unify physical cash ledgers with multi-bank savings, current accounts, credit cards, and amortizing loans.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem'
          }}>
            {accountMatrix.map((acc, idx) => {
              const Icon = acc.icon;
              const isLive = acc.name === 'Cash_1';
              return (
                <div
                  key={idx}
                  style={{
                    background: isLive ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card)',
                    border: isLive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: `${acc.color}15`,
                      color: acc.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={18} />
                    </div>
                    <span style={{
                      fontSize: '0.6875rem',
                      fontWeight: '700',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '6px',
                      background: isLive ? 'var(--accent-cr)' : 'var(--bg-input)',
                      color: isLive ? '#fff' : 'var(--text-muted)'
                    }}>
                      {acc.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: '0 0 0.15rem 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {acc.type}
                  </p>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: '800', margin: '0 0 0.4rem 0' }}>
                    {acc.name}
                  </h4>
                  <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {acc.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================== */}
        {/* DATA ENGINE & PROCESSING PIPELINE (Image 1 Structure)           */}
        {/* ============================================================== */}
        <section id="pipeline" style={{
          padding: '4rem 1.5rem',
          maxWidth: '1280px',
          margin: '0 auto',
          borderTop: '1px solid var(--border-color)'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3rem auto' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#8b5cf6', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Sheet Architecture & Intelligence Flow
            </span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0.5rem 0 1rem 0' }}>
              From Raw Transactions to Executive Dashboards
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              How MoneyMatrix AI orchestrates data across Excel NWF files, AI validation pipelines, Cost deviation matrices, and Power BI visual decks:
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem'
          }}>
            {pipelineStages.map((stg, idx) => {
              const Icon = stg.icon;
              return (
                <div
                  key={idx}
                  className="glass-card"
                  style={{
                    padding: '1.5rem',
                    borderRadius: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderTop: `3px solid ${stg.accent}`
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: stg.accent, textTransform: 'uppercase' }}>
                      {stg.stage}
                    </span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0.35rem 0 1.25rem 0' }}>
                      {stg.title}
                    </h3>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      {stg.items.map((item, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          <CheckCircle2 size={15} color={stg.accent} style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================== */}
        {/* PLATFORM PHILOSOPHY CALLOUT                                     */}
        {/* ============================================================== */}
        <section id="philosophy" style={{
          padding: '4.5rem 1.5rem',
          maxWidth: '960px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <div className="glass-card" style={{
            padding: '3rem 2rem',
            borderRadius: '28px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
          }}>
            <p style={{
              fontSize: '0.8125rem',
              fontWeight: '800',
              color: 'var(--accent-cr)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '1rem'
            }}>
              Platform Philosophy
            </p>
            <blockquote style={{
              fontSize: 'clamp(1.25rem, 3vw, 1.85rem)',
              fontWeight: '800',
              lineHeight: 1.35,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              margin: '0 0 1.25rem 0'
            }}>
              "Every financial transaction should contribute to a clearer understanding of wealth creation."
            </blockquote>
            <p style={{
              fontSize: '0.9375rem',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.6
            }}>
              MoneyMatrix AI is for personal finance what ERP systems are for businesses: a unified single source of truth for managing, analyzing, and multiplying wealth.
            </p>
          </div>
        </section>

        {/* ============================================================== */}
        {/* FINAL CALL TO ACTION (CTA)                                      */}
        {/* ============================================================== */}
        <section style={{
          padding: '4rem 1.5rem 5rem 1.5rem',
          maxWidth: '1100px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0b192c 0%, #0d2b45 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '28px',
            padding: '3.5rem 2rem',
            color: '#ffffff',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
          }}>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: '900', marginBottom: '0.75rem', color: '#ffffff' }}>
              Take Command of Your Wealth Today
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '580px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
              Experience the clarity of enterprise-grade cash tracking and financial operating systems on your local machine and cloud.
            </p>

            <button
              onClick={() => currentUser ? onEnterApp() : onOpenAuth('register')}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                fontSize: '1.0625rem',
                padding: '0.85rem 2.25rem',
                borderRadius: '12px',
                border: 'none',
                fontWeight: '700',
                boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)'
              }}
            >
              <span>{currentUser ? 'Access Cash Ledger' : 'Create Free Account'}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </section>

      </main>

      {/* Landing Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '2.5rem 1.5rem',
        background: 'var(--bg-card-solid)',
        fontSize: '0.8125rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <img src={brandIcon} alt="MoneyMatrix Logo" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>MoneyMatrix AI</span>
            <span>— Personal Finance Operating System</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-cr)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cr)' }} />
              MySQL Active (money_matrix_db)
            </span>
            <span>React + PHP API</span>
            <span>Hostinger Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
