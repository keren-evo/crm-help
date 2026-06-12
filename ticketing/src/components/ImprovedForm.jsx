import React, { useState } from 'react'
import FileDrop from './FileDrop'
import { PRIORITIES, PRIORITY_DESCRIPTIONS } from '../constants/ticketConstants'

export default function ImprovedForm({ submit, form, setForm, file, setFile, setStatus, onOpenLookup }) {
  return (
    <form onSubmit={submit} className="improved-form" aria-label="Submit support ticket">
      <div className="card">
        <h2>You're in the right place — a few details help us get started</h2>
        <div className="field">
          <label className="floating">Category</label>
          <input value={form.category} readOnly aria-readonly="true" />
        </div>
        <div className="field">
          <label className="floating">Title</label>
          <input
            placeholder="Short summary of the issue"
            value={form.title || ''}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div className="field">
          <label className="floating">Description</label>
          <textarea
            aria-required="true"
            placeholder="What I expected / What happened / Steps to reproduce"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="field">
          <label className="floating">Priority</label>
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            aria-describedby="priority-help"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <p id="priority-help" className="muted" style={{ marginTop: 6 }}>
            {PRIORITY_DESCRIPTIONS[form.priority]}
          </p>
        </div>
      </div>

      <div className="card">
        <h3>Context</h3>
        <div className="two-up">
          <div className="field">
            <label className="floating">Company</label>
            <input
              required
              placeholder="Company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="floating">Department</label>
            <input
              required
              placeholder="Department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Contact</h3>
        <div className="two-up">
          <div className="field">
            <label className="floating">Full name</label>
            <input
              required
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="floating">Email</label>
            <input
              required
              aria-required="true"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onBlur={(e) => {
                const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.target.value)
                if (!ok) setStatus('Please enter a valid email')
              }}
            />
          </div>
        </div>
        <div className="field">
          <label className="floating">Phone (optional)</label>
          <input
            placeholder="Phone"
            value={form.phone || ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="card">
        <h3>Attachments</h3>
        <FileDrop file={file} setFile={setFile} />
        <label className="muted">Link to error (optional)</label>
        <input
          placeholder="https://example.com/error"
          value={form.link || ''}
          onChange={(e) => setForm({ ...form, link: e.target.value })}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        <button
          type="submit"
          className="cta-primary"
          disabled={
            !form.email || !form.name || !form.company || !form.department || !form.description
          }
        >
          Submit ticket
        </button>
        <button type="button" className="link-btn" onClick={onOpenLookup}>
          Need to check an existing ticket?
        </button>
      </div>
    </form>
  )
}
