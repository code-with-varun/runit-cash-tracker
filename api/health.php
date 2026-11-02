<?php
// Health Check Endpoint
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/helpers/response.php';

handleCors();

try {
    $pdo = getDb();
    jsonResponse([
        'status' => 'ok',
        'dbState' => 'connected',
        'message' => 'Money Matrix PHP MySQL API is running smoothly',
        'timestamp' => date('c'),
    ]);
} catch (Exception $e) {
    jsonResponse([
        'status' => 'error',
        'dbState' => 'disconnected',
        'error' => $e->getMessage(),
    ], 500);
}
