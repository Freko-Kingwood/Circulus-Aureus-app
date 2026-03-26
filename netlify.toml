import { readList, store } from './_utils.mjs';

export default async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const docs = await readList('documents', []);
  const doc = docs.find((d) => d.id === id);

  if (!doc) {
    return new Response('Not found', { status: 404 });
  }

  const content = await store().get(`file:${id}`, { type: 'text' });
  const bytes = Uint8Array.from(atob(content || ''), (c) => c.charCodeAt(0));

  return new Response(bytes, {
    headers: {
      'content-type': doc.mime || 'application/octet-stream',
      'content-disposition': `attachment; filename="${doc.filename || 'download'}"`,
    },
  });
};
