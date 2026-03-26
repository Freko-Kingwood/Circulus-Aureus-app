import { json, readList, writeList, makeId, requireAuth } from './_utils.mjs';

export default async (req) => {
  try {
    requireAuth(req);
    const body = await req.json();
    const items = await readList('messages', []);
    items.unshift({
      id: makeId('message'),
      title: body.title || 'Uden titel',
      body: body.body || '',
      createdAt: new Date().toISOString(),
    });
    await writeList('messages', items);
    return json({ ok: true });
  } catch (error) {
    return json({ error: error.message }, 400);
  }
};
