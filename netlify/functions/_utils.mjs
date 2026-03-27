import jwt from 'jsonwebtoken'
import { connectLambda, getStore } from '@netlify/blobs'

export function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
}

export function getStores(event) {
  connectLambda(event)

  return {
    events: getStore('events'),
    members: getStore('members'),
    messages: getStore('messages'),
    approvals: getStore('approvals')
  }
}

export function requireAuth(event) {
  const authHeader =
    event?.headers?.authorization ||
    event?.headers?.Authorization ||
    ''

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Not authenticated')
  }

  const token = authHeader.replace('Bearer ', '').trim()

  if (!token) {
    throw new Error('Not authenticated')
  }

  try {
    const decoded = jwt.decode(token)

    if (!decoded || typeof decoded !== 'object') {
      throw new Error('Invalid token')
    }

    return decoded
  } catch {
    throw new Error('Not authenticated')
  }
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
  const keys = (result?.blobs || []).map((blob) => blob.key)
  const values = await Promise.all(keys.map((key) => getJSON(store, key)))
  return values.filter(Boolean)
}