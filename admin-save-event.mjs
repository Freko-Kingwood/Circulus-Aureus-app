import { getStore } from '@netlify/blobs';

export function store(name = 'circulus-aureus') {
  return getStore(name);
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export async function readList(key, fallback = []) {
  const value = await store().get(key, { type: 'json' });
  return value ?? fallback;
}

export async function writeList(key, value) {
  await store().setJSON(key, value);
}

export function requireAuth(req) {
  if (!req.headers.get('authorization')) {
    throw new Error('Ikke logget ind');
  }
}

export function makeId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
