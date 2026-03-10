export const API_BASE = "/siparis-api";

/* GET */
export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include"
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

/* JSON POST / PATCH / DELETE */
export async function apiJson(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

/* FormData (file upload) */
export async function apiForm(path, formData) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}