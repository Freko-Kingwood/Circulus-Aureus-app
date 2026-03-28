import { getProfileByEmail, json, parseBody, requireAdmin, supabase } from './_utils.mjs'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    await requireAdmin(event)

    const body = parseBody(event)
    const email = String(body.email || '').trim().toLowerCase()
    const fullName = String(body.full_name || '').trim()
    const role = String(body.role || '').trim().toLowerCase()
    const status = String(body.status || '').trim().toLowerCase()

    if (!email) {
      return json({ error: 'E-mail mangler' }, 400)
    }

    if (!['admin', 'member'].includes(role)) {
      return json({ error: 'Ugyldig rolle' }, 400)
    }

    if (!['pending', 'active', 'rejected'].includes(status)) {
      return json({ error: 'Ugyldig status' }, 400)
    }

    const existing = await getProfileByEmail(email)

    if (!existing) {
      return json({ error: 'Profil ikke fundet' }, 404)
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName || existing.full_name || email.split('@')[0],
        role,
        status
      })
      .eq('email', email)
      .select('*')
      .single()

    if (error) throw error

    return json({
      ok: true,
      message: 'Profil opdateret',
      profile: data
    })
  } catch (error) {
    const code =
      error.message === 'Not authenticated'
        ? 401
        : error.message === 'Forbidden'
        ? 403
        : 500

    return json({ error: error.message || 'Kunne ikke opdatere profil' }, code)
  }
}