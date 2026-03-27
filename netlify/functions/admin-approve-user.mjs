import { getStores, json, requireUser, isAdmin, getJSON, setJSON } from './_utils.mjs'

export const handler = async (event, context) => {
  try {
    const user = requireUser(context)

    if (!isAdmin(user)) {
      return json(403, { error: 'Forbidden' })
    }

    const body = JSON.parse(event.body || '{}')
    const safeEmail = String(body.email || '').trim().toLowerCase()

    if (!safeEmail) {
      return json(400, { error: 'Email mangler' })
    }

    const stores = getStores(event)
    const existing = await getJSON(stores.approvals, safeEmail)

    if (!existing) {
      return json(404, { error: 'Bruger ikke fundet' })
    }

    await setJSON(stores.approvals, safeEmail, {
      ...existing,
      status: 'invited',
      invitedAt: new Date().toISOString()
    })

    return json(200, { ok: true })
  } catch (error) {
    return json(500, { error: error?.message || 'Godkendelse fejlede' })
  }
}