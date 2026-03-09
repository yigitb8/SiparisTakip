<?php
session_start();

/*
  Geçici güvenli sürüm:
  Session içindeki kullanıcı yoksa da sayfa açılsın.
  Sonra gerçek session anahtarını bağlarız.
*/
$user = [
    "name" => "Misafir",
    "id"   => null
];

/*
  Eğer login sistemi bu yapıyı kullanıyorsa otomatik doldurur.
  Sonradan senin gerçek session anahtarına göre uyarlayacağız.
*/
if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
    $user["name"] = $_SESSION['user']['name'] ?? "Bilinmiyor";
    $user["id"]   = $_SESSION['user']['id'] ?? null;
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YYG Sipariş Takip</title>

  <script>
    window.__USER__ = <?= json_encode($user, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?>;
    console.log("PHP user:", window.__USER__);
  </script>

  <link rel="stylesheet" crossorigin href="/siparis/assets/index-Cftjw4Nk.css">
</head>
<body>
  <div id="root"></div>

  <script type="module" crossorigin src="/siparis/assets/index-C-tAtNoW.js"></script>
</body>
</html>