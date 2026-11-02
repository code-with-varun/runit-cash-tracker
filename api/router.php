<?php
// PHP CLI Built-in Server Router for Money Matrix API
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// If static file exists, return false to let PHP serve it directly
if (file_exists(__DIR__ . '/..' . $uri) && !is_dir(__DIR__ . '/..' . $uri) && !str_ends_with($uri, '.php')) {
    return false;
}

require __DIR__ . '/index.php';
