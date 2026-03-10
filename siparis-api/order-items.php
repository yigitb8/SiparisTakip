<?php
require __DIR__ . "/config.php";

try {
    $orderId = trim($_GET["id"] ?? "");

    if ($orderId === "") {
        http_response_code(400);
        echo json_encode([
            "message" => "Order id is required"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $pdo->prepare("
        SELECT
            rowId AS id,
            isbn,
            qty AS adet,
            bookTitle AS `kitap adı`,
            bookLocation AS `kitap konumu`
        FROM order_items
        WHERE orderId = ?
        ORDER BY id ASC
    ");
    $stmt->execute([$orderId]);

    echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "message" => "Order items fetch failed",
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}