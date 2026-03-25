import { getFileStore, readData, requireUser } from './_utils.mjs';

export default async (req) => {
  try {
    await requireUser();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response('Manglende id', { status: 400 });
    const data = await readData();
    const doc = data.documents.find((item) => item.id === id);
    if (!doc) return new Response('Dokument ikke fundet', { status: 404 });
    const fileStore = getFileStore();
    const entry = await fileStore.get(id, { type: 'stream' });
    if (!entry) return new Response('Fil ikke fundet', { status: 404 });
    return new Response(entry, {
      headers: {
        'content-type': doc.contentType || 'application/octet-stream',
        'content-disposition': `inline; filename="${encodeURIComponent(doc.fileName || 'dokument')}"`
      }
    });
  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401 : 500;
    return new Response(error.message, { status });
  }
};
