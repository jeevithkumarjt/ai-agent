// Streaming transport — WebSocket preferred, SSE POST fallback (04-api-contract.md §2).
// Both emit the same event set: user_message | text_delta | tool_call_started |
// tool_call_completed | message_done | error.
import { getAccessToken } from './auth.js'

export function wsUrl(apiBase, conversationId) {
  const base = apiBase.replace(/^http/, 'ws')
  return `${base}/v1/conversations/${conversationId}/ws?token=${encodeURIComponent(getAccessToken() ?? '')}`
}

/**
 * Send `text` over WebSocket. Calls `onOpen` once the socket is open and the
 * message is sent; calls `onFail` if the connection never establishes.
 * Returns a cancel function.
 */
export function streamViaWebSocket(apiBase, conversationId, text, onEvent, onOpen, onFail) {
  let settled = false
  const socket = new WebSocket(wsUrl(apiBase, conversationId))

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
 * throws if the request fails.
 */
export async function streamViaSse(apiBase, conversationId, text, onEvent) {
  const res = await fetch(`${apiBase}/v1/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken() ?? ''}` },
    body: JSON.stringify({ content: text }),
  })
  if (!res.ok || !res.body) {
    throw new Error(`SSE stream failed: HTTP ${res.status}`)
  }

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
