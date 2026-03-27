import {
  getStores,
  json,
  requireAuth,
  isAdmin
} from './_utils.mjs'

export const handler = async (event) => {
  try {
    const user = requireAuth(event)

    if (!isAdmin(user)) {
      return json(403, { error: 'Forbidden' })
    }

    const body = JSON.parse(event.body || '{}')
    const safeEmail = String(body.email || '').trim().toLowerCase()

    if (!safeEmail) {
      return json(400, { error: 'Email mangler' })
    }

    const stores = getStores(event)
    await stores.approvals.delete(safeEmail)

    return json(200, {
      ok: true,
      message: 'Bruger afvist'
    })
  } catch (error) {
    return json(500, {
      error: error?.message || 'Afvisning fejlede'
    })
  }
}