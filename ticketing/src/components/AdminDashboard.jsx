import React, { useEffect, useState } from 'react'
import {
  CATEGORIES,
  DEV_TEAMS,
  PRIORITIES,
  STATUSES,
  STATUS_DESCRIPTIONS,
} from '../constants/ticketConstants'
import { fetchStaffList, fetchTickets, updateTicket } from '../lib/ticketApi'

export default function AdminDashboard({ staff, onSelect, selectedId }) {
  const [tickets, setTickets] = useState([])
  const [staffList, setStaffList] = useState([])
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', dev_team: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [rows, agents] = await Promise.all([
        fetchTickets(staff, filters),
        fetchStaffList(),
      ])
      setTickets(rows)
      setStaffList(agents)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [staff, filters.status, filters.category, filters.priority, filters.dev_team])

  const quickStatus = async (ticket, status) => {
    try {
      await updateTicket(ticket.id, { status }, ticket.status)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div>
          <h2>Triage dashboard</h2>
          <p className="muted">
            Signed in as {staff.name || staff.email} ({staff.role})
            {staff.role === 'manager' && staff.department ? ` · ${staff.department}` : ''}
          </p>
        </div>
        <button type="button" className="cta-primary" onClick={load}>
          Refresh
        </button>
      </div>

      <div className="filter-bar card">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={filters.dev_team}
          onChange={(e) => setFilters({ ...filters, dev_team: e.target.value })}
        >
          <option value="">All dev teams</option>
          {DEV_TEAMS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <p>Loading tickets…</p>
      ) : tickets.length === 0 ? (
        <p className="muted">No tickets match your filters.</p>
      ) : (
        <div className="ticket-table-wrap card">
          <table className="ticket-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Category</th>
                <th>Dev team</th>
                <th>Department</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr
                  key={t.id}
                  className={selectedId === t.id ? 'selected' : ''}
                  onClick={() => onSelect(t)}
                >
                  <td className="mono">{String(t.id).slice(0, 8)}…</td>
                  <td>{t.title || t.description?.slice(0, 40) || '—'}</td>
                  <td><span className={`badge status-${t.status.replace(/\s+/g, '-')}`}>{t.status}</span></td>
                  <td><span className={`badge priority-${t.priority}`}>{t.priority}</span></td>
                  <td>{t.category}</td>
                  <td>{t.dev_team || '—'}</td>
                  <td>{t.department}</td>
                  <td>{new Date(t.updated_at || t.created_at).toLocaleDateString()}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => quickStatus(t, 'In Progress')}
                    >
                      Start
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
        {STATUS_DESCRIPTIONS['Escalated to IT']} · Select a row to edit assignment and notes.
      </p>
    </div>
  )
}
