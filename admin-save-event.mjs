import { getStore } from '@netlify/blobs';
import { getUser } from '@netlify/identity';

const DATA_STORE = getStore('circulus-aureus-data');
const FILE_STORE = getStore('circulus-aureus-files');

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export function text(message, status = 200) {
  return new Response(message, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

const seedData = {
  events: [
    {
      id: 'evt_seed_1',
      title: 'Broderskabsaften',
      date: '2026-04-03T20:00:00',
      location: 'Kapitelsalen',
      dresscode: 'Mørkt tøj',
      description: 'Formelt møde, fælles skål og aftenens emne.',
      deadline: '2026-04-01',
      responses: [],
      createdAt: '2026-03-25T12:00:00Z'
    }
  ],
  members: [],
  messages: [
    {
      id: 'msg_seed_1',
      title: 'Velkommen til Circulus Aureus',
      body: 'Dette er den første interne besked. Brug admin-panelet til at oprette nye opslag.',
      pinned: true,
      createdAt: new Date().toISOString(),
      authorName: 'System',
      authorEmail: 'system@circulus-aureus.local'
    }
  ],
  documents: []
};

export async function ensureData() {
  const current = await DATA_STORE.getJSON('app-data');
  if (!current) {
    await DATA_STORE.setJSON('app-data', seedData);
    return structuredClone(seedData);
  }
  return current;
}

export async function readData() {
  return ensureData();
}

export async function writeData(data) {
  await DATA_STORE.setJSON('app-data', data);
  return data;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

export function isAdminUser(user) {
  const envAdmins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(user?.roles?.includes('admin') || envAdmins.includes((user?.email || '').toLowerCase()));
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!isAdminUser(user)) throw new Error('Forbidden');
  return user;
}

export async function syncMemberFromUser(user) {
  const data = await readData();
  const existing = data.members.find((member) => member.email?.toLowerCase() === user.email?.toLowerCase());
  if (existing) {
    existing.name = existing.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Medlem';
    existing.active = true;
  } else {
    data.members.push({
      id: uid('member'),
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Medlem',
      email: user.email,
      phone: '',
      memberSince: new Date().getFullYear().toString(),
      active: true,
      source: 'identity'
    });
  }
  await writeData(data);
}

export function getFileStore() {
  return FILE_STORE;
}
