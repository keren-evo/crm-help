import React, { useState } from 'react'
import { supabase, missingEnv } from '../lib/supabaseClient'
import { demoStaffLogin } from '../lib/demoStore'
import { recoverFromAuthError } from '../lib/authRecovery'

export default function StaffAuthPanel({ onAuthed }) {
  const [email, setEmail] = useState('crmhelp@evohcg.com')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const signInDemo = (e) => {
    e.preventDefault()
    if (!email) return
    const ok = demoStaffLogin(email, password)
    if (!ok) {
      setStatus('Invalid email or password')
      return
    }
    setStatus('Signed in (demo mode)')
    onAuthed?.()
  }

  const signInPassword = async (e) => {
    e.preventDefault()
    if (!email || !password || missingEnv) return
    setLoading(true)
    setStatus('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setStatus('Signed in')
      onAuthed?.()
    } catch (err) {
      if (await recoverFromAuthError(supabase, err)) return
      setStatus(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const signInMagicLink = async () => {
    if (!email || missingEnv) return
    setLoading(true)
    setStatus('')
    try {
      const redirectTo = `${window.location.origin}${window.location.pathname}#/admin`
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      })
      if (error) throw error
      setStatus('Check your email for the magic link.')
    } catch (err) {
      if (await recoverFromAuthError(supabase, err)) return
      setStatus(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (missingEnv) {
      localStorage.removeItem('demo_staff_session')
    } else {
      await supabase.auth.signOut()
    }
    onAuthed?.()
  }

  return (
    <div className="card staff-auth">
      <h2>Staff sign-in</h2>
      <p className="muted">
        Sign in with your work email and password to triage tickets and view reporting.
      </p>
      <form onSubmit={missingEnv ? signInDemo : signInPassword} className="form">
        <input
          type="email"
          required
          placeholder="Work email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <button type="submit" disabled={loading}>
          {missingEnv ? 'Sign in (demo)' : loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      {!missingEnv && (
        <button type="button" className="link-btn" onClick={signInMagicLink} disabled={loading}>
          Send magic link instead
        </button>
      )}
      {status && <p className="status">{status}</p>}
      <button type="button" className="link-btn" onClick={signOut}>
        Sign out
      </button>
    </div>
  )
}
