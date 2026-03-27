import { getStores } from './_utils.mjs'

export default async (req) => {
  const body = await req.json()

  const store = getStores().approvals

  await store.set(body.email, {
    ...body,
    status: 'pending',
    createdAt: new Date().toISOString()
  })

  return new Response(JSON.stringify({ success: true }))
}