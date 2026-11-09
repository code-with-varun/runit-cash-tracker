const fs = require('fs');
const path = require('path');

// 1. PATCH App.jsx
const appFile = path.join(__dirname, '..', 'src', 'App.jsx');
let appContent = fs.readFileSync(appFile, 'utf8');

if (!appContent.includes('exportCompleteMasterExcel')) {
  appContent = appContent.replace(
    "import { getStoredPinAPI, setStoredPinAPI, resetDataAPI } from './utils/api';",
    `import { getStoredPinAPI, setStoredPinAPI, resetDataAPI } from './utils/api';
import { exportCompleteMasterExcel } from './utils/excel';`
  );

  const exportHandlerCode = `
  const handleExportCompleteExcel = async () => {
    try {
      const filename = await exportCompleteMasterExcel({
        currentUser,
        transactions,
        accounts,
        categories,
        masters
      });
      alert(\`🎉 Complete Excel Backup generated and downloaded successfully!\\n\\nFile: \${filename}\\n\\nAll database tables and masters (User Profile, 36-Column Ledger, Accounts, Taxonomy, Budgets, Cost Centers, Profit Centers, Projects) have been exported into separate sheets.\`);
    } catch (err) {
      console.error('Complete export error:', err);
      alert('Failed to generate complete backup: ' + err.message);
    }
  };
`;

  appContent = appContent.replace(
    'const handleLogout = () => {',
    `${exportHandlerCode}\n  const handleLogout = () => {`
  );

  // Pass to Sidebar
  appContent = appContent.replace(
    'setActiveAccount={setActiveAccount}\n      />',
    `setActiveAccount={setActiveAccount}\n        onExportCompleteExcel={handleExportCompleteExcel}\n      />`
  );

  // Pass to TopHeader
  appContent = appContent.replace(
    'onLogout={handleLogout}\n        />',
    `onLogout={handleLogout}\n          onExportCompleteExcel={handleExportCompleteExcel}\n        />`
  );

  // Pass to MasterTransactionsView
  appContent = appContent.replace(
    '<MasterTransactionsView\n            transactions={transactions}',
    `<MasterTransactionsView\n            onExportCompleteExcel={handleExportCompleteExcel}\n            transactions={transactions}`
  );

  fs.writeFileSync(appFile, appContent, 'utf8');
  console.log('Successfully patched App.jsx with handleExportCompleteExcel');
}

// 2. PATCH TopHeader.jsx
const headerFile = path.join(__dirname, '..', 'src', 'components', 'TopHeader.jsx');
let headerContent = fs.readFileSync(headerFile, 'utf8');

if (!headerContent.includes('FileSpreadsheet')) {
  headerContent = headerContent.replace(
    "  Sparkles\n} from 'lucide-react';",
    `  Sparkles,\n  FileSpreadsheet\n} from 'lucide-react';`
  );
}

if (!headerContent.includes('onExportCompleteExcel')) {
  headerContent = headerContent.replace(
    '  currentUser,\n  onLogout\n}) {',
    `  currentUser,\n  onLogout,\n  onExportCompleteExcel\n}) {`
  );

  // Add button next to Cash Tracker
  const cashTrackerEnd = `</button>\n\n\n        {/* User Profile Pill & Dropdown (Top-Right) */}`;
  const completeExportBtn = `</button>

        {/* Complete Excel Backup Quick Action */}
        <button
          onClick={onExportCompleteExcel}
          className="btn btn-secondary btn-sm"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.32rem 0.8rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '700',
            color: 'var(--primary-brand)',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            cursor: 'pointer'
          }}
          title="Export Complete Multi-Sheet Excel Backup (User Profile, 36-Col Ledger, Accounts, Taxonomy, Budgets, Cost Centers, Profit Centers, Projects)"
        >
          <FileSpreadsheet size={15} />
          <span className="hidden-sm">Complete Backup (.xlsx)</span>
        </button>

        {/* User Profile Pill & Dropdown (Top-Right) */}`;

  headerContent = headerContent.replace(cashTrackerEnd, completeExportBtn);

  // Add inside dropdown
  const dropdownSettingsBtn = `<button\n                  onClick={() => {\n                    setIsUserMenuOpen(false);\n                    if (onOpenSettings) onOpenSettings();\n                  }}`;
  const dropdownExportBtn = `<button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    if (onExportCompleteExcel) onExportCompleteExcel();
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '8px',
                    color: 'var(--primary-brand)'
                  }}
                >
                  <FileSpreadsheet size={15} />
                  <span>Export Complete Excel (.xlsx)</span>
                </button>

                ${dropdownSettingsBtn}`;

  headerContent = headerContent.replace(dropdownSettingsBtn, dropdownExportBtn);

  fs.writeFileSync(headerFile, headerContent, 'utf8');
  console.log('Successfully patched TopHeader.jsx with onExportCompleteExcel');
}

// 3. PATCH Sidebar.jsx
const sidebarFile = path.join(__dirname, '..', 'src', 'components', 'Sidebar.jsx');
let sidebarContent = fs.readFileSync(sidebarFile, 'utf8');

if (!sidebarContent.includes('FileSpreadsheet')) {
  sidebarContent = sidebarContent.replace(
    "  Landmark\n} from 'lucide-react';",
    `  Landmark,\n  FileSpreadsheet\n} from 'lucide-react';`
  );
}

if (!sidebarContent.includes('onExportCompleteExcel')) {
  sidebarContent = sidebarContent.replace(
    '  activeAccount,\n  setActiveAccount,\n}) {',
    `  activeAccount,\n  setActiveAccount,\n  onExportCompleteExcel,\n}) {`
  );

  // Add navigation item
  sidebarContent = sidebarContent.replace(
    "        { id: 'system-reset', label: 'System Reset', icon: RotateCcw, pill: 'Empty' },",
    `        { id: 'export-complete-excel', label: 'Complete Excel Backup', icon: FileSpreadsheet, pill: '.xlsx' },\n        { id: 'system-reset', label: 'System Reset', icon: RotateCcw, pill: 'Empty' },`
  );

  // Handle click
  sidebarContent = sidebarContent.replace(
    "if (itemId === 'system-reset') {",
    `if (itemId === 'export-complete-excel') {\n      if (onExportCompleteExcel) {\n        onExportCompleteExcel();\n      }\n      return;\n    }\n    if (itemId === 'system-reset') {`
  );

  fs.writeFileSync(sidebarFile, sidebarContent, 'utf8');
  console.log('Successfully patched Sidebar.jsx with onExportCompleteExcel');
}

// 4. PATCH MasterTransactionsView.jsx
const mtvFile = path.join(__dirname, '..', 'src', 'components', 'MasterTransactionsView.jsx');
let mtvContent = fs.readFileSync(mtvFile, 'utf8');

if (!mtvContent.includes('onExportCompleteExcel')) {
  mtvContent = mtvContent.replace(
    'export default function MasterTransactionsView({\n  transactions = [],',
    'export default function MasterTransactionsView({\n  onExportCompleteExcel,\n  transactions = [],'
  );

  // Add button next to Export Master Excel
  const oldExportBtn = `<button\n            onClick={handleExportExcel}\n            className="btn btn-secondary btn-sm"`;
  const newExportBtn = `{onExportCompleteExcel && (
            <button
              onClick={onExportCompleteExcel}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700' }}
              title="Export complete database backup: User Profile, Master Transactions, Accounts, Category Taxonomy, Budgets, Cost Centers, Profit Centers, Projects in separate sheets"
            >
              <Download size={14} />
              <span>Full System Backup (.xlsx)</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="btn btn-secondary btn-sm"`;

  mtvContent = mtvContent.replace(oldExportBtn, newExportBtn);
  fs.writeFileSync(mtvFile, mtvContent, 'utf8');
  console.log('Successfully patched MasterTransactionsView.jsx with onExportCompleteExcel');
}

console.log('All UI integration patches completed successfully!');

