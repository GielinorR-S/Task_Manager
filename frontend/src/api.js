import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

const instance = axios.create({
  baseURL: API_BASE,
})

let isRefreshing = false
let refreshSubscribers = []

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token))
  refreshSubscribers = []
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb)
}

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('access')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

instance.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config
    if (err.response && err.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      if (isRefreshing) {
        // wait for refresh to complete then retry
        return new Promise((resolve, reject) => {
          addRefreshSubscriber(token => {
            if (!token) return reject(err)
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(instance(originalRequest))
          })
        })
      }

      isRefreshing = true
      const refresh = localStorage.getItem('refresh')
      if (!refresh) {
        isRefreshing = false
        return Promise.reject(err)
      }

      try {
        const response = await axios.post(`${API_BASE}/token/refresh/`, { refresh })
        const newAccess = response.data.access
        localStorage.setItem('access', newAccess)
        onRefreshed(newAccess)
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return instance(originalRequest)
      } catch (e) {
        // refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        localStorage.removeItem('access_timestamp')
        onRefreshed(null)
        
        // Redirect to login if we're not already there
        if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          window.location.href = '/login'
        }
        
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }
    
    // Handle 401 errors - token expired or invalid
    if (err.response && err.response.status === 401) {
      // Clear tokens and redirect to login
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
      localStorage.removeItem('access_timestamp')
      
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(err)
  }
)

export default instance
