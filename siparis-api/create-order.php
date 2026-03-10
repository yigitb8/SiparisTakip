<?php
require __DIR__ . "/config.php";

try {
    $customer = "Bilinmiyor";

    if (isset($_SESSION["user"]) && is_array($_SESSION["user"])) {
        $customer = $_SESSION["user"]["name"] ?? "Bilinmiyor";
    }

    $note = $_POST["note"] ?? "";
    $total = (int)($_POST["total"] ?? 0);
    $itemsCount = (int)($_POST["itemsCount"] ?? 0);

    $orderId = "SP-" . rand(1000, 9999);
    $createdAt = now_tr();
    $status = "new";

    $fileName = "";
    $fileStoredName = "";

    if (!empty($_FILES["file"]["name"])) {
        $uploadDir = __DIR__ . "/uploads/";
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $fileName = $_FILES["file"]["name"];
        $ext = pathinfo($fileName, PATHINFO_EXTENSION);
        $fileStoredName = uniqid("file_", true) . ($ext ? "." . $ext : "");

        move_uploaded_file($_FILES["file"]["tmp_name"], $uploadDir . $fileStoredName);
    }

    $stmt = $pdo->prepare("
        INSERT INTO orders
        (id, status, customer, total, itemsCount, note, fileName, fileStoredName, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $orderId,
        $status,
        $customer,
        $total,
        $itemsCount,
        $note,
        $fileName,
        $fileStoredName,
        $createdAt
    ]);

    $get = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $get->execute([$orderId]);

    echo json_encode($get->fetch(), JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "message" => "Create order failed",
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}