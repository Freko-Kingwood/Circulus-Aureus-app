import { json, readList, writeList, requireAuth, store } from "./_utils.mjs";

export default async (req) => {
  try {
    requireAuth(req);
    const { id } = await req.json();

    if (!id) {
      return json({ error: "Manglende id" }, 400);
    }

    const items = await readList("documents", []);
    const next = items.filter((item) => item.id !== id);

    await writeList("documents", next);
    await store.delete(`file:${id}`);

    return json({ ok: true });
  } catch (error) {
    return json({ error: error.message }, 400);
  }
};