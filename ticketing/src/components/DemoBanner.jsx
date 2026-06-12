import React from 'react'
import { missingEnv } from '../lib/supabaseClient'
import { SEED_TICKET_LOOKUP_HINTS } from '../data/seedTickets'
import { resetDemoSeedData } from '../lib/demoStore'

export default function DemoBanner() {
  if (!missingEnv) return null

  return (
    <div className="demo-banner" role="status">
      <strong>Demo mode</strong> — sample data loaded. Staff login:{' '}
      <code>crmhelp@evohcg.com</code> / <code>crmhelp@evohcg.com</code>
      {' · '}
      Try ticket lookup:{' '}
      <code>{SEED_TICKET_LOOKUP_HINTS[0].email}</code> +{' '}
      <code>{SEED_TICKET_LOOKUP_HINTS[0].id}</code>
      <button
        type="button"
        className="link-btn"
        style={{ marginLeft: 8 }}
        onClick={() => {
          resetDemoSeedData()
          window.location.reload()
        }}
      >
        Reset sample data
      </button>
    </div>
  )
}
