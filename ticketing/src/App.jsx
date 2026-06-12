import React, { useEffect, useState } from 'react'
import './styles/modern.css'
import EvoLogo from './components/EvoLogo'
import ThemeToggle from './components/ThemeToggle'
import ClearSessionButton from './components/ClearSessionButton'
import SubmitPage, { DemoSubmitPage } from './pages/SubmitPage'
import AdminPage from './pages/AdminPage'
import ReportingPage from './pages/ReportingPage'
import { missingEnv, supabase } from './lib/supabaseClient'
import { ensureCleanAuthSession } from './lib/authRecovery'
import { ensureDemoSeedData } from './lib/demoStore'
import DemoBanner from './components/DemoBanner'

function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || '/')
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.slice(1) || '/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return route
}

export default function App() {
  const route = useHashRoute()

  useEffect(() => {
    ensureCleanAuthSession(supabase)
    if (missingEnv) ensureDemoSeedData()
  }, [])

  const shell = (content) => (
    <>
      <header className="site-header">
        <div className="header-inner">
          <div className="header-left">
            <a href="#/" aria-label="Home"><EvoLogo /></a>
          </div>
          <nav className="header-nav">
            <a href="#/" className={route === '/' ? 'active' : ''}>Submit</a>
            <a href="#/admin" className={route === '/admin' ? 'active' : ''}>Triage</a>
            <a href="#/reporting" className={route === '/reporting' ? 'active' : ''}>Reporting</a>
          </nav>
          <div className="header-right">
            <ThemeToggle />
            {supabase && <ClearSessionButton supabase={supabase} />}
          </div>
        </div>
      </header>
      <DemoBanner />
      {content}
    </>
  )

  if (missingEnv) {
    if (route === '/admin') return shell(<AdminPage />)
    if (route === '/reporting') return shell(<ReportingPage />)
    return shell(<DemoSubmitPage />)
  }

  if (route === '/admin') return shell(<AdminPage />)
  if (route === '/reporting') return shell(<ReportingPage />)
  return shell(<SubmitPage />)
}
