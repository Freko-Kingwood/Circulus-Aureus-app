import { json, readData, requireAdmin, writeData } from './_utils.mjs';

export default async (req) => {
  try {
    await requireAdmin();
    const { id } = await req.json();
    const data = await readData();
    data.messages = data.messages.filter((message) => message.id !== id);
    await writeData(data);
    return json({ ok: true });
  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500;
    return new Response(error.message, { status });
  }
};
