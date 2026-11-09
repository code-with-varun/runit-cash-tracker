const fs = require('fs');

let content = fs.readFileSync('src/components/TransactionValidationView.jsx', 'utf8');

// Find start of table card:
// <div className="card glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
const cardStartTarget = `<div className="card glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '14px', border: '1px solid var(--border-color)' }}>`;

const cardHeaderCode = `<div className="card glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
        
        {/* Table View Mode Switcher Header */}
        <div style={{
          padding: '0.65rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card-solid)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              display: 'inline-flex',
              padding: '2px',
              borderRadius: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)'
            }}>
              <button
                type="button"
                onClick={() => setFastAuditMode(true)}
                className={\`btn btn-sm \${fastAuditMode ? 'btn-primary' : 'btn-ghost'}\`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: fastAuditMode ? '800' : '600',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px'
                }}
                title="Compact view: Zero horizontal scroll! Select SubCategory and Verify in 1 click."
              >
                <Zap size={13} />
                <span>⚡ Fast Validation (No Scroll)</span>
              </button>

              <button
                type="button"
                onClick={() => setFastAuditMode(false)}
                className={\`btn btn-sm \${!fastAuditMode ? 'btn-primary' : 'btn-ghost'}\`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: !fastAuditMode ? '800' : '600',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px'
                }}
                title="Full 19-column spreadsheet view with detailed banking and ledger fields."
              >
                <Layers size={13} />
                <span>📊 Detailed Ledger (19 Cols)</span>
              </button>
            </div>

            <span style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
              {fastAuditMode ? '🎯 Select SubCategory & click Verify directly on the row — zero scrolling!' : '📑 Full banking ledger view with all 19 dimensions'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleAutoClassifyDate}
              disabled={actionLoading || dateTransactions.length === 0}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.71875rem', fontWeight: '700' }}
              title="Automatically match particulars against category rules (e.g. Shell -> PETROL, Swiggy -> FOOD)"
            >
              <Sparkles size={13} style={{ color: '#eab308' }} />
              <span>Auto-Classify Particulars</span>
            </button>
          </div>
        </div>`;

if (content.includes(cardStartTarget) && !content.includes('Table View Mode Switcher Header')) {
  content = content.replace(cardStartTarget, cardHeaderCode);
  console.log('Added table view mode switcher header');
}

// Now replace `<div style={{ overflowX: 'auto', maxHeight: '72vh' }}>` with the conditional `fastAuditMode`
const tableStartTarget = `        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '72vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left', whiteSpace: 'nowrap' }}>`;

const fastAuditTableHtml = `        ) : fastAuditMode ? (
          /* FAST AUDIT VIEW: FITS 100% ON SCREEN WITHOUT HORIZONTAL SCROLL */
          <div style={{ overflowX: 'auto', maxHeight: '72vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78125rem', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
                <tr>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.5rem', textAlign: 'center', width: '38px' }}>
                    <input
                      type="checkbox"
                      checked={selectedRowIds.length > 0 && paginatedDateTransactions.length > 0 && paginatedDateTransactions.every(t => selectedRowIds.includes(t.id))}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.65rem', width: '100px' }}>
                    LINE / DATE
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.85rem', minWidth: '220px' }}>
                    PARTICULARS & ACCOUNT
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', textAlign: 'right', width: '120px' }}>
                    AMOUNT (₹)
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', width: '235px' }}>
                    SUB-CATEGORY
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', width: '155px' }}>
                    DIMENSIONS
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', textAlign: 'center', width: '160px' }}>
                    STATUS & VERIFY
                  </th>
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.5rem', textAlign: 'center', width: '45px' }}>
                    
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
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRow(tx.id)}
                        />
                      </td>

                      {/* Line & Date */}
                      <td style={{ padding: '0.65rem 0.65rem' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: '800', color: 'var(--primary-brand)', fontSize: '0.75rem' }}>
                          #{tx.tranNo || tx.tran_no || tx.id}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {tx.date || tx.tran_date}
                        </div>
                      </td>

                      {/* Particulars & Account */}
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <div
                          style={{
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            fontSize: '0.8125rem',
                            lineHeight: '1.25',
                            maxWidth: '320px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={tx.notes || tx.particulars}
                        >
                          {tx.notes || tx.particulars || '—'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span className="badge badge-neutral" style={{ fontSize: '0.6875rem', padding: '1px 6px' }}>
                            <Landmark size={10} style={{ marginRight: '3px' }} />
                            {tx.accountNo || tx.account_no || 'Cash_1'}
                          </span>
                          {tx.tagging && (
                            <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-brand)', fontWeight: '700' }}>
                              #{tx.tagging}
                            </span>
                          )}
                          {val.badge !== 'VALIDATED' && (
                            <span style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: '4px', background: val.bg, color: val.color, fontWeight: '800' }} title={val.message}>
                              {val.badge}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>
                        <div style={{
                          fontWeight: '800',
                          fontSize: '0.875rem',
                          color: tx.type === 'Cr' ? 'var(--accent-cr)' : 'var(--accent-dr)'
                        }}>
                          {tx.type === 'Cr' ? '+' : '-'}₹{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <span className={tx.type === 'Cr' ? 'badge badge-cr' : 'badge badge-dr'} style={{ fontSize: '0.625rem', padding: '0 4px', marginTop: '2px' }}>
                          {tx.type === 'Cr' ? 'Credit' : 'Debit'}
                        </span>
                      </td>

                      {/* SubCategory Direct Selector */}
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <select
                          value={currentSubcat}
                          disabled={isLocked || actionLoading}
                          onChange={(e) => handleQuickSubcatChange(tx, e.target.value)}
                          className="form-control"
                          style={{
                            height: '32px',
                            fontSize: '0.78125rem',
                            fontWeight: '700',
                            padding: '0.2rem 0.5rem',
                            borderColor: !currentSubcat ? '#f59e0b' : 'var(--border-color)',
                            background: isLocked ? 'var(--bg-input-disabled)' : 'var(--bg-input)'
                          }}
                        >
                          <option value="">-- Select Classification ({categories.length}) --</option>
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

                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
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

                      {/* Dimensions (Cost Center / Profit Center / Budget) */}
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        {tx.type === 'Dr' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <select
                              value={tx.costCenter || tx.cost_center || ''}
                              disabled={isLocked || actionLoading}
                              onChange={(e) => handleQuickDimensionChange(tx, 'costCenter', e.target.value)}
                              className="form-control"
                              style={{ height: '26px', fontSize: '0.71875rem', padding: '0.1rem 0.35rem' }}
                            >
                              <option value="">-- Cost Center --</option>
                              {(masters?.cost_centers || []).map(cc => (
                                <option key={cc.code || cc.id} value={cc.name}>{cc.name}</option>
                              ))}
                            </select>

                            <div style={{ fontSize: '0.65625rem', color: tx.budget ? 'var(--primary-brand)' : 'var(--text-muted)' }}>
                              🎯 {tx.budget || 'Home Budget'}
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <select
                              value={tx.profitCenter || tx.profit_center || ''}
                              disabled={isLocked || actionLoading}
                              onChange={(e) => handleQuickDimensionChange(tx, 'profitCenter', e.target.value)}
                              className="form-control"
                              style={{ height: '26px', fontSize: '0.71875rem', padding: '0.1rem 0.35rem' }}
                            >
                              <option value="">-- Profit Center --</option>
                              {(masters?.profit_centers || []).map(pc => (
                                <option key={pc.code || pc.id} value={pc.name}>{pc.name}</option>
                              ))}
                            </select>
                            <div style={{ fontSize: '0.65625rem', color: 'var(--accent-cr)', fontWeight: '700' }}>
                              💼 Inflow Earner
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status & 1-Click Action */}
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {isLocked ? (
                            <>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                padding: '0.15rem 0.45rem',
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
                                style={{ padding: '0.15rem 0.4rem', fontSize: '0.6875rem', color: '#eab308' }}
                                title="Unlock line item"
                              >
                                <Unlock size={11} />
                              </button>
                            </>
                          ) : isVerified ? (
                            <>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '12px',
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: 'var(--primary-brand)',
                                fontSize: '0.6875rem',
                                fontWeight: '800'
                              }}>
                                <CheckCircle2 size={11} />
                                <span>VERIFIED</span>
                              </span>
                              <button
                                onClick={() => handleLockRow(tx)}
                                disabled={actionLoading}
                                className="btn btn-success btn-sm"
                                style={{ padding: '0.15rem 0.45rem', fontSize: '0.6875rem', fontWeight: '700' }}
                                title="Lock verified line"
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
                                padding: '0.25rem 0.75rem',
                                fontSize: '0.75rem',
                                fontWeight: '800',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                              title="Verify this line item"
                            >
                              <Check size={13} />
                              <span>Verify</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Tools */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                        {!isLocked && (
                          <button
                            onClick={() => handleDeleteLine(tx)}
                            disabled={actionLoading}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0.2rem 0.35rem', color: 'var(--accent-dr)' }}
                            title="Delete Draft Line"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* DETAILED 19-COLUMN VIEW (Full Horizontal Scroll for Detailed Audit) */
          <div style={{ overflowX: 'auto', maxHeight: '72vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left', whiteSpace: 'nowrap' }}>`;

if (content.includes(tableStartTarget)) {
  content = content.replace(tableStartTarget, fastAuditTableHtml);
  console.log('Replaced table with Fast Audit Mode + Detailed Ledger toggle');
} else {
  console.log('Could not find tableStartTarget');
}

fs.writeFileSync('src/components/TransactionValidationView.jsx', content, 'utf8');
console.log('Saved TransactionValidationView.jsx');

