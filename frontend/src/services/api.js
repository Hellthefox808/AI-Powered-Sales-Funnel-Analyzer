const API_BASE = '/api'

let currentToken = null

export function setAuthToken (token) {
  currentToken = token
  if (token) {
    localStorage.setItem('funnel_auth_token', token)
  } else {
    localStorage.removeItem('funnel_auth_token')
  }
}

export function getAuthToken () {
  if (!currentToken) {
    currentToken = localStorage.getItem('funnel_auth_token')
  }
  return currentToken
}

async function request (endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  const token = getAuthToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}: Failed request to ${endpoint}`)
  }

  return data
}

export const api = {
  async login (email, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    if (data.token) {
      setAuthToken(data.token)
    }
    return data
  },

  async getMe () {
    return request('/auth/me')
  },

  async getFunnel () {
    return request('/pipeline/funnel')
  },

  async getDeals (filters = {}) {
    const params = new URLSearchParams()
    if (filters.stage) params.append('stage', filters.stage)
    if (filters.status) params.append('status', filters.status)
    if (filters.ownerId) params.append('ownerId', filters.ownerId)
    const qs = params.toString() ? `?${params.toString()}` : ''
    return request(`/deals${qs}`)
  },

  async getDealById (id) {
    return request(`/deals/${id}`)
  },

  async updateDealStage (id, { stage, daysInStage = 0, status = 'OPEN', lossReason = null }) {
    return request(`/deals/${id}/stage`, {
      method: 'POST',
      body: JSON.stringify({ stage, daysInStage, status, lossReason })
    })
  },

  async addInteraction (dealId, payload) {
    return request(`/deals/${dealId}/interactions`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  },

  async simulateWhatIf (payload) {
    return request('/predictions/what-if', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  },

  async getBottlenecks () {
    return request('/bottlenecks')
  },

  async updateBenchmark (stage, payload) {
    return request(`/bottlenecks/benchmarks/${stage}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
  },

  async getActiveModel () {
    return request('/models/active')
  },

  async retrainModel (options = {}) {
    return request('/models/retrain', {
      method: 'POST',
      body: JSON.stringify(options)
    })
  },

  async getRepLeaderboard () {
    return request('/analytics/reps')
  },

  async getRevenueForecast () {
    return request('/analytics/forecast')
  }
}
