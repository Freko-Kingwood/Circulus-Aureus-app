import { json, readData, requireAdmin, uid, writeData, getFileStore } from './_utils.mjs';

export default async (req) => {
  try {
    await requireAdmin();
    const form = await req.formData();
    const title = form.get('title');
    const category = form.get('category');
    const description = form.get('description');
    const eventId = form.get('eventId');
    const file = form.get('file');
    if (!title || !file || typeof file === 'string') return new Response('Titel og fil er påkrævet', { status: 400 });
    const fileId = uid('file');
    const fileStore = getFileStore();
    await fileStore.set(fileId, file, {
      metadata: {
        fileName: file.name,
        contentType: file.type || 'application/octet-stream'
      }
    });
    const data = await readData();
    const linkedEvent = data.events.find((event) => event.id === eventId);
    data.documents.unshift({
      id: fileId,
      title: String(title),
      category: String(category || 'Dokument'),
      description: String(description || ''),
      eventId: eventId ? String(eventId) : '',
      eventTitle: linkedEvent?.title || '',
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      createdAt: new Date().toISOString()
    });
    await writeData(data);
    return json({ ok: true });
  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500;
    return new Response(error.message, { status });
  }
};
