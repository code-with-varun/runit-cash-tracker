const fs = require('fs');

let content = fs.readFileSync('src/components/TransactionValidationView.jsx', 'utf8');

// 1. Add Zap icon to lucide-react imports if not present
if (!content.includes('Zap,')) {
  content = content.replace('import {\n  Calendar as CalendarIcon,', 'import {\n  Calendar as CalendarIcon,\n  Zap,');
  console.log('Added Zap icon to imports');
}

// 2. Add fastAuditMode state
const stateTarget = `  const [validationFilter, setValidationFilter] = useState('ALL');
  const [onlyPendingDatesFilter, setOnlyPendingDatesFilter] = useState(false);`;

const stateReplacement = `  const [validationFilter, setValidationFilter] = useState('ALL');
  const [onlyPendingDatesFilter, setOnlyPendingDatesFilter] = useState(false);
  const [fastAuditMode, setFastAuditMode] = useState(true); // Fast validation mode (0 horizontal scroll) vs 19-col Detailed Ledger`;

if (content.includes(stateTarget) && !content.includes('const [fastAuditMode, setFastAuditMode]')) {
  content = content.replace(stateTarget, stateReplacement);
  console.log('Added fastAuditMode state');
}

// 3. Add handleQuickSubcatChange and handleQuickDimensionChange
const quickHandlersTarget = `  // Start inline editing
  const handleStartEdit = (tx) => {`;

const quickHandlersCode = `  // Fast-Audit: Direct Category selection without opening edit mode
  const handleQuickSubcatChange = async (tx, newSubcat) => {
    if ((tx.auditStatus || tx.audit_status) === 'frozen') {
      alert("This transaction is locked. Please unlock it first to edit.");
      return;
    }
    if (!newSubcat) return;

    try {
      setActionLoading(true);
      const matchedCat = categories.find(c => (c.subcategory || c.name) === newSubcat);
      const isExp = tx.type === 'Dr';
      const isInc = tx.type === 'Cr';
      const sub = (newSubcat || '').toUpperCase();

      // Auto-suggest cost center / budget for expense, profit center for income
      let recCostCenter = tx.costCenter || tx.cost_center;
      let recProfitCenter = tx.profitCenter || tx.profit_center;
      let recBudget = tx.budget;

      if (isExp) {
        recProfitCenter = null;
        if (!recCostCenter) {
          if (sub.includes('PETROL') || sub.includes('TRANSPORT') || sub.includes('BIKE') || sub.includes('CAR')) {
            recCostCenter = 'Vehicle';
            recBudget = recBudget || 'Travel Budget';
          } else if (sub.includes('FOOD') || sub.includes('SNACK') || sub.includes('DINING')) {
            recCostCenter = 'Self';
            recBudget = recBudget || 'Food Budget';
          } else if (sub.includes('GROCERIES') || sub.includes('HOUSE') || sub.includes('MAINTENANCE')) {
            recCostCenter = 'Home';
            recBudget = recBudget || 'Home Budget';
          } else if (sub.includes('MEDICAL') || sub.includes('HEALTH')) {
            recCostCenter = 'Health';
            recBudget = recBudget || 'Healthcare Budget';
          } else if (sub.includes('EDUCATION') || sub.includes('LEARNING')) {
            recCostCenter = 'Education';
            recBudget = recBudget || 'Home Budget';
          } else {
            recCostCenter = 'Self';
            recBudget = recBudget || 'Home Budget';
          }
        }
      } else if (isInc) {
        recCostCenter = null;
        recBudget = null;
        if (!recProfitCenter) {
          if (sub.includes('SALARY') || sub.includes('PAYROLL')) recProfitCenter = 'Salary';
          else if (sub.includes('FREELANCE') || sub.includes('CONSULTING')) recProfitCenter = 'Freelancing';
          else if (sub.includes('DIVIDEND') || sub.includes('INTEREST')) recProfitCenter = 'Investments';
          else recProfitCenter = 'Salary';
        }
      }

      await updateTransactionAPI({
        id: tx.id,
        categoryId: matchedCat?.id || null,
        categoryName: matchedCat?.name || newSubcat,
        subcategory: matchedCat?.subcategory || newSubcat,
        category: matchedCat?.category || null,
        division: matchedCat?.division || null,
        groupType: matchedCat?.group_type || matchedCat?.division || null,
        netType: matchedCat?.net_type || matchedCat?.sub_type || null,
        subType: matchedCat?.sub_type || null,
        transactionType: matchedCat?.transaction_type || tx.transactionType || 'ACTUAL',
        costCenter: recCostCenter,
        profitCenter: recProfitCenter,
        budget: recBudget
      });

      showToast(\`Line #\${tx.tranNo || tx.id}: Category set to "\${newSubcat}"\`);
      if (onReloadTransactions) await onReloadTransactions();
    } catch (err) {
      alert("Failed to update category: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Fast-Audit: Direct Dimension change
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
  };

  // Fast-Audit: Auto-classify all draft lines for this date using intelligent particular rules
  const handleAutoClassifyDate = async () => {
    const drafts = dateTransactions.filter(t => (t.auditStatus || t.audit_status) === 'draft');
    if (drafts.length === 0) {
      showToast("No draft transactions on this date to classify.", "info");
      return;
    }

    try {
      setActionLoading(true);
      let count = 0;
      for (const tx of drafts) {
        const text = tx.notes || tx.particulars || '';
        if (!text) continue;

        // Auto-match against categories
        const upper = text.toUpperCase();
        let matched = null;
        for (const c of categories) {
          const sub = (c.subcategory || c.name || '').toUpperCase();
          if (sub && upper.includes(sub)) {
            matched = c;
            break;
          }
        }

        if (matched) {
          await updateTransactionAPI({
            id: tx.id,
            categoryId: matched.id,
            categoryName: matched.name,
            subcategory: matched.subcategory || matched.name,
            category: matched.category,
            division: matched.division,
            groupType: matched.group_type || matched.division,
            subType: matched.sub_type,
            transactionType: matched.transaction_type || 'ACTUAL'
          });
          count++;
        }
      }

      showToast(\`Auto-classified \${count} transaction line(s)!\`);
      if (onReloadTransactions) await onReloadTransactions();
    } catch (err) {
      alert("Auto-classify failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Start inline editing
  const handleStartEdit = (tx) => {`;

if (content.includes(quickHandlersTarget) && !content.includes('handleQuickSubcatChange = async')) {
  content = content.replace(quickHandlersTarget, quickHandlersCode);
  console.log('Added quick handlers (handleQuickSubcatChange, handleQuickDimensionChange, handleAutoClassifyDate)');
}

fs.writeFileSync('src/components/TransactionValidationView.jsx', content, 'utf8');
console.log('Saved handlers in TransactionValidationView.jsx');

