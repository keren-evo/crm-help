import React, { useMemo, useState } from 'react'
import { supabase, missingEnv } from '../lib/supabaseClient'
import { demoStaffLogin } from '../lib/demoStore'
import { recoverFromAuthError } from '../lib/authRecovery'
import ThemeToggle from './ThemeToggle'

function initialsFromEmail(email) {
  const local = email.split('@')[0] || ''
  const parts = local.split(/[._-]/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return local.slice(0, 2).toUpperCase()
}

function displayNameFromEmail(email) {
  const local = email.split('@')[0] || 'Staff'
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

export default function StaffAuthPanel({ onAuthed, fullPage = true }) {
  const [email, setEmail] = useState('crmhelp@evohcg.com')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const initials = useMemo(() => initialsFromEmail(email), [email])
  const displayName = useMemo(() => displayNameFromEmail(email), [email])

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

  const shellClass = fullPage ? 'auth-shell' : 'auth-shell auth-shell--embedded'

  return (
    <div className={shellClass}>
      <div className="auth-panel">
        <div className="auth-panel-top">
          <a href="#/" className="auth-back">← Back</a>
          <div className="auth-mini-brand">
            <span className="auth-mini-icon" aria-hidden="true">◆</span>
            <span>Evo Help</span>
          </div>
        </div>

        <div className="auth-panel-body">
          <h1 className="auth-title">Staff sign-in</h1>
          <p className="auth-subtitle">Triage tickets, assign work, and view reporting.</p>

          <form onSubmit={missingEnv ? signInDemo : signInPassword} className="auth-form">
            <label className="auth-label" htmlFor="staff-email">Email</label>
            <input
              id="staff-email"
              type="email"
              required
              placeholder="Work email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="auth-input"
            />

            {email && (
              <div className="auth-profile">
                <div className="auth-avatar" aria-hidden="true">{initials}</div>
                <div>
                  <div className="auth-profile-name">{displayName}</div>
                  <div className="auth-profile-email">{email}</div>
                </div>
              </div>
            )}

            <div className="auth-label-row">
              <label className="auth-label" htmlFor="staff-password">Password</label>
              {!missingEnv && (
                <button type="button" className="auth-link" onClick={signInMagicLink} disabled={loading}>
                  Magic link
                </button>
              )}
            </div>
            <div className="auth-password-wrap">
              <input
                id="staff-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="auth-input"
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {missingEnv ? 'Sign in (demo)' : loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          {status && <p className="auth-status">{status}</p>}
        </div>
      </div>

      <div className="auth-visual">
        <div className="auth-visual-theme">
          <ThemeToggle />
        </div>
        <div className="auth-visual-grid" aria-hidden="true" />
        <div className="auth-visual-glow auth-visual-glow--tl" aria-hidden="true" />
        <div className="auth-visual-glow auth-visual-glow--br" aria-hidden="true" />
        <img
          src={`${import.meta.env.BASE_URL}evo-logo.svg`}
          alt=""
          className="auth-visual-logo"
          aria-hidden="true"
        />
        <p className="auth-visual-tagline" aria-hidden="true">Support ticketing for Evo teams</p>
      </div>
    </div>
  )
}
