import { json, readData, requireAdmin, uid, writeData } from './_utils.mjs';

export default async (req) => {
  try {
    await requireAdmin();
    const body = await req.json();
    if (!body.title || !body.date) return new Response('Titel og dato er påkrævet', { status: 400 });
    const data = await readData();
    data.events.push({
      id: uid('evt'),
      title: body.title,
      date: body.date,
      location: body.location || '',
      dresscode: body.dresscode || '',
      description: body.description || '',
      deadline: body.deadline || '',
      responses: [],
      createdAt: new Date().toISOString()
    });
    await writeData(data);
    return json({ ok: true });
  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500;
    return new Response(error.message, { status });
  }
};
