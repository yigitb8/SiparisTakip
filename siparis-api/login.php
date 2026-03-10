<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/auth-db.php';

$data = json_decode(file_get_contents("php://input"), true);

$kullaniciAdi = trim($data['username'] ?? '');
$sifre = $data['password'] ?? '';

if ($kullaniciAdi === '' || $sifre === '') {
    http_response_code(400);
    echo json_encode([
        "message" => "Kullanıcı adı ve şifre zorunludur."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$stmt = $authPdo->prepare("
    SELECT id, kullanici_adi, ad_soyad, sifre, rol, gorevi, avatar, email
    FROM kullanicilar
    WHERE kullanici_adi = ?
    LIMIT 1
");
$stmt->execute([$kullaniciAdi]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(401);
    echo json_encode([
        "message" => "Kullanıcı bulunamadı."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/*
  Şu an tabloya göre şifreler düz metin gibi görünüyor.
  O yüzden geçici olarak direkt karşılaştırma yapıyoruz.
  İleride hash'e geçersen bunu password_verify ile değiştireceğiz.
*/
if ($sifre !== $user['sifre']) {
    http_response_code(401);
    echo json_encode([
        "message" => "Şifre yanlış."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$_SESSION['user'] = [
    "id" => $user["id"],
    "username" => $user["kullanici_adi"],
    "name" => $user["ad_soyad"],
    "role" => $user["rol"],
    "duty" => $user["gorevi"],
    "avatar" => $user["avatar"],
    "email" => $user["email"]
];

echo json_encode([
    "ok" => true,
    "user" => $_SESSION['user']
], JSON_UNESCAPED_UNICODE);