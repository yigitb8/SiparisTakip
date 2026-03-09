<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode([
        "authenticated" => false
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    "authenticated" => true,
    "user" => $_SESSION['user']
], JSON_UNESCAPED_UNICODE);