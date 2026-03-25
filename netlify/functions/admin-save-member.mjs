import { json, readData, requireAdmin, uid, writeData } from './_utils.mjs';

export default async (req) => {
  try {
    await requireAdmin();
    const body = await req.json();
    if (!body.name || !body.email) return new Response('Navn og e-mail er påkrævet', { status: 400 });
    const data = await readData();
    const email = body.email.toLowerCase();
    const existing = data.members.find((member) => member.email?.toLowerCase() === email);
    if (existing) {
      existing.name = body.name;
      existing.phone = body.phone || '';
      existing.memberSince = body.memberSince || existing.memberSince || '';
      existing.active = true;
    } else {
      data.members.push({
        id: uid('member'),
        name: body.name,
        email: body.email,
        phone: body.phone || '',
        memberSince: body.memberSince || '',
        active: true,
        source: 'manual'
      });
    }
    await writeData(data);
    return json({ ok: true });
  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500;
    return new Response(error.message, { status });
  }
};
