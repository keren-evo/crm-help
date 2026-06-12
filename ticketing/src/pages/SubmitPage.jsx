import React, { useState } from 'react'
import ImprovedForm from '../components/ImprovedForm'
import TicketLookupModal from '../components/TicketLookupModal'
import EvoLogo from '../components/EvoLogo'
import ThemeToggle from '../components/ThemeToggle'
import ClearSessionButton from '../components/ClearSessionButton'
import MoreInfo from '../components/MoreInfo'
import { CATEGORIES, emptyTicketForm } from '../constants/ticketConstants'
import { submitTicket, sendConfirmationEmail } from '../lib/ticketApi'

function iconFor(category) {
  if (category.toLowerCase().includes('data')) return '📊'
  if (category.toLowerCase().includes('core')) return '⚙️'
  if (category.toLowerCase().includes('glitch') || category.toLowerCase().includes('error')) return '🐞'
  if (category.toLowerCase().includes('feature')) return '✨'
  if (category.toLowerCase().includes('report')) return '📈'
  return '❓'
}

export default function SubmitPage() {
  const [form, setForm] = useState(emptyTicketForm())
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')
  const [showLookup, setShowLookup] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setStatus('Submitting...')
    try {
      const { data } = await submitTicket(form, file)
      setStatus('Submitted — sending confirmation...')
      try {
        await sendConfirmationEmail({ email: data.email, name: data.name, ticketId: data.id })
        setStatus(`Submitted — confirmation sent. Ticket ID: ${data.id}`)
      } catch {
        setStatus(`Submitted — Ticket ID: ${data.id} (confirmation email pending)`)
      }
      setForm(emptyTicketForm(form.category))
      setFile(null)
    } catch (err) {
      console.error(err)
      setStatus(`Error: ${err.message}`)
    }
  }

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-left">
            <div style={{ height: 12 }} />
            <h1 style={{ fontSize: 44, marginTop: 8 }}>HOW CAN WE HELP YOU TODAY?</h1>
            <p className="lead">
              Choose a category below so we can acknowledge your issue and help you quickly.
            </p>
            <div className="categories prominent" role="list" aria-label="Support categories">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="listitem"
                  className={`cat-btn ${form.category === c ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, category: c })}
                >
                  <span style={{ marginRight: 8 }}>{iconFor(c)}</span>
                  <span>{c}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <ImprovedForm
          submit={submit}
          form={form}
          setForm={setForm}
          file={file}
          setFile={setFile}
          setStatus={setStatus}
          onOpenLookup={() => setShowLookup(true)}
        />
        <div className="status">{status}</div>
        {showLookup && <TicketLookupModal onClose={() => setShowLookup(false)} />}

        <hr />
        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <MoreInfo />
        </div>
        <footer style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <EvoLogo />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <a className="link-btn" href="#/admin">Staff login</a>
            <button type="button" className="link-btn" onClick={() => setShowLookup(true)}>
              Track ticket
            </button>
          </div>
        </footer>
      </div>
    </>
  )
}

export function DemoSubmitPage() {
  const [form, setForm] = useState({
    ...emptyTicketForm(),
    name: 'Demo User',
    email: 'demo@evo.local',
    department: 'Support',
    company: 'Evo',
  })
  const [status, setStatus] = useState('Demo mode — tickets saved locally')
  const [showLookup, setShowLookup] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await submitTicket(form, null)
      setStatus(`Saved locally — Ticket ID: ${data.id}`)
      setForm(emptyTicketForm(form.category))
    } catch (err) {
      setStatus(`Error: ${err.message}`)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Demo mode — Supabase not configured</h1>
      <p className="muted">
        Submit tickets locally, sign in at <a href="#/admin">Staff login</a>, and view{' '}
        <a href="#/reporting">Reporting</a>.
      </p>
      <ImprovedForm
        submit={submit}
        form={form}
        setForm={setForm}
        file={null}
        setFile={() => { }}
        setStatus={setStatus}
        onOpenLookup={() => setShowLookup(true)}
      />
      <div className="status">{status}</div>
      {showLookup && <TicketLookupModal onClose={() => setShowLookup(false)} />}
    </div>
  )
}
