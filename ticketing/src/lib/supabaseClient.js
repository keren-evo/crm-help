import { createClient } from '@supabase/supabase-js'
import { clearAuthStorage, hasValidSupabaseConfig } from './authRecovery'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
export const bucket = import.meta.env.VITE_STORAGE_BUCKET || 'tickets'

export const missingEnv = !hasValidSupabaseConfig(SUPABASE_URL, SUPABASE_ANON_KEY)

// Drop stale sessions when Supabase is not properly configured.
if (missingEnv) {
  clearAuthStorage()
}

export const supabase = !missingEnv
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
    },
  })
  : null

export function publicScreenshotUrl(path) {
  if (!path || !SUPABASE_URL) return null
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}

export function edgeUrl(name) {
  const base = import.meta.env.VITE_EDGE_URL
  if (base && base.includes('/send-confirmation')) {
    return base.replace(/\/send-confirmation\/?$/, `/${name}`)
  }
  if (base) return `${base.replace(/\/$/, '')}/${name}`
  return `/functions/v1/${name}`
}
