import { json, readList, writeList, makeId, requireAuth } from "./_utils.mjs";

export default async (req) => {
  try {
    requireAuth(req);

    const body = await req.json();
    const items = await readList("events", []);

    items.unshift({
      id: makeId("event"),
      title: body.title || "Uden titel",
      datetime: body.datetime || "",
      location: body.location || "",
      description: body.description || "",
      createdAt: new Date().toISOString()
    });

    await writeList("events", items);
    return json({ ok: true });
  } catch (error) {
    return json({ error: error.message }, 400);
  }
};