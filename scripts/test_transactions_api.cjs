const { execSync } = require('child_process');
const fs = require('fs');

const phpCode = `<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/api/transactions';
require_once 'api/transactions.php';
`;

fs.writeFileSync('test_tx_tmp.php', phpCode);
try {
  const out = execSync('C:\\xampp\\php\\php.exe test_tx_tmp.php', { encoding: 'utf8' });
  const json = JSON.parse(out.substring(out.indexOf('[')));
  console.log('Transactions count:', json.length);
  if (json.length > 0) {
    console.log('Latest transaction fields:');
    console.log({
      id: json[0].id,
      subcategory: json[0].subcategory,
      division: json[0].division,
      budget: json[0].budget,
      costCenter: json[0].costCenter,
      profitCenter: json[0].profitCenter,
      project: json[0].project,
    });
  }
} finally {
  if (fs.existsSync('test_tx_tmp.php')) fs.unlinkSync('test_tx_tmp.php');
}

