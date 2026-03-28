import { getProfileByEmail, json, requireSignedIn, supabase } from './_utils.mjs'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const email = await requireSignedIn(event)
    const existing = await getProfileByEmail(email)

    if (existing) {
      return json({
        ok: true,
        profile: existing
      })
    }

    const fullName = email.split('@')[0]

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        email,
        full_name: fullName,
        role: 'member',
        status: 'active'
      })
      .select('*')
      .single()

    if (error) throw error

    return json({
      ok: true,
      profile: data
    })
  } catch (error) {
    const code = error.message === 'Not authenticated' ? 401 : 500
    return json({ error: error.message || 'Kunne ikke synkronisere profil' }, code)
  }
}