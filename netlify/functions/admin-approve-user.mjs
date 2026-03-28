import { json, parseBody, requireAdmin, supabase } from './_utils.mjs'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    await requireAdmin(event)

    const body = parseBody(event)
    const email = String(body.email || '').trim().toLowerCase()

    if (!email) {
      return json({ error: 'E-mail mangler' }, 400)
    }

    const { error } = await supabase
      .from('access_requests')
      .update({
        status: 'approved',
        handled_at: new Date().toISOString()
      })
      .eq('email', email)

    if (error) throw error

    return json({
      ok: true,
      message: 'Bruger markeret som inviteret'
    })
  } catch (error) {
    console.error('admin-approve-user fejl:', error)
    return json({ error: error.message || 'Kunne ikke godkende bruger' }, 500)
  }
}