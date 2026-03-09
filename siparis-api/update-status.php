<?php
require __DIR__ . "/config.php";

try {
    $data = json_input();

    $id = trim($data["id"] ?? "");
    $status = trim($data["status"] ?? "");

    $allowed = ["new", "preparing", "completed"];

    if ($id === "" || !in_array($status, $allowed, true)) {
        http_response_code(400);
        echo json_encode([
            "message" => "Invalid input"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmt->execute([$status, $id]);

    $get = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $get->execute([$id]);

    $order = $get->fetch();

    if (!$order) {
        http_response_code(404);
        echo json_encode([
            "message" => "Order not found"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode($order, JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "message" => "Update status failed",
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}