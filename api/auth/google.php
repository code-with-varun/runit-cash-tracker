<?php
// Google Sign-In & Instant Registration API Endpoint
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';

handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

$input = getJsonInput();

$credential = $input['credential'] ?? null;
$googleId = $input['google_id'] ?? ($input['googleId'] ?? null);
$email = strtolower(trim($input['email'] ?? ''));
$name = trim($input['name'] ?? '');
$avatar = $input['avatar'] ?? ($input['picture'] ?? null);

// If client provided a Google Identity Services JWT credential
if ($credential) {
    $jwtParts = explode('.', $credential);
    if (count($jwtParts) === 3) {
        $jwtPayload = json_decode(base64_decode(strtr($jwtParts[1], '-_', '+/')), true);
        if ($jwtPayload && isset($jwtPayload['sub'])) {
            $googleId = $jwtPayload['sub'];
            $email = strtolower($jwtPayload['email'] ?? $email);
            $name = $jwtPayload['name'] ?? ($name ?: ($jwtPayload['given_name'] ?? 'Google User'));
            $avatar = $jwtPayload['picture'] ?? $avatar;
        }
    }
}

if (empty($email) && empty($googleId)) {
    jsonResponse(['success' => false, 'error' => 'Valid Google credentials or email are required.'], 400);
}

try {
    $pdo = getDb();

    $user = null;

    // 1. Look up by google_id
    if ($googleId) {
        $stmt = $pdo->prepare("SELECT id, name, username, email, role, status, avatar FROM users WHERE google_id = :google_id LIMIT 1");
        $stmt->execute([':google_id' => $googleId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // 2. Look up by email if not found by google_id
    if (!$user && $email) {
        $stmt = $pdo->prepare("SELECT id, name, username, email, role, status, avatar FROM users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // If found, link google_id & avatar
        if ($user) {
            $updateStmt = $pdo->prepare("UPDATE users SET google_id = COALESCE(:google_id, google_id), avatar = COALESCE(:avatar, avatar), auth_provider = 'google' WHERE id = :id");
            $updateStmt->execute([
                ':google_id' => $googleId,
                ':avatar' => $avatar,
                ':id' => $user['id']
            ]);
            if ($avatar) $user['avatar'] = $avatar;
        }
    }

    // 3. Look up by username matching email prefix (e.g., if user previously registered with username = 'varun')
    if (!$user && $email) {
        $prefix = explode('@', $email)[0];
        $stmt = $pdo->prepare("SELECT id, name, username, email, role, status, avatar FROM users WHERE username = :username LIMIT 1");
        $stmt->execute([':username' => $prefix]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            $updateStmt = $pdo->prepare("UPDATE users SET email = :email, google_id = COALESCE(:google_id, google_id), avatar = COALESCE(:avatar, avatar), auth_provider = 'google' WHERE id = :id");
            $updateStmt->execute([
                ':email' => $email,
                ':google_id' => $googleId,
                ':avatar' => $avatar,
                ':id' => $user['id']
            ]);
            $user['email'] = $email;
            if ($avatar) $user['avatar'] = $avatar;
        }
    }

    // 4. If user not found, automatically register new user via Google
    if (!$user) {
        $baseUsername = $email ? explode('@', $email)[0] : 'guser_' . substr(md5(uniqid()), 0, 6);
        $cleanUsername = preg_replace('/[^a-zA-Z0-9_]/', '', strtolower($baseUsername));
        if (empty($cleanUsername)) $cleanUsername = 'guser';

        // Check if username collision
        $checkStmt = $pdo->prepare("SELECT id FROM users WHERE username = :username LIMIT 1");
        $checkStmt->execute([':username' => $cleanUsername]);
        if ($checkStmt->fetch()) {
            $cleanUsername = $cleanUsername . '_' . substr(md5(uniqid()), 0, 4);
        }

        $fullName = !empty($name) ? $name : ucfirst($cleanUsername);
        $randomPwdHash = password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);

        $insertStmt = $pdo->prepare("
            INSERT INTO users (name, username, email, password, google_id, avatar, auth_provider, role, status) 
            VALUES (:name, :username, :email, :password, :google_id, :avatar, 'google', 'user', 'active')
        ");
        $insertStmt->execute([
            ':name' => $fullName,
            ':username' => $cleanUsername,
            ':email' => $email,
            ':password' => $randomPwdHash,
            ':google_id' => $googleId,
            ':avatar' => $avatar
        ]);

        $userId = (int)$pdo->lastInsertId();

        // Create initial Cash_1 account for the newly registered user
        $accStmt = $pdo->prepare("
            INSERT INTO accounts (user_id, code, name, type, dump_type, balance, status) 
            VALUES (:user_id, 'Cash_1', 'Cash_1 (Physical Cash)', 'Cash Account', 'FINANCE', 0.00, 'active')
        ");
        $accStmt->execute([':user_id' => $userId]);

        jsonResponse([
            'success' => true,
            'isNewUser' => true,
            'message' => 'Account created and signed in with Google successfully!',
            'user' => [
                'id' => $userId,
                'name' => $fullName,
                'username' => $cleanUsername,
                'email' => $email,
                'role' => 'user',
                'avatar' => $avatar,
                'authProvider' => 'google'
            ]
        ], 201);
    }

    // Existing user login
    if (isset($user['status']) && $user['status'] === 'inactive') {
        jsonResponse(['success' => false, 'error' => 'Your account has been deactivated. Please contact support.']);
    }

    jsonResponse([
        'success' => true,
        'isNewUser' => false,
        'message' => 'Signed in with Google successfully!',
        'user' => [
            'id' => (int)$user['id'],
            'name' => $user['name'],
            'username' => $user['username'],
            'email' => $user['email'] ?? $email,
            'role' => $user['role'] ?? 'user',
            'avatar' => $user['avatar'] ?? $avatar,
            'authProvider' => 'google'
        ]
    ]);

} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => 'Google authentication error: ' . $e->getMessage()], 500);
}
