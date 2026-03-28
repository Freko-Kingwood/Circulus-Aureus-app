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
        status: 'approved',
        handled_at: new Date().toISOString()
      })
      .eq('email', email)

    if (requestError) throw requestError

    const { data: existingProfile, error: profileReadError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (profileReadError) throw profileReadError

    const payload = existingProfile
      ? {
          email,
          full_name: existingProfile.full_name || email.split('@')[0],
          role: existingProfile.role || 'member',
          status: 'pending'
        }
      : {
          email,
          full_name: email.split('@')[0],
          role: 'member',
          status: 'pending'
        }

    const { error: profileWriteError } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'email' })

    if (profileWriteError) throw profileWriteError

    return json({
      ok: true,
      message: 'Bruger markeret som godkendt'
    })
  } catch (error) {
    const code = error.message === 'Not authenticated' ? 401 : error.message === 'Forbidden' ? 403 : 500
    return json({ error: error.message || 'Kunne ikke godkende bruger' }, code)
  }
}