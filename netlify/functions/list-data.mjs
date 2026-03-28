import { json, supabase } from './_utils.mjs'

export const handler = async () => {
  try {
    const [eventsRes, membersRes, messagesRes, approvalsRes] = await Promise.all([
      supabase.from('events').select('*').order('starts_at', { ascending: true }),
      supabase.from('profiles').select('*').order('created_at', { ascending: true }),
      supabase.from('messages').select('*').order('created_at', { ascending: false }),
      supabase.from('access_requests').select('*').order('created_at', { ascending: false })
    ])

    if (eventsRes.error) throw eventsRes.error
    if (membersRes.error) throw membersRes.error
    if (messagesRes.error) throw messagesRes.error
    if (approvalsRes.error) throw approvalsRes.error

    return json({
      events: eventsRes.data || [],
      members: membersRes.data || [],
      messages: messagesRes.data || [],
      approvals: approvalsRes.data || []
    })
  } catch (error) {
    console.error('list-data fejl:', error)
    return json({ error: error.message || 'Kunne ikke hente data' }, 500)
  }
}