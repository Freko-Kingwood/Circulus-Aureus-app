import { json, getFileStore, readData, requireAdmin, writeData } from './_utils.mjs';

export default async (req) => {
  try {
    await requireAdmin();
    const { id } = await req.json();
    const data = await readData();
    data.documents = data.documents.filter((doc) => doc.id !== id);
    await writeData(data);
    const fileStore = getFileStore();
    await fileStore.delete(id);
    return json({ ok: true });
  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500;
    return new Response(error.message, { status });
  }
};
