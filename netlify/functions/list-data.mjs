import { getStores, requireUser } from './_utils.mjs'

export default async (req, context) => {
  try {
    await requireUser(context)

    const stores = getStores()

    const [eventsRaw, membersRaw, messagesRaw, approvalsRaw] = await Promise.all([
      stores.events.list(),
      stores.members.list(),
      stores.messages.list(),
      stores.approvals.list()
    ])

    const events = (eventsRaw?.blobs || []).map((item) => item.data)
    const members = (membersRaw?.blobs || []).map((item) => item.data)
    const messages = (messagesRaw?.blobs || []).map((item) => item.data)
    const approvals = (approvalsRaw?.blobs || []).map((item) => item.data)

    return new Response(
      JSON.stringify({ events, members, messages, approvals }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}