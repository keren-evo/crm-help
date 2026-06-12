import {
  CATEGORIES,
  DEV_TEAMS,
  INITIAL_STATUS,
  PRIORITIES,
  STATUSES,
} from '../constants/ticketConstants'
import { SEED_TICKETS } from '../data/seedTickets'

const KEY = 'demo_tickets'
const STAFF_KEY = 'demo_staff_session'
const SEED_VERSION = 'seed-v1'
const DEMO_SUPERADMIN = {
  email: 'crmhelp@evohcg.com',
  password: 'crmhelp@evohcg.com',
  name: 'CRM Help',
  role: 'superadmin',
  department: 'IT',
  company: 'Evo',
}

export function isDemoStaff() {
  return !!localStorage.getItem(STAFF_KEY)
}

export function demoStaffLogin(email, password = '') {
  const normalized = email.trim().toLowerCase()
  if (
    normalized === DEMO_SUPERADMIN.email
    && password === DEMO_SUPERADMIN.password
  ) {
    localStorage.setItem(STAFF_KEY, JSON.stringify({
      email: DEMO_SUPERADMIN.email,
      name: DEMO_SUPERADMIN.name,
      role: DEMO_SUPERADMIN.role,
      department: DEMO_SUPERADMIN.department,
      company: DEMO_SUPERADMIN.company,
    }))
    return true
  }

  if (!password && normalized.includes('manager')) {
    localStorage.setItem(STAFF_KEY, JSON.stringify({
      email: normalized,
      name: normalized.split('@')[0],
      role: 'manager',
      department: 'Operations',
      company: 'Evo',
    }))
    return true
  }

  if (!password) {
    localStorage.setItem(STAFF_KEY, JSON.stringify({
      email: normalized,
      name: normalized.split('@')[0],
      role: 'admin',
      department: 'IT',
      company: 'Evo',
    }))
    return true
  }

  return false
}

export function demoStaffLogout() {
  localStorage.removeItem(STAFF_KEY)
}

export function getDemoStaff() {
  const raw = localStorage.getItem(STAFF_KEY)
  return raw ? JSON.parse(raw) : null
}

/** Load sample tickets for demo/testing (1–2 per category). */
export function ensureDemoSeedData() {
  if (localStorage.getItem('demo_seed_version') === SEED_VERSION) return false
  localStorage.setItem(KEY, JSON.stringify(SEED_TICKETS))
  localStorage.setItem('demo_seed_version', SEED_VERSION)
  return true
}

export function resetDemoSeedData() {
  localStorage.setItem(KEY, JSON.stringify(SEED_TICKETS))
  localStorage.setItem('demo_seed_version', SEED_VERSION)
}

export function listDemoTickets(filters = {}) {
  let rows = JSON.parse(localStorage.getItem(KEY) || '[]')
  if (filters.status) rows = rows.filter((t) => t.status === filters.status)
  if (filters.category) rows = rows.filter((t) => t.category === filters.category)
  if (filters.priority) rows = rows.filter((t) => t.priority === filters.priority)
  if (filters.dev_team) rows = rows.filter((t) => t.dev_team === filters.dev_team)
  if (filters.department && filters.role === 'manager') {
    rows = rows.filter((t) => t.department === filters.department)
  }
  return rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export function insertDemoTicket(form, screenshot_path = null) {
  const ticket = {
    ...form,
    id: `demo-${Date.now().toString(36)}`,
    screenshot_path,
    status: INITIAL_STATUS,
    dev_team: null,
    assigned_to: null,
    internal_notes: '',
    resolution_notes: '',
    resolved_at: null,
    last_movement_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    escalation_alert_sent: false,
  }
  const existing = JSON.parse(localStorage.getItem(KEY) || '[]')
  existing.push(ticket)
  localStorage.setItem(KEY, JSON.stringify(existing))
  return ticket
}

export function lookupDemoTicket(id, email) {
  const rows = JSON.parse(localStorage.getItem(KEY) || '[]')
  return rows.find(
    (t) => t.id === id && t.email.toLowerCase() === email.toLowerCase(),
  ) || null
}

export function updateDemoTicket(id, patch) {
  const rows = JSON.parse(localStorage.getItem(KEY) || '[]')
  const idx = rows.findIndex((t) => t.id === id)
  if (idx < 0) throw new Error('Ticket not found')
  const prev = rows[idx]
  const movementFields = ['status', 'assigned_to', 'dev_team', 'internal_notes', 'priority']
  const moved = movementFields.some((f) => patch[f] !== undefined && patch[f] !== prev[f])
  rows[idx] = {
    ...prev,
    ...patch,
    updated_at: new Date().toISOString(),
    last_movement_at: moved ? new Date().toISOString() : prev.last_movement_at,
    resolved_at: ['Resolved', 'Closed'].includes(patch.status)
      ? new Date().toISOString()
      : prev.resolved_at,
  }
  localStorage.setItem(KEY, JSON.stringify(rows))
  return rows[idx]
}

export function demoReportingStats() {
  const rows = listDemoTickets({})
  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0]))
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]))
  const byPriority = Object.fromEntries(PRIORITIES.map((p) => [p, 0]))
  let slaBreaches = 0
  let resolvedCount = 0
  let totalResolutionHours = 0

  rows.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + 1
    byStatus[t.status] = (byStatus[t.status] || 0) + 1
    byPriority[t.priority] = (byPriority[t.priority] || 0) + 1
    if (t.priority === 'High' && !t.escalation_alert_sent) {
      const hours = (Date.now() - new Date(t.last_movement_at).getTime()) / 3600000
      if (hours >= 48 && !['Resolved', 'Closed', 'Duplicate', 'Not in Scope'].includes(t.status)) {
        slaBreaches += 1
      }
    }
    if (t.resolved_at) {
      resolvedCount += 1
      totalResolutionHours +=
        (new Date(t.resolved_at) - new Date(t.created_at)) / 3600000
    }
  })

  return {
    total: rows.length,
    open: rows.filter((t) => !['Resolved', 'Closed', 'Duplicate', 'Not in Scope'].includes(t.status)).length,
    byCategory,
    byStatus,
    byPriority,
    slaBreaches,
    avgResolutionHours: resolvedCount ? Math.round(totalResolutionHours / resolvedCount) : null,
    devTeams: DEV_TEAMS,
  }
}

export function runDemoEscalationCheck() {
  const rows = JSON.parse(localStorage.getItem(KEY) || '[]')
  let count = 0
  rows.forEach((t, i) => {
    if (t.escalation_alert_sent) return
    if (t.priority !== 'High') return
    if (['Resolved', 'Closed', 'Duplicate', 'Not in Scope'].includes(t.status)) return
    const hours = (Date.now() - new Date(t.last_movement_at).getTime()) / 3600000
    if (hours >= 48) {
      rows[i] = { ...t, escalation_alert_sent: true }
      count += 1
    }
  })
  localStorage.setItem(KEY, JSON.stringify(rows))
  return count
}
