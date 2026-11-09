const fs = require('fs');

let content = fs.readFileSync('src/components/MasterTransactionsView.jsx', 'utf8');

// 1. Remove the Action <th>
const thOld = `                <th style={{ background: '#334155', color: '#fff', padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                  Action
                </th>`;

if (content.includes(thOld)) {
  content = content.replace(thOld, '');
  console.log('Removed Action <th>');
} else {
  console.log('Could not find thOld');
}

// 2. Remove the Action <td>
const tdOld = `                      {/* Action Button */}
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>
                        <button
                          onClick={() => handleToggleRowAudit(tx)}
                          className={\`btn btn-sm \${isFrozen ? 'btn-secondary' : isVerified ? 'btn-success' : 'btn-primary'}\`}
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.6875rem' }}
                          title={isFrozen ? "Unlock Record" : isVerified ? "Freeze & Lock" : "Verify Taxonomy"}
                        >
                          {isFrozen ? <Unlock size={11} /> : isVerified ? <Lock size={11} /> : <Check size={11} />}
                          <span>{isFrozen ? 'Unlock' : isVerified ? 'Lock' : 'Verify'}</span>
                        </button>
                      </td>`;

if (content.includes(tdOld)) {
  content = content.replace(tdOld, '');
  console.log('Removed Action <td>');
} else {
  console.log('Could not find tdOld');
}

// 3. Remove the batch audit actions from extraActions
const batchAuditOld = `            {/* Batch Audit Actions */}
            {selectedTxIds.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-input)', padding: '2px 6px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                  {selectedTxIds.length} Selected:
                </span>
                <button
                  onClick={() => handleBatchAudit('verified')}
                  disabled={loadingAction}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.6875rem', height: '26px', padding: '0 0.45rem' }}
                >
                  <Check size={11} />
                  <span>Verify</span>
                </button>
                <button
                  onClick={() => handleBatchAudit('frozen')}
                  disabled={loadingAction}
                  className="btn btn-success btn-sm"
                  style={{ fontSize: '0.6875rem', height: '26px', padding: '0 0.45rem' }}
                >
                  <Lock size={11} />
                  <span>Freeze</span>
                </button>
                <button
                  onClick={() => handleBatchAudit('draft')}
                  disabled={loadingAction}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.6875rem', height: '26px', padding: '0 0.45rem' }}
                >
                  <Unlock size={11} />
                  <span>Draft</span>
                </button>
              </div>
            )}`;

if (content.includes(batchAuditOld)) {
  content = content.replace(batchAuditOld, '');
  console.log('Removed batch audit actions from extraActions');
} else {
  console.log('Could not find batchAuditOld');
}

// 4. Update Header Subtitle to emphasize Read-Only Master Repository
const descOld = `Consolidate all accounts, verify line-item taxonomy classifications, and freeze audited records with standard banking headers.`;
const descNew = `Consolidated read-only master repository for all accounts. Use this view for global search, auditing, analytics, and exporting reports. (Line-by-line verification and daily locks are handled in Daily Validation).`;

if (content.includes(descOld)) {
  content = content.replace(descOld, descNew);
  console.log('Updated description');
}

fs.writeFileSync('src/components/MasterTransactionsView.jsx', content, 'utf8');
console.log('Saved src/components/MasterTransactionsView.jsx');

