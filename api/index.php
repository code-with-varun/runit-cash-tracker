<?php
// Money Matrix Master API Router / Front Controller
// Handles all /api/* requests with seamless routing for Apache & Built-in PHP Server

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/helpers/response.php';

// Handle CORS Preflight
handleCors();

// Parse requested path relative to /api
$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

// Normalize path: find where '/api' occurs and take everything after it
$apiPos = strpos($requestUri, '/api');
if ($apiPos !== false) {
    $subPath = substr($requestUri, $apiPos + 4); // strip '/api'
} else {
    $subPath = $requestUri;
}

$trimmedPath = trim($subPath, '/');

// Route Dispatcher
if ($trimmedPath === '' || $trimmedPath === 'health') {
    require __DIR__ . '/health.php';
    exit;
}

if ($trimmedPath === 'auth/register') {
    require __DIR__ . '/auth/register.php';
    exit;
}

if ($trimmedPath === 'auth/login') {
    require __DIR__ . '/auth/login.php';
    exit;
}

if (str_starts_with($trimmedPath, 'masters')) {
    $parts = explode('/', $trimmedPath);
    if (isset($parts[1]) && empty($_GET['id'])) {
        $_GET['id'] = $parts[1];
    }
    require __DIR__ . '/masters.php';
    exit;
}

if (str_starts_with($trimmedPath, 'categories')) {
    // Extract ID if pattern is categories/:id
    $parts = explode('/', $trimmedPath);
    if (isset($parts[1]) && $parts[1] !== 'bulk' && empty($_GET['id'])) {
        $_GET['id'] = $parts[1];
    }
    require __DIR__ . '/categories.php';
    exit;
}

if (str_starts_with($trimmedPath, 'transactions')) {
    // Extract ID if pattern is transactions/:id
    $parts = explode('/', $trimmedPath);
    if (isset($parts[1]) && $parts[1] !== 'bulk' && empty($_GET['id'])) {
        $_GET['id'] = $parts[1];
    }
    require __DIR__ . '/transactions.php';
    exit;
}

if (str_starts_with($trimmedPath, 'accounts')) {
    $parts = explode('/', $trimmedPath);
    if (isset($parts[1]) && empty($_GET['id'])) {
        $_GET['id'] = $parts[1];
    }
    require __DIR__ . '/accounts.php';
    exit;
}

if (str_starts_with($trimmedPath, 'admin/users')) {
    $parts = explode('/', $trimmedPath);
    if (isset($parts[2]) && empty($_GET['id'])) {
        $_GET['id'] = $parts[2];
    }
    require __DIR__ . '/admin/users.php';
    exit;
}

if ($trimmedPath === 'settings/pin' || str_starts_with($trimmedPath, 'settings')) {
    require __DIR__ . '/settings.php';
    exit;
}

if ($trimmedPath === 'reset') {
    require __DIR__ . '/reset.php';
    exit;
}

if (str_starts_with($trimmedPath, 'closing-balances')) {
    require __DIR__ . '/closing-balances.php';
    exit;
}

if (str_starts_with($trimmedPath, 'budgets')) {
    require __DIR__ . '/budgets.php';
    exit;
}

if (str_starts_with($trimmedPath, 'ap-ar')) {
    require __DIR__ . '/ap-ar.php';
    exit;
}

if (str_starts_with($trimmedPath, 'loans')) {
    require __DIR__ . '/loans.php';
    exit;
}

if (str_starts_with($trimmedPath, 'portfolio')) {
    require __DIR__ . '/portfolio.php';
    exit;
}

if (str_starts_with($trimmedPath, 'career')) {
    require __DIR__ . '/career.php';
    exit;
}

// 404 Not Found fallback
jsonResponse([
    'error' => 'API endpoint not found',
    'requested_path' => $requestUri,
    'normalized_route' => $trimmedPath,
    'method' => $_SERVER['REQUEST_METHOD'] ?? 'GET',
], 404);
