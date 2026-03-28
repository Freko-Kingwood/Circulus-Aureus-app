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

    const { data: accessRequest, error: requestReadError } = await supabase
      .from('access_requests')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (requestReadError) throw requestReadError

    if (!accessRequest) {
      return json({ error: 'Anmodning ikke fundet' }, 404)
    }

    const { error: requestUpdateError } = await supabase
      .from('access_requests')
      .update({
        status: 'approved',
        handled_at: new Date().toISOString()
      })
      .eq('email', email)

    if (requestUpdateError) throw requestUpdateError

    const nameFromRequest =
      String(accessRequest.name || '').trim() || email.split('@')[0]

    const { error: profileUpsertError } = await supabase
      .from('profiles')
      .upsert(
        {
          email,
          full_name: nameFromRequest,
          role: 'member',
          status: 'pending'
        },
        { onConflict: 'email' }
      )

    if (profileUpsertError) throw profileUpsertError

    return json({
      ok: true,
      message: 'Bruger markeret som godkendt'
    })
  } catch (error) {
    console.error('admin-approve-user fejl:', error)

    const code =
      error.message === 'Not authenticated'
        ? 401
        : error.message === 'Forbidden'
        ? 403
        : 500

    return json(
      { error: error.message || 'Kunne ikke godkende bruger' },
      code
    )
  }
}