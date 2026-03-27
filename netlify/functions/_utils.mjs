import { getStore } from '@netlify/blobs'
import { getUser } from '@netlify/functions'

export function getStores() {
  return {
    events: getStore('events'),
    members: getStore('members'),
    messages: getStore('messages'),
    approvals: getStore('approvals')
  }
}

export async function requireUser(context) {
  const user = await getUser(context)
  if (!user) throw new Error('Not authenticated')
  return user
}

export function isAdmin(user) {
  return (user?.email || '').toLowerCase() === 'frekopetersen1998@gmail.com'
}

export async function setJSON(store, key, value) {
  await store.set(key, JSON.stringify(value), {
    contentType: 'application/json'
  })
}

export async function getJSON(store, key) {
  const raw = await store.get(key, { type: 'text' })
  return raw ? JSON.parse(raw) : null
}

export async function listJSON(store) {
  const result = await store.list()
  const keys = (result?.blobs || []).map((b) => b.key)
  const values = await Promise.all(keys.map((key) => getJSON(store, key)))
  return values.filter(Boolean)
}