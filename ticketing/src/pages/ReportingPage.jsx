import React, { useEffect, useState } from 'react'
import ReportingDashboard from '../components/ReportingDashboard'
import StaffAuthPanel from '../components/StaffAuthPanel'
import { fetchStaffProfile, supabase, missingEnv } from '../lib/ticketApi'
import { canAccessReporting } from '../lib/roles'
import { getDemoStaff } from '../lib/demoStore'

export default function ReportingPage() {
  const [staff, setStaff] = useState(null)

  const loadStaff = async () => {
    if (missingEnv) {
      setStaff(getDemoStaff())
      return
    }
    setStaff(await fetchStaffProfile())
  }

  useEffect(() => {
    loadStaff()
    if (!missingEnv && supabase) {
      const { data: sub } = supabase.auth.onAuthStateChange(() => loadStaff())
      return () => sub.subscription.unsubscribe()
    }
  }, [])

  if (!staff) {
    return <StaffAuthPanel onAuthed={loadStaff} fullPage={false} />
  }

  if (!canAccessReporting(staff.role)) {
    return (
      <div className="container wide">
        <p>Reporting is available to managers and admins.</p>
        <a href="#/admin">Go to triage</a>
      </div>
    )
  }

  return (
    <div className="container wide">
      <div className="page-nav">
        <a href="#/">Submit form</a>
        <a href="#/admin">Triage</a>
        <a href="#/reporting">Reporting</a>
      </div>
      <ReportingDashboard staff={staff} />
    </div>
  )
}
