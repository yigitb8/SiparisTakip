<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

$id = isset($_GET['id']) ? trim($_GET['id']) : '';

if ($id === '') {
    http_response_code(400);
    echo "Geçersiz sipariş ID";
    exit;
}

require_once __DIR__ . '/config.php';

$stmt = $pdo->prepare("SELECT fileName, fileStoredName FROM orders WHERE id = ? LIMIT 1");
$stmt->execute([$id]);
$order = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$order || empty($order['fileStoredName'])) {
    http_response_code(404);
    echo "Dosya bulunamadı";
    exit;
}

$filePath = __DIR__ . '/uploads/' . $order['fileStoredName'];

if (!file_exists($filePath)) {
    http_response_code(404);
    echo "Dosya sunucuda bulunamadı: " . $filePath;
    exit;
}

$downloadName = !empty($order['fileName']) ? $order['fileName'] : basename($filePath);
$mimeType = 'application/octet-stream';

if (function_exists('mime_content_type')) {
    $detected = mime_content_type($filePath);
    if ($detected) {
        $mimeType = $detected;
    }
}

header('Content-Description: File Transfer');
header('Content-Type: ' . $mimeType);
header('Content-Disposition: attachment; filename="' . basename($downloadName) . '"');
header('Content-Length: ' . filesize($filePath));
header('Cache-Control: no-cache, must-revalidate');
header('Pragma: public');

readfile($filePath);
exit;