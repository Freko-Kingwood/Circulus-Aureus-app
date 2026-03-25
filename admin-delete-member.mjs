import { json, readData, requireUser, writeData, syncMemberFromUser } from './_utils.mjs';

export default async (req) => {
  try {
    const user = await requireUser();
    await syncMemberFromUser(user);
    const { eventId, status } = await req.json();
    if (!['yes', 'maybe', 'no'].includes(status)) return new Response('Ugyldigt svar', { status: 400 });
    const data = await readData();
    const event = data.events.find((item) => item.id === eventId);
    if (!event) return new Response('Begivenhed ikke fundet', { status: 404 });
    event.responses = event.responses || [];
    const existing = event.responses.find((item) => item.email === user.email);
    const payload = {
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Medlem',
      status,
      updatedAt: new Date().toISOString()
    };
    if (existing) Object.assign(existing, payload);
    else event.responses.push(payload);
    await writeData(data);
    return json({ ok: true });
  } catch (error) {
    return new Response(error.message === 'Unauthorized' ? 'Unauthorized' : 'Server error', { status: error.message === 'Unauthorized' ? 401 : 500 });
  }
};
