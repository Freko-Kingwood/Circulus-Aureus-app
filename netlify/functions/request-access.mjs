import { getStores, setJSON } from './_utils.mjs'

export default async (req) => {
  try {
    const body = await req.json()

    const email = String(body.email || '').trim().toLowerCase()
    const name = String(body.name || '').trim()
    const note = String(body.note || '').trim()

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: 'Navn og e-mail er påkrævet' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const stores = getStores()

    await setJSON(stores.approvals, email, {
      name,
      email,
      note,
      status: 'pending',
      createdAt: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Anmodning gemt'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error?.message || 'Request-access fejlede'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}