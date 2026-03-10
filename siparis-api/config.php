<?php
session_start();

header("Access-Control-Allow-Origin: https://istakip.yagmuryayingrubu.com");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

$host = "localhost";
$dbname = "yagmuryayingrubu_siparis_takip";
$username = "yagmuryayingrubu_yigit_siparis";
$password = "Yyg118793.";

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "ok" => false,
        "message" => "DB connection failed",
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function json_input() {
    $raw = file_get_contents("php://input");
    return json_decode($raw, true) ?: [];
}

function now_tr() {
    return date("d.m.Y H:i:s");
}

function normalize_isbn($value = "") {
    return preg_replace('/[-\s]+/', '', trim((string)$value));
}