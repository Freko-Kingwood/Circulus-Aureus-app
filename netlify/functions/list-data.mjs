import { getStores, requireUser } from './_utils.mjs'

export default async (req, context) => {
  try {
    await requireUser(context)

    const stores = getStores()

    const [events, members, messages, approvals] = await Promise.all([
      stores.events.list(),
      stores.members.list(),
      stores.messages.list(),
      stores.approvals.list()
    ])

    return new Response(JSON.stringify({
      events: events.map(e => e.value),
      members: members.map(m => m.value),
      messages: messages.map(m => m.value),
      approvals: approvals.map(a => a.value)
    }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 401 })
  }
}