import * as LocalStorage from './storage';

function getApiBase() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    const path = window.location.pathname;
    const cleanPath = path.replace(/index\.html?$/i, '').replace(/\/+$/, '');
    if (cleanPath && cleanPath !== '/') {
      return `${cleanPath}/api`;
    }
  }
  return '/api';
}

const API_BASE = getApiBase();

// Helper for fetch API with fallback to LocalStorage
async function fetchWithFallback(url, options = {}, fallbackFn) {
  let isServerError = false;
  try {
    let user = LocalStorage.getCurrentUser();
    if (!user || !user.id) {
      const activeId = localStorage.getItem('moneymatrix_active_user') || localStorage.getItem('cashtracker_active_user');
      if (activeId) {
        user = { id: Number(activeId) || activeId, role: 'user' };
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(user?.id ? { 'X-User-Id': String(user.id) } : {}),
      ...(user?.role ? { 'X-User-Role': user.role } : {}),
      ...(options.headers || {}),
    };

    let targetUrl = `${API_BASE}${url}`;
    if (user?.id) {
      const sep = targetUrl.includes('?') ? '&' : '?';
      targetUrl += `${sep}user_id=${encodeURIComponent(user.id)}`;
    }

    const res = await fetch(targetUrl, {
      ...options,
      headers,
    });

    if (!res.ok) {
      isServerError = true;
      const errJson = await res.json().catch(() => ({}));
      const errMsg = errJson.error || errJson.message || `HTTP error ${res.status}`;
      throw new Error(errMsg);
    }
    return await res.json();
  } catch (err) {
    console.warn(`API call failed (${url}):`, err.message);
    // If the server rejected the mutation (4xx/5xx), do not silently fallback for write operations
    if (isServerError && options.method && options.method !== 'GET') {
      throw err;
    }
    if (fallbackFn) {
      return fallbackFn();
    }
    throw err;
  }
}

// User Authentication API (MongoDB Atlas with LocalStorage fallback)
export async function registerUserAPI({ name, username, password }) {
  return fetchWithFallback(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({ name, username, password }),
    },
    () => LocalStorage.registerUser({ name, username, password })
  );
}

export async function loginUserAPI(username, password) {
  return fetchWithFallback(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    },
    () => LocalStorage.loginUser(username, password)
  );
}

export async function googleAuthAPI({ credential, email, name, googleId, avatar }) {
  return fetchWithFallback(
    '/auth/google',
    {
      method: 'POST',
      body: JSON.stringify({ credential, email, name, googleId, avatar }),
    },
    () => {
      const users = LocalStorage.getUsers ? LocalStorage.getUsers() : [];
      let user = users.find(u => u.email === email || (googleId && u.googleId === googleId));
      if (!user) {
        const username = email ? email.split('@')[0] : 'guser';
        user = {
          id: Date.now(),
          name: name || username,
          username,
          email,
          role: 'user',
          avatar,
          authProvider: 'google'
        };
        if (LocalStorage.saveUsers) {
          users.push(user);
          LocalStorage.saveUsers(users);
        }
      }
      return { success: true, user };
    }
  );
}

// Categories API
export async function getCategoriesAPI() {
  return fetchWithFallback('/categories', {}, LocalStorage.getCategories);
}

export async function addCategoryAPI(category) {
  return fetchWithFallback(
    '/categories',
    {
      method: 'POST',
      body: JSON.stringify(category),
    },
    () => LocalStorage.addCategory(category)
  );
}

export async function bulkAddCategoriesAPI(categories) {
  return fetchWithFallback(
    '/categories/bulk',
    {
      method: 'POST',
      body: JSON.stringify(categories),
    },
    () => {
      const current = LocalStorage.getCategories();
      categories.forEach((c) => LocalStorage.addCategory(c));
      return { message: 'Bulk categories added' };
    }
  );
}

export async function importStandardCategoriesAPI() {
  return fetchWithFallback(
    '/categories?action=import_standard',
    { method: 'POST' },
    () => ({ success: true, message: 'Standard categories imported' })
  );
}

export async function bulkAuditTransactionsAPI({ ids, auditStatus }) {
  return fetchWithFallback(
    '/transactions?action=bulk_audit',
    {
      method: 'PUT',
      body: JSON.stringify({ ids, auditStatus }),
    },
    () => ({ success: true, count: ids.length })
  );
}

export async function updateCategoryAPI(category) {
  return fetchWithFallback(
    `/categories/${category.id}`,
    {
      method: 'PUT',
      body: JSON.stringify(category),
    },
    () => category
  );
}

export async function deleteCategoryAPI(id) {
  return fetchWithFallback(
    `/categories/${id}`,
    { method: 'DELETE' },
    () => LocalStorage.deleteCategory(id)
  );
}

// Transactions API
export async function getTransactionsAPI() {
  return fetchWithFallback('/transactions', {}, LocalStorage.getTransactions);
}

export async function addTransactionAPI(transaction) {
  return fetchWithFallback(
    '/transactions',
    {
      method: 'POST',
      body: JSON.stringify(transaction),
    },
    () => LocalStorage.addTransaction(transaction)
  );
}

export async function addBulkTransactionsAPI(transactionsList) {
  return fetchWithFallback(
    '/transactions/bulk',
    {
      method: 'POST',
      body: JSON.stringify(transactionsList),
    },
    () => LocalStorage.addBulkTransactions(transactionsList)
  );
}

export async function updateTransactionAPI(transaction) {
  return fetchWithFallback(
    `/transactions/${transaction.id}`,
    {
      method: 'PUT',
      body: JSON.stringify(transaction),
    },
    () => LocalStorage.updateTransaction(transaction)
  );
}

export async function deleteTransactionAPI(id) {
  return fetchWithFallback(
    `/transactions/${id}`,
    { method: 'DELETE' },
    () => LocalStorage.deleteTransaction(id)
  );
}

// PIN & Settings API
export async function getStoredPinAPI() {
  return fetchWithFallback(
    '/settings/pin',
    {},
    () => ({ pin: LocalStorage.getStoredPin() })
  );
}

export async function setStoredPinAPI(pin) {
  return fetchWithFallback(
    '/settings/pin',
    {
      method: 'POST',
      body: JSON.stringify({ pin }),
    },
    () => LocalStorage.setStoredPin(pin)
  );
}

export async function resetDataAPI() {
  return fetchWithFallback(
    '/reset',
    { method: 'POST' },
    () => LocalStorage.resetToSampleData()
  );
}

// Personal Accounts API
export async function getAccountsAPI() {
  return fetchWithFallback(
    '/accounts',
    {},
    () => LocalStorage.getAccounts()
  );
}

export async function addAccountAPI(account) {
  return fetchWithFallback(
    '/accounts',
    {
      method: 'POST',
      body: JSON.stringify(account),
    },
    () => LocalStorage.addAccount(account)
  );
}

export async function addBulkAccountsAPI(accountsList) {
  return fetchWithFallback(
    '/accounts?action=bulk',
    {
      method: 'POST',
      body: JSON.stringify({ accounts: accountsList }),
    },
    () => LocalStorage.addBulkAccounts(accountsList)
  );
}

export async function updateAccountAPI(account) {
  return fetchWithFallback(
    '/accounts',
    {
      method: 'PUT',
      body: JSON.stringify(account),
    },
    () => LocalStorage.updateAccount(account)
  );
}

export async function deleteAccountAPI(id) {
  return fetchWithFallback(
    `/accounts?id=${id}`,
    { method: 'DELETE' },
    () => LocalStorage.deleteAccount(id)
  );
}

// Super Admin User Management API
export async function getAdminUsersAPI() {
  return fetchWithFallback(
    '/admin/users',
    {},
    () => ({ success: true, stats: { totalUsers: 1, totalTransactions: 0, totalCategories: 0 }, users: [] })
  );
}

export async function updateAdminUserAPI({ id, status, role }) {
  return fetchWithFallback(
    '/admin/users',
    {
      method: 'PUT',
      body: JSON.stringify({ id, status, role }),
    },
    () => ({ success: true })
  );
}

export async function createAdminUserAPI({ name, username, password, role }) {
  return fetchWithFallback(
    '/admin/users',
    {
      method: 'POST',
      body: JSON.stringify({ name, username, password, role }),
    },
    () => ({ success: true })
  );
}

export async function deleteAdminUserAPI(id) {
  return fetchWithFallback(
    `/admin/users?id=${id}`,
    { method: 'DELETE' },
    () => ({ success: true })
  );
}

// Closing Balances API (Yearwise, Monthwise, Daywise)
export async function getClosingBalancesAPI(type = 'yearly', year = null) {
  let url = `/closing-balances?type=${encodeURIComponent(type)}`;
  if (year) url += `&year=${encodeURIComponent(year)}`;
  return fetchWithFallback(
    url,
    {},
    () => ({ success: true, data: [] })
  );
}

// Budget vs Actuals & Category Pivot API
export async function getBudgetsAPI(year = null, subcategory = null) {
  let url = `/budgets?`;
  if (year) url += `year=${encodeURIComponent(year)}&`;
  if (subcategory) url += `subcategory=${encodeURIComponent(subcategory)}`;
  return fetchWithFallback(
    url,
    {},
    () => ({ success: true, operational: [], divisions: [], matrix: { DR: {}, CR: {} } })
  );
}

export async function saveBudgetsAPI(payload) {
  return fetchWithFallback(
    '/budgets',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    () => ({ success: true })
  );
}

// AP / AR Counterparty Matrix & Yearwise Net P/L
export async function getApArMatrixAPI() {
  return fetchWithFallback(
    '/ap-ar',
    {},
    () => ({ success: true, counterparties: [], matrix: {}, raw_data: {}, yearwise_pl: [] })
  );
}

export async function saveApArMatrixAPI(matrixData) {
  return fetchWithFallback(
    '/ap-ar',
    {
      method: 'POST',
      body: JSON.stringify({ matrix_data: matrixData }),
    },
    () => ({ success: true })
  );
}

// Loan Accounts & PMT Amortization Schedule
export async function getLoansAPI(accountNo = null) {
  let url = '/loans';
  if (accountNo) url += `?account_no=${encodeURIComponent(accountNo)}`;
  return fetchWithFallback(
    url,
    {},
    () => ({ success: true, loans: [], active_loan: null, schedule: [], statement_ledger: [] })
  );
}

export async function createLoanAPI(loanData) {
  return fetchWithFallback(
    '/loans',
    {
      method: 'POST',
      body: JSON.stringify(loanData),
    },
    () => ({ success: true })
  );
}

// Portfolio & Equity Demat Trading Suite API
export async function getPortfolioAPI(type = 'all') {
  return fetchWithFallback(
    `/portfolio?type=${encodeURIComponent(type)}`,
    {},
    () => ({
      status: 'success',
      summary: {},
      holdings: [],
      demat_ledger: [],
      order_log: [],
      trade_details: [],
      trade_bills: []
    })
  );
}

export async function saveHoldingAPI(holdingData) {
  return fetchWithFallback(
    '/portfolio',
    {
      method: 'POST',
      body: JSON.stringify(holdingData)
    },
    () => ({ success: true })
  );
}

// Career Timeline P&L API
export async function getCareerMilestonesAPI() {
  return fetchWithFallback(
    '/career',
    {},
    () => ({
      status: 'success',
      summary: {},
      milestones: []
    })
  );
}

export async function saveCareerMilestoneAPI(data) {
  return fetchWithFallback(
    '/career',
    {
      method: 'POST',
      body: JSON.stringify(data)
    },
    () => ({ success: true })
  );
}

// Module Population / Seeding APIs
export async function seedPortfolioAPI() {
  return fetchWithFallback('/portfolio?action=seed', { method: 'POST', body: JSON.stringify({ action: 'seed' }) });
}

export async function seedCareerAPI() {
  return fetchWithFallback('/career?action=seed', { method: 'POST', body: JSON.stringify({ action: 'seed' }) });
}

export async function seedLoansAPI() {
  return fetchWithFallback('/loans?action=seed', {});
}

export async function seedApArAPI() {
  return fetchWithFallback('/ap-ar?action=seed', {});
}

// Management Masters APIs (Budgets, Cost Centers, Profit Centers, Projects)
export async function getMastersAPI(type = 'all') {
  return fetchWithFallback(
    `/masters?type=${encodeURIComponent(type)}`,
    {},
    () => {
      if (type === 'all') return LocalStorage.getAllMasters();
      if (type === 'budgets') return LocalStorage.getBudgetMasters();
      if (type === 'cost_centers') return LocalStorage.getCostCenters();
      if (type === 'profit_centers') return LocalStorage.getProfitCenters();
      if (type === 'projects') return LocalStorage.getProjects();
      return [];
    }
  );
}

export async function addMasterAPI(masterData) {
  return fetchWithFallback(
    '/masters',
    {
      method: 'POST',
      body: JSON.stringify(masterData)
    },
    () => {
      const t = masterData.type || 'cost_centers';
      if (t === 'budgets' || t === 'budget') return LocalStorage.addBudgetMaster(masterData);
      if (t === 'cost_centers' || t === 'cost_center') return LocalStorage.addCostCenter(masterData);
      if (t === 'profit_centers' || t === 'profit_center') return LocalStorage.addProfitCenter(masterData);
      if (t === 'projects' || t === 'project') return LocalStorage.addProject(masterData);
      return { success: false, error: 'Unknown master type' };
    }
  );
}

export async function updateMasterAPI(masterData) {
  return fetchWithFallback(
    `/masters/${masterData.id}?type=${encodeURIComponent(masterData.type || '')}`,
    {
      method: 'PUT',
      body: JSON.stringify(masterData)
    },
    () => {
      const t = masterData.type || 'cost_centers';
      if (t === 'budgets' || t === 'budget') return LocalStorage.updateBudgetMaster(masterData);
      if (t === 'cost_centers' || t === 'cost_center') return LocalStorage.updateCostCenter(masterData);
      if (t === 'profit_centers' || t === 'profit_center') return LocalStorage.updateProfitCenter(masterData);
      if (t === 'projects' || t === 'project') return LocalStorage.updateProject(masterData);
      return { success: true };
    }
  );
}

export async function deleteMasterAPI(id, type) {
  return fetchWithFallback(
    `/masters/${id}?type=${encodeURIComponent(type)}`,
    {
      method: 'DELETE'
    },
    () => {
      if (type === 'budgets' || type === 'budget') return LocalStorage.deleteBudgetMaster(id);
      if (type === 'cost_centers' || type === 'cost_center') return LocalStorage.deleteCostCenter(id);
      if (type === 'profit_centers' || type === 'profit_center') return LocalStorage.deleteProfitCenter(id);
      if (type === 'projects' || type === 'project') return LocalStorage.deleteProject(id);
      return { success: true };
    }
  );
}

export async function resetDefaultMastersAPI() {
  return fetchWithFallback(
    '/masters?action=reset_defaults',
    {
      method: 'POST',
      body: JSON.stringify({ action: 'reset_defaults' })
    },
    () => LocalStorage.resetDefaultMasters()
  );
}
