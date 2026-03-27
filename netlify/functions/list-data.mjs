import { getStores, requireUser, listJSON } from './_utils.mjs'

export default async (req, context) => {
  try {
    await requireUser(context)
    const stores = getStores()

    const [events, members, messages, approvals] = await Promise.all([
      listJSON(stores.events),
      listJSON(stores.members),
      listJSON(stores.messages),
      listJSON(stores.approvals)
    ])

    return new Response(JSON.stringify({ events, members, messages, approvals }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Kunne ikke hente data' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}