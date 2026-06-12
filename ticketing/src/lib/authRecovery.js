export function isJwsError(err) {
  const msg = err?.message || err?.error_description || String(err || '')
  return msg.includes('Invalid Compact JWS') || msg.includes('invalid JWT')
}

export function clearAuthStorage() {
  try {
    Object.keys(localStorage).forEach((k) => {
      if (/supabase|sb-|auth|session|jwt/i.test(k)) {
        localStorage.removeItem(k)
      }
    })
  } catch {
    /* ignore */
  }
  try {
    document.cookie.split(';').forEach((c) => {
      document.cookie = `${c.replace(/^ +/, '').replace(/=.*/, '')}=;expires=${new Date(0).toUTCString()};path=/`
    })
  } catch {
    /* ignore */
  }
}

export async function recoverFromAuthError(supabase, err) {
  if (!isJwsError(err)) return false

  if (sessionStorage.getItem('auth_recovery_done')) {
    clearAuthStorage()
    return true
  }

  sessionStorage.setItem('auth_recovery_done', '1')
  try {
    await supabase?.auth?.signOut()
  } catch {
    /* ignore */
  }
  clearAuthStorage()
  window.location.reload()
  return true
}

export async function ensureCleanAuthSession(supabase) {
  if (!supabase) return
  try {
    const { error } = await supabase.auth.getSession()
    if (error) await recoverFromAuthError(supabase, error)
  } catch (err) {
    await recoverFromAuthError(supabase, err)
  }
}

export function hasValidSupabaseConfig(url, anonKey) {
  if (!url || !anonKey) return false
  if (/your-anon-key|changeme|replace-me/i.test(anonKey)) return false
  // Supabase anon/service keys are JWTs (header.payload.signature)
  return anonKey.split('.').length === 3 && anonKey.length > 80
}
