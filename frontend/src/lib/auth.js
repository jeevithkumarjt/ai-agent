// In-memory token holder (ADR-005: never localStorage).
// The widget loses auth on refresh — the host page supplies a fresh token via
// the `token` attribute or by listening for the `auth_needed` event.
const state = {
  accessToken: null,
  refreshToken: null,
  expiresAt: 0, // epoch ms
}

export function setTokens({ access_token, refresh_token, expires_in }) {
  state.accessToken = access_token
  state.refreshToken = refresh_token || null
  state.expiresAt = Date.now() + (expires_in ?? 0) * 1000
}

export function getAccessToken() {
  if (state.accessToken && Date.now() < state.expiresAt) {
    return state.accessToken
  }
  return state.accessToken // allow expiry; API 401 triggers refresh/re-auth
}

export function getRefreshToken() {
  return state.refreshToken
}

export function clearTokens() {
  state.accessToken = null
  state.refreshToken = null
  state.expiresAt = 0
}

export function isAuthenticated() {
  return Boolean(state.accessToken)
}
