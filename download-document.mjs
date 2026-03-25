import { json, readData, requireAdmin, uid, writeData } from './_utils.mjs';

export default async (req) => {
  try {
    const user = await requireAdmin();
    const body = await req.json();
    if (!body.title || !body.body) return new Response('Titel og besked er påkrævet', { status: 400 });
    const data = await readData();
    data.messages.unshift({
      id: uid('msg'),
      title: body.title,
      body: body.body,
      pinned: Boolean(body.pinned),
      createdAt: new Date().toISOString(),
      authorName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
      authorEmail: user.email
    });
    await writeData(data);
    return json({ ok: true });
  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500;
    return new Response(error.message, { status });
  }
};
