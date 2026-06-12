import React, { useEffect, useState } from 'react'
import AdminDashboard from '../components/AdminDashboard'
import TicketDetailPanel from '../components/TicketDetailPanel'
import StaffAuthPanel from '../components/StaffAuthPanel'
import { fetchStaffProfile, supabase, missingEnv } from '../lib/ticketApi'
import { canAccessReporting } from '../lib/roles'
import { getDemoStaff } from '../lib/demoStore'
import { recoverFromAuthError } from '../lib/authRecovery'

export default function AdminPage() {
  const [staff, setStaff] = useState(null)
  const [selected, setSelected] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadStaff = async () => {
    if (missingEnv) {
      setStaff(getDemoStaff())
      return
    }
    try {
      const profile = await fetchStaffProfile()
      setStaff(profile)
    } catch (err) {
      if (await recoverFromAuthError(supabase, err)) return
      console.error(err)
      setStaff(null)
    }
  }

  useEffect(() => {
    loadStaff()
    if (!missingEnv && supabase) {
      const { data: sub } = supabase.auth.onAuthStateChange(() => loadStaff())
      return () => sub.subscription.unsubscribe()
    }
  }, [])

  if (!staff) {
    return (
      <div className="container wide">
        <StaffAuthPanel onAuthed={loadStaff} />
        <p className="muted" style={{ marginTop: 16 }}>
          Staff accounts must exist in the <code>staff_users</code> table with a matching Supabase Auth user.
          Admins see all tickets; managers see their department.
        </p>
        <p><a href="#/">← Back to submit form</a></p>
      </div>
    )
  }

  return (
    <div className="container wide">
      <div className="page-nav">
        <a href="#/">Submit form</a>
        <a href="#/admin">Triage</a>
        {canAccessReporting(staff.role) && (
          <a href="#/reporting">Reporting</a>
        )}
      </div>
      <AdminDashboard
        key={refreshKey}
        staff={staff}
        selectedId={selected?.id}
        onSelect={setSelected}
      />
      {selected && (
        <TicketDetailPanel
          ticket={selected}
          staff={staff}
          onClose={() => setSelected(null)}
          onUpdated={() => {
            setRefreshKey((k) => k + 1)
            setSelected(null)
          }}
        />
      )}
    </div>
  )
}
