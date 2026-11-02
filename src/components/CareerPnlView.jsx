import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Download,
  Building,
  CheckCircle2,
  Award,
  Zap,
  ChevronRight,
  Flame,
  FileSpreadsheet
} from 'lucide-react';
import { getCareerMilestonesAPI, seedCareerAPI } from '../utils/api';
import DataTablePagination, { useDataTablePagination } from './DataTablePagination';

export default function CareerPnlView() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [milestones, setMilestones] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // New milestone form state
  const [newMilestone, setNewMilestone] = useState({
    company: '',
    role: '',
    start_date: '2021-01-01',
    end_date: '',
    is_current: 1,
    start_ctc: 1200000,
    end_ctc: 1800000,
    total_inflow: 5000000,
    total_outflow: 2500000,
    notes: ''
  });

  const fetchCareerData = async () => {
    setLoading(true);
    try {
      const res = await getCareerMilestonesAPI();
      if (res && res.status === 'success') {
        setSummary(res.summary || {});
        setMilestones(res.milestones || []);
      }
    } catch (err) {
      console.error('Failed to load career milestone data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCareerData();
    const handleReset = () => fetchCareerData();
    window.addEventListener('moneymatrix_data_reset', handleReset);
    return () => window.removeEventListener('moneymatrix_data_reset', handleReset);
  }, []);

  const {
    paginatedItems: paginatedMilestones,
    PaginationComponent,
    getSortHeaderProps,
    renderSortIndicator
  } = useDataTablePagination(milestones, 10);

  const exportCareerCsv = () => {
    let rows = [];
    rows.push(['#', 'Company', 'Role', 'Start Date', 'End Date', 'Tenure Days', 'Tenure Years', 'Starting CTC', 'Ending CTC', 'Total Inflow', 'Total Outflow', 'Net Savings', 'Savings Pct', 'Gain Per Day', 'Burn Per Day', 'Status']);

    milestones.forEach((m, idx) => {
      rows.push([
        idx + 1,
        `"${m.company}"`,
        `"${m.role}"`,
        m.start_date,
        m.end_date || 'Present',
        m.tenure_days,
        m.tenure_years,
        m.start_ctc,
        m.end_ctc,
        m.total_inflow,
        m.total_outflow,
        m.net_savings,
        `${m.savings_pct}%`,
        m.gain_per_day,
        m.burn_per_day,
        m.status
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `career_timeline_pnl_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const start = new Date(newMilestone.start_date);
    const end = newMilestone.is_current ? new Date() : new Date(newMilestone.end_date);
    const days = Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
    const netSavings = newMilestone.total_inflow - newMilestone.total_outflow;
    const savingsPct = newMilestone.total_inflow > 0 ? (netSavings / newMilestone.total_inflow) * 100 : 0;

    const created = {
      ...newMilestone,
      id: milestones.length + 1,
      tenure_days: days,
      tenure_years: (days / 365.25).toFixed(1),
      net_savings: netSavings,
      savings_pct: savingsPct.toFixed(2),
      gain_per_day: (netSavings / days).toFixed(2),
      burn_per_day: (newMilestone.total_outflow / days).toFixed(2),
      status: newMilestone.is_current ? 'ACTIVE / PRESENT' : 'COMPLETED'
    };

    setMilestones([...milestones, created]);
    setShowAddModal(false);
  };

  const handleSeedCareer = async () => {
    setLoading(true);
    try {
      await seedCareerAPI();
      await fetchCareerData();
    } catch (err) {
      console.error('Failed to seed career data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.75rem', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
            Job Experience & Career Timeline P&L
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Organisation-level tenure, lifetime earnings velocity, CTC progression, and wealth accumulation per job
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={exportCareerCsv}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem' }}
          >
            <Download size={16} />
            Export Timeline CSV
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem' }}
          >
            <Plus size={16} />
            Add Career Milestone
          </button>
        </div>
      </div>

      {/* KPI Cards (Resilient Responsive Grid) */}
      <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        
        {/* Lifetime Earnings */}
        <div className="card glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Lifetime Total Earnings
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)' }}>
              <DollarSign size={18} color="#3b82f6" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#3b82f6', letterSpacing: '-0.02em' }}>
            ₹{(summary.lifetime_inflow || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Cumulative salary & inflows across <strong>{summary.stints_count || 0} organizations</strong>
          </div>
        </div>

        {/* Lifetime Operating Outflow */}
        <div className="card glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Lifetime Total Outflow
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)' }}>
              <ArrowDownRight size={18} color="#ef4444" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--accent-dr)', letterSpacing: '-0.02em' }}>
            ₹{(summary.lifetime_outflow || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Total lifestyle, taxes, and operational expenses
          </div>
        </div>

        {/* Net Wealth Accumulated */}
        <div className="card glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Lifetime Net Capital Saved
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)' }}>
              <ArrowUpRight size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--accent-cr)', letterSpacing: '-0.02em' }}>
            +₹{(summary.lifetime_savings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-cr)', fontWeight: '600', marginTop: '0.35rem' }}>
            {summary.lifetime_savings_pct || 0}% Overall Savings Rate
          </div>
        </div>

        {/* Daily Wealth Gain Velocity */}
        <div className="card glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Daily Financial Velocity
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)' }}>
              <Zap size={18} color="#8b5cf6" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#8b5cf6', letterSpacing: '-0.02em' }}>
            +₹{(summary.lifetime_gain_per_day || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} / day
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Across <strong>{(summary.total_career_days || 0).toLocaleString()} active career days</strong> ({summary.total_career_years || 0} yrs)
          </div>
        </div>

      </div>

      {/* Visual Career Timeline Progression Steps */}
      <div className="card glass-card" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
        <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={18} color="#3b82f6" />
          Career Progression & Package Growth Trajectory
        </h3>

        {milestones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <Building size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>No Career Milestones Recorded</div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Workspace is in clean reset state. Click "+ Add Career Milestone" above or import milestones once ready.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {milestones.map((m, idx) => (
            <div
              key={m.id || idx}
              style={{
                padding: '1.15rem',
                borderRadius: '10px',
                background: m.is_current ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-subtle)',
                border: m.is_current ? '1.5px solid #3b82f6' : '1px solid var(--border-color)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '12px',
                  background: m.is_current ? '#3b82f6' : 'var(--border-color)',
                  color: m.is_current ? '#ffffff' : 'var(--text-muted)'
                }}>
                  {m.is_current ? '★ CURRENT' : `STINT #${idx + 1}`}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {m.tenure_years} yrs ({m.tenure_days}d)
                </span>
              </div>

              <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-primary)' }}>
                {m.company}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                {m.role}
              </div>

              <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>CTC Package:</span>
                  <strong>₹{(m.start_ctc / 100000).toFixed(1)}L → ₹{(m.end_ctc / 100000).toFixed(1)}L</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Net Saved:</span>
                  <strong style={{ color: 'var(--accent-cr)' }}>+₹{(m.net_savings / 100000).toFixed(2)} Lakhs</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Savings Rate:</span>
                  <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{m.savings_pct}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Daily Gain Velocity:</span>
                  <strong style={{ color: '#8b5cf6' }}>+₹{m.gain_per_day} / day</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Main Career Ledger Table */}
      <div className="card glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
              Organization-wise Career Financial Ledger
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Inflows, operating outflows, net wealth generated, and daily burn/gain velocity per tenure
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="moneymatrix-table">
            <thead>
              <tr style={{ background: 'var(--bg-card)' }}>
                <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                <th {...getSortHeaderProps('company')}>Organization {renderSortIndicator('company')}</th>
                <th {...getSortHeaderProps('role')}>Role & Title {renderSortIndicator('role')}</th>
                <th {...getSortHeaderProps('start_date')}>Tenure {renderSortIndicator('start_date')}</th>
                <th {...getSortHeaderProps('tenure_days')} style={{ textAlign: 'center' }}>Days {renderSortIndicator('tenure_days')}</th>
                <th {...getSortHeaderProps('start_ctc')} style={{ textAlign: 'right' }}>Start CTC {renderSortIndicator('start_ctc')}</th>
                <th {...getSortHeaderProps('end_ctc')} style={{ textAlign: 'right' }}>End CTC {renderSortIndicator('end_ctc')}</th>
                <th {...getSortHeaderProps('total_inflow')} style={{ textAlign: 'right' }}>Total Inflow {renderSortIndicator('total_inflow')}</th>
                <th {...getSortHeaderProps('total_outflow')} style={{ textAlign: 'right' }}>Total Outflow {renderSortIndicator('total_outflow')}</th>
                <th {...getSortHeaderProps('net_savings')} style={{ textAlign: 'right' }}>Net Savings {renderSortIndicator('net_savings')}</th>
                <th {...getSortHeaderProps('savings_pct')} style={{ textAlign: 'right' }}>Savings % {renderSortIndicator('savings_pct')}</th>
                <th {...getSortHeaderProps('gain_per_day')} style={{ textAlign: 'right' }}>Gain / Day {renderSortIndicator('gain_per_day')}</th>
                <th {...getSortHeaderProps('burn_per_day')} style={{ textAlign: 'right' }}>Burn / Day {renderSortIndicator('burn_per_day')}</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMilestones.length === 0 && (
                <tr>
                  <td colSpan="14" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      <Briefcase size={36} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                      <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>
                        No Career Milestones Recorded
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '420px' }}>
                        Workspace is in clean reset state. Click "+ Add Career Milestone" above or import milestones once ready.
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {paginatedMilestones.map((m, idx) => (
                <tr key={m.id || idx}>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{idx + 1}</td>
                  <td>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{m.company}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.notes}</div>
                  </td>
                  <td style={{ fontWeight: '500', fontSize: '0.85rem' }}>{m.role}</td>
                  <td style={{ fontSize: '0.8125rem' }}>
                    {m.start_date} → {m.is_current ? 'Present' : m.end_date}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: '600' }}>{m.tenure_days}d</td>
                  <td style={{ textAlign: 'right' }}>₹{m.start_ctc.toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: '#3b82f6' }}>
                    ₹{m.end_ctc.toLocaleString('en-IN')}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>
                    ₹{m.total_inflow.toLocaleString('en-IN')}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--accent-dr)' }}>
                    ₹{m.total_outflow.toLocaleString('en-IN')}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--accent-cr)' }}>
                    +₹{m.net_savings.toLocaleString('en-IN')}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--accent-cr)' }}>
                    {m.savings_pct}%
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: '#8b5cf6' }}>
                    +₹{m.gain_per_day}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                    ₹{m.burn_per_day}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      background: m.is_current ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: m.is_current ? '#3b82f6' : '#10b981'
                    }}>
                      {m.is_current ? 'ACTIVE' : 'COMPLETED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {PaginationComponent}
      </div>

      {/* Add Career Milestone Modal */}
      {showAddModal && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card glass-card" style={{ maxWidth: '540px', width: '100%', padding: '1.75rem', background: 'var(--bg-card)' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.25rem', fontWeight: '800' }}>
              Add Career Milestone
            </h3>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Organization</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Page Industries"
                    value={newMilestone.company}
                    onChange={e => setNewMilestone({ ...newMilestone, company: e.target.value })}
                    className="form-control"
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Role / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Business Finance"
                    value={newMilestone.role}
                    onChange={e => setNewMilestone({ ...newMilestone, role: e.target.value })}
                    className="form-control"
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Start Date</label>
                  <input
                    type="date"
                    required
                    value={newMilestone.start_date}
                    onChange={e => setNewMilestone({ ...newMilestone, start_date: e.target.value })}
                    className="form-control"
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>End Date</label>
                  <input
                    type="date"
                    disabled={!!newMilestone.is_current}
                    value={newMilestone.end_date}
                    onChange={e => setNewMilestone({ ...newMilestone, end_date: e.target.value })}
                    className="form-control"
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="currentJobCheck"
                  checked={!!newMilestone.is_current}
                  onChange={e => setNewMilestone({ ...newMilestone, is_current: e.target.checked ? 1 : 0 })}
                />
                <label htmlFor="currentJobCheck" style={{ fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                  Currently Working Here (Active)
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Starting CTC (₹)</label>
                  <input
                    type="number"
                    required
                    value={newMilestone.start_ctc}
                    onChange={e => setNewMilestone({ ...newMilestone, start_ctc: parseFloat(e.target.value) || 0 })}
                    className="form-control"
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Ending CTC (₹)</label>
                  <input
                    type="number"
                    required
                    value={newMilestone.end_ctc}
                    onChange={e => setNewMilestone({ ...newMilestone, end_ctc: parseFloat(e.target.value) || 0 })}
                    className="form-control"
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Total Tenure Inflow (₹)</label>
                  <input
                    type="number"
                    required
                    value={newMilestone.total_inflow}
                    onChange={e => setNewMilestone({ ...newMilestone, total_inflow: parseFloat(e.target.value) || 0 })}
                    className="form-control"
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Total Tenure Outflow (₹)</label>
                  <input
                    type="number"
                    required
                    value={newMilestone.total_outflow}
                    onChange={e => setNewMilestone({ ...newMilestone, total_outflow: parseFloat(e.target.value) || 0 })}
                    className="form-control"
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
