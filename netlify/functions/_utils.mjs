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
  if (!user) {
    throw new Error('Not authenticated')
  }
  return user
}

export function isAdmin(user) {
  return (user?.email || '').toLowerCase() === 'frekopetersen1998@gmail.com'
}