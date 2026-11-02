import React, { useState, useEffect } from 'react';
import { PlusCircle, Calendar, Tag, DollarSign, FileText, CheckCircle, AlertCircle, Landmark } from 'lucide-react';
import { getTodayString } from '../utils/storage';

export default function SingleEntryForm({
  categories = [],
  accounts = [],
  masters = { budgets: [], cost_centers: [], profit_centers: [], projects: [] },
  activeAccount = 'Cash_1',
  onAddTransaction,
  onNavigate
}) {
  const todayStr = getTodayString();

  const [selectedAccount, setSelectedAccount] = useState(activeAccount || 'Cash_1');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [type, setType] = useState('Dr');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayStr);
  const [notes, setNotes] = useState('');
  const [costCenter, setCostCenter] = useState('Self');
  const [profitCenter, setProfitCenter] = useState('');
  const [budget, setBudget] = useState('Home Budget');
  const [project, setProject] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Keep selectedAccount in sync if activeAccount changes
  useEffect(() => {
    if (activeAccount) {
      setSelectedAccount(activeAccount);
    }
  }, [activeAccount]);

  const defaultAccountsList = [
    { id: 'Cash_1', name: 'Cash_1 (Physical Cash)', type: 'Cash' },
    { id: 'ICICI_DM_3142', name: 'ICICI_DM_3142 (Savings)', type: 'Bank' },
    { id: 'FED_SB_9998', name: 'FED_SB_9998 (Federal SB)', type: 'Bank' },
    { id: 'HDFC_CC_0733', name: 'HDFC_CC_0733 (Credit Card)', type: 'Card' },
    { id: 'ICICI_CC_8003', name: 'ICICI_CC_HP_8003 (Credit Card)', type: 'Card' },
    { id: 'ICICI_CUR_0498', name: 'ICICI_CUR_0498 (Current)', type: 'Current' },
    { id: 'SELVA_LOAN', name: 'SELVA_LOANS (Payable)', type: 'Loan' },
  ];

  const accountOptions = (accounts && accounts.length > 0)
    ? accounts.map(a => ({ id: a.code || a.name, name: `${a.name} (${a.code || a.type})` }))
    : defaultAccountsList;

  const crCategories = categories ? categories.filter((c) => c.type === 'Cr') : [];
  const drCategories = categories ? categories.filter((c) => c.type === 'Dr') : [];

  // Auto-select first category on load
  useEffect(() => {
    if (categories && categories.length > 0 && !categoryId) {
      const firstCat = categories[0];
      setCategoryId(firstCat.id);
      setCategoryName(firstCat.name);
      setType(firstCat.type);
    }
  }, [categories, categoryId]);

  // Handle Category selection & Auto-assign Type
  const handleCategoryChange = (e) => {
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
  };

  // Date Change with Validation
  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    if (selectedDate > todayStr) {
      setErrorMsg('Future dates are strictly blocked. Date reset to Today.');
      setDate(todayStr);
    } else {
      setErrorMsg('');
      setDate(selectedDate);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validation
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }

    if (date > todayStr) {
      setErrorMsg('Future dates are strictly blocked. Please select today or a past date.');
      return;
    }

    const matchedAcc = (accounts || []).find(a => a.code === selectedAccount || a.name === selectedAccount);
    const catObj = (categories || []).find((c) => String(c.id) === String(categoryId));

    const newTx = {
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
    };

    onAddTransaction(newTx);

    setSuccessMsg(`Successfully added ${type === 'Cr' ? 'Credit' : 'Debit'} entry of ₹${parsedAmount.toLocaleString('en-IN')} to ${selectedAccount}`);
    setAmount('');
    setNotes('');

    setTimeout(() => {
      setSuccessMsg('');
    }, 3500);
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', width: '100%', padding: '0.5rem' }}>
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--primary-brand-bg)',
              color: 'var(--primary-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <PlusCircle size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Single Transaction Entry
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                Record a financial entry to target ledger: <strong style={{ color: 'var(--text-primary)' }}>{selectedAccount}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('accounts')}
              className="btn btn-ghost btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.78125rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}
              title="Return to Accounts Master"
            >
              <Landmark size={14} color="#3b82f6" />
              <span>Accounts Master</span>
            </button>
          </div>
        </div>

        {/* Feedback Notifications */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            background: 'var(--accent-dr-bg)',
            border: '1px solid var(--accent-dr-border)',
            color: 'var(--accent-dr)',
            fontSize: '0.8125rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            background: 'var(--accent-cr-bg)',
            border: '1px solid var(--accent-cr-border)',
            color: 'var(--accent-cr)',
            fontSize: '0.8125rem',
            marginBottom: '1.25rem'
          }}>
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          
          {/* Target Account Selector */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: '700' }}>
              <Landmark size={15} color="var(--primary-brand)" />
              <span>Target Account (Cash / Bank / Card / Loan)</span>
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="form-control"
              style={{ padding: '0.65rem 0.85rem', fontWeight: '600', fontSize: '0.875rem' }}
              required
            >
              {accountOptions.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown & Auto-Assigned Type */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: '700' }}>
              <Tag size={15} />
              <span>Select Category</span>
            </label>
            <select
              value={categoryId}
              onChange={handleCategoryChange}
              className="form-control"
              style={{ padding: '0.65rem 0.85rem', fontWeight: '600', fontSize: '0.875rem' }}
              required
            >
              {categories.length === 0 && (
                <option value="">No categories defined yet. Please create categories first.</option>
              )}
              {crCategories.length > 0 && (
                <optgroup label="🟢 Credit (Income / Inflows)">
                  {crCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {drCategories.length > 0 && (
                <optgroup label="🔴 Debit (Expense / Outflows)">
                  {drCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Auto-assigned Type Display Badge & Hierarchy */}
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
                      📁 {c.division || 'LIVING'} &gt; {c.category || 'General'} {c.sub_type ? `(${c.sub_type})` : ''}
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
          </div>

          {/* Amount & Date Picker Grid */}
          <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: '700' }}>
                <DollarSign size={15} />
                <span>Amount (₹)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 1500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="form-control"
                style={{ padding: '0.65rem 0.85rem', fontSize: '0.9375rem', fontWeight: '700' }}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: '700' }}>
                <Calendar size={15} />
                <span>Date (Future dates blocked)</span>
              </label>
              <input
                type="date"
                max={todayStr}
                value={date}
                onChange={handleDateChange}
                className="form-control"
                style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem' }}
                required
              />
            </div>
          </div>

          {/* Notes Field */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: '700' }}>
              <FileText size={15} />
              <span>Notes / Particulars (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Grocery restocking, monthly client retainer..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-control"
              style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className={type === 'Cr' ? 'btn btn-success' : 'btn btn-danger'}
              style={{ flex: 1, padding: '0.75rem 1rem', fontSize: '0.9375rem', fontWeight: '700' }}
            >
              <PlusCircle size={18} />
              <span>Record Transaction</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('accounts')}
              className="btn btn-secondary"
              style={{ padding: '0.75rem 1.25rem' }}
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
