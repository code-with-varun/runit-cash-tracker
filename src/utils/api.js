import * as LocalStorage from './storage';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Helper for fetch API with fallback to LocalStorage
async function fetchWithFallback(url, options = {}, fallbackFn) {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`API call failed (${url}), falling back to LocalStorage:`, err.message);
    return fallbackFn();
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
