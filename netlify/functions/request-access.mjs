import { json, parseBody, supabase } from './_utils.mjs'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = parseBody(event)

    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const note = String(body.note || '').trim()

    if (!name || !email) {
      return json({ error: 'Navn og e-mail er påkrævet' }, 400)
    }

    const { error } = await supabase
      .from('access_requests')
      .upsert(
        {
          name,
          email,
          note,
          status: 'pending'
        },
        { onConflict: 'email' }
      )

    if (error) throw error

    return json({ ok: true, message: 'Anmodning gemt' })
  } catch (error) {
    console.error('request-access fejl:', error)
    return json({ error: error.message || 'Kunne ikke gemme anmodning' }, 500)
  }
}