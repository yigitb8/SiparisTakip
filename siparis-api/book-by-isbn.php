<?php
require __DIR__ . "/config.php";

try {
    $isbn = normalize_isbn($_GET["isbn"] ?? "");

    if ($isbn === "") {
        http_response_code(400);
        echo json_encode([
            "message" => "ISBN is required"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $pdo->prepare("
        SELECT isbn, title, location
        FROM books
        WHERE isbn = ?
        LIMIT 1
    ");
    $stmt->execute([$isbn]);

    $book = $stmt->fetch();

    if (!$book) {
        http_response_code(404);
        echo json_encode([
            "message" => "Book not found"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode($book, JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "message" => "Book lookup failed",
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}