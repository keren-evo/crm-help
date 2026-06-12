export function isAdminRole(role) {
  return role === 'admin' || role === 'superadmin'
}

export function canAccessReporting(role) {
  return isAdminRole(role) || role === 'manager'
}

export function canTriage(role) {
  return ['agent', 'manager', 'admin', 'superadmin'].includes(role)
}
