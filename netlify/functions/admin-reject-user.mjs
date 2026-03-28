import { json, parseBody, requireAdmin, supabase } from './_utils.mjs'

export default async (event) => {
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

    const { error: requestError } = await supabase
      .from('access_requests')
      .update({
        status: 'rejected',
        handled_at: new Date().toISOString()
      })
      .eq('email', email)

    if (requestError) throw requestError

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          email,
          full_name: email.split('@')[0],
          role: 'member',
          status: 'rejected'
        },
        { onConflict: 'email' }
      )

    if (profileError) throw profileError

    return json({
      ok: true,
      message: 'Bruger afvist'
    })
  } catch (error) {
    const code = error.message === 'Not authenticated' ? 401 : error.message === 'Forbidden' ? 403 : 500
    return json({ error: error.message || 'Kunne ikke afvise bruger' }, code)
  }
}