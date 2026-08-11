// REST client for the non-streaming endpoints (api/openapi.yaml).
import { getAccessToken } from './auth.js'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function apiRequest(apiBase, path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const auth = token ?? getAccessToken()
  if (auth) headers.Authorization = `Bearer ${auth}`

  let res
  try {
    res = await fetch(`${apiBase}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('network error', 0)
  }
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const data = await res.json()
      if (data?.detail) detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
    } catch {
      /* keep default */
    }
    throw new ApiError(detail, res.status)
  }
  return res.json()
}

export async function login(apiBase, email, password) {
  return apiRequest(apiBase, '/v1/auth/login', { method: 'POST', body: { email, password } })
}

export async function refresh(apiBase, refreshToken) {
  return apiRequest(apiBase, '/v1/auth/refresh', { method: 'POST', body: { refresh_token: refreshToken } })
}

export async function createConversation(apiBase) {
  const data = await apiRequest(apiBase, '/v1/conversations', { method: 'POST' })
  return data.id
}

export async function fetchHistory(apiBase, conversationId) {
  const data = await apiRequest(apiBase, `/v1/conversations/${conversationId}/messages?limit=50&offset=0`)
  return data.items
}
