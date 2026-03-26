import { readList, store } from "./_utils.mjs";

export default async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response("Manglende id", { status: 400 });
  }

  const docs = await readList("documents", []);
  const doc = docs.find((item) => item.id === id);

  if (!doc) {
    return new Response("Dokument ikke fundet", { status: 404 });
  }

  const base64 = await store.get(`file:${id}`, { type: "text" });

  if (!base64) {
    return new Response("Fil ikke fundet", { status: 404 });
  }

  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  return new Response(bytes, {
    status: 200,
    headers: {
      "content-type": doc.mime || "application/octet-stream",
      "content-disposition": `attachment; filename="${doc.filename || "download.bin"}"`
    }
  });
};