import { getStore } from "@netlify/blobs";

const store = getStore("circulus-aureus");

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

export async function readList(key, fallback = []) {
  const raw = await store.get(key, { type: "json" });
  return Array.isArray(raw) ? raw : fallback;
}

export async function writeList(key, value) {
  await store.setJSON(key, value);
}

export function makeId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function requireAuth(req) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    throw new Error("Ikke autoriseret");
  }
}

export { store };
