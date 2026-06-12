/**
 * Create or update the crmhelp superadmin via Supabase Admin API.
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node tools/create-superadmin.mjs
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = 'crmhelp@evohcg.com'
const password = 'crmhelp@evohcg.com'

if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: existing } = await admin.auth.admin.listUsers()
const found = existing?.users?.find((u) => u.email?.toLowerCase() === email)

let userId = found?.id
if (!userId) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'CRM Help' },
  })
  if (error) throw error
  userId = data.user.id
  console.log('Created auth user:', userId)
} else {
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  })
  if (error) throw error
  console.log('Updated auth user password:', userId)
}

const { error: staffErr } = await admin.from('staff_users').upsert(
  {
    auth_id: userId,
    name: 'CRM Help',
    email,
    department: 'IT',
    company: 'Evo',
    role: 'superadmin',
  },
  { onConflict: 'email' },
)

if (staffErr) throw staffErr
console.log('staff_users row ready for', email, '(superadmin)')
