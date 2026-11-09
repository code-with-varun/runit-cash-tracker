const fs = require('fs');

// ==========================================
// 1. UPDATE BulkEntryGrid.jsx
// ==========================================
let bulkContent = fs.readFileSync('src/components/BulkEntryGrid.jsx', 'utf8');

// Update signature
const sigOld = `export default function BulkEntryGrid({
  categories = [],
  accounts = [],
  activeAccount = 'Cash_1',`;

const sigNew = `export default function BulkEntryGrid({
  categories = [],
  accounts = [],
  masters = { budgets: [], cost_centers: [], profit_centers: [], projects: [] },
  activeAccount = 'Cash_1',`;

if (bulkContent.includes(sigOld)) {
  bulkContent = bulkContent.replace(sigOld, sigNew);
  console.log('Updated BulkEntryGrid signature with masters prop');
}

// Update createBlankRow
const blankRowOld = `  const createBlankRow = (serial = 1, defaultAccount = 'Cash_1') => {
    const firstCat = categories.length > 0 ? categories[0] : { id: '', name: 'General', type: 'Dr' };
    if (!isCashTrackerMode) {
      return {
        id: Date.now() + Math.random(),
        isBankFormat: true,
        date: todayStr,
        tran_date: todayStr,
        tran_no: serial,
        account_no: defaultAccount,
        particulars: '',
        debit: '',
        credit: '',
        balance: '',
        categoryId: firstCat.id,
        categoryName: firstCat.name,
        subcategory: firstCat.subcategory || firstCat.name,
        type: 'Dr',
        amount: '',
      };
    } else {
      return {
        id: Date.now() + Math.random(),
        isBankFormat: false,
        date: todayStr,
        tran_date: todayStr,
        tran_no: serial,
        account_no: 'Cash_1',
        particulars: '',
        categoryId: firstCat.id,
        categoryName: firstCat.name,
        type: firstCat.type || 'Dr',
        amount: '',
        notes: '',
      };
    }
  };`;

const blankRowNew = `  const createBlankRow = (serial = 1, defaultAccount = 'Cash_1') => {
    const firstCat = categories.length > 0 ? categories[0] : { id: '', name: 'General', type: 'Dr' };
    if (!isCashTrackerMode) {
      return {
        id: Date.now() + Math.random(),
        isBankFormat: true,
        date: todayStr,
        tran_date: todayStr,
        tran_no: serial,
        account_no: defaultAccount,
        particulars: '',
        debit: '',
        credit: '',
        balance: '',
        categoryId: firstCat.id,
        categoryName: firstCat.name,
        subcategory: firstCat.subcategory || firstCat.name,
        division: firstCat.division || 'LIVING',
        category: firstCat.category || 'General',
        subType: firstCat.sub_type || null,
        transactionType: firstCat.transaction_type || 'ACTUAL',
        costCenter: firstCat.type === 'Dr' ? 'Self' : '',
        profitCenter: firstCat.type === 'Cr' ? 'Salary' : '',
        budget: firstCat.type === 'Dr' ? 'Home Budget' : '',
        project: '',
        type: 'Dr',
        amount: '',
      };
    } else {
      return {
        id: Date.now() + Math.random(),
        isBankFormat: false,
        date: todayStr,
        tran_date: todayStr,
        tran_no: serial,
        account_no: 'Cash_1',
        particulars: '',
        categoryId: firstCat.id,
        categoryName: firstCat.name,
        subcategory: firstCat.subcategory || firstCat.name,
        division: firstCat.division || 'LIVING',
        category: firstCat.category || 'General',
        subType: firstCat.sub_type || null,
        transactionType: firstCat.transaction_type || 'ACTUAL',
        costCenter: firstCat.type === 'Dr' ? 'Self' : '',
        profitCenter: firstCat.type === 'Cr' ? 'Salary' : '',
        budget: firstCat.type === 'Dr' ? 'Home Budget' : '',
        project: '',
        type: firstCat.type || 'Dr',
        amount: '',
        notes: '',
      };
    }
  };`;

if (bulkContent.includes(blankRowOld)) {
  bulkContent = bulkContent.replace(blankRowOld, blankRowNew);
  console.log('Updated createBlankRow with management dimensions');
}

// Update categoryId change logic in handleRowChange
const catChangeOld = `    } else if (field === 'categoryId') {
      const selectedCat = categories.find((c) => String(c.id) === String(value));
      if (selectedCat) {
        targetRow.categoryId = selectedCat.id;
        targetRow.categoryName = selectedCat.name;
        targetRow.subcategory = selectedCat.subcategory || selectedCat.name;
        targetRow._manualCategory = true;
        if (!targetRow.debit && !targetRow.credit) {
          targetRow.type = selectedCat.type;
        }
      }
    }`;

const catChangeNew = `    } else if (field === 'categoryId') {
      const selectedCat = categories.find((c) => String(c.id) === String(value));
      if (selectedCat) {
        targetRow.categoryId = selectedCat.id;
        targetRow.categoryName = selectedCat.name;
        targetRow.subcategory = selectedCat.subcategory || selectedCat.name;
        targetRow.division = selectedCat.division || 'LIVING';
        targetRow.category = selectedCat.category || 'General';
        targetRow.subType = selectedCat.sub_type || null;
        targetRow.transactionType = selectedCat.transaction_type || 'ACTUAL';
        targetRow._manualCategory = true;
        if (!targetRow.debit && !targetRow.credit) {
          targetRow.type = selectedCat.type;
        }
        // Auto-recommend dimensions based on category keywords
        const sub = (selectedCat.subcategory || selectedCat.name || '').toUpperCase();
        if (targetRow.type === 'Dr') {
          targetRow.profitCenter = '';
          if (sub.includes('PETROL') || sub.includes('TRANSPORT') || sub.includes('BIKE') || sub.includes('CAR')) {
            targetRow.costCenter = 'Vehicle';
            targetRow.budget = 'Travel Budget';
          } else if (sub.includes('FOOD') || sub.includes('DINING') || sub.includes('SNACK')) {
            targetRow.costCenter = 'Self';
            targetRow.budget = 'Food Budget';
          } else if (sub.includes('GROCERIES') || sub.includes('HOUSE') || sub.includes('MAINTENANCE')) {
            targetRow.costCenter = 'Home';
            targetRow.budget = 'Home Budget';
          } else if (sub.includes('MEDICAL') || sub.includes('HEALTH')) {
            targetRow.costCenter = 'Health';
            targetRow.budget = 'Healthcare Budget';
          }
        } else if (targetRow.type === 'Cr') {
          targetRow.costCenter = '';
          targetRow.budget = '';
          if (sub.includes('SALARY') || sub.includes('PAYROLL')) {
            targetRow.profitCenter = 'Salary';
          } else if (sub.includes('FREELANCE') || sub.includes('CONSULTING')) {
            targetRow.profitCenter = 'Freelancing';
          } else if (sub.includes('DIVIDEND') || sub.includes('INTEREST')) {
            targetRow.profitCenter = 'Investments';
          }
        }
      }
    }`;

if (bulkContent.includes(catChangeOld)) {
  bulkContent = bulkContent.replace(catChangeOld, catChangeNew);
  console.log('Updated categoryId change with auto-cascade & dimension rules');
}

// Update validRows creation in handleSubmitBulk
const validRowsOld = `      validRows.push({
        date: r.date || r.tran_date || todayStr,
        tran_date: r.date || r.tran_date || todayStr,
        tran_no: r.tran_no || (i + 1),
        tranNo: r.tran_no || (i + 1),
        accountNo: targetAccCode,
        account_no: targetAccCode,
        account_id: matchedAcc?.id || null,
        particulars: (r.particulars || r.notes || '').trim(),
        notes: (r.particulars || r.notes || '').trim(),
        debit: type === 'Dr' ? amount : 0.00,
        credit: type === 'Cr' ? amount : 0.00,
        balance: parseFloat(r.balance || 0),
        amount: amount,
        type: type,
        categoryId: catObj?.id || r.categoryId || null,
        categoryName: catObj?.name || r.categoryName || 'General',
        subcategory: catObj?.subcategory || catObj?.name || r.categoryName || 'General',
        groupType: catObj?.group_type || null,
        netType: catObj?.net_type || null,
        subType: catObj?.sub_type || null,
        transactionType: catObj?.transaction_type || 'ACTUAL',
        auditStatus: 'draft',
      });`;

const validRowsNew = `      validRows.push({
        date: r.date || r.tran_date || todayStr,
        tran_date: r.date || r.tran_date || todayStr,
        tran_no: r.tran_no || (i + 1),
        tranNo: r.tran_no || (i + 1),
        accountNo: targetAccCode,
        account_no: targetAccCode,
        account_id: matchedAcc?.id || null,
        particulars: (r.particulars || r.notes || '').trim(),
        notes: (r.particulars || r.notes || '').trim(),
        debit: type === 'Dr' ? amount : 0.00,
        credit: type === 'Cr' ? amount : 0.00,
        balance: parseFloat(r.balance || 0),
        amount: amount,
        type: type,
        categoryId: catObj?.id || r.categoryId || null,
        categoryName: catObj?.name || r.categoryName || 'General',
        subcategory: catObj?.subcategory || catObj?.name || r.categoryName || 'General',
        category: catObj?.category || r.category || null,
        division: catObj?.division || r.division || null,
        groupType: catObj?.group_type || catObj?.division || null,
        netType: catObj?.net_type || catObj?.sub_type || null,
        subType: catObj?.sub_type || r.subType || null,
        transactionType: catObj?.transaction_type || r.transactionType || 'ACTUAL',
        costCenter: type === 'Dr' ? (r.costCenter || null) : null,
        profitCenter: type === 'Cr' ? (r.profitCenter || null) : null,
        budget: type === 'Dr' ? (r.budget || null) : null,
        project: r.project || null,
        auditStatus: 'draft',
      });`;

if (bulkContent.includes(validRowsOld)) {
  bulkContent = bulkContent.replace(validRowsOld, validRowsNew);
  console.log('Updated validRows in handleSubmitBulk to submit all dimensions');
}

// Update table headers for Bank and Cash format
const theadOld = `              {isCashTrackerMode ? (
                /* Purely Standard Cash Columns */
                <tr>
                  <th style={{ width: '36px' }}>#</th>
                  <th style={{ minWidth: '130px' }}>Date</th>
                  <th style={{ minWidth: '170px' }}>Category</th>
                  <th style={{ minWidth: '90px' }}>Type</th>
                  <th style={{ minWidth: '130px' }}>Amount (₹)</th>
                  <th style={{ minWidth: '240px' }}>Notes</th>
                  <th style={{ width: '50px', textAlign: 'center' }}>Action</th>
                </tr>
              ) : (
                /* Purely Bank Statement Columns */
                <tr>
                  <th style={{ width: '36px' }}>#</th>
                  <th style={{ minWidth: '125px' }}>tran_date</th>
                  <th style={{ width: '80px' }}>tran_no</th>
                  <th style={{ minWidth: '150px' }}>account_no</th>
                  <th style={{ minWidth: '240px' }}>particulars</th>
                  <th style={{ minWidth: '110px' }}>debit (₹)</th>
                  <th style={{ minWidth: '110px' }}>credit (₹)</th>
                  <th style={{ minWidth: '110px' }}>balance (₹)</th>
                  <th style={{ minWidth: '160px' }}>Category (Auto-Classified)</th>
                  <th style={{ width: '45px', textAlign: 'center' }}>Action</th>
                </tr>
              )}`;

const theadNew = `              {isCashTrackerMode ? (
                /* Purely Standard Cash Columns */
                <tr>
                  <th style={{ width: '36px' }}>#</th>
                  <th style={{ minWidth: '125px' }}>Date</th>
                  <th style={{ minWidth: '160px' }}>Category</th>
                  <th style={{ minWidth: '80px' }}>Type</th>
                  <th style={{ minWidth: '115px' }}>Amount (₹)</th>
                  <th style={{ minWidth: '125px' }}>Cost Center</th>
                  <th style={{ minWidth: '125px' }}>Profit Center</th>
                  <th style={{ minWidth: '125px' }}>Budget</th>
                  <th style={{ minWidth: '180px' }}>Notes</th>
                  <th style={{ width: '50px', textAlign: 'center' }}>Action</th>
                </tr>
              ) : (
                /* Purely Bank Statement Columns */
                <tr>
                  <th style={{ width: '36px' }}>#</th>
                  <th style={{ minWidth: '120px' }}>tran_date</th>
                  <th style={{ width: '75px' }}>tran_no</th>
                  <th style={{ minWidth: '140px' }}>account_no</th>
                  <th style={{ minWidth: '200px' }}>particulars</th>
                  <th style={{ minWidth: '100px' }}>debit (₹)</th>
                  <th style={{ minWidth: '100px' }}>credit (₹)</th>
                  <th style={{ minWidth: '100px' }}>balance (₹)</th>
                  <th style={{ minWidth: '150px' }}>Category</th>
                  <th style={{ minWidth: '120px' }}>Cost Center</th>
                  <th style={{ minWidth: '120px' }}>Profit Center</th>
                  <th style={{ minWidth: '120px' }}>Budget</th>
                  <th style={{ minWidth: '110px' }}>Project</th>
                  <th style={{ width: '45px', textAlign: 'center' }}>Action</th>
                </tr>
              )}`;

if (bulkContent.includes(theadOld)) {
  bulkContent = bulkContent.replace(theadOld, theadNew);
  console.log('Updated thead in BulkEntryGrid with dimension headers');
}

// Update the cash format row cells
const cashRowOld = `                      <td>
                        <input
                          type="text"
                          placeholder="Notes / description..."
                          value={row.notes || ''}
                          onChange={(e) => handleRowChange(idx, 'notes', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8125rem', minHeight: '34px' }}
                        />
                      </td>`;

const cashRowNew = `                      <td>
                        <select
                          value={row.costCenter || ''}
                          disabled={row.type === 'Cr'}
                          onChange={(e) => handleRowChange(idx, 'costCenter', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.4rem', fontSize: '0.78125rem', minHeight: '34px' }}
                        >
                          <option value="">{row.type === 'Cr' ? '— (N/A)' : '-- Cost Center --'}</option>
                          {(masters?.cost_centers || []).map(cc => (
                            <option key={cc.code || cc.id} value={cc.name}>{cc.name}</option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <select
                          value={row.profitCenter || ''}
                          disabled={row.type === 'Dr'}
                          onChange={(e) => handleRowChange(idx, 'profitCenter', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.4rem', fontSize: '0.78125rem', minHeight: '34px' }}
                        >
                          <option value="">{row.type === 'Dr' ? '— (N/A)' : '-- Profit Center --'}</option>
                          {(masters?.profit_centers || []).map(pc => (
                            <option key={pc.code || pc.id} value={pc.name}>{pc.name}</option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <select
                          value={row.budget || ''}
                          disabled={row.type === 'Cr'}
                          onChange={(e) => handleRowChange(idx, 'budget', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.4rem', fontSize: '0.78125rem', minHeight: '34px' }}
                        >
                          <option value="">{row.type === 'Cr' ? '— (N/A)' : '-- Budget --'}</option>
                          {(masters?.budgets || []).map(b => (
                            <option key={b.code || b.id} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <input
                          type="text"
                          placeholder="Notes / description..."
                          value={row.notes || ''}
                          onChange={(e) => handleRowChange(idx, 'notes', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8125rem', minHeight: '34px' }}
                        />
                      </td>`;

if (bulkContent.includes(cashRowOld)) {
  bulkContent = bulkContent.replace(cashRowOld, cashRowNew);
  console.log('Updated cash row cells with dimensions');
}

// Update the bank format row cells (after category select)
const bankCatOld = `                      <td>
                        <select
                          value={row.categoryId || (categories.length > 0 ? categories[0].id : '')}
                          onChange={(e) => handleRowChange(idx, 'categoryId', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8125rem', minHeight: '34px' }}
                        >
                          {crCategories.length > 0 && (
                            <optgroup label="🟢 Credit (Income)">
                              {crCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {drCategories.length > 0 && (
                            <optgroup label="🔴 Debit (Expense)">
                              {drCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </td>`;

const bankCatNew = `                      <td>
                        <select
                          value={row.categoryId || (categories.length > 0 ? categories[0].id : '')}
                          onChange={(e) => handleRowChange(idx, 'categoryId', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8125rem', minHeight: '34px' }}
                        >
                          {crCategories.length > 0 && (
                            <optgroup label="🟢 Credit (Income)">
                              {crCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {drCategories.length > 0 && (
                            <optgroup label="🔴 Debit (Expense)">
                              {drCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </td>

                      {/* Cost Center */}
                      <td>
                        <select
                          value={row.costCenter || ''}
                          disabled={row.type === 'Cr'}
                          onChange={(e) => handleRowChange(idx, 'costCenter', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.4rem', fontSize: '0.78125rem', minHeight: '34px' }}
                        >
                          <option value="">{row.type === 'Cr' ? '— (N/A)' : '-- Cost Center --'}</option>
                          {(masters?.cost_centers || []).map(cc => (
                            <option key={cc.code || cc.id} value={cc.name}>{cc.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* Profit Center */}
                      <td>
                        <select
                          value={row.profitCenter || ''}
                          disabled={row.type === 'Dr'}
                          onChange={(e) => handleRowChange(idx, 'profitCenter', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.4rem', fontSize: '0.78125rem', minHeight: '34px' }}
                        >
                          <option value="">{row.type === 'Dr' ? '— (N/A)' : '-- Profit Center --'}</option>
                          {(masters?.profit_centers || []).map(pc => (
                            <option key={pc.code || pc.id} value={pc.name}>{pc.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* Budget */}
                      <td>
                        <select
                          value={row.budget || ''}
                          disabled={row.type === 'Cr'}
                          onChange={(e) => handleRowChange(idx, 'budget', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.4rem', fontSize: '0.78125rem', minHeight: '34px' }}
                        >
                          <option value="">{row.type === 'Cr' ? '— (N/A)' : '-- Budget --'}</option>
                          {(masters?.budgets || []).map(b => (
                            <option key={b.code || b.id} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* Project */}
                      <td>
                        <select
                          value={row.project || ''}
                          onChange={(e) => handleRowChange(idx, 'project', e.target.value)}
                          className="form-control"
                          style={{ padding: '0.3rem 0.4rem', fontSize: '0.78125rem', minHeight: '34px' }}
                        >
                          <option value="">-- Project --</option>
                          {(masters?.projects || []).map(pr => (
                            <option key={pr.code || pr.id} value={pr.name}>{pr.name}</option>
                          ))}
                        </select>
                      </td>`;

if (bulkContent.includes(bankCatOld)) {
  bulkContent = bulkContent.replace(bankCatOld, bankCatNew);
  console.log('Updated bank row cells with dimension inputs');
}

fs.writeFileSync('src/components/BulkEntryGrid.jsx', bulkContent, 'utf8');
console.log('Saved BulkEntryGrid.jsx');


// ==========================================
// 2. UPDATE SingleEntryForm.jsx
// ==========================================
let singleContent = fs.readFileSync('src/components/SingleEntryForm.jsx', 'utf8');

// Update props
const singleSigOld = `export default function SingleEntryForm({
  categories = [],
  accounts = [],
  activeAccount = 'Cash_1',
  onAddTransaction,
  onNavigate
}) {`;

const singleSigNew = `export default function SingleEntryForm({
  categories = [],
  accounts = [],
  masters = { budgets: [], cost_centers: [], profit_centers: [], projects: [] },
  activeAccount = 'Cash_1',
  onAddTransaction,
  onNavigate
}) {`;

if (singleContent.includes(singleSigOld)) {
  singleContent = singleContent.replace(singleSigOld, singleSigNew);
  console.log('Updated SingleEntryForm props with masters');
}

// Add state for dimensions
const stateTargetOld = `  const [type, setType] = useState('Dr');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayStr);
  const [notes, setNotes] = useState('');`;

const stateTargetNew = `  const [type, setType] = useState('Dr');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayStr);
  const [notes, setNotes] = useState('');
  const [costCenter, setCostCenter] = useState('Self');
  const [profitCenter, setProfitCenter] = useState('');
  const [budget, setBudget] = useState('Home Budget');
  const [project, setProject] = useState('');`;

if (singleContent.includes(stateTargetOld)) {
  singleContent = singleContent.replace(stateTargetOld, stateTargetNew);
  console.log('Added dimension states in SingleEntryForm');
}

// Update handleCategoryChange to set dimensions
const catChangeSingleOld = `  const handleCategoryChange = (e) => {
    const selectedId = e.target.value;
    setCategoryId(selectedId);
    const catObj = categories.find((c) => String(c.id) === String(selectedId));
    if (catObj) {
      setCategoryName(catObj.name);
      setType(catObj.type); // Auto-assigned Cr/Dr
    }
  };`;

const catChangeSingleNew = `  const handleCategoryChange = (e) => {
    const selectedId = e.target.value;
    setCategoryId(selectedId);
    const catObj = categories.find((c) => String(c.id) === String(selectedId));
    if (catObj) {
      setCategoryName(catObj.name);
      setType(catObj.type); // Auto-assigned Cr/Dr
      const sub = (catObj.subcategory || catObj.name || '').toUpperCase();
      if (catObj.type === 'Dr') {
        setProfitCenter('');
        if (sub.includes('PETROL') || sub.includes('TRANSPORT') || sub.includes('BIKE') || sub.includes('CAR')) {
          setCostCenter('Vehicle');
          setBudget('Travel Budget');
        } else if (sub.includes('FOOD') || sub.includes('DINING') || sub.includes('SNACK')) {
          setCostCenter('Self');
          setBudget('Food Budget');
        } else if (sub.includes('GROCERIES') || sub.includes('HOUSE') || sub.includes('MAINTENANCE')) {
          setCostCenter('Home');
          setBudget('Home Budget');
        } else if (sub.includes('MEDICAL') || sub.includes('HEALTH')) {
          setCostCenter('Health');
          setBudget('Healthcare Budget');
        } else {
          setCostCenter('Self');
          setBudget('Home Budget');
        }
      } else {
        setCostCenter('');
        setBudget('');
        if (sub.includes('SALARY') || sub.includes('PAYROLL')) {
          setProfitCenter('Salary');
        } else if (sub.includes('FREELANCE') || sub.includes('CONSULTING')) {
          setProfitCenter('Freelancing');
        } else if (sub.includes('DIVIDEND') || sub.includes('INTEREST')) {
          setProfitCenter('Investments');
        } else {
          setProfitCenter('Salary');
        }
      }
    }
  };`;

if (singleContent.includes(catChangeSingleOld)) {
  singleContent = singleContent.replace(catChangeSingleOld, catChangeSingleNew);
  console.log('Updated handleCategoryChange in SingleEntryForm');
}

// Update newTx construction in handleSubmit
const newTxOld = `    const newTx = {
      date,
      accountNo: selectedAccount || 'Cash_1',
      account_id: matchedAcc?.id || null,
      categoryId: catObj?.id || categoryId || null,
      categoryName: catObj?.name || categoryName || 'General',
      subcategory: catObj?.subcategory || catObj?.name || categoryName || 'General',
      groupType: catObj?.group_type || null,
      netType: catObj?.net_type || null,
      subType: catObj?.sub_type || null,
      transactionType: catObj?.transaction_type || 'ACTUAL',
      type,
      amount: parsedAmount,
      notes: notes.trim(),
    };`;

const newTxNew = `    const newTx = {
      date,
      accountNo: selectedAccount || 'Cash_1',
      account_id: matchedAcc?.id || null,
      categoryId: catObj?.id || categoryId || null,
      categoryName: catObj?.name || categoryName || 'General',
      subcategory: catObj?.subcategory || catObj?.name || categoryName || 'General',
      category: catObj?.category || null,
      division: catObj?.division || null,
      groupType: catObj?.group_type || catObj?.division || null,
      netType: catObj?.net_type || catObj?.sub_type || null,
      subType: catObj?.sub_type || null,
      transactionType: catObj?.transaction_type || 'ACTUAL',
      costCenter: type === 'Dr' ? (costCenter || null) : null,
      profitCenter: type === 'Cr' ? (profitCenter || null) : null,
      budget: type === 'Dr' ? (budget || null) : null,
      project: project || null,
      type,
      amount: parsedAmount,
      notes: notes.trim(),
    };`;

if (singleContent.includes(newTxOld)) {
  singleContent = singleContent.replace(newTxOld, newTxNew);
  console.log('Updated newTx in SingleEntryForm to attach all dimensions');
}

// Add dimension selector fields into SingleEntryForm JSX right before Amount & Date Picker
const formFieldsOld = `          {/* Auto-assigned Type Display Badge */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: '700' }}>Classification</label>
            <div>
              <span className={type === 'Cr' ? 'badge badge-cr' : 'badge badge-dr'} style={{ fontSize: '0.8125rem', padding: '0.4rem 0.85rem' }}>
                {type === 'Cr' ? '🟢 Credit (Cr) — Income / Inflow' : '🔴 Debit (Dr) — Expense / Outflow'}
              </span>
            </div>
          </div>`;

const formFieldsNew = `          {/* Auto-assigned Type Display Badge & Hierarchy */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: '700' }}>Classification & Hierarchy</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className={type === 'Cr' ? 'badge badge-cr' : 'badge badge-dr'} style={{ fontSize: '0.8125rem', padding: '0.4rem 0.85rem' }}>
                {type === 'Cr' ? '🟢 Credit (Cr) — Income / Inflow' : '🔴 Debit (Dr) — Expense / Outflow'}
              </span>
              {(() => {
                const c = categories.find((cat) => String(cat.id) === String(categoryId));
                if (c) {
                  return (
                    <span className="badge badge-neutral" style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}>
                      📁 {c.division || 'LIVING'} &gt; {c.category || 'General'} {c.sub_type ? \`(\${c.sub_type})\` : ''}
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {/* Management Dimensions Grid */}
          <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
            {type === 'Dr' ? (
              <>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '700' }}>
                    Cost Center (Consumed By Whom?)
                  </label>
                  <select
                    value={costCenter}
                    onChange={(e) => setCostCenter(e.target.value)}
                    className="form-control"
                    style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem' }}
                  >
                    <option value="">-- None / General --</option>
                    {(masters?.cost_centers || []).map(cc => (
                      <option key={cc.code || cc.id} value={cc.name}>{cc.name} ({cc.code})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '700' }}>
                    Budget Bucket (Planned Under What?)
                  </label>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="form-control"
                    style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem' }}
                  >
                    <option value="">-- None / General --</option>
                    {(masters?.budgets || []).map(b => (
                      <option key={b.code || b.id} value={b.name}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ fontWeight: '700' }}>
                  Profit Center (Earned / Generated By Whom?)
                </label>
                <select
                  value={profitCenter}
                  onChange={(e) => setProfitCenter(e.target.value)}
                  className="form-control"
                  style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem' }}
                >
                  <option value="">-- None / General --</option>
                  {(masters?.profit_centers || []).map(pc => (
                    <option key={pc.code || pc.id} value={pc.name}>{pc.name} ({pc.code})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ fontWeight: '700' }}>
                Project Master (Purpose / Target Initiative - Optional)
              </label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="form-control"
                style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem' }}
              >
                <option value="">-- No Project (Standard Operating Expense/Income) --</option>
                {(masters?.projects || []).map(pr => (
                  <option key={pr.code || pr.id} value={pr.name}>{pr.name} ({pr.code})</option>
                ))}
              </select>
            </div>
          </div>`;

if (singleContent.includes(formFieldsOld)) {
  singleContent = singleContent.replace(formFieldsOld, formFieldsNew);
  console.log('Added dimension inputs in SingleEntryForm JSX');
}

fs.writeFileSync('src/components/SingleEntryForm.jsx', singleContent, 'utf8');
console.log('Saved SingleEntryForm.jsx');

