import { getStores, json, setJSON } from './_utils.mjs'

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}')

    const email = String(body.email || '').trim().toLowerCase()
    const name = String(body.name || '').trim()
    const note = String(body.note || '').trim()

    if (!name || !email) {
      return json(400, { error: 'Navn og e-mail er påkrævet' })
    }

    const stores = getStores(event)

    await setJSON(stores.approvals, email, {
      name,
      email,
      note,
      status: 'pending',
      createdAt: new Date().toISOString()
    })

    return json(200, { ok: true, message: 'Anmodning gemt' })
  } catch (error) {
    return json(500, { error: error?.message || 'Request-access fejlede' })
  }
}