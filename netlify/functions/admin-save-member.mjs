import { json, readList, writeList, makeId, requireAuth } from "./_utils.mjs";

export default async (req) => {
  try {
    requireAuth(req);

    const body = await req.json();
    const items = await readList("members", []);

    items.unshift({
      id: makeId("member"),
      name: body.name || "Uden navn",
      email: body.email || "",
      since: body.since || "",
      createdAt: new Date().toISOString()
    });

    await writeList("members", items);
    return json({ ok: true });
  } catch (error) {
    return json({ error: error.message }, 400);
  }
};