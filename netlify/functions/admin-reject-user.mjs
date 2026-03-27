import { getStores, requireUser, isAdmin } from './_utils.mjs'

export default async (req, context) => {
  try {
    const user = await requireUser(context)
    if (!isAdmin(user)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { email } = await req.json()
    const safeEmail = String(email || '').trim().toLowerCase()
    if (!safeEmail) {
      return new Response(JSON.stringify({ error: 'Email mangler' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    await getStores().approvals.delete(safeEmail)

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Afvisning fejlede' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}