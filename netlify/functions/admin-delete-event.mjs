import { json, readList, writeList, requireAuth } from "./_utils.mjs";

export default async (req) => {
  try {
    requireAuth(req);
    const { id } = await req.json();

    if (!id) {
      return json({ error: "Manglende id" }, 400);
    }

    const items = await readList("events", []);
    const next = items.filter((item) => item.id !== id);

    await writeList("events", next);
    return json({ ok: true });
  } catch (error) {
    return json({ error: error.message }, 400);
  }
};