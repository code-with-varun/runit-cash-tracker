<?php
// Money Matrix Database & System Configuration
// Seamlessly auto-detects Local XAMPP vs Hostinger Production (runito.in)

$hostHeader = $_SERVER['HTTP_HOST'] ?? ($_SERVER['SERVER_NAME'] ?? '');
$isProduction = str_contains($hostHeader, 'runito.in') || file_exists(__DIR__ . '/config.prod.php');

if ($isProduction) {
    return [
        'db' => [
            'host' => 'localhost',
            'port' => '3306',
            'name' => 'u935057905_money_matrix',
            'user' => 'u935057905_money_matrix',
            'pass' => 'Maruthuvk@2026',
            'charset' => 'utf8mb4',
        ],
        'app' => [
            'name' => 'MoneyMatrix AI API (Hostinger Production)',
            'version' => '1.0.0',
            'env' => 'production',
        ]
    ];
}

// Default Local XAMPP Environment
return [
    'db' => [
        'host' => getenv('DB_HOST') ?: '127.0.0.1',
        'port' => getenv('DB_PORT') ?: '3306',
        'name' => getenv('DB_NAME') ?: 'money_matrix_db',
        'user' => getenv('DB_USER') ?: 'root',
        'pass' => getenv('DB_PASS') !== false ? getenv('DB_PASS') : '',
        'charset' => 'utf8mb4',
    ],
    'app' => [
        'name' => 'MoneyMatrix AI API (Local Development)',
        'version' => '1.0.0',
        'env' => getenv('APP_ENV') ?: 'development',
    ]
];
