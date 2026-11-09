const { execSync } = require('child_process');
const fs = require('fs');

const phpCode = `<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
require_once 'api/categories.php';
`;

fs.writeFileSync('test_cat_tmp.php', phpCode);
try {
  const out = execSync('C:\\xampp\\php\\php.exe test_cat_tmp.php', { encoding: 'utf8' });
  const json = JSON.parse(out.substring(out.indexOf('[')));
  console.log('Categories count:', json.length);
  console.log('Sample category:', json[0]);
} finally {
  if (fs.existsSync('test_cat_tmp.php')) fs.unlinkSync('test_cat_tmp.php');
}

