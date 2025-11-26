// Small auth helper for login/logout state
export function saveTokens({ access, refresh }) {
  if (access) localStorage.setItem('access', access)
  if (refresh) localStorage.setItem('refresh', refresh)
}

export function clearTokens() {
  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
}

export function isAuthenticated() {
  return !!localStorage.getItem('access')
}
