const { execSync } = require('child_process');
const fs = require('fs');

const phpCode = `<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/api/masters';
require_once 'api/masters.php';
`;

fs.writeFileSync('test_masters_tmp.php', phpCode);
try {
  const out = execSync('C:\\xampp\\php\\php.exe test_masters_tmp.php', { encoding: 'utf8' });
  const json = JSON.parse(out.substring(out.indexOf('{')));
  console.log('Success:', json.success);
  console.log('Budgets count:', json.budgets.length);
  console.log('Cost Centers count:', json.cost_centers.length);
  console.log('Profit Centers count:', json.profit_centers.length);
  console.log('Projects count:', json.projects.length);
  console.log('First Budget:', json.budgets[0]);
  console.log('First Cost Center:', json.cost_centers[0]);
  console.log('First Profit Center:', json.profit_centers[0]);
  console.log('First Project:', json.projects[0]);
} finally {
  if (fs.existsSync('test_masters_tmp.php')) fs.unlinkSync('test_masters_tmp.php');
}
