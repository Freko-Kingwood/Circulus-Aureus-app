import { getUserFromEvent, getProfileByEmail, json, supabase } from './_utils.mjs'

export default async () => {
  return json({ error: 'Handler not mounted' }, 500)
}

export async function handler(event) {
  try {
    const identityUser = getUserFromEvent(event)
    const email = identityUser?.email ? String(identityUser.email).toLowerCase() : null
    const profile = email ? await getProfileByEmail(email) : null
    const isAdmin = profile?.role === 'admin'

    const [eventsRes, membersRes, messagesRes, approvalsRes] = await Promise.all([
      supabase.from('events').select('*').order('starts_at', { ascending: true }),
      supabase.from('profiles').select('*').order('created_at', { ascending: true }),
      supabase.from('messages').select('*').order('created_at', { ascending: false }),
      isAdmin
        ? supabase.from('access_requests').select('*').order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null })
    ])

    if (eventsRes.error) throw eventsRes.error
    if (membersRes.error) throw membersRes.error
    if (messagesRes.error) throw messagesRes.error
    if (approvalsRes.error) throw approvalsRes.error

    return json({
      events: eventsRes.data || [],
      members: membersRes.data || [],
      messages: messagesRes.data || [],
      approvals: approvalsRes.data || [],
      me: profile || null
    })
  } catch (error) {
    return json({ error: error.message || 'Kunne ikke hente data' }, 500)
  }
}