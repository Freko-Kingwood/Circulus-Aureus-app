import { json, readData, requireAdmin, writeData } from './_utils.mjs';

export default async (req) => {
  try {
    await requireAdmin();
    const { id } = await req.json();
    const data = await readData();
    data.members = data.members.filter((member) => member.id !== id);
    await writeData(data);
    return json({ ok: true });
  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500;
    return new Response(error.message, { status });
  }
};
