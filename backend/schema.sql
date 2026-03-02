PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS books (
  isbn TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('new','preparing','completed')),
  customer TEXT NOT NULL,
  total REAL NOT NULL DEFAULT 0,
  itemsCount INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  fileName TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId TEXT NOT NULL,
  rowId TEXT NOT NULL,              -- tabloda "id"
  isbn TEXT NOT NULL,
  bookTitle TEXT NOT NULL,
  bookLocation TEXT NOT NULL,
  FOREIGN KEY(orderId) REFERENCES orders(id) ON DELETE CASCADE
);

-- örnek kitaplar (test için)
INSERT OR IGNORE INTO books (isbn, title, location) VALUES
('9786051234567','Küçük Prens','Depo-A / Raf 3'),
('9789750719387','Tutunamayanlar','Depo-B / Raf 7'),
('9789750738609','Saatleri Ayarlama Enstitüsü','Depo-A / Raf 1');