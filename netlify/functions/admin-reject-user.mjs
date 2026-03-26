import { json, readList, writeList, requireAuth } from "./_utils.mjs";

export default async (req) => {
  try {
    requireAuth(req);
    const { email } = await req.json();

    const approvals = await readList("approvals", []);
    const next = approvals.filter((item) => item.email !== email);

    await writeList("approvals", next);
    return json({ ok: true });
  } catch (error) {
    return json({ error: error.message }, 400);
  }
};