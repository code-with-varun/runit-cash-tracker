const fs = require('fs');
const XLSX = require('xlsx');

const wb = XLSX.readFile('category-taxonomy-2026-11-02-1793628024.xlsx');
const sheet = wb.Sheets['new category'];
const rows = XLSX.utils.sheet_to_json(sheet);

const mapped = rows.map((r, idx) => {
  const subcat = String(r.SubCategory || '').trim();
  const cat = String(r.Category || '').trim();
  const div = String(r.Division || '').trim();
  const subType = String(r.SubType || '').trim();
  const txType = String(r.TransactionType || '').trim();
  const desc = String(r['sub category description'] || '').trim();

  let type = 'Dr';
  let suffix = 'DR';

  const crSubs = [
    'Liability Received', 'LOAN', 'LOAN RECOLLECTION', 'REIMBURSMENT CLAIM',
    'CC BILL LOAN', 'CC SETTLEMENT', 'ATM CASH IN', 'REFUND CASHBACK',
    'SELF TRANSFER IN', 'CC ROTATION IN'
  ];

  if (div === 'EARNINGS' || subType === 'INCOME' || crSubs.includes(subcat)) {
    type = 'Cr';
    suffix = 'CR';
  }

  return {
    id: Number(r.CategoryID) || (idx + 1),
    name: subcat,
    subcategory: subcat,
    category: cat,
    division: div,
    sub_type: subType,
    transaction_type: txType,
    description: desc,
    suffix: suffix,
    type: type,
    group_type: div,
    net_type: subType,
    info_type: 'BOTH'
  };
});

fs.writeFileSync('categories_master_verified.json', JSON.stringify(mapped, null, 2), 'utf8');

// Build PHP array
let phpContent = '<?php\n// 64 Master Taxonomy Categories from New Taxonomy\nconst DEFAULT_CATEGORIES = [\n';
mapped.forEach(c => {
  const escSub = c.subcategory.replace(/'/g, "\\'");
  const escCat = c.category.replace(/'/g, "\\'");
  const escDiv = c.division.replace(/'/g, "\\'");
  const escSubT = c.sub_type.replace(/'/g, "\\'");
  const escTxT = c.transaction_type.replace(/'/g, "\\'");
  const escDesc = c.description.replace(/'/g, "\\'");
  phpContent += `    ['id' => ${c.id}, 'name' => '${escSub}', 'subcategory' => '${escSub}', 'category' => '${escCat}', 'division' => '${escDiv}', 'suffix' => '${c.suffix}', 'info_type' => 'BOTH', 'transaction_type' => '${escTxT}', 'group_type' => '${escDiv}', 'net_type' => '${escSubT}', 'sub_type' => '${escSubT}', 'description' => '${escDesc}', 'type' => '${c.type}'],\n`;
});
phpContent += '];\n';
fs.writeFileSync('categories_php_array.php', phpContent, 'utf8');

// Build SQL seed
let sqlContent = '-- 64 Master Categories Seed SQL\n';
sqlContent += 'INSERT INTO `categories` (`id`, `user_id`, `name`, `subcategory`, `category`, `division`, `suffix`, `info_type`, `transaction_type`, `group_type`, `net_type`, `sub_type`, `description`, `type`) VALUES\n';
const sqlRows = mapped.map(c => {
  const escSub = c.subcategory.replace(/'/g, "''");
  const escCat = c.category.replace(/'/g, "''");
  const escDiv = c.division.replace(/'/g, "''");
  const escSubT = c.sub_type.replace(/'/g, "''");
  const escTxT = c.transaction_type.replace(/'/g, "''");
  const escDesc = c.description.replace(/'/g, "''");
  return `(${c.id}, NULL, '${escSub}', '${escSub}', '${escCat}', '${escDiv}', '${c.suffix}', 'BOTH', '${escTxT}', '${escDiv}', '${escSubT}', '${escSubT}', '${escDesc}', '${c.type}')`;
});
sqlContent += sqlRows.join(',\n') + ';\n';
fs.writeFileSync('categories_seed.sql', sqlContent, 'utf8');

console.log('Successfully wrote categories_master_verified.json, categories_php_array.php, categories_seed.sql with ' + mapped.length + ' categories.');

