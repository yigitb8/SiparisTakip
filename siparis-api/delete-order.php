<?php
require __DIR__ . "/config.php";

try {
    $data = json_input();
    $id = trim($data["id"] ?? "");

    if ($id === "") {
        http_response_code(400);
        echo json_encode([
            "message" => "Order id is required"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode([
        "ok" => true
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "message" => "Delete order failed",
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}