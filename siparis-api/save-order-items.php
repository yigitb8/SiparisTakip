<?php
require __DIR__ . "/config.php";

try {
    $data = json_input();

    $orderId = trim($data["orderId"] ?? "");
    $items = $data["items"] ?? [];

    if ($orderId === "") {
        http_response_code(400);
        echo json_encode([
            "message" => "Order id is required"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (!is_array($items)) {
        http_response_code(400);
        echo json_encode([
            "message" => "Items must be an array"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $check = $pdo->prepare("SELECT id FROM orders WHERE id = ?");
    $check->execute([$orderId]);

    if (!$check->fetch()) {
        http_response_code(404);
        echo json_encode([
            "message" => "Order not found"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $pdo->beginTransaction();

    $del = $pdo->prepare("DELETE FROM order_items WHERE orderId = ?");
    $del->execute([$orderId]);

    $ins = $pdo->prepare("
        INSERT INTO order_items
        (orderId, rowId, isbn, qty, bookTitle, bookLocation)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    foreach ($items as $it) {
        $rowId = trim((string)($it["id"] ?? ""));
        $isbn = normalize_isbn($it["isbn"] ?? "");
        $qty = max(1, (int)($it["adet"] ?? $it["qty"] ?? 1));
        $title = trim((string)($it["kitap adı"] ?? ""));
        $location = trim((string)($it["kitap konumu"] ?? ""));

        if ($rowId === "" && $isbn === "" && $title === "" && $location === "") {
            continue;
        }

        $ins->execute([
            $orderId,
            $rowId,
            $isbn,
            $qty,
            $title,
            $location
        ]);
    }

    $pdo->commit();

    echo json_encode([
        "ok" => true
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        "message" => "Save order items failed",
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}