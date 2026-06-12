import { bucket, edgeUrl, missingEnv, publicScreenshotUrl, supabase } from './supabaseClient'
import { CATEGORY_DEFAULT_TEAM, INITIAL_STATUS } from '../constants/ticketConstants'
import {
  insertDemoTicket,
  isDemoStaff,
  listDemoTickets,
  lookupDemoTicket,
  updateDemoTicket,
  demoReportingStats,
  runDemoEscalationCheck,
  getDemoStaff,
} from './demoStore'

export async function submitTicket(form, file) {
  if (missingEnv) {
    const ticket = insertDemoTicket(form)
    return { data: ticket, demo: true }
  }

  let screenshot_path = null
  if (file) {
    const fname = `${Date.now()}_${file.name}`
    const { data, error: upErr } = await supabase.storage.from(bucket).upload(fname, file)
    if (upErr) throw upErr
    screenshot_path = data.path
  }

  const insertBody = {
    ...form,
    screenshot_path,
    status: INITIAL_STATUS,
    dev_team: CATEGORY_DEFAULT_TEAM[form.category] || null,
  }

  const { data, error } = await supabase.from('tickets').insert([insertBody]).select().single()
  if (error) throw error
  return { data, demo: false }
}

export async function sendConfirmationEmail({ email, name, ticketId }) {
  if (missingEnv) return { status: 'demo-skipped' }
  const res = await fetch(edgeUrl('send-confirmation'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, ticketId }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function lookupTicket(ticketId, email) {
  if (missingEnv) {
    const data = lookupDemoTicket(ticketId, email)
    return { data, error: data ? null : { message: 'No ticket found' } }
  }

  const { data, error } = await supabase.rpc('lookup_ticket', {
    ticket_id: ticketId,
    ticket_email: email,
  })
  const row = Array.isArray(data) ? data[0] : data
  if (error) return { data: null, error }
  if (!row) return { data: null, error: { message: 'No ticket found' } }
  return { data: row, error: null }
}

export async function fetchStaffProfile() {
  if (missingEnv) {
    const staff = getDemoStaff()
    return staff
  }
  const { data: session, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  if (!session?.session) return null
  const { data, error } = await supabase
    .from('staff_users')
    .select('*')
    .eq('auth_id', session.session.user.id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function fetchTickets(staff, filters = {}) {
  if (missingEnv) {
    return listDemoTickets({ ...filters, role: staff?.role, department: staff?.department })
  }

  let q = supabase.from('tickets').select('*').order('created_at', { ascending: false })
  if (filters.status) q = q.eq('status', filters.status)
  if (filters.category) q = q.eq('category', filters.category)
  if (filters.priority) q = q.eq('priority', filters.priority)
  if (filters.dev_team) q = q.eq('dev_team', filters.dev_team)

  const { data, error } = await q
  if (error) throw error

  if (staff?.role === 'manager' && staff.department) {
    return data.filter((t) => t.department === staff.department)
  }
  return data
}

export async function fetchStaffList() {
  if (missingEnv) return [{ id: 'demo-agent', name: 'Demo Agent', email: 'agent@evo.local', role: 'agent' }]
  const { data, error } = await supabase.from('staff_users').select('id,name,email,role,department').order('name')
  if (error) throw error
  return data
}

export async function updateTicket(id, patch, previousStatus) {
  if (missingEnv) {
    const updated = updateDemoTicket(id, patch)
    if (patch.status && patch.status !== previousStatus) {
      console.info('[demo] status email:', patch.status, '→', updated.email)
    }
    return updated
  }

  const { data, error } = await supabase.from('tickets').update(patch).eq('id', id).select().single()
  if (error) throw error

  if (patch.status && patch.status !== previousStatus) {
    await sendStatusUpdateEmail({
      email: data.email,
      name: data.name,
      ticketId: data.id,
      status: data.status,
      resolutionNotes: data.resolution_notes,
    })
  }

  return data
}

export async function sendStatusUpdateEmail(payload) {
  if (missingEnv) return { status: 'demo-skipped' }
  const res = await fetch(edgeUrl('send-status-update'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) console.warn('Status email failed:', await res.text())
  return res.ok ? res.json() : null
}

export async function fetchReportingStats() {
  if (missingEnv) return demoReportingStats()

  const { data, error } = await supabase.from('tickets').select('*')
  if (error) throw error

  const stats = demoReportingStats()
  stats.total = 0
  stats.open = 0
  stats.slaBreaches = 0
  stats.avgResolutionHours = null
  Object.keys(stats.byCategory).forEach((k) => { stats.byCategory[k] = 0 })
  Object.keys(stats.byStatus).forEach((k) => { stats.byStatus[k] = 0 })
  Object.keys(stats.byPriority).forEach((k) => { stats.byPriority[k] = 0 })

  let resolvedCount = 0
  let totalResolutionHours = 0

  data.forEach((t) => {
    stats.total += 1
    stats.byCategory[t.category] = (stats.byCategory[t.category] || 0) + 1
    stats.byStatus[t.status] = (stats.byStatus[t.status] || 0) + 1
    stats.byPriority[t.priority] = (stats.byPriority[t.priority] || 0) + 1
    if (!['Resolved', 'Closed', 'Duplicate', 'Not in Scope'].includes(t.status)) stats.open += 1
    if (t.priority === 'High' && !t.escalation_alert_sent) {
      const hours = (Date.now() - new Date(t.last_movement_at).getTime()) / 3600000
      if (hours >= 48 && !['Resolved', 'Closed', 'Duplicate', 'Not in Scope'].includes(t.status)) {
        stats.slaBreaches += 1
      }
    }
    if (t.resolved_at) {
      resolvedCount += 1
      totalResolutionHours += (new Date(t.resolved_at) - new Date(t.created_at)) / 3600000
    }
  })

  stats.avgResolutionHours = resolvedCount
    ? Math.round(totalResolutionHours / resolvedCount)
    : null

  return stats
}

export async function triggerEscalationCheck() {
  if (missingEnv) return { alerted: runDemoEscalationCheck() }
  const res = await fetch(edgeUrl('check-escalation'), { method: 'POST' })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export { publicScreenshotUrl, missingEnv, supabase } from './supabaseClient'
export { isDemoStaff } from './demoStore'
