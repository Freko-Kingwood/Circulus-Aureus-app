import { getStores, json, requireAuth, listJSON } from './_utils.mjs'

export const handler = async (event) => {
  try {
    requireAuth(event)

    const stores = getStores(event)

    const [events, members, messages, approvals] = await Promise.all([
      listJSON(stores.events),
      listJSON(stores.members),
      listJSON(stores.messages),
      listJSON(stores.approvals)
    ])

    return json(200, {
      events,
      members,
      messages,
      approvals
    })
  } catch (error) {
    return json(401, {
      error: error?.message || 'Kunne ikke hente data'
    })
  }
}