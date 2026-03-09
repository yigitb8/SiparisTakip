<?php
require __DIR__ . "/config.php";

try {
    $status = $_GET["status"] ?? null;

    if ($status) {
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE status = ? ORDER BY createdAt DESC");
        $stmt->execute([$status]);
    } else {
        $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC");
    }

    echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "message" => "Orders fetch failed",
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}