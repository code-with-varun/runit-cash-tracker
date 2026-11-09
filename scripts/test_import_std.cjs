const { execSync } = require('child_process');
const fs = require('fs');

const phpCode = `<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REQUEST_URI'] = '/api/categories.php?action=import_standard';
$_GET['action'] = 'import_standard';
$_GET['user_id'] = '9999'; // Non-existent user id test

require_once 'api/config/cors.php';
require_once 'api/config/db.php';
require_once 'api/helpers/response.php';

// Execute api/categories.php logic
require 'api/categories.php';
`;

fs.writeFileSync('test_import_std.php', phpCode);
try {
  const out = execSync('C:\\xampp\\php\\php.exe test_import_std.php', { encoding: 'utf8' });
  console.log('Result:', out);
} finally {
  if (fs.existsSync('test_import_std.php')) fs.unlinkSync('test_import_std.php');
}

