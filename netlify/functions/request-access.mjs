import { json, readList, writeList } from "./_utils.mjs";

export default async (req) => {
  try {
    const body = await req.json();
    const email = (body.email || "").toLowerCase().trim();

    if (!email) {
      return json({ error: "Manglende email" }, 400);
    }

    const approvals = await readList("approvals", []);
    const exists = approvals.some((item) => item.email === email);

    if (!exists) {
      approvals.unshift({
        email,
        createdAt: new Date().toISOString()
      });
      await writeList("approvals", approvals);
    }

    return json({ ok: true });
  } catch (error) {
    return json({ error: error.message }, 400);
  }
};