const fs = require('fs');
let code = fs.readFileSync('src/components/TransactionValidationView.jsx', 'utf8');

// 1. Ensure masters prop is accepted
const propOld = `export default function TransactionValidationView({
  transactions = [],
  categories = [],
  accounts = [],
  onReloadTransactions,
  onNavigateToEntry
}) {`;

const propNew = `export default function TransactionValidationView({
  transactions = [],
  categories = [],
  accounts = [],
  masters = { budgets: [], cost_centers: [], profit_centers: [], projects: [] },
  onReloadTransactions,
  onNavigateToEntry
}) {`;
code = code.replace(propOld, propNew);

// 2. Add evaluateTransactionValidation helper right before the component
const evalHelper = `
export function evaluateTransactionValidation(tx) {
  const isExpense = tx.type === 'Dr';
  const isIncome = tx.type === 'Cr';
  const isRotational = (tx.transactionType || tx.transaction_type) === 'ROTATIONAL';

  if (isRotational) {
    return { status: 'valid', badge: 'ROTATIONAL', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', message: 'Internal rotational transfer' };
  }

  if (isExpense) {
    const hasProfitCenter = Boolean(tx.profitCenter || tx.profit_center);
    const hasCostCenter = Boolean(tx.costCenter || tx.cost_center);
    const hasBudget = Boolean(tx.budget);

    if (hasProfitCenter) {
      return { status: 'error', badge: 'CONFLICT', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', message: 'Profit Center invalid on Expense item' };
    }
    if (!hasCostCenter && !hasBudget) {
      return { status: 'warning', badge: 'UNTAGGED', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', message: 'Missing Cost Center & Budget' };
    }
    if (!hasCostCenter) {
      return { status: 'warning', badge: 'NO COST CENTER', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', message: 'Missing Cost Center (Who consumed?)' };
    }
    if (!hasBudget) {
      return { status: 'warning', badge: 'NO BUDGET', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', message: 'Missing Budget (Which plan?)' };
    }
    return { status: 'valid', badge: 'VALIDATED', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', message: 'Fully Tagged Expense' };
  }

  if (isIncome) {
    const hasCostCenter = Boolean(tx.costCenter || tx.cost_center);
    const hasProfitCenter = Boolean(tx.profitCenter || tx.profit_center);

    if (hasCostCenter) {
      return { status: 'error', badge: 'CONFLICT', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', message: 'Cost Center invalid on Income item' };
    }
    if (!hasProfitCenter) {
      return { status: 'warning', badge: 'NO PROFIT CENTER', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', message: 'Missing Profit Center (Who earned?)' };
    }
    return { status: 'valid', badge: 'VALIDATED', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', message: 'Fully Tagged Income' };
  }

  return { status: 'valid', badge: 'VALID', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', message: 'Valid' };
}
`;

code = evalHelper + '\n' + code;

// 3. Add bulk dimension modal states
const bulkStateOld = `  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);
  const [bulkSelectedSubcat, setBulkSelectedSubcat] = useState('');`;

const bulkStateNew = `  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);
  const [bulkSelectedSubcat, setBulkSelectedSubcat] = useState('');
  const [bulkCostCenter, setBulkCostCenter] = useState('');
  const [bulkProfitCenter, setBulkProfitCenter] = useState('');
  const [bulkBudget, setBulkBudget] = useState('');
  const [bulkProject, setBulkProject] = useState('');
  const [validationFilter, setValidationFilter] = useState('ALL');`;

code = code.replace(bulkStateOld, bulkStateNew);

// 4. Update handleStartEdit to load budget, costCenter, profitCenter, project
const startEditOld = `    setEditFormData({
      subcategory: tx.subcategory || tx.categoryName || '',
      transactionType: tx.transactionType || 'ACTUAL',
      notes: tx.notes || tx.particulars || '',
      tagging: tx.tagging || '',
      utrNo: tx.utrNo || tx.utr_no || '',
      amount: tx.amount || 0,
      remarks: tx.remarks || ''
    });`;

const startEditNew = `    setEditFormData({
      subcategory: tx.subcategory || tx.categoryName || '',
      transactionType: tx.transactionType || 'ACTUAL',
      budget: tx.budget || '',
      costCenter: tx.costCenter || tx.cost_center || '',
      profitCenter: tx.profitCenter || tx.profit_center || '',
      project: tx.project || '',
      notes: tx.notes || tx.particulars || '',
      tagging: tx.tagging || '',
      utrNo: tx.utrNo || tx.utr_no || '',
      amount: tx.amount || 0,
      remarks: tx.remarks || '',
      type: tx.type
    });`;

code = code.replace(startEditOld, startEditNew);

// 5. Update handleSaveEdit to validate and save all management dimensions
const saveEditOld = `      const matchedCat = categories.find(c => (c.subcategory || c.name) === editFormData.subcategory);
      await updateTransactionAPI({
        id: txId,
        categoryId: matchedCat?.id || null,
        categoryName: matchedCat?.name || editFormData.subcategory,
        subcategory: matchedCat?.subcategory || editFormData.subcategory,
        groupType: matchedCat?.group_type || null,
        netType: matchedCat?.net_type || null,
        subType: matchedCat?.sub_type || null,
        transactionType: editFormData.transactionType,
        notes: editFormData.notes,
        remarks: editFormData.remarks,
        tagging: editFormData.tagging,
        utrNo: editFormData.utrNo,
        amount: Number(editFormData.amount || 0)
      });`;

const saveEditNew = `      const matchedCat = categories.find(c => (c.subcategory || c.name) === editFormData.subcategory);
      const isExpense = editFormData.type === 'Dr';
      const isIncome = editFormData.type === 'Cr';

      // Enforce transaction-wise dimension rules
      let finalCostCenter = editFormData.costCenter;
      let finalProfitCenter = editFormData.profitCenter;
      if (isExpense) {
        finalProfitCenter = null; // Expenses cannot have Profit Center
      } else if (isIncome) {
        finalCostCenter = null; // Income cannot have Cost Center
      }

      await updateTransactionAPI({
        id: txId,
        categoryId: matchedCat?.id || null,
        categoryName: matchedCat?.name || editFormData.subcategory,
        subcategory: matchedCat?.subcategory || editFormData.subcategory,
        category: matchedCat?.category || null,
        division: matchedCat?.division || null,
        groupType: matchedCat?.group_type || matchedCat?.division || null,
        netType: matchedCat?.net_type || matchedCat?.sub_type || null,
        subType: matchedCat?.sub_type || null,
        transactionType: editFormData.transactionType || matchedCat?.transaction_type || 'ACTUAL',
        budget: editFormData.budget || null,
        costCenter: finalCostCenter,
        profitCenter: finalProfitCenter,
        project: editFormData.project || null,
        notes: editFormData.notes,
        remarks: editFormData.remarks,
        tagging: editFormData.tagging,
        utrNo: editFormData.utrNo,
        amount: Number(editFormData.amount || 0)
      });`;

code = code.replace(saveEditOld, saveEditNew);

// 6. Update handleApplyBulkCategory to apply dimensions
const applyBulkOld = `      const matchedCat = categories.find(c => (c.subcategory || c.name) === bulkSelectedSubcat);
      for (const id of selectedRowIds) {
        await updateTransactionAPI({
          id,
          categoryId: matchedCat?.id || null,
          categoryName: matchedCat?.name || bulkSelectedSubcat,
          subcategory: matchedCat?.subcategory || bulkSelectedSubcat,
          groupType: matchedCat?.group_type || null,
          netType: matchedCat?.net_type || null,
          subType: matchedCat?.sub_type || null,
          transactionType: matchedCat?.transaction_type || 'ACTUAL'
        });
      }`;

const applyBulkNew = `      const matchedCat = categories.find(c => (c.subcategory || c.name) === bulkSelectedSubcat);
      for (const id of selectedRowIds) {
        const line = dateTransactions.find(t => t.id === id);
        const isExp = line?.type === 'Dr';
        const isInc = line?.type === 'Cr';

        const updatePayload = { id };
        if (bulkSelectedSubcat) {
          updatePayload.categoryId = matchedCat?.id || null;
          updatePayload.categoryName = matchedCat?.name || bulkSelectedSubcat;
          updatePayload.subcategory = matchedCat?.subcategory || bulkSelectedSubcat;
          updatePayload.category = matchedCat?.category || null;
          updatePayload.division = matchedCat?.division || null;
          updatePayload.groupType = matchedCat?.group_type || matchedCat?.division || null;
          updatePayload.subType = matchedCat?.sub_type || null;
          updatePayload.transactionType = matchedCat?.transaction_type || 'ACTUAL';
        }
        if (bulkCostCenter && !isInc) updatePayload.costCenter = bulkCostCenter;
        if (bulkProfitCenter && !isExp) updatePayload.profitCenter = bulkProfitCenter;
        if (bulkBudget && !isInc) updatePayload.budget = bulkBudget;
        if (bulkProject) updatePayload.project = bulkProject;

        await updateTransactionAPI(updatePayload);
      }`;

code = code.replace(applyBulkOld, applyBulkNew);

// 7. Add Smart Auto-Fix Dimensions method
const autoFixMethod = `
  // Smart Auto-Fix & Validate Date Dimensions
  const handleAutoFixDimensions = async () => {
    const unverifiedLines = dateTransactions.filter(t => (t.auditStatus || t.audit_status) !== 'frozen');
    if (unverifiedLines.length === 0) {
      showToast("No editable transactions found on this date.", "info");
      return;
    }

    try {
      setActionLoading(true);
      let fixedCount = 0;

      for (const tx of unverifiedLines) {
        const isExp = tx.type === 'Dr';
        const isInc = tx.type === 'Cr';
        const sub = (tx.subcategory || tx.categoryName || '').toUpperCase();
        const payload = { id: tx.id };
        let needsUpdate = false;

        // Rule 1: Clean up conflict (Profit Center on Expense)
        if (isExp && (tx.profitCenter || tx.profit_center)) {
          payload.profitCenter = null;
          needsUpdate = true;
        }

        // Rule 2: Clean up conflict (Cost Center on Income)
        if (isInc && (tx.costCenter || tx.cost_center)) {
          payload.costCenter = null;
          needsUpdate = true;
        }

        // Rule 3: Suggest Cost Center on Expense if missing
        if (isExp && !(tx.costCenter || tx.cost_center)) {
          if (sub.includes('PETROL') || sub.includes('TRANSPORT') || sub.includes('BIKE') || sub.includes('CAR')) {
            payload.costCenter = 'Vehicle';
            payload.budget = tx.budget || 'Travel Budget';
          } else if (sub.includes('GROCERIES') || sub.includes('HOUSE') || sub.includes('MAINTENANCE')) {
            payload.costCenter = 'Home';
            payload.budget = tx.budget || 'Home Budget';
          } else if (sub.includes('FOOD') || sub.includes('SNACK') || sub.includes('DINING')) {
            payload.costCenter = 'Self';
            payload.budget = tx.budget || 'Food Budget';
          } else if (sub.includes('MEDICAL') || sub.includes('HEALTH')) {
            payload.costCenter = 'Health';
            payload.budget = tx.budget || 'Healthcare Budget';
          } else if (sub.includes('EDUCATION') || sub.includes('LEARNING')) {
            payload.costCenter = 'Education';
            payload.budget = tx.budget || 'Home Budget';
          } else {
            payload.costCenter = 'Self';
            payload.budget = tx.budget || 'Home Budget';
          }
          needsUpdate = true;
        }

        // Rule 4: Suggest Profit Center on Income if missing
        if (isInc && !(tx.profitCenter || tx.profit_center)) {
          if (sub.includes('SALARY') || sub.includes('PAYROLL')) {
            payload.profitCenter = 'Salary';
          } else if (sub.includes('CASHBACK') || sub.includes('REWARD')) {
            payload.profitCenter = 'Cashback & Rewards';
          } else if (sub.includes('INVESTMENT') || sub.includes('RETURN') || sub.includes('DIVIDEND')) {
            payload.profitCenter = 'Investments';
          } else if (sub.includes('FREELANCE')) {
            payload.profitCenter = 'Freelancing';
          } else {
            payload.profitCenter = 'Salary';
          }
          needsUpdate = true;
        }

        if (needsUpdate) {
          await updateTransactionAPI(payload);
          fixedCount++;
        }
      }

      showToast(\`Auto-validated & optimized dimensions for \${fixedCount} transaction line(s)!\`);
      if (onReloadTransactions) await onReloadTransactions();
    } catch (err) {
      alert("Auto-fix failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };
`;

code = code.replace('// Batch Verify for Date', autoFixMethod + '\n  // Batch Verify for Date');

fs.writeFileSync('src/components/TransactionValidationView.jsx', code, 'utf8');
console.log('Successfully patched logic in TransactionValidationView.jsx');

