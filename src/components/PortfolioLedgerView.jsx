import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  PieChart,
  Layers,
  Tag,
  Calendar,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  BarChart3,
  Percent,
  Hash,
  AlertCircle
} from 'lucide-react';
import SlicerBar from './SlicerBar';
import DataTablePagination, { useDataTablePagination } from './DataTablePagination';
import { getPortfolioAPI, saveHoldingAPI, seedPortfolioAPI } from '../utils/api';

export default function PortfolioLedgerView() {
  const [activeTab, setActiveTab] = useState('holdings'); // 'holdings' | 'demat-ledger' | 'order-log' | 'trade-details' | 'trade-bills'
  const [loading, setLoading] = useState(true);

  // Data states from API
  const [summary, setSummary] = useState({});
  const [holdings, setHoldings] = useState([]);
  const [dematLedger, setDematLedger] = useState([]);
  const [orderLog, setOrderLog] = useState([]);
  const [tradeDetails, setTradeDetails] = useState([]);
  const [tradeBills, setTradeBills] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [ltcgFilter, setLtcgFilter] = useState('ALL');
  const [topTenFilter, setTopTenFilter] = useState('ALL');

  // Modal for new holding
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHolding, setNewHolding] = useState({
    ticker: '',
    name: '',
    asset_class: 'Banking / Large Cap',
    sector: 'Financial Services',
    purchase_date: new Date().toISOString().split('T')[0],
    qty: 10,
    avg_price: 1000,
    cmp: 1100,
    is_top_ten: 1
  });

  const fetchPortfolioData = async () => {
    setLoading(true);
    try {
      const res = await getPortfolioAPI('all');
      if (res && res.status === 'success') {
        setSummary(res.summary || {});
        setHoldings(res.holdings || []);
        setDematLedger(res.demat_ledger || []);
        setOrderLog(res.order_log || []);
        setTradeDetails(res.trade_details || []);
        setTradeBills(res.trade_bills || []);
      }
    } catch (err) {
      console.error('Failed to load portfolio data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
    const handleReset = () => fetchPortfolioData();
    window.addEventListener('moneymatrix_data_reset', handleReset);
    return () => window.removeEventListener('moneymatrix_data_reset', handleReset);
  }, []);

  // Filtered Holdings
  const filteredHoldings = useMemo(() => {
    return holdings.filter(h => {
      const matchSearch =
        h.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.sector || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchSector = sectorFilter === 'ALL' || h.sector === sectorFilter || h.asset_class === sectorFilter;
      
      const matchLtcg =
        ltcgFilter === 'ALL' ||
        (ltcgFilter === 'LTCG' && h.is_ltcg) ||
        (ltcgFilter === 'STCG' && !h.is_ltcg);

      const matchTopTen =
        topTenFilter === 'ALL' ||
        (topTenFilter === 'YES' && h.is_top_ten) ||
        (topTenFilter === 'NO' && !h.is_top_ten);

      return matchSearch && matchSector && matchLtcg && matchTopTen;
    });
  }, [holdings, searchTerm, sectorFilter, ltcgFilter, topTenFilter]);

  const {
    paginatedItems: paginatedHoldings,
    PaginationComponent: HoldingsPagination,
    getSortHeaderProps: getHoldingsSortHeaderProps,
    renderSortIndicator: renderHoldingsSortIndicator
  } = useDataTablePagination(filteredHoldings, 15);

  const {
    paginatedItems: paginatedLedger,
    PaginationComponent: LedgerPagination,
    getSortHeaderProps: getLedgerSortHeaderProps,
    renderSortIndicator: renderLedgerSortIndicator
  } = useDataTablePagination(dematLedger, 15);

  const {
    paginatedItems: paginatedOrders,
    PaginationComponent: OrdersPagination,
    getSortHeaderProps: getOrdersSortHeaderProps,
    renderSortIndicator: renderOrdersSortIndicator
  } = useDataTablePagination(orderLog, 15);

  const {
    paginatedItems: paginatedTrades,
    PaginationComponent: TradesPagination,
    getSortHeaderProps: getTradesSortHeaderProps,
    renderSortIndicator: renderTradesSortIndicator
  } = useDataTablePagination(tradeDetails, 15);

  const {
    paginatedItems: paginatedBills,
    PaginationComponent: BillsPagination,
    getSortHeaderProps: getBillsSortHeaderProps,
    renderSortIndicator: renderBillsSortIndicator
  } = useDataTablePagination(tradeBills, 15);

  // Distinct sectors for SlicerBar
  const distinctSectors = useMemo(() => {
    const set = new Set();
    holdings.forEach(h => {
      if (h.sector) set.add(h.sector);
    });
    return Array.from(set);
  }, [holdings]);

  const holdingsSlicers = [
    {
      id: 'sector',
      label: 'Sector',
      icon: Tag,
      selected: sectorFilter,
      onChange: setSectorFilter,
      options: [
        { value: 'ALL', label: 'All Sectors', count: holdings.length },
        ...distinctSectors.map(s => ({
          value: s,
          label: s,
          count: holdings.filter(h => h.sector === s).length
        }))
      ]
    },
    {
      id: 'ltcg',
      label: 'LTCG Tax Slab (1 Yr)',
      icon: Clock,
      selected: ltcgFilter,
      onChange: setLtcgFilter,
      options: [
        { value: 'ALL', label: 'All Holdings', count: holdings.length },
        { value: 'LTCG', label: 'Ready for Sale (LTCG >= 1 Yr)', count: holdings.filter(h => h.is_ltcg).length },
        { value: 'STCG', label: 'Holding (< 1 Yr / STCG)', count: holdings.filter(h => !h.is_ltcg).length }
      ]
    },
    {
      id: 'topTen',
      label: 'Top 10 Stocks',
      icon: Sparkles,
      selected: topTenFilter,
      onChange: setTopTenFilter,
      options: [
        { value: 'ALL', label: 'All Holdings', count: holdings.length },
        { value: 'YES', label: 'Top 10 Flagged', count: holdings.filter(h => h.is_top_ten).length },
        { value: 'NO', label: 'Other Scripts', count: holdings.filter(h => !h.is_top_ten).length }
      ]
    }
  ];

  // Export to CSV / Excel helper
  const exportCurrentTabToCsv = () => {
    let rows = [];
    let filename = `portfolio_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeTab === 'holdings') {
      rows.push(['SI NO', 'Ticker', 'Company Name', 'Sector', 'Purchase Date', 'Qty', 'Buy Price', 'CMP', 'Invested Amt', 'Current Value', 'LTCG Status', 'P/L (INR)', 'P/L (%)', 'Top 10']);
      filteredHoldings.forEach((h, idx) => {
        rows.push([
          idx + 1,
          h.ticker,
          `"${h.name}"`,
          `"${h.sector}"`,
          h.purchase_date,
          h.qty,
          h.avg_price,
          h.cmp,
          h.amount_invested,
          h.current_value,
          `"${h.ltcg_status}"`,
          h.pnl,
          `${h.pnl_pct}%`,
          h.is_top_ten ? 'YES' : 'NO'
        ]);
      });
    } else if (activeTab === 'demat-ledger') {
      rows.push(['Date', 'Settlement No', 'Narration', 'Voucher No', 'Debit (INR)', 'Credit (INR)', 'Running Balance', 'Type']);
      dematLedger.forEach(row => {
        rows.push([
          row.trd_date,
          row.settlement_no,
          `"${row.narration}"`,
          row.voucher_no,
          row.debit,
          row.credit,
          row.running_balance,
          row.balance_type
        ]);
      });
    } else if (activeTab === 'order-log') {
      rows.push(['Order Date & Time', 'Exchange', 'Symbol', 'Action', 'Qty', 'Order Type', 'Limit Price', 'Product', 'Status', 'Days Since Purchase']);
      orderLog.forEach(row => {
        rows.push([
          row.ord_date_time,
          row.exchange,
          row.symbol,
          row.action,
          row.qty,
          row.order_type,
          row.limit_price,
          row.product,
          row.status,
          row.days_since_purchase
        ]);
      });
    } else if (activeTab === 'trade-details') {
      rows.push(['Trade Date', 'Trade No', 'Order No', 'Symbol', 'Action', 'Qty', 'Gross Rate', 'Market Value', 'Brokerage', 'STT', 'CGST', 'SGST', 'Stamp Duty', 'Turnover Tax', 'Net Rate', 'Net Total']);
      tradeDetails.forEach(row => {
        rows.push([
          row.trd_date,
          row.trd_no,
          row.order_no,
          row.symbol,
          row.action,
          row.qty,
          row.gross_rate,
          row.market_value,
          row.brokerage,
          row.stt,
          row.cgst,
          row.sgst,
          row.stamp_duty,
          row.turnover_tax,
          row.net_rate,
          row.net_total
        ]);
      });
    } else if (activeTab === 'trade-bills') {
      rows.push(['Bill Date', 'Settlement Date', 'Bill No', 'Exchange', 'Segment', 'Gross Turnover', 'Brokerage', 'Statutory Levies', 'Net Amount', 'Pay Type', 'Status']);
      tradeBills.forEach(row => {
        rows.push([
          row.bill_date,
          row.settlement_date,
          row.bill_number,
          row.exchange,
          row.segment,
          row.gross_turnover,
          row.brokerage,
          row.statutory_levies,
          row.net_amount,
          row.pay_type,
          row.status
        ]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddHoldingSubmit = async (e) => {
    e.preventDefault();
    try {
      await saveHoldingAPI(newHolding);
      setShowAddModal(false);
      fetchPortfolioData();
    } catch (err) {
      console.error('Error saving holding:', err);
    }
  };

  const handleSeedData = async () => {
    setLoading(true);
    try {
      await seedPortfolioAPI();
      await fetchPortfolioData();
    } catch (err) {
      console.error('Failed to seed portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.75rem', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
            Equity Portfolio & Demat Trading Suite
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Comprehensive stock holdings, LTCG 1-year tax maturity tracker, and NSE Demat client control ledger
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={exportCurrentTabToCsv}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem' }}
          >
            <Download size={16} />
            Export Tab to CSV
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem' }}
          >
            <Plus size={16} />
            Add Stock Holding
          </button>
        </div>
      </div>

      {/* KPI Cards Row (Resilient Responsive Grid) */}
      <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {/* Total Valuation */}
        <div className="card glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Portfolio Valuation
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)' }}>
              <TrendingUp size={18} color="#3b82f6" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#3b82f6', letterSpacing: '-0.02em' }}>
            ₹{(summary.total_current_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Invested Capital: <strong style={{ color: 'var(--text-primary)' }}>₹{(summary.total_invested || 0).toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Unrealized Gain */}
        <div className="card glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Unrealized P&L
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)' }}>
              <ArrowUpRight size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--accent-cr)', letterSpacing: '-0.02em' }}>
            +₹{(summary.total_unrealized_pnl || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-cr)', fontWeight: '600', marginTop: '0.35rem' }}>
            +{summary.total_pnl_pct || 0}% Total Return
          </div>
        </div>

        {/* LTCG Ready Value */}
        <div className="card glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              LTCG Ready (≥ 1 Year)
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)' }}>
              <ShieldCheck size={18} color="#8b5cf6" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#8b5cf6', letterSpacing: '-0.02em' }}>
            ₹{(summary.ltcg_ready_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Eligible for <strong>12.5% LTCG slab</strong> (Exempt up to ₹1.25L)
          </div>
        </div>

        {/* Short Term Holdings */}
        <div className="card glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              STCG Holdings (&lt; 1 Year)
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)' }}>
              <Clock size={18} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#f59e0b', letterSpacing: '-0.02em' }}>
            ₹{(summary.stcg_holding_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Holding period active (Subject to 20% STCG)
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {[
          { id: 'holdings', label: '1. Stock Holdings & LTCG Readiness', icon: PieChart, count: holdings.length },
          { id: 'demat-ledger', label: '2. Client Control A/C Ledger', icon: FileSpreadsheet, count: dematLedger.length },
          { id: 'order-log', label: '3. Equity Order Log', icon: Clock, count: orderLog.length },
          { id: 'trade-details', label: '4. Trade Details & Taxes', icon: BarChart3, count: tradeDetails.length },
          { id: 'trade-bills', label: '5. Equity Trade Bills', icon: FileText, count: tradeBills.length },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.15rem',
                borderRadius: '8px',
                border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                color: isActive ? '#3b82f6' : 'var(--text-muted)',
                fontWeight: isActive ? '700' : '500',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                fontSize: '0.875rem'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span style={{
                background: isActive ? '#3b82f6' : 'var(--border-color)',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                padding: '0.1rem 0.45rem',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: '700'
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: STOCK HOLDINGS & LTCG READINESS */}
      {activeTab === 'holdings' && (
        <div>
          {/* Slicer Filter Bar */}
          <SlicerBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search company, ticker, or sector..."
            groups={holdingsSlicers}
          />

          <div className="card glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="moneymatrix-table">
                <thead>
                  <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
                    <th {...getHoldingsSortHeaderProps('id')} style={{ width: '60px', textAlign: 'center' }}>
                      SI NO {renderHoldingsSortIndicator('id')}
                    </th>
                    <th {...getHoldingsSortHeaderProps('ticker')}>
                      Script / Company {renderHoldingsSortIndicator('ticker')}
                    </th>
                    <th {...getHoldingsSortHeaderProps('sector')}>
                      Sector {renderHoldingsSortIndicator('sector')}
                    </th>
                    <th {...getHoldingsSortHeaderProps('purchase_date')}>
                      Pur Date {renderHoldingsSortIndicator('purchase_date')}
                    </th>
                    <th {...getHoldingsSortHeaderProps('qty')} style={{ textAlign: 'right' }}>
                      Qty {renderHoldingsSortIndicator('qty')}
                    </th>
                    <th {...getHoldingsSortHeaderProps('avg_price')} style={{ textAlign: 'right' }}>
                      Buy Price {renderHoldingsSortIndicator('avg_price')}
                    </th>
                    <th {...getHoldingsSortHeaderProps('cmp')} style={{ textAlign: 'right' }}>
                      CMP {renderHoldingsSortIndicator('cmp')}
                    </th>
                    <th {...getHoldingsSortHeaderProps('amount_invested')} style={{ textAlign: 'right' }}>
                      Invested Amt {renderHoldingsSortIndicator('amount_invested')}
                    </th>
                    <th {...getHoldingsSortHeaderProps('current_value')} style={{ textAlign: 'right' }}>
                      Current Value {renderHoldingsSortIndicator('current_value')}
                    </th>
                    <th {...getHoldingsSortHeaderProps('days_held')} style={{ textAlign: 'center' }}>
                      LTCG Eligibility (1 Yr) {renderHoldingsSortIndicator('days_held')}
                    </th>
                    <th {...getHoldingsSortHeaderProps('pnl')} style={{ textAlign: 'right' }}>
                      P&L (₹) {renderHoldingsSortIndicator('pnl')}
                    </th>
                    <th {...getHoldingsSortHeaderProps('pnl_pct')} style={{ textAlign: 'right' }}>
                      Return (%) {renderHoldingsSortIndicator('pnl_pct')}
                    </th>
                    <th style={{ textAlign: 'center' }}>Top 10</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHoldings.length === 0 && (
                    <tr>
                      <td colSpan="13" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                          <PieChart size={36} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                          <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>
                            No Stock Holdings Recorded
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '420px' }}>
                            Workspace is in clean reset state. Click "+ Add Stock Holding" to register scripts, or import your holdings data once ready.
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {paginatedHoldings.map((h, idx) => (
                    <tr key={h.id || idx}>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {idx + 1}
                      </td>
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{h.ticker}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{h.name}</div>
                      </td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#3b82f6',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {h.sector || h.asset_class}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>{h.purchase_date}</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>{h.qty}</td>
                      <td style={{ textAlign: 'right' }}>₹{h.avg_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#3b82f6' }}>
                        ₹{h.cmp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right' }}>₹{h.amount_invested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700' }}>
                        ₹{h.current_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          background: h.is_ltcg ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: h.is_ltcg ? '#10b981' : '#f59e0b'
                        }}>
                          {h.is_ltcg ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                          {h.is_ltcg ? `Ready for Sale (${h.days_held}d)` : `Holding (${h.days_held}d)`}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {h.tax_treatment}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: h.pnl >= 0 ? 'var(--accent-cr)' : 'var(--accent-dr)' }}>
                        {h.pnl >= 0 ? '+' : ''}₹{h.pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: h.pnlPct >= 0 ? 'var(--accent-cr)' : 'var(--accent-dr)' }}>
                        {h.pnlPct >= 0 ? '+' : ''}{h.pnl_pct}%
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {h.is_top_ten ? (
                          <span style={{ color: '#eab308', fontWeight: '800', fontSize: '0.85rem' }}>★ Top 10</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {HoldingsPagination}
          </div>
        </div>
      )}

      {/* TAB 2: CLIENT CONTROL LEDGER (NSE DEMAT ACCOUNT) */}
      {activeTab === 'demat-ledger' && (
        <div className="card glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
                CLIENT CONTROL A/C - Demat Equity Broker Ledger
              </h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Direct Demat statement reconciliation of NSE cash traded values, UPI payouts, contracts & refunds
              </p>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Total Ledger Records: <strong>{dematLedger.length}</strong>
            </div>
          </div>

          <div className="table-responsive">
            <table className="moneymatrix-table">
              <thead>
                <tr style={{ background: 'var(--bg-card)' }}>
                  <th {...getLedgerSortHeaderProps('trd_date')}>Date {renderLedgerSortIndicator('trd_date')}</th>
                  <th {...getLedgerSortHeaderProps('settlement_no')}>Settlement / Ref No {renderLedgerSortIndicator('settlement_no')}</th>
                  <th {...getLedgerSortHeaderProps('narration')}>Description / Narration {renderLedgerSortIndicator('narration')}</th>
                  <th {...getLedgerSortHeaderProps('voucher_no')}>Voucher No {renderLedgerSortIndicator('voucher_no')}</th>
                  <th {...getLedgerSortHeaderProps('debit')} style={{ textAlign: 'right' }}>Debit (₹) {renderLedgerSortIndicator('debit')}</th>
                  <th {...getLedgerSortHeaderProps('credit')} style={{ textAlign: 'right' }}>Credit (₹) {renderLedgerSortIndicator('credit')}</th>
                  <th {...getLedgerSortHeaderProps('running_balance')} style={{ textAlign: 'right' }}>Running Balance {renderLedgerSortIndicator('running_balance')}</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLedger.map((row, idx) => (
                  <tr key={row.id || idx}>
                    <td style={{ fontWeight: '600', fontSize: '0.8125rem' }}>{row.trd_date}</td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'var(--bg-subtle)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                        {row.settlement_no}
                      </span>
                    </td>
                    <td style={{ fontWeight: '500', fontSize: '0.85rem' }}>{row.narration}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{row.voucher_no}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: row.debit > 0 ? 'var(--accent-dr)' : 'inherit' }}>
                      {row.debit > 0 ? `₹${row.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: row.credit > 0 ? 'var(--accent-cr)' : 'inherit' }}>
                      {row.credit > 0 ? `₹${row.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: row.running_balance >= 0 ? 'var(--accent-cr)' : 'var(--accent-dr)' }}>
                      ₹{Math.abs(row.running_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })} {row.balance_type}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        background: row.balance_type === 'Cr' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: row.balance_type === 'Cr' ? '#10b981' : '#ef4444'
                      }}>
                        {row.balance_type === 'Cr' ? 'SURPLUS CR' : 'PAYABLE DR'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {LedgerPagination}
        </div>
      )}

      {/* TAB 3: EQUITY ORDER LOG */}
      {activeTab === 'order-log' && (
        <div className="card glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
                Equity Order Log (NSE / BSE)
              </h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Timestamped trade order execution history with order types, product tags and days since purchase
              </p>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Total Orders: <strong>{orderLog.length}</strong>
            </div>
          </div>

          <div className="table-responsive">
            <table className="moneymatrix-table">
              <thead>
                <tr style={{ background: 'var(--bg-card)' }}>
                  <th {...getOrdersSortHeaderProps('ord_date_time')}>Order Date & Time {renderOrdersSortIndicator('ord_date_time')}</th>
                  <th {...getOrdersSortHeaderProps('exchange')}>Exch {renderOrdersSortIndicator('exchange')}</th>
                  <th {...getOrdersSortHeaderProps('symbol')}>Symbol {renderOrdersSortIndicator('symbol')}</th>
                  <th {...getOrdersSortHeaderProps('action')} style={{ textAlign: 'center' }}>Action {renderOrdersSortIndicator('action')}</th>
                  <th {...getOrdersSortHeaderProps('qty')} style={{ textAlign: 'right' }}>Qty {renderOrdersSortIndicator('qty')}</th>
                  <th {...getOrdersSortHeaderProps('order_type')}>Order Type {renderOrdersSortIndicator('order_type')}</th>
                  <th {...getOrdersSortHeaderProps('limit_price')} style={{ textAlign: 'right' }}>Limit Price {renderOrdersSortIndicator('limit_price')}</th>
                  <th {...getOrdersSortHeaderProps('product')}>Product {renderOrdersSortIndicator('product')}</th>
                  <th {...getOrdersSortHeaderProps('status')} style={{ textAlign: 'center' }}>Status {renderOrdersSortIndicator('status')}</th>
                  <th {...getOrdersSortHeaderProps('days_since_purchase')} style={{ textAlign: 'center' }}>Days Since Pur {renderOrdersSortIndicator('days_since_purchase')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((ord, idx) => (
                  <tr key={ord.id || idx}>
                    <td style={{ fontSize: '0.8125rem', fontFamily: 'monospace' }}>{ord.ord_date_time}</td>
                    <td style={{ fontWeight: '700', color: '#3b82f6' }}>{ord.exchange}</td>
                    <td style={{ fontWeight: '700' }}>{ord.symbol}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        background: ord.action === 'BUY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: ord.action === 'BUY' ? '#10b981' : '#ef4444'
                      }}>
                        {ord.action}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{ord.qty}</td>
                    <td>{ord.order_type}</td>
                    <td style={{ textAlign: 'right' }}>₹{ord.limit_price.toFixed(2)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{ord.product}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        background: ord.status === 'EXECUTED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: ord.status === 'EXECUTED' ? '#10b981' : '#ef4444'
                      }}>
                        {ord.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: '600' }}>
                      {ord.days_since_purchase !== '-' ? `${ord.days_since_purchase} days` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {OrdersPagination}
        </div>
      )}

      {/* TAB 4: EQUITY TRADE DETAILS */}
      {activeTab === 'trade-details' && (
        <div className="card glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
                Equity Trade Details & Statutory Tax Breakdown
              </h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Granular contract note details with Brokerage, STT, CGST, SGST, Stamp Duty, and Turnover Taxes
              </p>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Total Executed Trades: <strong>{tradeDetails.length}</strong>
            </div>
          </div>

          <div className="table-responsive">
            <table className="moneymatrix-table">
              <thead>
                <tr style={{ background: 'var(--bg-card)' }}>
                  <th {...getTradesSortHeaderProps('trd_date')}>Date</th>
                  <th {...getTradesSortHeaderProps('trd_no')}>Trade No</th>
                  <th {...getTradesSortHeaderProps('symbol')}>Symbol</th>
                  <th {...getTradesSortHeaderProps('action')} style={{ textAlign: 'center' }}>Action</th>
                  <th {...getTradesSortHeaderProps('qty')} style={{ textAlign: 'right' }}>Qty</th>
                  <th {...getTradesSortHeaderProps('gross_rate')} style={{ textAlign: 'right' }}>Gross Rate</th>
                  <th {...getTradesSortHeaderProps('market_value')} style={{ textAlign: 'right' }}>Market Value</th>
                  <th {...getTradesSortHeaderProps('brokerage')} style={{ textAlign: 'right' }}>Brokerage</th>
                  <th {...getTradesSortHeaderProps('stt')} style={{ textAlign: 'right' }}>STT</th>
                  <th {...getTradesSortHeaderProps('cgst')} style={{ textAlign: 'right' }}>GST</th>
                  <th {...getTradesSortHeaderProps('stamp_duty')} style={{ textAlign: 'right' }}>Stamp Duty</th>
                  <th {...getTradesSortHeaderProps('turnover_tax')} style={{ textAlign: 'right' }}>Turnover Tax</th>
                  <th {...getTradesSortHeaderProps('net_rate')} style={{ textAlign: 'right' }}>Net Rate</th>
                  <th {...getTradesSortHeaderProps('net_total')} style={{ textAlign: 'right' }}>Net Total</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrades.map((t, idx) => (
                  <tr key={t.id || idx}>
                    <td style={{ fontSize: '0.8125rem' }}>{t.trd_date}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.trd_no}</td>
                    <td style={{ fontWeight: '700' }}>{t.symbol}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '0.2rem 0.45rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981'
                      }}>
                        {t.action}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{t.qty}</td>
                    <td style={{ textAlign: 'right' }}>₹{t.gross_rate.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{t.market_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>₹{t.brokerage.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>₹{t.stt.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>₹{(t.cgst + t.sgst).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>₹{t.stamp_duty.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>₹{t.turnover_tax.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>₹{t.net_rate.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--accent-dr)' }}>
                      ₹{t.net_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {TradesPagination}
        </div>
      )}

      {/* TAB 5: EQUITY TRADE BILLS */}
      {activeTab === 'trade-bills' && (
        <div className="card glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
                Equity Trade Bills & Settlement Notes
              </h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Official settlement obligations, statutory levy totals and net payin/payout reconciliation
              </p>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Total Settlement Bills: <strong>{tradeBills.length}</strong>
            </div>
          </div>

          <div className="table-responsive">
            <table className="moneymatrix-table">
              <thead>
                <tr style={{ background: 'var(--bg-card)' }}>
                  <th {...getBillsSortHeaderProps('bill_date')}>Bill Date</th>
                  <th {...getBillsSortHeaderProps('settlement_date')}>Due / Settlement Date</th>
                  <th {...getBillsSortHeaderProps('bill_number')}>Bill Number</th>
                  <th {...getBillsSortHeaderProps('exchange')}>Exch / Seg</th>
                  <th {...getBillsSortHeaderProps('gross_turnover')} style={{ textAlign: 'right' }}>Gross Turnover</th>
                  <th {...getBillsSortHeaderProps('brokerage')} style={{ textAlign: 'right' }}>Total Brokerage</th>
                  <th {...getBillsSortHeaderProps('statutory_levies')} style={{ textAlign: 'right' }}>Statutory Levies</th>
                  <th {...getBillsSortHeaderProps('net_amount')} style={{ textAlign: 'right' }}>Net Payin / Payout</th>
                  <th style={{ textAlign: 'center' }}>Obligation</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBills.map((b, idx) => (
                  <tr key={b.id || idx}>
                    <td style={{ fontWeight: '600' }}>{b.bill_date}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{b.settlement_date}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: '700' }}>{b.bill_number}</td>
                    <td>
                      <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'var(--bg-subtle)', fontSize: '0.75rem', fontWeight: '600' }}>
                        {b.exchange} {b.segment}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>₹{b.gross_turnover.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>₹{b.brokerage.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>₹{b.statutory_levies.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: b.pay_type === 'PAYIN' ? 'var(--accent-dr)' : 'var(--accent-cr)' }}>
                      ₹{b.net_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        background: b.pay_type === 'PAYIN' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: b.pay_type === 'PAYIN' ? '#ef4444' : '#10b981'
                      }}>
                        {b.pay_type}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981'
                      }}>
                        <CheckCircle2 size={13} />
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {BillsPagination}
        </div>
      )}

      {/* Add Stock Holding Modal */}
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
          <div className="card glass-card" style={{ maxWidth: '520px', width: '100%', padding: '1.75rem', background: 'var(--bg-card)' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.25rem', fontWeight: '800' }}>
              Add Equity Stock Holding
            </h3>

            <form onSubmit={handleAddHoldingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Ticker Symbol</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RELIANCE"
                    value={newHolding.ticker}
                    onChange={e => setNewHolding({ ...newHolding, ticker: e.target.value.toUpperCase() })}
                    className="form-control"
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Reliance Industries Ltd"
                    value={newHolding.name}
                    onChange={e => setNewHolding({ ...newHolding, name: e.target.value })}
                    className="form-control"
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Sector / Asset Class</label>
                  <input
                    type="text"
                    required
                    value={newHolding.sector}
                    onChange={e => setNewHolding({ ...newHolding, sector: e.target.value, asset_class: e.target.value })}
                    className="form-control"
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Purchase Date</label>
                  <input
                    type="date"
                    required
                    value={newHolding.purchase_date}
                    onChange={e => setNewHolding({ ...newHolding, purchase_date: e.target.value })}
                    className="form-control"
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newHolding.qty}
                    onChange={e => setNewHolding({ ...newHolding, qty: parseInt(e.target.value) || 0 })}
                    className="form-control"
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Buy Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newHolding.avg_price}
                    onChange={e => setNewHolding({ ...newHolding, avg_price: parseFloat(e.target.value) || 0 })}
                    className="form-control"
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>CMP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newHolding.cmp}
                    onChange={e => setNewHolding({ ...newHolding, cmp: parseFloat(e.target.value) || 0 })}
                    className="form-control"
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  id="topTenCheck"
                  checked={!!newHolding.is_top_ten}
                  onChange={e => setNewHolding({ ...newHolding, is_top_ten: e.target.checked ? 1 : 0 })}
                />
                <label htmlFor="topTenCheck" style={{ fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                  Mark as Top 10 Core Holdings
                </label>
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
                  Save Stock Holding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
