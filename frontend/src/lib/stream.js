// Streaming transport — WebSocket preferred, SSE POST fallback (04-api-contract.md §2).
// Both emit the same event set: user_message | text_delta | tool_call_started |
// tool_call_completed | message_done | error.
// WebSocket auth: short-lived single-use ticket (instead of long-lived token in URL).
// Flow: fetch ticket → use in WS URL → server consumes ticket after one connection.

import { getAccessToken } from './auth.js'

export async function fetchWsTicket(apiBase) {
  const token = getAccessToken()
  if (!token) return null
  try {
    const res = await fetch(`${apiBase}/v1/auth/ws-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: token }),
    })
    if (!res.ok) throw new Error(`WS ticket failed: HTTP ${res.status}`)
    const data = await res.json()
    return data.ticket || null
  } catch (err) {
    console.warn('ws_ticket_failed', err)
    return null
  }
}

/**
 * Generate WebSocket URL using a one-time ticket instead of a long-lived token.
 * The ticket is consumed server-side after the first WS connection.
 */
export function wsUrl(apiBase, conversationId, ticket) {
  const base = apiBase.replace(/^http/, 'ws')
  // Use ticket instead of bearer token in URL — never expose long-lived credentials in URL
  return `${base}/v1/conversations/${conversationId}/ws?ticket=${encodeURIComponent(ticket ?? '')}`
}

/**
 * Send `text` over WebSocket with ticket-based auth.
 * Calls `onOpen` once the socket is open and the message is sent;
 * calls `onFail` if the connection never establishes.
 * Returns a cancel function.
 */
export async function streamViaWebSocket(apiBase, conversationId, text, onEvent, onOpen, onFail) {
  let settled = false
  let ticket = null

  // Fetch a one-time WS ticket right before opening the socket
  ticket = await fetchWsTicket(apiBase)
  if (!ticket) return onFail?.()

  const socket = new WebSocket(wsUrl(apiBase, conversationId, ticket))

  socket.onopen = () => {
    settled = true
    socket.send(text)
    onOpen?.()
  }
  socket.onmessage = (e) => {
    try {
      onEvent(JSON.parse(e.data))
    } catch {
      /* ignore malformed frames */
    }
  }
  socket.onerror = () => {
    if (!settled) onFail?.()
  }

  return () => {
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close()
    }
  }
}

/**
 * Send `text` via the SSE POST endpoint. Resolves when the stream closes;
 * throws if the request fails. Emits the same event set as the widget:
 * text_delta | tool_call_started | tool_call_completed | message_done | error.
 */
export async function streamViaSse(apiBase, conversationId, text, onEvent) {
  const res = await fetch(`${apiBase}/v1/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken() ?? ''}` },
    body: JSON.stringify({ content: text }),
  })
  if (!res.ok) {
    if (res.status === 429) {
      const wait = res.headers.get('Retry-After')
      const detail = wait
        ? `You're moving a little fast — wait ${wait}s before sending another message.`
        : 'You're sending messages too quickly. Take a breath, then tap send to retry.'
      throw new Error(detail)
    }
    throw new Error(`SSE stream failed: HTTP ${res.status}`)
  }
  if (!res.body) throw new Error('SSE stream: no response body')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let idx
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      const line = frame.split('\n').find((l) => l.startsWith('data:'))
      if (!line) continue
      const raw = line.slice(5).trim()
      if (!raw || raw === '[DONE]') continue
      try {
        onEvent(JSON.parse(raw))
      } catch {
        /* ignore malformed frames */
      }
    }
  }
}