// Auth helper for login/logout state and token management

export function saveTokens({ access, refresh }) {
  if (access) {
    localStorage.setItem('access', access)
    // Store timestamp for token expiry checking
    localStorage.setItem('access_timestamp', Date.now().toString())
  }
  if (refresh) {
    localStorage.setItem('refresh', refresh)
  }
}

export function clearTokens() {
  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
  localStorage.removeItem('access_timestamp')
}

export function isAuthenticated() {
  const access = localStorage.getItem('access')
  if (!access) return false
  
  // Check if token might be expired (60 minutes = 3600000 ms)
  const timestamp = localStorage.getItem('access_timestamp')
  if (timestamp) {
    const age = Date.now() - parseInt(timestamp, 10)
    // If token is older than 55 minutes, consider it expired (refresh should handle it)
    if (age > 55 * 60 * 1000) {
      // Token might be expired, but let the API handle refresh
      return true // Still return true, API will handle refresh
    }
  }
  
  return true
}

export function getAccessToken() {
  return localStorage.getItem('access')
}

export function getRefreshToken() {
  return localStorage.getItem('refresh')
}
