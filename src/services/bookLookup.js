import { apiGet } from "./api";

export function normalizeIsbn(value = "") {
  return String(value).replace(/[-\s]/g, "").trim();
}

export async function findBookByIsbn(isbn) {
  const normalized = normalizeIsbn(isbn);
  if (!normalized) return null;

  try {
    return await apiGet(`/book-by-isbn.php?isbn=${encodeURIComponent(normalized)}`);
  } catch (e) {
    return null;
  }
}