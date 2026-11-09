const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'src', 'components', 'TransactionValidationView.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add showAnalyticsCards state if not present
if (!content.includes('showAnalyticsCards')) {
  content = content.replace(
    'const [fastAuditMode, setFastAuditMode] = useState(true);',
    `const [fastAuditMode, setFastAuditMode] = useState(true);
  const [showAnalyticsCards, setShowAnalyticsCards] = useState(false);`
  );
  console.log('Added showAnalyticsCards state');
}

// 2. Ensure handleQuickDimensionChange handles project and utrNo
const oldDimFn = `  // Fast-Audit: Direct Dimension change
  const handleQuickDimensionChange = async (tx, field, value) => {
    if ((tx.auditStatus || tx.audit_status) === 'frozen') {
      alert("This transaction is locked. Please unlock it first to edit.");
      return;
    }
    try {
      setActionLoading(true);
      const payload = { id: tx.id };
      if (field === 'costCenter') payload.costCenter = value || null;
      if (field === 'profitCenter') payload.profitCenter = value || null;
      if (field === 'budget') payload.budget = value || null;

      await updateTransactionAPI(payload);
      showToast(\`Line #\${tx.tranNo || tx.id}: \${field} updated\`);
      if (onReloadTransactions) await onReloadTransactions();
    } catch (err) {
      alert("Failed to update dimension: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };`;

const newDimFn = `  // Fast-Audit: Direct Field change (Cost Center, Profit Center, Budget, Project, UTR)
  const handleQuickDimensionChange = async (tx, field, value) => {
    if ((tx.auditStatus || tx.audit_status) === 'frozen') {
      alert("This transaction is locked. Please unlock it first to edit.");
      return;
    }
    try {
      setActionLoading(true);
      const payload = { id: tx.id };
      if (field === 'costCenter') payload.costCenter = value || null;
      if (field === 'profitCenter') payload.profitCenter = value || null;
      if (field === 'budget') payload.budget = value || null;
      if (field === 'project') payload.project = value || null;
      if (field === 'utrNo') payload.utrNo = value || null;

      await updateTransactionAPI(payload);
      showToast(\`Line #\${tx.tranNo || tx.id}: \${field} updated\`);
      if (onReloadTransactions) await onReloadTransactions();
    } catch (err) {
      alert("Failed to update " + field + ": " + err.message);
    } finally {
      setActionLoading(false);
    }
  };`;

if (content.includes('// Fast-Audit: Direct Dimension change')) {
  content = content.replace(oldDimFn, newDimFn);
  console.log('Updated handleQuickDimensionChange to support project and utrNo');
}

// 3. Add masters fallback options inside component body
const optionsMarker = `  // All transactions strictly for selected date`;
const optionsCode = `  // Fallback dimension master options
  const costCenterOptions = useMemo(() => {
    if (masters?.cost_centers && masters.cost_centers.length > 0) return masters.cost_centers;
    return [
      { name: 'Self' }, { name: 'Home' }, { name: 'Vehicle' },
      { name: 'Family' }, { name: 'Health' }, { name: 'Education' },
      { name: 'Business' }, { name: 'Tech/Office' }
    ];
  }, [masters?.cost_centers]);

  const profitCenterOptions = useMemo(() => {
    if (masters?.profit_centers && masters.profit_centers.length > 0) return masters.profit_centers;
    return [
      { name: 'Varun Salary' }, { name: 'Freelance & Consulting' },
      { name: 'Real Estate / Rental' }, { name: 'Investments & Portfolio' },
      { name: 'Other Income' }
    ];
  }, [masters?.profit_centers]);

  const budgetOptions = useMemo(() => {
    if (masters?.budgets && masters.budgets.length > 0) return masters.budgets;
    return [
      { name: 'Home & Living Budget' }, { name: 'Food & Dining Budget' },
      { name: 'Mobility & Fuel Budget' }, { name: 'Discretionary Lifestyle' },
      { name: 'Emergency & Health' }, { name: 'Education & Growth' },
      { name: 'Savings & Investments' }
    ];
  }, [masters?.budgets]);

  const projectOptions = useMemo(() => {
    if (masters?.projects && masters.projects.length > 0) return masters.projects;
    return [
      { name: 'General Household' }, { name: 'Vehicle Maintenance' },
      { name: 'Home Renovation' }, { name: 'Vacation & Travel' }
    ];
  }, [masters?.projects]);

  // All transactions strictly for selected date`;

if (!content.includes('costCenterOptions = useMemo')) {
  content = content.replace(optionsMarker, optionsCode);
  console.log('Added dimension fallback options (cost centers, profit centers, budgets, projects)');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Finished preliminary patch');

