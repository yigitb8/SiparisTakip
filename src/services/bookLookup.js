import { API_BASE } from "./api";

export function normalizeIsbn(value = "") {
  return value.replace(/[-\s]/g, "").trim();
}

export async function findBookByIsbn(isbnRaw) {
  const isbn = normalizeIsbn(isbnRaw);
  if (!isbn) return null;

  const res = await fetch(`${API_BASE}/books/by-isbn/${encodeURIComponent(isbn)}`);
  if (!res.ok) return null;

  return res.json(); // {isbn, title, location}
}