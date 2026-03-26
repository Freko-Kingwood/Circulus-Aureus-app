import { json, readList, writeList, makeId, requireAuth, store } from "./_utils.mjs";

export default async (req) => {
  try {
    requireAuth(req);

    const body = await req.json();
    const id = makeId("doc");
    const docs = await readList("documents", []);

    await store.set(`file:${id}`, body.content || "");

    docs.unshift({
      id,
      title: body.title || body.filename || "Dokument",
      note: body.note || "",
      filename: body.filename || "file.bin",
      mime: body.mime || "application/octet-stream",
      createdAt: new Date().toISOString()
    });

    await writeList("documents", docs);
    return json({ ok: true, id });
  } catch (error) {
    return json({ error: error.message }, 400);
  }
};