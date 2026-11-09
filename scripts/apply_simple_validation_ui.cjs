const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'src', 'components', 'TransactionValidationView.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Find start of return statement
const returnIndex = content.indexOf('return (\n    <div style={{ padding: \'1.25rem\', maxWidth: \'1650px\', margin: \'0 auto\' }}>');
if (returnIndex === -1) {
  console.error("Could not find start of return statement");
  process.exit(1);
}

// Find boundary of detailed 19-column view
const detailedBoundary = content.indexOf('/* DETAILED 19-COLUMN VIEW (Full Horizontal Scroll for Detailed Audit) */');
if (detailedBoundary === -1) {
  console.error("Could not find detailed 19-column view boundary");
  process.exit(1);
}

// Find the ") : (" just before detailedBoundary
const ternarySplit = content.lastIndexOf(') : (', detailedBoundary);
if (ternarySplit === -1) {
  console.error("Could not find ternary split before detailed view");
  process.exit(1);
}

const beforeReturn = content.substring(0, returnIndex);
const afterTernary = content.substring(ternarySplit);

const newRenderCode = `return (
    <div style={{ padding: '1rem 1.25rem', maxWidth: '1680px', margin: '0 auto' }}>

      {/* Sleek Unified Header & Simple Date Navigator */}
      <div className="card glass-card" style={{
        padding: '0.85rem 1.25rem',
        marginBottom: '1rem',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem' }}>
          
          {/* Left: View Title & Live Day Scope */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, var(--primary-brand), #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
              flexShrink: 0
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  Daily Transaction Validation
                </h2>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.6875rem',
                  fontWeight: '800',
                  background: dayStats.isFullyLocked ? 'var(--accent-cr-bg)' : dayStats.isFullyVerified ? 'rgba(59, 130, 246, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                  color: dayStats.isFullyLocked ? 'var(--accent-cr)' : dayStats.isFullyVerified ? 'var(--primary-brand)' : '#b45309',
                  border: \`1px solid \${dayStats.isFullyLocked ? 'var(--accent-cr-border)' : dayStats.isFullyVerified ? 'rgba(59, 130, 246, 0.3)' : 'rgba(234, 179, 8, 0.3)'}\`
                }}>
                  {dayStats.isFullyLocked ? '🔒 Day Finalized & Locked' : dayStats.isFullyVerified ? '✅ All 100% Verified' : \`⚠️ \${dayStats.draftCount} Pending\`}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span><strong>{dayStats.totalLines}</strong> lines</span>
                <span>•</span>
                <span style={{ color: 'var(--accent-cr)', fontWeight: '700' }}>+{dayStats.crCount} Cr (₹{dayStats.totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })})</span>
                <span>•</span>
                <span style={{ color: 'var(--accent-dr)', fontWeight: '700' }}>-{dayStats.drCount} Dr (₹{dayStats.totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })})</span>
                <span>•</span>
                <span>Net: <strong style={{ color: dayStats.netFlow >= 0 ? 'var(--accent-cr)' : 'var(--accent-dr)' }}>₹{dayStats.netFlow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
              </div>
            </div>
          </div>

          {/* Center: Simple Date Navigator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'var(--bg-card-solid)',
            padding: '0.3rem 0.5rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            flexWrap: 'wrap'
          }}>
            {/* Prev */}
            <button
              onClick={() => handleStepDate(-1)}
              className="btn btn-secondary btn-sm"
              style={{ minHeight: '30px', padding: '0.2rem 0.55rem', fontSize: '0.75rem', fontWeight: '700' }}
              title="Previous Date (Older)"
            >
              <ChevronLeft size={15} />
              <span className="hidden-sm">Prev</span>
            </button>

            {/* Calendar Date Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.15rem 0.45rem',
              background: 'var(--bg-input)',
              borderRadius: '6px',
              border: '1px solid var(--border-color)'
            }}>
              <CalendarIcon size={14} style={{ color: 'var(--primary-brand)' }} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontWeight: '700',
                  fontSize: '0.8125rem',
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Next */}
            <button
              onClick={() => handleStepDate(1)}
              className="btn btn-secondary btn-sm"
              style={{ minHeight: '30px', padding: '0.2rem 0.55rem', fontSize: '0.75rem', fontWeight: '700' }}
              title="Next Date (Newer)"
            >
              <span className="hidden-sm">Next</span>
              <ChevronRight size={15} />
            </button>

            {/* Quick Date Dropdown */}
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-control"
              style={{
                height: '30px',
                fontSize: '0.75rem',
                fontWeight: '600',
                padding: '0.1rem 0.4rem',
                maxWidth: '190px',
                borderRadius: '6px'
              }}
            >
              {dropdownDateOptions.map(d => (
                <option key={d.date} value={d.date}>
                  {d.date} {d.pending > 0 ? \`(\${d.pending} pend)\` : '✓'}
                </option>
              ))}
            </select>

            <button
              onClick={handleJumpToday}
              className="btn btn-secondary btn-sm"
              style={{ minHeight: '30px', padding: '0.2rem 0.5rem', fontSize: '0.71875rem' }}
              title="Jump to Today"
            >
              Today
            </button>

            {/* Next Pending Button */}
            {datesWithPending.length > 0 && (
              <button
                onClick={handleJumpNextPending}
                className="btn btn-primary btn-sm"
                style={{
                  minHeight: '30px',
                  padding: '0.2rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: 'var(--primary-brand)',
                  color: '#fff'
                }}
                title="Jump to next date with pending items"
              >
                <FastForward size={13} />
                <span>Next Pending ({datesWithPending.length})</span>
              </button>
            )}
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleAutoClassifyDate}
              disabled={actionLoading || dateTransactions.length === 0}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              title="Automatically classify subcategories from bank particulars"
            >
              <Sparkles size={13} style={{ color: '#eab308' }} />
              <span>Auto-Classify</span>
            </button>

            {dayStats.draftCount > 0 && (
              <button
                onClick={handleBatchVerifyDate}
                disabled={actionLoading}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-brand)', border: '1px solid var(--primary-brand)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                title="Verify all pending lines for this date"
              >
                <Check size={14} />
                <span>Verify All ({dayStats.draftCount})</span>
              </button>
            )}

            {dayStats.isFullyLocked ? (
              <button
                onClick={handleBatchUnlockDate}
                disabled={actionLoading}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', fontWeight: '700', color: '#eab308' }}
              >
                <Unlock size={13} />
                <span>Unlock Day</span>
              </button>
            ) : (
              <button
                onClick={handleBatchLockDate}
                disabled={actionLoading || dayStats.totalLines === 0}
                className="btn btn-success btn-sm"
                style={{ fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                title="Freeze and finalize this day"
              >
                <Lock size={13} />
                <span>Lock Day</span>
              </button>
            )}

            <button
              onClick={handleExportDaySheet}
              className="btn btn-secondary btn-sm"
              title="Export formatted Excel sheet"
              style={{ padding: '0.25rem 0.5rem' }}
            >
              <Download size={14} />
            </button>

            <button
              onClick={() => setShowAnalyticsCards(prev => !prev)}
              className={\`btn btn-sm \${showAnalyticsCards ? 'btn-primary' : 'btn-secondary'}\`}
              style={{ fontSize: '0.71875rem', padding: '0.25rem 0.55rem' }}
              title="Toggle detailed KPI cards"
            >
              📊 Stats
            </button>
          </div>
        </div>

        {/* Collapsible KPI Scoreboard (Only when requested via Stats button) */}
        {showAnalyticsCards && (
          <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
            <div className="validation-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="validation-kpi-card">
                <div className="kpi-label"><ShieldCheck size={14} style={{ color: 'var(--primary-brand)' }} /><span>Day Scope</span></div>
                <div className="kpi-val">{dayStats.totalLines} lines</div>
                <div className="kpi-sub"><span>Draft: {dayStats.draftCount}</span><span>Verified: {dayStats.verifiedCount}</span><span>Locked: {dayStats.lockedCount}</span></div>
              </div>
              <div className="validation-kpi-card">
                <div className="kpi-label"><TrendingUp size={14} style={{ color: 'var(--accent-cr)' }} /><span>Day Inflow (Cr)</span></div>
                <div className="kpi-val" style={{ color: 'var(--accent-cr)' }}>+₹{dayStats.totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="kpi-sub"><span>{dayStats.crCount} Credit Line{dayStats.crCount === 1 ? '' : 's'}</span></div>
              </div>
              <div className="validation-kpi-card">
                <div className="kpi-label"><TrendingDown size={14} style={{ color: 'var(--accent-dr)' }} /><span>Day Outflow (Dr)</span></div>
                <div className="kpi-val" style={{ color: 'var(--accent-dr)' }}>-₹{dayStats.totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="kpi-sub"><span>{dayStats.drCount} Debit Line{dayStats.drCount === 1 ? '' : 's'}</span></div>
              </div>
              <div className="validation-kpi-card">
                <div className="kpi-label"><Scale size={14} /><span>Net Day Cashflow</span></div>
                <div className="kpi-val" style={{ color: dayStats.netFlow >= 0 ? 'var(--accent-cr)' : 'var(--accent-dr)' }}>
                  {dayStats.netFlow >= 0 ? '+' : ''}₹{dayStats.netFlow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="kpi-sub"><span>{dayStats.netFlow >= 0 ? '▲ Net Liquidity Surplus' : '▼ Net Cash Reduction'}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Feedback */}
      {statusMessage.text && (
        <div style={{
          marginBottom: '0.85rem',
          padding: '0.65rem 1rem',
          borderRadius: '8px',
          background: statusMessage.type === 'success' ? 'var(--accent-cr-bg)' : 'rgba(59, 130, 246, 0.12)',
          border: \`1px solid \${statusMessage.type === 'success' ? 'var(--accent-cr-border)' : 'rgba(59, 130, 246, 0.3)'}\`,
          color: statusMessage.type === 'success' ? 'var(--accent-cr)' : 'var(--primary-brand)',
          fontSize: '0.8125rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={16} />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Bulk Action Pill Bar */}
      {selectedRowIds.length > 0 && (
        <div className="bulk-action-pill-bar" style={{ marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              background: 'var(--primary-brand)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: '800',
              padding: '0.2rem 0.6rem',
              borderRadius: '20px'
            }}>
              {selectedRowIds.length} Selected
            </span>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Bulk Actions:
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleBulkVerifySelected}
              disabled={actionLoading}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-brand)' }}
            >
              <Check size={14} style={{ marginRight: '0.2rem' }} />
              <span>Verify Selected</span>
            </button>
            <button
              onClick={handleBulkLockSelected}
              disabled={actionLoading}
              className="btn btn-success btn-sm"
              style={{ fontSize: '0.75rem', fontWeight: '700' }}
            >
              <Lock size={14} style={{ marginRight: '0.2rem' }} />
              <span>Lock Selected</span>
            </button>
            <button
              onClick={() => setIsBulkCategoryModalOpen(true)}
              disabled={actionLoading}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', fontWeight: '700' }}
            >
              <Tag size={14} style={{ marginRight: '0.2rem' }} />
              <span>Set Dimensions</span>
            </button>
            <button
              onClick={handleBulkDeleteSelected}
              disabled={actionLoading}
              className="btn btn-danger btn-sm"
              style={{ fontSize: '0.75rem', fontWeight: '700' }}
            >
              <Trash2 size={14} style={{ marginRight: '0.2rem' }} />
              <span>Delete</span>
            </button>
            <button
              onClick={() => setSelectedRowIds([])}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Slim Search & Filter Strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.65rem',
        marginBottom: '0.75rem'
      }}>
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchParticulars}
              onChange={(e) => setSearchParticulars(e.target.value)}
              placeholder="Filter particulars, subcategory, UTR..."
              className="form-control"
              style={{
                paddingLeft: '32px',
                height: '32px',
                fontSize: '0.78125rem',
                borderRadius: '8px'
              }}
            />
            {searchParticulars && (
              <button
                onClick={() => setSearchParticulars('')}
                style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Buttons & Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {/* Quick Flow Filter */}
          <div style={{ display: 'inline-flex', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-color)', padding: '2px' }}>
            <button
              onClick={() => setFlowTypeFilter('ALL')}
              style={{
                background: flowTypeFilter === 'ALL' ? 'var(--primary-brand)' : 'transparent',
                color: flowTypeFilter === 'ALL' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.71875rem',
                fontWeight: flowTypeFilter === 'ALL' ? '700' : '500',
                cursor: 'pointer'
              }}
            >
              All ({rawDateTxs.length})
            </button>
            <button
              onClick={() => setFlowTypeFilter('Dr')}
              style={{
                background: flowTypeFilter === 'Dr' ? 'var(--accent-dr)' : 'transparent',
                color: flowTypeFilter === 'Dr' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.71875rem',
                fontWeight: flowTypeFilter === 'Dr' ? '700' : '500',
                cursor: 'pointer'
              }}
            >
              Debits ({dayStats.drCount})
            </button>
            <button
              onClick={() => setFlowTypeFilter('Cr')}
              style={{
                background: flowTypeFilter === 'Cr' ? 'var(--accent-cr)' : 'transparent',
                color: flowTypeFilter === 'Cr' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.71875rem',
                fontWeight: flowTypeFilter === 'Cr' ? '700' : '500',
                cursor: 'pointer'
              }}
            >
              Credits ({dayStats.crCount})
            </button>
          </div>

          {/* Quick Status Filter */}
          <div style={{ display: 'inline-flex', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-color)', padding: '2px' }}>
            <button
              onClick={() => setStatusFilter('ALL')}
              style={{
                background: statusFilter === 'ALL' ? 'var(--primary-brand)' : 'transparent',
                color: statusFilter === 'ALL' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.71875rem',
                fontWeight: statusFilter === 'ALL' ? '700' : '500',
                cursor: 'pointer'
              }}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              style={{
                background: statusFilter === 'draft' ? '#eab308' : 'transparent',
                color: statusFilter === 'draft' ? '#000' : 'var(--text-secondary)',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.71875rem',
                fontWeight: statusFilter === 'draft' ? '700' : '500',
                cursor: 'pointer'
              }}
            >
              Pending ({dayStats.draftCount})
            </button>
          </div>

          {/* View Mode Switcher */}
          <div style={{ display: 'inline-flex', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-color)', padding: '2px', marginLeft: '0.25rem' }}>
            <button
              onClick={() => setFastAuditMode(true)}
              style={{
                background: fastAuditMode ? 'var(--primary-brand)' : 'transparent',
                color: fastAuditMode ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.71875rem',
                fontWeight: fastAuditMode ? '800' : '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <Zap size={11} />
              <span>Fast View</span>
            </button>
            <button
              onClick={() => setFastAuditMode(false)}
              style={{
                background: !fastAuditMode ? 'var(--primary-brand)' : 'transparent',
                color: !fastAuditMode ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.71875rem',
                fontWeight: !fastAuditMode ? '800' : '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <Layers size={11} />
              <span>Full Ledger (19)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Validation Table Card */}
      <div className="card glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        
        {dateTransactions.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <CalendarIcon size={44} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              No Transactions Recorded For {selectedDate}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.4rem auto 1.25rem', maxWidth: '480px' }}>
              There are no transactions recorded for this date matching your active filters.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleJumpNextPending}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: '700' }}
              >
                <FastForward size={14} style={{ marginRight: '0.3rem' }} />
                <span>Jump to Next Pending Date ({datesWithPending.length})</span>
              </button>
              <button
                onClick={handleJumpLatest}
                className="btn btn-secondary btn-sm"
              >
                <span>Jump to Latest Date</span>
              </button>
            </div>
          </div>
        ) : fastAuditMode ? (
          /* FAST AUDIT VIEW: FULL PARTICULARS + CR/DR ADAPTIVE DIMENSIONS */
          <div style={{ overflowX: 'auto', maxHeight: '74vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78125rem', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
                <tr>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.65rem 0.4rem', textAlign: 'center', width: '36px' }}>
                    <input
                      type="checkbox"
                      checked={selectedRowIds.length > 0 && paginatedDateTransactions.length > 0 && paginatedDateTransactions.every(t => selectedRowIds.includes(t.id))}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.65rem 0.55rem', width: '75px' }}>
                    # / DATE
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.65rem 0.75rem', minWidth: '320px' }}>
                    FULL PARTICULARS & ACCOUNT
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.65rem 0.65rem', textAlign: 'right', width: '115px' }}>
                    AMOUNT (₹)
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.65rem 0.65rem', width: '215px' }}>
                    SUB-CATEGORY
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.65rem 0.65rem', width: '165px' }}>
                    COST / PROFIT CENTER
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.65rem 0.65rem', width: '155px' }}>
                    BUDGET PLAN
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.65rem 0.65rem', width: '150px' }}>
                    PROJECT / UTR
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.65rem 0.65rem', textAlign: 'center', width: '125px' }}>
                    STATUS & VERIFY
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.65rem 0.4rem', textAlign: 'center', width: '38px' }}>
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedDateTransactions.map((tx, idx) => {
                  const isLocked = (tx.auditStatus || tx.audit_status) === 'frozen';
                  const isVerified = (tx.auditStatus || tx.audit_status) === 'verified';
                  const isSelected = selectedRowIds.includes(tx.id);
                  const currentSubcat = tx.subcategory || tx.categoryName || '';
                  const matchedCat = categories.find(c => (c.subcategory || c.name) === currentSubcat);
                  const val = evaluateTransactionValidation(tx);

                  return (
                    <tr
                      key={tx.id}
                      style={{
                        background: isSelected ? 'rgba(59, 130, 246, 0.12)' : (idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-card-solid)'),
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '0.65rem 0.4rem', textAlign: 'center', verticalAlign: 'top' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRow(tx.id)}
                        />
                      </td>

                      {/* Line & Date */}
                      <td style={{ padding: '0.65rem 0.55rem', verticalAlign: 'top' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: '800', color: 'var(--primary-brand)', fontSize: '0.75rem' }}>
                          #{tx.tranNo || tx.tran_no || tx.id}
                        </div>
                        <div style={{ fontSize: '0.65625rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {tx.date || tx.tran_date}
                        </div>
                      </td>

                      {/* Full Particulars & Account (NO TRUNCATION!) */}
                      <td style={{ padding: '0.65rem 0.75rem', verticalAlign: 'top' }}>
                        <div style={{
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          fontSize: '0.8125rem',
                          lineHeight: '1.4',
                          wordBreak: 'break-word',
                          whiteSpace: 'normal'
                        }}>
                          {tx.notes || tx.particulars || '—'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '5px', flexWrap: 'wrap' }}>
                          <span className="badge badge-neutral" style={{ fontSize: '0.6875rem', padding: '1px 6px', fontWeight: '700' }}>
                            <Landmark size={10} style={{ marginRight: '3px' }} />
                            {tx.accountNo || tx.account_no || 'Cash_1'}
                          </span>
                          <span style={{
                            fontSize: '0.625rem',
                            fontWeight: '800',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: (tx.transactionType || tx.transaction_type) === 'ROTATIONAL' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(59, 130, 246, 0.12)',
                            color: (tx.transactionType || tx.transaction_type) === 'ROTATIONAL' ? '#b45309' : 'var(--primary-brand)'
                          }}>
                            {(tx.transactionType || tx.transaction_type) === 'ROTATIONAL' ? 'ROTATIONAL' : 'ACTUAL'}
                          </span>
                          {tx.tagging && (
                            <span style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: '4px', background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                              #{tx.tagging}
                            </span>
                          )}
                          {val.badge !== 'VALIDATED' && val.badge !== 'ROTATIONAL' && (
                            <span style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: '4px', background: val.bg, color: val.color, fontWeight: '800' }} title={val.message}>
                              {val.badge}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount & Type */}
                      <td style={{ padding: '0.65rem 0.65rem', textAlign: 'right', verticalAlign: 'top' }}>
                        <div style={{
                          fontWeight: '800',
                          fontSize: '0.875rem',
                          color: tx.type === 'Cr' ? 'var(--accent-cr)' : 'var(--accent-dr)'
                        }}>
                          {tx.type === 'Cr' ? '+' : '-'}₹{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <span className={tx.type === 'Cr' ? 'badge badge-cr' : 'badge badge-dr'} style={{ fontSize: '0.625rem', padding: '0 5px', marginTop: '2px' }}>
                          {tx.type === 'Cr' ? 'Credit (Inflow)' : 'Debit (Outflow)'}
                        </span>
                      </td>

                      {/* Sub-Category Direct Selector */}
                      <td style={{ padding: '0.65rem 0.65rem', verticalAlign: 'top' }}>
                        <select
                          value={currentSubcat}
                          disabled={isLocked || actionLoading}
                          onChange={(e) => handleQuickSubcatChange(tx, e.target.value)}
                          className="form-control"
                          style={{
                            height: '30px',
                            fontSize: '0.78125rem',
                            fontWeight: '700',
                            padding: '0.15rem 0.45rem',
                            borderColor: !currentSubcat ? '#f59e0b' : 'var(--border-color)',
                            background: isLocked ? 'var(--bg-input-disabled)' : 'var(--bg-input)'
                          }}
                        >
                          <option value="">-- Select SubCategory ({categories.length}) --</option>
                          {Array.from(new Set(categories.map(c => c.division || 'LIVING'))).map(div => (
                            <optgroup key={div} label={\`📁 \${div}\`}>
                              {categories.filter(c => (c.division || 'LIVING') === div).map(cat => (
                                <option key={cat.id} value={cat.subcategory || cat.name}>
                                  {cat.subcategory || cat.name} {cat.category ? \`(\${cat.category})\` : ''}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>

                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--primary-brand)', fontWeight: '700' }}>
                            {matchedCat?.division || tx.division || 'LIVING'}
                          </span>
                          <span>&gt;</span>
                          <span>{matchedCat?.category || tx.category || 'General'}</span>
                          {matchedCat?.sub_type && (
                            <span style={{ color: 'var(--text-secondary)' }}>({matchedCat.sub_type})</span>
                          )}
                        </div>
                      </td>

                      {/* Cost Center (Dr) or Profit Center (Cr) */}
                      <td style={{ padding: '0.65rem 0.65rem', verticalAlign: 'top' }}>
                        {tx.type === 'Dr' ? (
                          <div>
                            <div style={{ fontSize: '0.625rem', fontWeight: '800', color: 'var(--primary-brand)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <span>🏢 COST CENTER</span>
                            </div>
                            <select
                              value={tx.costCenter || tx.cost_center || ''}
                              disabled={isLocked || actionLoading}
                              onChange={(e) => handleQuickDimensionChange(tx, 'costCenter', e.target.value)}
                              className="form-control"
                              style={{
                                height: '28px',
                                fontSize: '0.75rem',
                                padding: '0.15rem 0.35rem',
                                borderColor: !(tx.costCenter || tx.cost_center) ? '#f59e0b' : 'var(--border-color)'
                              }}
                            >
                              <option value="">-- Cost Center --</option>
                              {costCenterOptions.map(cc => (
                                <option key={cc.code || cc.id || cc.name} value={cc.name}>{cc.name}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: '0.625rem', fontWeight: '800', color: 'var(--accent-cr)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <span>💼 PROFIT CENTER (INCOME)</span>
                            </div>
                            <select
                              value={tx.profitCenter || tx.profit_center || ''}
                              disabled={isLocked || actionLoading}
                              onChange={(e) => handleQuickDimensionChange(tx, 'profitCenter', e.target.value)}
                              className="form-control"
                              style={{
                                height: '28px',
                                fontSize: '0.75rem',
                                padding: '0.15rem 0.35rem',
                                borderColor: !(tx.profitCenter || tx.profit_center) ? '#f59e0b' : 'var(--accent-cr-border)',
                                background: 'rgba(16, 185, 129, 0.05)'
                              }}
                            >
                              <option value="">-- Profit Center --</option>
                              {profitCenterOptions.map(pc => (
                                <option key={pc.code || pc.id || pc.name} value={pc.name}>{pc.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </td>

                      {/* Budget Plan (Expense Only) */}
                      <td style={{ padding: '0.65rem 0.65rem', verticalAlign: 'top' }}>
                        {tx.type === 'Dr' ? (
                          <div>
                            <div style={{ fontSize: '0.625rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                              <span>🎯 BUDGET</span>
                            </div>
                            <select
                              value={tx.budget || ''}
                              disabled={isLocked || actionLoading}
                              onChange={(e) => handleQuickDimensionChange(tx, 'budget', e.target.value)}
                              className="form-control"
                              style={{
                                height: '28px',
                                fontSize: '0.75rem',
                                padding: '0.15rem 0.35rem'
                              }}
                            >
                              <option value="">-- Budget Plan --</option>
                              {budgetOptions.map(b => (
                                <option key={b.code || b.id || b.name} value={b.name}>{b.name}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div style={{ height: '28px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.71875rem', fontStyle: 'italic' }}>
                            — (N/A for Credit)
                          </div>
                        )}
                      </td>

                      {/* Project & UTR */}
                      <td style={{ padding: '0.65rem 0.65rem', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <select
                            value={tx.project || ''}
                            disabled={isLocked || actionLoading}
                            onChange={(e) => handleQuickDimensionChange(tx, 'project', e.target.value)}
                            className="form-control"
                            style={{ height: '26px', fontSize: '0.71875rem', padding: '0.1rem 0.35rem' }}
                          >
                            <option value="">-- Project (Opt) --</option>
                            {projectOptions.map(p => (
                              <option key={p.code || p.id || p.name} value={p.name}>{p.name}</option>
                            ))}
                          </select>

                          <input
                            type="text"
                            defaultValue={tx.utrNo || tx.utr_no || ''}
                            placeholder="UTR / Ref #"
                            disabled={isLocked || actionLoading}
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              if (val !== (tx.utrNo || tx.utr_no || '')) {
                                handleQuickDimensionChange(tx, 'utrNo', val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.target.blur();
                            }}
                            style={{
                              width: '100%',
                              height: '24px',
                              fontSize: '0.6875rem',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '5px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-input)',
                              color: 'var(--text-primary)',
                              fontFamily: 'monospace'
                            }}
                          />
                        </div>
                      </td>

                      {/* Status & Verify Action */}
                      <td style={{ padding: '0.65rem 0.65rem', textAlign: 'center', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {isLocked ? (
                            <>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '12px',
                                background: 'var(--accent-cr-bg)',
                                color: 'var(--accent-cr)',
                                fontSize: '0.6875rem',
                                fontWeight: '800'
                              }}>
                                <Lock size={10} />
                                <span>LOCKED</span>
                              </span>
                              <button
                                onClick={() => handleUnlockRow(tx)}
                                disabled={actionLoading}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '0.15rem 0.35rem', fontSize: '0.6875rem', color: '#eab308' }}
                                title="Unlock row"
                              >
                                <Unlock size={11} />
                              </button>
                            </>
                          ) : isVerified ? (
                            <>
                              <button
                                onClick={() => handleUnlockRow(tx)}
                                disabled={actionLoading}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '12px',
                                  background: 'rgba(59, 130, 246, 0.15)',
                                  color: 'var(--primary-brand)',
                                  fontSize: '0.6875rem',
                                  fontWeight: '800',
                                  border: '1px solid rgba(59, 130, 246, 0.3)',
                                  cursor: 'pointer'
                                }}
                                title="Click to unverify back to draft"
                              >
                                <CheckCircle2 size={11} />
                                <span>VERIFIED</span>
                              </button>
                              <button
                                onClick={() => handleLockRow(tx)}
                                disabled={actionLoading}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '0.15rem 0.35rem', fontSize: '0.6875rem', color: 'var(--accent-cr)' }}
                                title="Lock & Freeze line"
                              >
                                <Lock size={11} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleVerifyRow(tx)}
                              disabled={actionLoading}
                              className="btn btn-primary btn-sm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.25rem 0.65rem',
                                fontSize: '0.75rem',
                                fontWeight: '800',
                                borderRadius: '6px'
                              }}
                              title="Verify line item"
                            >
                              <Check size={13} />
                              <span>Verify</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Delete Action */}
                      <td style={{ padding: '0.65rem 0.4rem', textAlign: 'center', verticalAlign: 'top' }}>
                        {!isLocked && (
                          <button
                            onClick={() => handleDeleteRow(tx)}
                            disabled={actionLoading}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px',
                              borderRadius: '4px'
                            }}
                            title="Delete transaction line"
                          >
                            <Trash2 size={13} style={{ color: 'var(--accent-dr)', opacity: 0.7 }} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        `;

const finalContent = beforeReturn + newRenderCode + afterTernary;
fs.writeFileSync(targetFile, finalContent, 'utf8');
console.log('Successfully patched simple validation UI with full particulars and Cr/Dr adaptive dimensions!');

