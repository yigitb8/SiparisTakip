const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { db, init } = require("./db");

init();

const app = express();

// ✅ Dev için en rahat CORS (istersen sonra kısıtlarız)
app.use(cors());
app.use(express.json());

// ✅ uploads klasörünü dışarı aç (indir)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// uploads
const upload = multer({ dest: path.join(__dirname, "uploads") });

/** Utils */
function nowTr() {
  return new Date().toLocaleString("tr-TR");
}
function normalizeIsbn(value = "") {
  return String(value).replace(/[-\s]/g, "").trim();
}

/** Health */
app.get("/health", (req, res) => res.json({ ok: true }));

/** Books lookup: ISBN -> title, location */
app.get("/books/by-isbn/:isbn", (req, res) => {
  const isbn = normalizeIsbn(req.params.isbn);

  const row = db
    .prepare("SELECT isbn, title, location FROM books WHERE isbn = ?")
    .get(isbn);

  if (!row) return res.status(404).json({ message: "Book not found" });
  res.json(row);
});

/** Orders list */
app.get("/orders", (req, res) => {
  const status = req.query.status;
  let rows;

  if (status) {
    rows = db
      .prepare("SELECT * FROM orders WHERE status = ? ORDER BY createdAt DESC")
      .all(status);
  } else {
    rows = db.prepare("SELECT * FROM orders ORDER BY createdAt DESC").all();
  }

  res.json(rows);
});


app.get("/orders/:id/file", (req, res) => {
  const order = db
    .prepare("SELECT fileName, fileStoredName FROM orders WHERE id = ?")
    .get(req.params.id);

  if (!order || !order.fileStoredName) {
    return res.status(404).json({ message: "File not found" });
  }

  const filePath = path.join(__dirname, "uploads", order.fileStoredName);

  const original = String(order.fileName || "order-file");

  // ✅ ASCII fallback (tarayıcılar filename="..." kısmını bozmadan kullansın)
  const asciiFallback = original
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")     // aksan temizle
    .replace(/[^\x20-\x7E]/g, "_")       // ascii dışı -> _
    .replace(/["\\]/g, "_");             // " ve \ sorun çıkarır

  // ✅ RFC5987 (UTF-8) filename*
  const encoded = encodeURIComponent(original)
    .replace(/['()]/g, escape)
    .replace(/\*/g, "%2A");

  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`
  );

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(err);
      if (!res.headersSent) res.status(404).json({ message: "File not found" });
    }
  });
});

/** Create order (new) with optional file + description/note */
app.post("/orders", upload.single("file"), (req, res) => {
  const {
    id,
    customer = "Yeni Sipariş",
    total = 0,
    itemsCount = 0,
    note = "",
  } = req.body;

  const orderId = (id || `SP-${Math.floor(1000 + Math.random() * 9000)}`).trim();

  // ✅ Orijinal isim + sunucuda kaydedilen isim
  const fileName = req.file?.originalname || "";
  const fileStoredName = req.file?.filename || "";

  const createdAt = nowTr();
  const status = "new";

  try {
    db.prepare(
      `INSERT INTO orders (id, status, customer, total, itemsCount, note, fileName, fileStoredName, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      orderId,
      status,
      customer,
      Number(total),
      Number(itemsCount),
      String(note),
      fileName,
      fileStoredName,
      createdAt
    );

    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
    res.status(201).json(order);
  } catch (e) {
    res.status(400).json({ message: "Create order failed", error: String(e) });
  }
});

/** Update order status (drag-drop / buttons) */
app.patch("/orders/:id/status", (req, res) => {
  const { status } = req.body;
  const allowed = new Set(["new", "preparing", "completed"]);
  if (!allowed.has(status))
    return res.status(400).json({ message: "Invalid status" });

  const info = db
    .prepare("UPDATE orders SET status = ? WHERE id = ?")
    .run(status, req.params.id);

  if (info.changes === 0)
    return res.status(404).json({ message: "Order not found" });

  res.json(db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id));
});

/** Order items: list (✅ adet dahil) */
app.get("/orders/:id/items", (req, res) => {
  const orderId = req.params.id;

  const rows = db
    .prepare(
      "SELECT rowId AS id, isbn, qty AS adet, bookTitle AS 'kitap adı', bookLocation AS 'kitap konumu' FROM order_items WHERE orderId = ? ORDER BY id ASC"
    )
    .all(orderId);

  res.json(rows);
});

/** Order items: upsert many (save table) (✅ adet kaydedilir) */
app.put("/orders/:id/items", (req, res) => {
  const orderId = req.params.id;

  // ✅ Order var mı kontrolü (FK hatasını engeller)
  const exists = db.prepare("SELECT id FROM orders WHERE id = ?").get(orderId);
  if (!exists) return res.status(404).json({ message: "Order not found" });

  const items = Array.isArray(req.body) ? req.body : [];

  // ✅ boş satırları temizle + adet normalize
  const cleaned = items
    .map((it) => {
      const rowId = String(it?.id ?? "").trim();
      const isbn = normalizeIsbn(it?.isbn ?? "");
      const title = String(it?.["kitap adı"] ?? "").trim();
      const loc = String(it?.["kitap konumu"] ?? "").trim();

      const qtyRaw = it?.adet ?? it?.qty ?? 1;
      const qty = Math.max(1, parseInt(qtyRaw, 10) || 1);

      return { rowId, isbn, title, loc, qty };
    })
    .filter((x) => x.rowId || x.isbn || x.title || x.loc);

  try {
    const tx = db.transaction(() => {
      db.prepare("DELETE FROM order_items WHERE orderId = ?").run(orderId);

      const ins = db.prepare(
        `INSERT INTO order_items (orderId, rowId, isbn, qty, bookTitle, bookLocation)
         VALUES (?, ?, ?, ?, ?, ?)`
      );

      for (const x of cleaned) {
        ins.run(orderId, x.rowId, x.isbn, x.qty, x.title, x.loc);
      }
    });

    tx();
    res.json({ ok: true, saved: cleaned.length });
  } catch (e) {
    res.status(400).json({ message: "Save items failed", error: String(e) });
  }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));