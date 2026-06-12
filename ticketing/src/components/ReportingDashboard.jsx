import React, { useEffect, useState } from 'react'
import { fetchReportingStats, triggerEscalationCheck } from '../lib/ticketApi'

function BarChart({ data, color = 'var(--evo-primary)' }) {
  const max = Math.max(...Object.values(data), 1)
  return (
    <div className="bar-chart">
      {Object.entries(data).map(([label, value]) => (
        <div key={label} className="bar-row">
          <span className="bar-label">{label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(value / max) * 100}%`, background: color }} />
          </div>
          <span className="bar-value">{value}</span>
        </div>
      ))}
    </div>
  )
}

export default function ReportingDashboard({ staff }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [escalationMsg, setEscalationMsg] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      setStats(await fetchReportingStats())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const runEscalation = async () => {
    try {
      const result = await triggerEscalationCheck()
      setEscalationMsg(`Escalation check complete — ${result.alerted ?? 0} alert(s) sent.`)
      load()
    } catch (e) {
      setEscalationMsg(`Escalation check failed: ${e.message}`)
    }
  }

  if (loading || !stats) return <p>Loading reporting data…</p>

  return (
    <div className="reporting-dashboard">
      <div className="admin-header">
        <div>
          <h2>Leadership reporting</h2>
          <p className="muted">
            Volume, SLA breaches, and resolution metrics
            {staff?.role === 'manager' ? ` · ${staff.department}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="link-btn" onClick={runEscalation}>
            Run 48h escalation check
          </button>
          <button type="button" className="cta-primary" onClick={load}>
            Refresh
          </button>
        </div>
      </div>
      {escalationMsg && <p className="status">{escalationMsg}</p>}

      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total tickets</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value">{stats.open}</div>
          <div className="stat-label">Open</div>
        </div>
        <div className="stat-card card alert-stat">
          <div className="stat-value">{stats.slaBreaches}</div>
          <div className="stat-label">High-priority stalled 48h+</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value">
            {stats.avgResolutionHours != null ? `${stats.avgResolutionHours}h` : '—'}
          </div>
          <div className="stat-label">Avg resolution time</div>
        </div>
      </div>

      <div className="report-grid">
        <div className="card">
          <h3>By category</h3>
          <BarChart data={stats.byCategory} color="#8900E1" />
        </div>
        <div className="card">
          <h3>By status</h3>
          <BarChart data={stats.byStatus} color="#330662" />
        </div>
        <div className="card">
          <h3>By priority</h3>
          <BarChart data={stats.byPriority} color="#118a8a" />
        </div>
      </div>
    </div>
  )
}
