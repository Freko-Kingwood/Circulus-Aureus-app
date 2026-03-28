import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL')
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

export function json(body, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(body)
  }
}

export function getUserFromEvent(event) {
  return event?.clientContext?.user || null
}

export async function requireUser(event) {
  const user = getUserFromEvent(event)

  if (!user?.email) {
    throw new Error('Not authenticated')
  }

  return user
}

export async function getProfileByEmail(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', String(email).toLowerCase())
    .maybeSingle()

  if (error) throw error
  return data
}

export async function requireAdmin(event) {
  const user = await requireUser(event)
  const profile = await getProfileByEmail(user.email)

  if (!profile || profile.role !== 'admin') {
    throw new Error('Forbidden')
  }

  return { user, profile }
}

export function parseBody(event) {
  try {
    return event?.body ? JSON.parse(event.body) : {}
  } catch {
    return {}
  }
}