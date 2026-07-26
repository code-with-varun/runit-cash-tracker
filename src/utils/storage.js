// Data Storage & Persistence Utility using LocalStorage

const STORAGE_KEYS = {
  USERS: 'cashtracker_users',
  ACTIVE_USER: 'cashtracker_active_user',
  THEME: 'cashtracker_theme',
};

// Initial Default Categories
const DEFAULT_CATEGORIES = [
  { id: 'cat_1', name: 'Salary', type: 'Cr' },
  { id: 'cat_2', name: 'Freelance & Consulting', type: 'Cr' },
  { id: 'cat_3', name: 'Investments & Returns', type: 'Cr' },
  { id: 'cat_4', name: 'Rental Income', type: 'Cr' },
  { id: 'cat_5', name: 'Food & Dining', type: 'Dr' },
  { id: 'cat_6', name: 'Rent & Housing', type: 'Dr' },
  { id: 'cat_7', name: 'Utilities & Bills', type: 'Dr' },
  { id: 'cat_8', name: 'Shopping & Electronics', type: 'Dr' },
  { id: 'cat_9', name: 'Transportation & Fuel', type: 'Dr' },
  { id: 'cat_10', name: 'Healthcare & Insurance', type: 'Dr' },
  { id: 'cat_11', name: 'Entertainment & Leisure', type: 'Dr' },
];

// Helper to get Today's Date formatted YYYY-MM-DD
export function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Initial Sample Transactions
const DEFAULT_TRANSACTIONS = [
  {
    id: 'tx_101',
    date: getTodayString(),
    categoryId: 'cat_1',
    categoryName: 'Salary',
    type: 'Cr',
    amount: 75000.00,
    notes: 'Monthly salary credited',
  },
  {
    id: 'tx_102',
    date: getTodayString(),
    categoryId: 'cat_6',
    categoryName: 'Rent & Housing',
    type: 'Dr',
    amount: 22000.00,
    notes: 'Apartment monthly rent',
  },
  {
    id: 'tx_103',
    date: getTodayString(),
    categoryId: 'cat_5',
    categoryName: 'Food & Dining',
    type: 'Dr',
    amount: 1450.00,
    notes: 'Grocery store restocking',
  },
  {
    id: 'tx_104',
    date: getTodayString(),
    categoryId: 'cat_2',
    categoryName: 'Freelance & Consulting',
    type: 'Cr',
    amount: 18500.00,
    notes: 'Web application design project',
  },
  {
    id: 'tx_105',
    date: getTodayString(),
    categoryId: 'cat_7',
    categoryName: 'Utilities & Bills',
    type: 'Dr',
    amount: 3200.00,
    notes: 'Electricity and fiber internet bill',
  },
];

// User Account Management API
export function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
  } catch (e) {
    return [];
  }
}

export function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function getCurrentUser() {
  const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
  if (!activeId) return null;
  const users = getUsers();
  return users.find((u) => u.id === activeId) || null;
}

export function registerUser({ name, username, password }) {
  const users = getUsers();
  const trimmedUsername = username.trim().toLowerCase();

  if (users.some((u) => u.username.toLowerCase() === trimmedUsername)) {
    return { success: false, error: 'Username is already registered.' };
  }

  const newUser = {
    id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: name.trim(),
    username: trimmedUsername,
    password: password,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  // Initialize sample categories & transactions for the new account
  localStorage.setItem(`cashtracker_categories_${newUser.id}`, JSON.stringify(DEFAULT_CATEGORIES));
  localStorage.setItem(`cashtracker_transactions_${newUser.id}`, JSON.stringify(DEFAULT_TRANSACTIONS));

  // Set active session
  localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, newUser.id);
  return { success: true, user: newUser };
}

export function loginUser(username, password) {
  const users = getUsers();
  const trimmedUsername = username.trim().toLowerCase();
  const user = users.find((u) => u.username.toLowerCase() === trimmedUsername && u.password === password);

  if (!user) {
    return { success: false, error: 'Invalid username or password.' };
  }

  localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, user.id);
  return { success: true, user };
}

export function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
}

// User-Scoped Storage Helpers
function getUserCategoriesKey(userId) {
  return `cashtracker_categories_${userId}`;
}

function getUserTransactionsKey(userId) {
  return `cashtracker_transactions_${userId}`;
}

// Categories API
export function getCategories() {
  const user = getCurrentUser();
  if (!user) return DEFAULT_CATEGORIES;
  const key = getUserCategoriesKey(user.id);
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(data) || DEFAULT_CATEGORIES;
  } catch (e) {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories) {
  const user = getCurrentUser();
  if (!user) return;
  localStorage.setItem(getUserCategoriesKey(user.id), JSON.stringify(categories));
}

export function addCategory(category) {
  const categories = getCategories();
  const newCat = {
    id: `cat_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    ...category,
  };
  categories.push(newCat);
  saveCategories(categories);
  return newCat;
}

export function deleteCategory(id) {
  let categories = getCategories();
  categories = categories.filter((c) => c.id !== id);
  saveCategories(categories);
}

// Transactions API
export function getTransactions() {
  const user = getCurrentUser();
  if (!user) return DEFAULT_TRANSACTIONS;
  const key = getUserTransactionsKey(user.id);
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_TRANSACTIONS));
      return DEFAULT_TRANSACTIONS;
    }
    return JSON.parse(data) || DEFAULT_TRANSACTIONS;
  } catch (e) {
    return DEFAULT_TRANSACTIONS;
  }
}

export function saveTransactions(transactions) {
  const user = getCurrentUser();
  if (!user) return;
  localStorage.setItem(getUserTransactionsKey(user.id), JSON.stringify(transactions));
}

export function addTransaction(transaction) {
  const transactions = getTransactions();
  const newTx = {
    id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    ...transaction,
  };
  transactions.unshift(newTx);
  saveTransactions(transactions);
  return newTx;
}

export function addBulkTransactions(newTransactions) {
  const transactions = getTransactions();
  const formatted = newTransactions.map((tx, idx) => ({
    id: `tx_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
    ...tx,
  }));
  const updated = [...formatted, ...transactions];
  saveTransactions(updated);
  return updated;
}

export function updateTransaction(updatedTx) {
  let transactions = getTransactions();
  transactions = transactions.map((tx) => (tx.id === updatedTx.id ? updatedTx : tx));
  saveTransactions(transactions);
}

export function deleteTransaction(id) {
  let transactions = getTransactions();
  transactions = transactions.filter((tx) => tx.id !== id);
  saveTransactions(transactions);
}

// Backup & Reset API
export function exportFullDataJSON() {
  const data = {
    User: getCurrentUser(),
    Categories: getCategories(),
    Transactions: getTransactions(),
  };
  return JSON.stringify(data, null, 2);
}

export function importFullDataJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.Categories && Array.isArray(data.Categories)) {
      saveCategories(data.Categories);
    }
    if (data.Transactions && Array.isArray(data.Transactions)) {
      saveTransactions(data.Transactions);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function resetToSampleData() {
  const user = getCurrentUser();
  if (user) {
    localStorage.setItem(getUserCategoriesKey(user.id), JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem(getUserTransactionsKey(user.id), JSON.stringify(DEFAULT_TRANSACTIONS));
  }
}

