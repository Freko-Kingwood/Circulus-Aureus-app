import { getStores, json, requireUser, isAdmin } from './_utils.mjs'

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

    await getStores().approvals.delete(safeEmail)

    return json(200, { ok: true })
  } catch (error) {
    return json(500, { error: error?.message || 'Afvisning fejlede' })
  }
}