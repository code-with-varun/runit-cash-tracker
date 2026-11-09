<?php
/**
 * Money Matrix - Automated Hostinger FTP Sync Script
 * Target: https://runito.in/money-matrix/
 */

$host = 'ftp.runito.in';
$port = 21;
$user = 'u935057905.runit';
$pass = 'Maruthuvk@2026';
$remotePrefix = '/money-matrix';

$localRoot = dirname(__DIR__);
$localDist = $localRoot . DIRECTORY_SEPARATOR . 'dist';
$localApi  = $localRoot . DIRECTORY_SEPARATOR . 'api';

echo "========================================================\n";
echo " Deploying Money Matrix to Hostinger FTP ($host)\n";
echo " Target Remote Directory: $remotePrefix/\n";
echo "========================================================\n\n";

$conn = @ftp_connect($host, $port, 30);
if (!$conn) {
    die("ERROR: Failed to connect to $host\n");
}
if (!@ftp_login($conn, $user, $pass)) {
    die("ERROR: Failed to authenticate user $user\n");
}
ftp_pasv($conn, true);
echo "✓ Connected and authenticated successfully.\n\n";

function ensureDirectory($conn, $remoteDir) {
    $parts = explode('/', trim($remoteDir, '/'));
    $path = '';
    foreach ($parts as $p) {
        $path .= '/' . $p;
        if (!@ftp_chdir($conn, $path)) {
            if (@ftp_mkdir($conn, $path)) {
                echo "  + Created remote directory: $path\n";
            }
        }
    }
}

function syncDirectory($conn, $localDir, $remoteBaseDir) {
    $uploaded = 0;
    ensureDirectory($conn, $remoteBaseDir);

    $items = scandir($localDir);
    foreach ($items as $item) {
        if ($item === '.' || $item === '..' || $item === '.git') continue;

        $localPath = $localDir . DIRECTORY_SEPARATOR . $item;
        $remotePath = $remoteBaseDir . '/' . $item;

        if (is_dir($localPath)) {
            $uploaded += syncDirectory($conn, $localPath, $remotePath);
        } else {
            echo "  -> Uploading $remotePath ... ";
            if (ftp_put($conn, $remotePath, $localPath, FTP_BINARY)) {
                echo "OK\n";
                $uploaded++;
            } else {
                echo "FAILED!\n";
            }
        }
    }
    return $uploaded;
}

echo "1. Syncing Frontend (dist/ -> /money-matrix/)\n";
$distCount = syncDirectory($conn, $localDist, $remotePrefix);
echo "✓ Frontend files synced: $distCount\n\n";

echo "2. Syncing Backend (api/ -> /money-matrix/api/)\n";
$apiCount = syncDirectory($conn, $localApi, $remotePrefix . '/api');
echo "✓ Backend files synced: $apiCount\n\n";

ftp_close($conn);

echo "========================================================\n";
echo "✓ Deployment Completed! Total $distCount frontend + $apiCount backend files synced.\n";
echo "========================================================\n";
