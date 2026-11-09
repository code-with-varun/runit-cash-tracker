<?php
// Money Matrix - Root Entry Point for XAMPP Apache
// Enables running directly from http://localhost/money-matrix/ or http://localhost/runit-cash-tracker/

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

// 1. Direct API requests to the PHP REST API
if (str_contains($uri, '/api')) {
    require __DIR__ . '/api/index.php';
    exit;
}

// 2. Serve static assets directly from dist/
$assetTypes = ['assets', 'branding', 'favicon.png', 'logo.png'];
foreach ($assetTypes as $type) {
    if (str_contains($uri, '/' . $type)) {
        $pos = strpos($uri, '/' . $type);
        $relPath = substr($uri, $pos);
        $targetFile = __DIR__ . '/dist' . $relPath;

        if (file_exists($targetFile) && !is_dir($targetFile)) {
            $ext = strtolower(pathinfo($targetFile, PATHINFO_EXTENSION));
            $mimes = [
                'js' => 'application/javascript',
                'css' => 'text/css',
                'png' => 'image/png',
                'jpg' => 'image/jpeg',
                'svg' => 'image/svg+xml',
                'ico' => 'image/x-icon',
                'json' => 'application/json',
                'woff2' => 'font/woff2',
                'woff' => 'font/woff',
            ];
            if (isset($mimes[$ext])) {
                header('Content-Type: ' . $mimes[$ext]);
            }
            readfile($targetFile);
            exit;
        }
    }
}

// 3. Serve the React Application (Single Page App)
$distIndex = __DIR__ . '/dist/index.html';
if (file_exists($distIndex)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($distIndex);
    exit;
}

// 4. Fallback if build hasn't run yet
echo "<h2>Money Matrix</h2><p>Please run <code>npm run build</code> to compile the frontend assets.</p>";
