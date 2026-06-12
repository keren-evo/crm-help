import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { hasValidSupabaseConfig } from '../lib/authRecovery'

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light')
    localStorage.setItem('theme', theme)

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!hasValidSupabaseConfig(SUPABASE_URL, SUPABASE_ANON_KEY)) return

    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      supabase.auth.getSession().then(({ data, error }) => {
        if (error || !data.session?.user) return
        supabase.from('profiles').upsert({ id: data.session.user.id, theme }, { onConflict: 'id' }).then(() => { })
      }).catch(() => { })
    } catch {
      /* ignore */
    }
  }, [theme])

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      aria-label="Toggle theme"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? '☀' : '🌙'}
    </button>
  )
}
