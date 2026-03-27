import { getStores, requireUser, isAdmin } from './_utils.mjs'

export default async (req, context) => {
  try {
    const user = await requireUser(context)

    if (!isAdmin(user)) {
      return new Response('Forbidden', { status: 403 })
    }

    const { email } = await req.json()

    const store = getStores().approvals

    const record = await store.get(email)

    await store.set(email, {
      ...record,
      status: 'invited'
    })

    return new Response(JSON.stringify({ success: true }))
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}