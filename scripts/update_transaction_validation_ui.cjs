const fs = require('fs');

let content = fs.readFileSync('src/components/TransactionValidationView.jsx', 'utf8');

// 1. Add Auto-Validate button in toolbar if not already present
if (!content.includes('Auto-Validate Dimensions')) {
  const targetToolbar = `          <button
            onClick={handleBatchVerifyDate}`;
  const replacementToolbar = `          <button
            onClick={handleAutoFixDimensions}
            disabled={actionLoading || dateTransactions.length === 0}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-brand)', border: '1px solid rgba(59, 130, 246, 0.4)' }}
            title="Auto-resolve dimension conflicts, clear invalid profit centers on expenses / cost centers on income, and auto-tag standard cost centers"
          >
            <Sparkles size={14} />
            <span>Auto-Validate Dimensions</span>
          </button>

          <button
            onClick={handleBatchVerifyDate}`;
  if (content.includes(targetToolbar)) {
    content = content.replace(targetToolbar, replacementToolbar);
    console.log('Added Auto-Validate Dimensions button to toolbar');
  }
}

// 2. Update the Bulk Action bar button from "Set Category" to "Set Dimensions & Category"
const setCatBtnTarget = `            <button
              onClick={() => setIsBulkCategoryModalOpen(true)}
              disabled={actionLoading}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', fontWeight: '700' }}
            >
              <Tag size={14} style={{ marginRight: '0.3rem' }} />
              <span>Set Category</span>
            </button>`;

const setCatBtnReplacement = `            <button
              onClick={() => setIsBulkCategoryModalOpen(true)}
              disabled={actionLoading}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-brand)', border: '1px solid rgba(59, 130, 246, 0.4)' }}
            >
              <Tag size={14} style={{ marginRight: '0.3rem' }} />
              <span>Set Dimensions & Category</span>
            </button>`;

if (content.includes(setCatBtnTarget)) {
  content = content.replace(setCatBtnTarget, setCatBtnReplacement);
  console.log('Updated Bulk Action bar button label');
}

// 3. Update the table <thead> to add Validation, Hierarchy, Cost Center, Profit Center, Budget, Project
const theadOld = `                  {/* Status (Prominently placed at the beginning of audit data) */}
                  <th {...getSortHeaderProps('status')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', fontWeight: '800', textAlign: 'center', minWidth: '100px' }}>
                    STATUS {renderSortIndicator('status')}
                  </th>

                  {/* tran_date */}
                  <th {...getSortHeaderProps('tran_date')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '110px' }}>
                    DATE {renderSortIndicator('tran_date')}
                  </th>

                  {/* tran_no */}
                  <th {...getSortHeaderProps('tran_no')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '90px' }}>
                    TRAN # {renderSortIndicator('tran_no')}
                  </th>

                  {/* account_no */}
                  <th {...getSortHeaderProps('account_no')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '140px' }}>
                    ACCOUNT {renderSortIndicator('account_no')}
                  </th>

                  {/* particulars */}
                  <th {...getSortHeaderProps('particulars')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 1rem', minWidth: '220px' }}>
                    PARTICULARS {renderSortIndicator('particulars')}
                  </th>

                  {/* debit */}
                  <th {...getSortHeaderProps('debit')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', textAlign: 'right', minWidth: '105px' }}>
                    DEBIT (₹) {renderSortIndicator('debit')}
                  </th>

                  {/* credit */}
                  <th {...getSortHeaderProps('credit')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', textAlign: 'right', minWidth: '105px' }}>
                    CREDIT (₹) {renderSortIndicator('credit')}
                  </th>

                  {/* balance */}
                  <th {...getSortHeaderProps('balance')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', textAlign: 'right', minWidth: '110px' }}>
                    BALANCE (₹) {renderSortIndicator('balance')}
                  </th>

                  {/* SUB_CATEGORY */}
                  <th {...getSortHeaderProps('SUB_CATEGORY')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '160px' }}>
                    CATEGORY {renderSortIndicator('SUB_CATEGORY')}
                  </th>

                  {/* transaction_type */}
                  <th {...getSortHeaderProps('transaction_type')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '110px' }}>
                    TYPE {renderSortIndicator('transaction_type')}
                  </th>

                  {/* UTR NO */}
                  <th {...getSortHeaderProps('utr_no')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '130px' }}>
                    UTR / REF # {renderSortIndicator('utr_no')}
                  </th>`;

const theadNew = `                  {/* Status (Audit Lifecycle) */}
                  <th {...getSortHeaderProps('status')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', fontWeight: '800', textAlign: 'center', minWidth: '95px' }}>
                    STATUS {renderSortIndicator('status')}
                  </th>

                  {/* Validation Rules Badge */}
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', fontWeight: '800', textAlign: 'center', minWidth: '115px' }}>
                    VALIDATION
                  </th>

                  {/* tran_date */}
                  <th {...getSortHeaderProps('tran_date')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '105px' }}>
                    DATE {renderSortIndicator('tran_date')}
                  </th>

                  {/* tran_no */}
                  <th {...getSortHeaderProps('tran_no')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '85px' }}>
                    TRAN # {renderSortIndicator('tran_no')}
                  </th>

                  {/* account_no */}
                  <th {...getSortHeaderProps('account_no')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '135px' }}>
                    ACCOUNT {renderSortIndicator('account_no')}
                  </th>

                  {/* particulars */}
                  <th {...getSortHeaderProps('particulars')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 1rem', minWidth: '200px' }}>
                    PARTICULARS {renderSortIndicator('particulars')}
                  </th>

                  {/* debit */}
                  <th {...getSortHeaderProps('debit')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', textAlign: 'right', minWidth: '100px' }}>
                    DEBIT (₹) {renderSortIndicator('debit')}
                  </th>

                  {/* credit */}
                  <th {...getSortHeaderProps('credit')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', textAlign: 'right', minWidth: '100px' }}>
                    CREDIT (₹) {renderSortIndicator('credit')}
                  </th>

                  {/* balance */}
                  <th {...getSortHeaderProps('balance')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', textAlign: 'right', minWidth: '105px' }}>
                    BALANCE (₹) {renderSortIndicator('balance')}
                  </th>

                  {/* TAXONOMY HIERARCHY */}
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '150px' }}>
                    DIVISION / GROUP
                  </th>

                  {/* SUB_CATEGORY */}
                  <th {...getSortHeaderProps('SUB_CATEGORY')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '160px' }}>
                    SUB-CATEGORY {renderSortIndicator('SUB_CATEGORY')}
                  </th>

                  {/* COST CENTER */}
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '125px' }}>
                    COST CENTER
                  </th>

                  {/* PROFIT CENTER */}
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '125px' }}>
                    PROFIT CENTER
                  </th>

                  {/* BUDGET */}
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '130px' }}>
                    BUDGET
                  </th>

                  {/* PROJECT */}
                  <th style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '125px' }}>
                    PROJECT
                  </th>

                  {/* transaction_type */}
                  <th {...getSortHeaderProps('transaction_type')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '105px' }}>
                    TX TYPE {renderSortIndicator('transaction_type')}
                  </th>

                  {/* UTR NO */}
                  <th {...getSortHeaderProps('utr_no')} style={{ background: '#1e293b', color: '#fff', padding: '0.7rem 0.75rem', minWidth: '120px' }}>
                    UTR / REF # {renderSortIndicator('utr_no')}
                  </th>`;

if (content.includes(theadOld)) {
  content = content.replace(theadOld, theadNew);
  console.log('Updated thead with management dimension columns');
} else {
  console.log('Could not find theadOld');
}

// 4. Update the row rendering inside tbody
const rowOldTarget = `                      {/* 8. balance */}
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>
                        ₹{Number(tx.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* 9. SUB_CATEGORY */}
                      <td style={{ padding: '0.55rem 0.75rem', minWidth: '160px' }}>
                        {isEditing ? (
                          <select
                            value={editFormData.subcategory}
                            onChange={(e) => setEditFormData({ ...editFormData, subcategory: e.target.value })}
                            className="form-control"
                            style={{ height: '30px', fontSize: '0.75rem', padding: '0.2rem' }}
                          >
                            {categories.map(c => (
                              <option key={c.id} value={c.subcategory || c.name}>{c.subcategory || c.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                            {tx.subcategory || tx.categoryName || 'GENERAL'}
                          </span>
                        )}
                      </td>

                      {/* 10. transaction_type */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>
                        {isEditing ? (
                          <select
                            value={editFormData.transactionType}
                            onChange={(e) => setEditFormData({ ...editFormData, transactionType: e.target.value })}
                            className="form-control"
                            style={{ height: '30px', fontSize: '0.75rem' }}
                          >
                            <option value="ACTUAL">ACTUAL</option>
                            <option value="ROTATIONAL">ROTATIONAL</option>
                            <option value="COMPENSATIONAL">COMPENSATIONAL</option>
                          </select>
                        ) : (
                          <span style={{
                            fontSize: '0.6875rem',
                            fontWeight: '800',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: tx.transactionType === 'ROTATIONAL' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                            color: tx.transactionType === 'ROTATIONAL' ? '#eab308' : 'var(--primary-brand)'
                          }}>
                            {tx.transactionType || tx.transaction_type || 'ACTUAL'}
                          </span>
                        )}
                      </td>

                      {/* 11. UTR NO */}
                      <td style={{ padding: '0.55rem 0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="UTR / Ref..."
                            value={editFormData.utrNo}
                            onChange={(e) => setEditFormData({ ...editFormData, utrNo: e.target.value })}
                            className="form-control"
                            style={{ height: '30px', fontSize: '0.75rem', padding: '0.2rem 0.4rem', width: '130px' }}
                          />
                        ) : (
                          tx.utrNo || tx.utr_no || '—'
                        )}
                      </td>`;

// Also notice we need the validation badge column right after status:
const statusCellOld = `                      {/* 1. Status */}
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>
                        {isLocked ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '12px',
                            background: 'var(--accent-cr-bg)',
                            color: 'var(--accent-cr)',
                            fontSize: '0.6875rem',
                            fontWeight: '800'
                          }}>
                            <Lock size={11} />
                            <span>LOCKED</span>
                          </span>
                        ) : isVerified ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '12px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: 'var(--primary-brand)',
                            fontSize: '0.6875rem',
                            fontWeight: '800'
                          }}>
                            <CheckCircle2 size={11} />
                            <span>VERIFIED</span>
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '12px',
                            background: 'rgba(234, 179, 8, 0.15)',
                            color: '#eab308',
                            fontSize: '0.6875rem',
                            fontWeight: '800'
                          }}>
                            <AlertCircle size={11} />
                            <span>DRAFT</span>
                          </span>
                        )}
                      </td>`;

const statusCellNew = `                      {/* 1. Status */}
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>
                        {isLocked ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '12px',
                            background: 'var(--accent-cr-bg)',
                            color: 'var(--accent-cr)',
                            fontSize: '0.6875rem',
                            fontWeight: '800'
                          }}>
                            <Lock size={11} />
                            <span>LOCKED</span>
                          </span>
                        ) : isVerified ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '12px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: 'var(--primary-brand)',
                            fontSize: '0.6875rem',
                            fontWeight: '800'
                          }}>
                            <CheckCircle2 size={11} />
                            <span>VERIFIED</span>
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '12px',
                            background: 'rgba(234, 179, 8, 0.15)',
                            color: '#eab308',
                            fontSize: '0.6875rem',
                            fontWeight: '800'
                          }}>
                            <AlertCircle size={11} />
                            <span>DRAFT</span>
                          </span>
                        )}
                      </td>

                      {/* Dimension Validation Status */}
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>
                        {(() => {
                          const v = evaluateTransactionValidation(tx);
                          return (
                            <span
                              title={v.message}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '12px',
                                background: v.bg,
                                color: v.color,
                                fontSize: '0.65625rem',
                                fontWeight: '800',
                                border: \`1px solid \${v.color}33\`,
                                cursor: 'help'
                              }}
                            >
                              {v.badge}
                            </span>
                          );
                        })()}
                      </td>`;

if (content.includes(statusCellOld)) {
  content = content.replace(statusCellOld, statusCellNew);
  console.log('Added Dimension Validation cell next to Status cell');
} else {
  console.log('Could not find statusCellOld');
}

const rowNewReplacement = `                      {/* 8. balance */}
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>
                        ₹{Number(tx.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* 9. Taxonomy Hierarchy (Division > Category) */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>
                        {(() => {
                          const matchedCat = categories.find(c => (c.subcategory || c.name) === (tx.subcategory || tx.categoryName));
                          const div = matchedCat?.division || tx.division || 'LIVING';
                          const cat = matchedCat?.category || tx.category || 'General';
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--primary-brand)', letterSpacing: '0.04em' }}>
                                {div}
                              </span>
                              <span style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                                {cat}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* 10. SUB_CATEGORY */}
                      <td style={{ padding: '0.55rem 0.75rem', minWidth: '160px' }}>
                        {isEditing ? (
                          <select
                            value={editFormData.subcategory}
                            onChange={(e) => {
                              const newSub = e.target.value;
                              const cMatch = categories.find(c => (c.subcategory || c.name) === newSub);
                              setEditFormData({
                                ...editFormData,
                                subcategory: newSub,
                                transactionType: cMatch?.transaction_type || editFormData.transactionType
                              });
                            }}
                            className="form-control"
                            style={{ height: '30px', fontSize: '0.75rem', padding: '0.2rem' }}
                          >
                            {categories.map(c => (
                              <option key={c.id} value={c.subcategory || c.name}>
                                {c.subcategory || c.name} {c.category ? \`(\${c.category})\` : ''}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                            {tx.subcategory || tx.categoryName || 'GENERAL'}
                          </span>
                        )}
                      </td>

                      {/* 11. COST CENTER (Consumed By) */}
                      <td style={{ padding: '0.55rem 0.75rem', minWidth: '125px' }}>
                        {tx.type === 'Cr' ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>— (N/A)</span>
                        ) : isEditing ? (
                          <select
                            value={editFormData.costCenter}
                            onChange={(e) => setEditFormData({ ...editFormData, costCenter: e.target.value })}
                            className="form-control"
                            style={{ height: '30px', fontSize: '0.75rem', padding: '0.2rem' }}
                          >
                            <option value="">-- None --</option>
                            {(masters?.cost_centers || []).map(cc => (
                              <option key={cc.code || cc.id} value={cc.name}>{cc.name} ({cc.code})</option>
                            ))}
                          </select>
                        ) : (
                          (tx.costCenter || tx.cost_center) ? (
                            <span className="badge badge-neutral" style={{ fontSize: '0.71875rem', fontWeight: '700' }}>
                              {tx.costCenter || tx.cost_center}
                            </span>
                          ) : (
                            <span style={{ color: '#f59e0b', fontSize: '0.7rem', fontWeight: '600' }}>⚠ Not set</span>
                          )
                        )}
                      </td>

                      {/* 12. PROFIT CENTER (Earned By) */}
                      <td style={{ padding: '0.55rem 0.75rem', minWidth: '125px' }}>
                        {tx.type === 'Dr' ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>— (N/A)</span>
                        ) : isEditing ? (
                          <select
                            value={editFormData.profitCenter}
                            onChange={(e) => setEditFormData({ ...editFormData, profitCenter: e.target.value })}
                            className="form-control"
                            style={{ height: '30px', fontSize: '0.75rem', padding: '0.2rem' }}
                          >
                            <option value="">-- None --</option>
                            {(masters?.profit_centers || []).map(pc => (
                              <option key={pc.code || pc.id} value={pc.name}>{pc.name} ({pc.code})</option>
                            ))}
                          </select>
                        ) : (
                          (tx.profitCenter || tx.profit_center) ? (
                            <span className="badge badge-cr" style={{ fontSize: '0.71875rem', fontWeight: '700' }}>
                              {tx.profitCenter || tx.profit_center}
                            </span>
                          ) : (
                            <span style={{ color: '#f59e0b', fontSize: '0.7rem', fontWeight: '600' }}>⚠ Not set</span>
                          )
                        )}
                      </td>

                      {/* 13. BUDGET (Plan Bucket) */}
                      <td style={{ padding: '0.55rem 0.75rem', minWidth: '130px' }}>
                        {tx.type === 'Cr' ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>— (N/A)</span>
                        ) : isEditing ? (
                          <select
                            value={editFormData.budget}
                            onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })}
                            className="form-control"
                            style={{ height: '30px', fontSize: '0.75rem', padding: '0.2rem' }}
                          >
                            <option value="">-- None --</option>
                            {(masters?.budgets || []).map(b => (
                              <option key={b.code || b.id} value={b.name}>{b.name}</option>
                            ))}
                          </select>
                        ) : (
                          tx.budget ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--primary-brand)', fontWeight: '700' }}>
                              {tx.budget}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>—</span>
                          )
                        )}
                      </td>

                      {/* 14. PROJECT (Purpose) */}
                      <td style={{ padding: '0.55rem 0.75rem', minWidth: '125px' }}>
                        {isEditing ? (
                          <select
                            value={editFormData.project}
                            onChange={(e) => setEditFormData({ ...editFormData, project: e.target.value })}
                            className="form-control"
                            style={{ height: '30px', fontSize: '0.75rem', padding: '0.2rem' }}
                          >
                            <option value="">-- None --</option>
                            {(masters?.projects || []).map(pr => (
                              <option key={pr.code || pr.id} value={pr.name}>{pr.name}</option>
                            ))}
                          </select>
                        ) : (
                          tx.project ? (
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                              {tx.project}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>—</span>
                          )
                        )}
                      </td>

                      {/* 15. transaction_type */}
                      <td style={{ padding: '0.55rem 0.75rem' }}>
                        {isEditing ? (
                          <select
                            value={editFormData.transactionType}
                            onChange={(e) => setEditFormData({ ...editFormData, transactionType: e.target.value })}
                            className="form-control"
                            style={{ height: '30px', fontSize: '0.75rem' }}
                          >
                            <option value="ACTUAL">ACTUAL</option>
                            <option value="ROTATIONAL">ROTATIONAL</option>
                            <option value="COMPENSATIONAL">COMPENSATIONAL</option>
                          </select>
                        ) : (
                          <span style={{
                            fontSize: '0.6875rem',
                            fontWeight: '800',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: tx.transactionType === 'ROTATIONAL' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                            color: tx.transactionType === 'ROTATIONAL' ? '#eab308' : 'var(--primary-brand)'
                          }}>
                            {tx.transactionType || tx.transaction_type || 'ACTUAL'}
                          </span>
                        )}
                      </td>

                      {/* 16. UTR NO */}
                      <td style={{ padding: '0.55rem 0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="UTR / Ref..."
                            value={editFormData.utrNo}
                            onChange={(e) => setEditFormData({ ...editFormData, utrNo: e.target.value })}
                            className="form-control"
                            style={{ height: '30px', fontSize: '0.75rem', padding: '0.2rem 0.4rem', width: '130px' }}
                          />
                        ) : (
                          tx.utrNo || tx.utr_no || '—'
                        )}
                      </td>`;

if (content.includes(rowOldTarget)) {
  content = content.replace(rowOldTarget, rowNewReplacement);
  console.log('Updated tbody row cells with dimension columns');
} else {
  console.log('Could not find rowOldTarget');
}

// 5. Update the Bulk Category Modal to include Cost Center, Profit Center, Budget, Project
const modalOldTarget = `            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Tag size={18} style={{ color: 'var(--primary-brand)' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  Set Sub-Category For {selectedRowIds.length} Line(s)
                </h3>
              </div>
              <button
                onClick={() => setIsBulkCategoryModalOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.2rem 0.4rem', border: 'none' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Choose a standard sub-category to apply across all {selectedRowIds.length} selected transaction lines. The corresponding taxonomy (Group, Net Type, Sub Type, and Transaction Type) will be updated automatically.
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                Select Classification Sub-Category:
              </label>
              <select
                value={bulkSelectedSubcat}
                onChange={(e) => setBulkSelectedSubcat(e.target.value)}
                className="form-control"
                style={{ height: '38px', fontSize: '0.85rem' }}
              >
                <option value="">-- Choose Category ({categories.length} available) --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.subcategory || c.name}>
                    {c.subcategory || c.name} {c.category ? \`(\${c.category})\` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setIsBulkCategoryModalOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.4rem 0.9rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleApplyBulkCategory}
                disabled={!bulkSelectedSubcat || actionLoading}
                className="btn btn-primary btn-sm"
                style={{ padding: '0.4rem 1.1rem', fontWeight: '700' }}
              >
                {actionLoading ? 'Applying...' : \`Apply to \${selectedRowIds.length} Line(s)\`}
              </button>
            </div>`;

const modalNewReplacement = `            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Tag size={18} style={{ color: 'var(--primary-brand)' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  Set Management Dimensions For {selectedRowIds.length} Line(s)
                </h3>
              </div>
              <button
                onClick={() => setIsBulkCategoryModalOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.2rem 0.4rem', border: 'none' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Apply category taxonomy and management dimensions across all {selectedRowIds.length} selected transaction lines.
              Dimension validation rules will strictly preserve the boundary: Expenses consume Cost Centers & Budgets, whereas Income generates Profit Centers.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              {/* Category */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Select Taxonomy Sub-Category:
                </label>
                <select
                  value={bulkSelectedSubcat}
                  onChange={(e) => setBulkSelectedSubcat(e.target.value)}
                  className="form-control"
                  style={{ height: '38px', fontSize: '0.85rem' }}
                >
                  <option value="">-- Choose Category ({categories.length} available) --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.subcategory || c.name}>
                      {c.subcategory || c.name} {c.category ? \`(\${c.category})\` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cost Center */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Cost Center (Expenses):
                </label>
                <select
                  value={bulkCostCenter}
                  onChange={(e) => setBulkCostCenter(e.target.value)}
                  className="form-control"
                  style={{ height: '36px', fontSize: '0.8125rem' }}
                >
                  <option value="">-- Leave Unchanged / None --</option>
                  {(masters?.cost_centers || []).map(cc => (
                    <option key={cc.code || cc.id} value={cc.name}>{cc.name} ({cc.code})</option>
                  ))}
                </select>
              </div>

              {/* Profit Center */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Profit Center (Income):
                </label>
                <select
                  value={bulkProfitCenter}
                  onChange={(e) => setBulkProfitCenter(e.target.value)}
                  className="form-control"
                  style={{ height: '36px', fontSize: '0.8125rem' }}
                >
                  <option value="">-- Leave Unchanged / None --</option>
                  {(masters?.profit_centers || []).map(pc => (
                    <option key={pc.code || pc.id} value={pc.name}>{pc.name} ({pc.code})</option>
                  ))}
                </select>
              </div>

              {/* Budget */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Budget Bucket (Expenses):
                </label>
                <select
                  value={bulkBudget}
                  onChange={(e) => setBulkBudget(e.target.value)}
                  className="form-control"
                  style={{ height: '36px', fontSize: '0.8125rem' }}
                >
                  <option value="">-- Leave Unchanged / None --</option>
                  {(masters?.budgets || []).map(b => (
                    <option key={b.code || b.id} value={b.name}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>

              {/* Project */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Project / Purpose:
                </label>
                <select
                  value={bulkProject}
                  onChange={(e) => setBulkProject(e.target.value)}
                  className="form-control"
                  style={{ height: '36px', fontSize: '0.8125rem' }}
                >
                  <option value="">-- Leave Unchanged / None --</option>
                  {(masters?.projects || []).map(pr => (
                    <option key={pr.code || pr.id} value={pr.name}>{pr.name} ({pr.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setIsBulkCategoryModalOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.4rem 0.9rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleApplyBulkCategory}
                disabled={(!bulkSelectedSubcat && !bulkCostCenter && !bulkProfitCenter && !bulkBudget && !bulkProject) || actionLoading}
                className="btn btn-primary btn-sm"
                style={{ padding: '0.4rem 1.1rem', fontWeight: '700' }}
              >
                {actionLoading ? 'Applying...' : \`Apply to \${selectedRowIds.length} Line(s)\`}
              </button>
            </div>`;

if (content.includes(modalOldTarget)) {
  content = content.replace(modalOldTarget, modalNewReplacement);
  console.log('Updated Bulk Modal with full dimensions');
} else {
  console.log('Could not find modalOldTarget');
}

fs.writeFileSync('src/components/TransactionValidationView.jsx', content, 'utf8');
console.log('Finished updating TransactionValidationView.jsx');

