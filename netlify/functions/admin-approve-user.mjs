import { getStores, requireUser, isAdmin } from './_utils.mjs'

export default async (req, context) => {
  try {
    const user = await requireUser(context)

    if (!isAdmin(user)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const { email } = await req.json()
    const safeEmail = String(email || '').trim().toLowerCase()

    if (!safeEmail) {
      return new Response(
        JSON.stringify({ error: 'Email mangler' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const store = getStores().approvals
    const existing = await store.get(safeEmail, { type: 'json' })

    if (!existing) {
      return new Response(
        JSON.stringify({ error: 'Bruger ikke fundet' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    await store.set(safeEmail, {
      ...existing,
      status: 'invited',
      invitedAt: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}