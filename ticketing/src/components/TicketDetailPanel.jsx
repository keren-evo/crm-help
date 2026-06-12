import React, { useEffect, useState } from 'react'
import { DEV_TEAMS, STATUSES } from '../constants/ticketConstants'
import { fetchStaffList, updateTicket } from '../lib/ticketApi'

export default function TicketDetailPanel({ ticket, staff, onUpdated, onClose }) {
  const [form, setForm] = useState(null)
  const [staffList, setStaffList] = useState([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!ticket) return
    setForm({
      status: ticket.status,
      dev_team: ticket.dev_team || '',
      assigned_to: ticket.assigned_to || '',
      internal_notes: ticket.internal_notes || '',
      resolution_notes: ticket.resolution_notes || '',
      priority: ticket.priority,
    })
    fetchStaffList().then(setStaffList).catch(console.error)
  }, [ticket])

  if (!ticket || !form) return null

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const patch = {
        status: form.status,
        dev_team: form.dev_team || null,
        assigned_to: form.assigned_to || null,
        internal_notes: form.internal_notes,
        resolution_notes: form.resolution_notes,
        priority: form.priority,
      }
      await updateTicket(ticket.id, patch, ticket.status)
      setMessage('Saved — submitter notified if status changed.')
      onUpdated?.()
    } catch (err) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card ticket-detail">
      <div className="detail-header">
        <h3>{ticket.title || 'Ticket detail'}</h3>
        <button type="button" className="link-btn" onClick={onClose}>Close</button>
      </div>
      <p className="muted mono">{ticket.id}</p>
      <div className="detail-meta">
        <div><strong>From:</strong> {ticket.name} · {ticket.email}</div>
        <div><strong>Company / Dept:</strong> {ticket.company} / {ticket.department}</div>
        <div><strong>Category:</strong> {ticket.category}</div>
        <div><strong>Submitted:</strong> {new Date(ticket.created_at).toLocaleString()}</div>
      </div>
      <p>{ticket.description}</p>
      {ticket.link && (
        <p>
          <a href={ticket.link} target="_blank" rel="noreferrer">Error link</a>
        </p>
      )}

      <form onSubmit={save} className="form detail-form">
        <label>
          Status
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {['High', 'Medium', 'Low'].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label>
          Dev team
          <select value={form.dev_team} onChange={(e) => setForm({ ...form, dev_team: e.target.value })}>
            <option value="">Unassigned</option>
            {DEV_TEAMS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>
        <label>
          Assigned to
          <select
            value={form.assigned_to}
            onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
          >
            <option value="">Unassigned</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
            ))}
          </select>
        </label>
        <label>
          Internal notes (staff only)
          <textarea
            value={form.internal_notes}
            onChange={(e) => setForm({ ...form, internal_notes: e.target.value })}
          />
        </label>
        <label>
          Resolution notes (visible on lookup when resolved)
          <textarea
            value={form.resolution_notes}
            onChange={(e) => setForm({ ...form, resolution_notes: e.target.value })}
          />
        </label>
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
      {message && <p className="status">{message}</p>}
    </div>
  )
}
