import { getStores } from './_utils.mjs'

export default async (req) => {
  try {
    const body = await req.json()
    const email = String(body.email || '').trim().toLowerCase()
    const name = String(body.name || '').trim()
    const note = String(body.note || '').trim()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email mangler' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const store = getStores().approvals

    await store.set(email, {
      email,
      name,
      note,
      status: 'pending',
      createdAt: new Date().toISOString()
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