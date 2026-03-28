import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ADMIN_EMAILS = String(process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

if (!SUPABASE_URL) throw new Error('Missing SUPABASE_URL')
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

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

export function parseBody(event) {
  try {
    return event?.body ? JSON.parse(event.body) : {}
  } catch {
    return {}
  }
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
  const headerEmail = String(
    event?.headers?.['x-user-email'] ||
    event?.headers?.['X-User-Email'] ||
    ''
  ).trim().toLowerCase()

  if (!headerEmail) {
    throw new Error('Not authenticated')
  }

  const profile = await getProfileByEmail(headerEmail)

  const isAdminByEnv = ADMIN_EMAILS.includes(headerEmail)
  const isAdminByProfile = profile?.role === 'admin'

  if (!isAdminByEnv && !isAdminByProfile) {
    throw new Error('Forbidden')
  }

  return { email: headerEmail, profile }
}