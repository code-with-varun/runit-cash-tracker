<?php
// Response and Request Helpers for Money Matrix API

function jsonResponse($data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function getRequestedUserId(): ?string {
    if (!empty($_SERVER['HTTP_X_USER_ID'])) {
        return trim($_SERVER['HTTP_X_USER_ID']);
    }
    if (!empty($_GET['user_id'])) {
        return trim($_GET['user_id']);
    }
    if (!empty($_GET['userId'])) {
        return trim($_GET['userId']);
    }
    $body = getJsonInput();
    if (!empty($body['user_id'])) {
        return trim($body['user_id']);
    }
    if (!empty($body['userId'])) {
        return trim($body['userId']);
    }
    return null;
}
