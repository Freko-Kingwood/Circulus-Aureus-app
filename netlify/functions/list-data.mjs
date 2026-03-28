import { getProfileByEmail, getHeaderEmail, json, supabase } from './_utils.mjs'

export const handler = async (event) => {
  try {
    const email = getHeaderEmail(event)
    const me = email ? await getProfileByEmail(email) : null
    const isAdmin = me?.role === 'admin'

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
      me
    })
  } catch (error) {
    return json({ error: error.message || 'Kunne ikke hente data' }, 500)
  }
}