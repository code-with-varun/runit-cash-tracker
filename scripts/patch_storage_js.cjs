const fs = require('fs');

const categoriesJson = JSON.parse(fs.readFileSync('categories_master_verified.json', 'utf8'));
const mastersJson = JSON.parse(fs.readFileSync('masters_default.json', 'utf8'));

let storageCode = fs.readFileSync('src/utils/storage.js', 'utf8');

// Replace DEFAULT_CATEGORIES
const oldDefCat = 'const DEFAULT_CATEGORIES = [];';
const newDefCat = `export const DEFAULT_CATEGORIES = ${JSON.stringify(categoriesJson, null, 2)};

export const DEFAULT_BUDGETS = ${JSON.stringify(mastersJson.budgets, null, 2)};
export const DEFAULT_COST_CENTERS = ${JSON.stringify(mastersJson.cost_centers, null, 2)};
export const DEFAULT_PROFIT_CENTERS = ${JSON.stringify(mastersJson.profit_centers, null, 2)};
export const DEFAULT_PROJECTS = ${JSON.stringify(mastersJson.projects, null, 2)};
`;

storageCode = storageCode.replace(oldDefCat, newDefCat);

// Add Masters helpers at end of storage.js
const mastersHelpers = `
// Management Masters API (Budgets, Cost Centers, Profit Centers, Projects)
function getUserMastersKey(userId, type) {
  return \`moneymatrix_master_\${type}_\${userId || 'default'}\`;
}

export function getBudgetMasters() {
  const user = getCurrentUser();
  try {
    const data = localStorage.getItem(getUserMastersKey(user?.id, 'budgets'));
    if (data) return JSON.parse(data);
  } catch (e) {}
  return DEFAULT_BUDGETS;
}

export function saveBudgetMasters(items) {
  const user = getCurrentUser();
  localStorage.setItem(getUserMastersKey(user?.id, 'budgets'), JSON.stringify(items));
}

export function addBudgetMaster(item) {
  const list = getBudgetMasters();
  const newItem = {
    id: item.id || Date.now(),
    code: item.code || \`B\${String(list.length + 1).padStart(3, '0')}\`,
    name: item.name,
    description: item.description || '',
    category_group: item.category_group || 'LIVING',
    status: item.status || 'active'
  };
  list.push(newItem);
  saveBudgetMasters(list);
  return newItem;
}

export function updateBudgetMaster(item) {
  let list = getBudgetMasters();
  list = list.map(i => (i.id === item.id || i.code === item.code ? { ...i, ...item } : i));
  saveBudgetMasters(list);
  return { success: true };
}

export function deleteBudgetMaster(id) {
  let list = getBudgetMasters();
  list = list.filter(i => i.id !== id && i.code !== id);
  saveBudgetMasters(list);
  return { success: true };
}

export function getCostCenters() {
  const user = getCurrentUser();
  try {
    const data = localStorage.getItem(getUserMastersKey(user?.id, 'cost_centers'));
    if (data) return JSON.parse(data);
  } catch (e) {}
  return DEFAULT_COST_CENTERS;
}

export function saveCostCenters(items) {
  const user = getCurrentUser();
  localStorage.setItem(getUserMastersKey(user?.id, 'cost_centers'), JSON.stringify(items));
}

export function addCostCenter(item) {
  const list = getCostCenters();
  const newItem = {
    id: item.id || Date.now(),
    code: item.code || \`CC\${String(list.length + 1).padStart(3, '0')}\`,
    name: item.name,
    description: item.description || '',
    status: item.status || 'active'
  };
  list.push(newItem);
  saveCostCenters(list);
  return newItem;
}

export function updateCostCenter(item) {
  let list = getCostCenters();
  list = list.map(i => (i.id === item.id || i.code === item.code ? { ...i, ...item } : i));
  saveCostCenters(list);
  return { success: true };
}

export function deleteCostCenter(id) {
  let list = getCostCenters();
  list = list.filter(i => i.id !== id && i.code !== id);
  saveCostCenters(list);
  return { success: true };
}

export function getProfitCenters() {
  const user = getCurrentUser();
  try {
    const data = localStorage.getItem(getUserMastersKey(user?.id, 'profit_centers'));
    if (data) return JSON.parse(data);
  } catch (e) {}
  return DEFAULT_PROFIT_CENTERS;
}

export function saveProfitCenters(items) {
  const user = getCurrentUser();
  localStorage.setItem(getUserMastersKey(user?.id, 'profit_centers'), JSON.stringify(items));
}

export function addProfitCenter(item) {
  const list = getProfitCenters();
  const newItem = {
    id: item.id || Date.now(),
    code: item.code || \`PC\${String(list.length + 1).padStart(3, '0')}\`,
    name: item.name,
    description: item.description || '',
    status: item.status || 'active'
  };
  list.push(newItem);
  saveProfitCenters(list);
  return newItem;
}

export function updateProfitCenter(item) {
  let list = getProfitCenters();
  list = list.map(i => (i.id === item.id || i.code === item.code ? { ...i, ...item } : i));
  saveProfitCenters(list);
  return { success: true };
}

export function deleteProfitCenter(id) {
  let list = getProfitCenters();
  list = list.filter(i => i.id !== id && i.code !== id);
  saveProfitCenters(list);
  return { success: true };
}

export function getProjects() {
  const user = getCurrentUser();
  try {
    const data = localStorage.getItem(getUserMastersKey(user?.id, 'projects'));
    if (data) return JSON.parse(data);
  } catch (e) {}
  return DEFAULT_PROJECTS;
}

export function saveProjects(items) {
  const user = getCurrentUser();
  localStorage.setItem(getUserMastersKey(user?.id, 'projects'), JSON.stringify(items));
}

export function addProject(item) {
  const list = getProjects();
  const newItem = {
    id: item.id || Date.now(),
    code: item.code || \`PR\${String(list.length + 1).padStart(3, '0')}\`,
    name: item.name,
    description: item.description || '',
    status: item.status || 'active'
  };
  list.push(newItem);
  saveProjects(list);
  return newItem;
}

export function updateProject(item) {
  let list = getProjects();
  list = list.map(i => (i.id === item.id || i.code === item.code ? { ...i, ...item } : i));
  saveProjects(list);
  return { success: true };
}

export function deleteProject(id) {
  let list = getProjects();
  list = list.filter(i => i.id !== id && i.code !== id);
  saveProjects(list);
  return { success: true };
}

export function getAllMasters() {
  return {
    budgets: getBudgetMasters(),
    cost_centers: getCostCenters(),
    profit_centers: getProfitCenters(),
    projects: getProjects(),
  };
}

export function resetDefaultMasters() {
  saveBudgetMasters(DEFAULT_BUDGETS);
  saveCostCenters(DEFAULT_COST_CENTERS);
  saveProfitCenters(DEFAULT_PROFIT_CENTERS);
  saveProjects(DEFAULT_PROJECTS);
  return getAllMasters();
}
`;

storageCode += '\n' + mastersHelpers;

fs.writeFileSync('src/utils/storage.js', storageCode, 'utf8');
console.log('Successfully patched src/utils/storage.js');

