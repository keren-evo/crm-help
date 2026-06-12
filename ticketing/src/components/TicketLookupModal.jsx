import React, { useState } from 'react'
import { lookupTicket, publicScreenshotUrl } from '../lib/ticketApi'

export default function TicketLookupModal({ onClose }) {
  const [email, setEmail] = useState('')
  const [ticketId, setTicketId] = useState('')
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const lookup = async (e) => {
    e.preventDefault()
    setErr('')
    setResult(null)
    setLoading(true)
    try {
      const { data, error } = await lookupTicket(ticketId.trim(), email.trim())
      if (error) throw error
      setResult(data)
    } catch (ex) {
      setErr(ex.message || String(ex))
    } finally {
      setLoading(false)
    }
  }

  const screenshotUrl = result?.screenshot_path ? publicScreenshotUrl(result.screenshot_path) : null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h3>Track your ticket</h3>
        <p className="muted">Enter the email and ticket ID from your confirmation message.</p>
        <form onSubmit={lookup} className="form">
          <input
            placeholder="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Ticket ID"
            required
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="cta-primary" disabled={loading}>
              {loading ? 'Looking up…' : 'Lookup'}
            </button>
            <button type="button" className="link-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </form>
        {err && <div className="alert alert-error">{err}</div>}
        {result && (
          <div className="lookup-result">
            <div><strong>Status:</strong> {result.status}</div>
            <div><strong>Title:</strong> {result.title || '—'}</div>
            <div><strong>Category:</strong> {result.category}</div>
            <div><strong>Priority:</strong> {result.priority}</div>
            <div><strong>Submitted:</strong> {new Date(result.created_at).toLocaleString()}</div>
            {result.resolution_notes && (
              <div><strong>Resolution:</strong> {result.resolution_notes}</div>
            )}
            {screenshotUrl && (
              <div>
                <a target="_blank" rel="noreferrer" href={screenshotUrl}>
                  View screenshot
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
