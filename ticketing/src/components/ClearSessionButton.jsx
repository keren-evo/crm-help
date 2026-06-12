import React from 'react'
import { clearAuthStorage } from '../lib/authRecovery'

export default function ClearSessionButton({ supabase }) {
  const clear = async () => {
    try {
      if (supabase?.auth) await supabase.auth.signOut()
    } catch {
      /* ignore */
    }
    clearAuthStorage()
    sessionStorage.removeItem('auth_recovery_done')
    window.location.reload()
  }

  return (
    <button className="link-btn" onClick={clear} title="Clear session & reload (developer)">Clear session</button>
  )
}
