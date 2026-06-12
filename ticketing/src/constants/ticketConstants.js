export const CATEGORIES = [
  'Data issues',
  'Core functionality',
  'Glitch & error messaging',
  'Feature requests',
  'Reporting & dashboard',
]

export const PRIORITIES = ['High', 'Medium', 'Low']

export const PRIORITY_DESCRIPTIONS = {
  High: 'Blocks work, affects multiple users, payroll/client/compliance/data integrity risk.',
  Medium: 'Affects workflow but has a workaround.',
  Low: 'Minor inconvenience, enhancement, cosmetic issue, or non-urgent request.',
}

export const STATUSES = [
  'Submitted',
  'Under Review',
  'Need More Information',
  'In Progress',
  'Escalated to IT',
  'Pending Leadership Decision',
  'Resolved',
  'Closed',
  'Duplicate',
  'Not in Scope',
]

export const STATUS_DESCRIPTIONS = {
  Submitted: 'Ticket received and awaiting triage.',
  'Under Review': 'Being reviewed by the support team.',
  'Need More Information': 'Waiting on additional details from the submitter.',
  'In Progress': 'Actively being worked on.',
  'Escalated to IT': 'Escalated to CTO or C-level leadership.',
  'Pending Leadership Decision': 'Awaiting a leadership decision.',
  Resolved: 'Issue was fixed.',
  Closed: 'Ticket closed.',
  Duplicate: 'Duplicate of an existing ticket.',
  'Not in Scope': 'Request is outside project scope.',
}

export const DEV_TEAMS = [
  'Build Team',
  'Troubleshooting team',
  'Leadership',
  'Reporting team',
  'Data Team',
]

export const CATEGORY_DEFAULT_TEAM = {
  'Data issues': 'Data Team',
  'Core functionality': 'Build Team',
  'Glitch & error messaging': 'Troubleshooting team',
  'Feature requests': 'Build Team',
  'Reporting & dashboard': 'Reporting team',
}

export const TERMINAL_STATUSES = ['Resolved', 'Closed', 'Duplicate', 'Not in Scope']

export const INITIAL_STATUS = 'Submitted'

export const emptyTicketForm = (category = CATEGORIES[0]) => ({
  name: '',
  email: '',
  phone: '',
  department: '',
  company: '',
  category,
  priority: PRIORITIES[1],
  title: '',
  description: '',
  link: '',
})
