import { useCallback, useEffect, useRef, useState } from 'react'
import { setTokens, isAuthenticated, getAccessToken, clearTokens, getRefreshToken } from '../lib/auth.js'
import { login, refresh, createConversation, fetchHistory, ApiError } from '../lib/api.js'
import { streamViaWebSocket, streamViaSse } from '../lib/stream.js'
import './styles.css'

const WELCOME = 'Hi — I can answer questions from your organization\'s knowledge base.'

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export default function ChatWidget({ apiBase, tenantId, initialToken, onAuthNeeded }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState(initialToken ? 'ready' : 'login')
  const [busy, setBusy] = useState(false)
  const conversationIdRef = useRef(null)
  const streamCancelRef = useRef(null)

  const scrollRef = useRef(null)
  const lastSentRef = useRef('')

  const pushMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, msg])
  }, [])

  const appendText = useCallback((text) => {
    setMessages((prev) => {
      const next = [...prev]
      const last = next[next.length - 1]
      if (last && last.role === 'assistant') {
        next[next.length - 1] = { ...last, content: last.content + text }
      } else {
        next.push({ role: 'assistant', content: text, streaming: true })
      }
      return next
    })
  }, [])

  useEffect(() => {
    if (initialToken) setTokens({ access_token: initialToken, refresh_token: null, expires_in: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const handleLogin = async (email, password) => {
    try {
      const tokens = await login(apiBase, email, password)
      setTokens(tokens)
      setStatus('ready')
    } catch (err) {
      return err instanceof ApiError ? err.message : 'login failed'
    }
    return null
  }

  const tryReauth = useCallback(async () => {
    const rt = getRefreshToken()
    if (rt) {
      try {
        const tokens = await refresh(apiBase, rt)
        setTokens(tokens)
        return true
      } catch {
        clearTokens()
      }
    }
    onAuthNeeded?.()
    setStatus('login')
    return false
  }, [apiBase, onAuthNeeded])

  const ensureConversation = useCallback(async () => {
    if (conversationIdRef.current) return conversationIdRef.current
    const id = await createConversation(apiBase)
    conversationIdRef.current = id
    return id
  }, [apiBase])

  const send = async (text) => {
    const content = text.trim()
    if (!content || busy) return
    lastSentRef.current = content
    setInput('')
    pushMessage({ role: 'user', content })
    setBusy(true)
    setStatus('streaming')

    const handleEvent = (event) => {
      switch (event.type) {
        case 'text_delta':
          appendText(event.text ?? '')
          break
        case 'tool_call_started':
          appendText(`\n[🔎 ${event.tool_name}]`)
          break
        case 'tool_call_completed':
          break
        case 'message_done':
          setMessages((prev) => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last && last.role === 'assistant') {
              next[next.length - 1] = {
                ...last,
                streaming: false,
                citations: event.citations ?? [],
                messageId: event.message_id,
              }
            }
            return next
          })
          setStatus('ready')
          break
        case 'error':
          setMessages((prev) => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last && last.role === 'assistant' && last.streaming) {
              next[next.length - 1] = { ...last, content: `${last.content}\n\n⚠ ${event.message}`, streaming: false }
            }
            return next
          })
          setStatus('ready')
          break
        default:
          break
      }
    }

    const onAuthError = (err) => {
      if (err instanceof ApiError && err.status === 401) {
        return true
      }
      return false
    }

    try {
      const convId = await ensureConversation()

      // 1) WebSocket first — the message is sent on socket open. The promise only
      // resolves once the stream ends (message_done/error) or the socket fails.
      // Fall back to SSE only when the socket never opened (message not sent).
      let wsOpened = false
      const outcome = await new Promise((resolve) => {
        let settled = false
        const finish = (value) => {
          if (!settled) {
            settled = true
            resolve(value)
          }
        }
        const cancelWs = streamViaWebSocket(
          apiBase,
          convId,
          content,
          (ev) => {
            handleEvent(ev)
            if (ev.type === 'message_done' || ev.type === 'error') finish('done')
          },
          () => {
            wsOpened = true
          },
          () => finish(wsOpened ? 'ws_error' : 'ws_failed'),
        )
        setTimeout(() => {
          if (!settled) {
            cancelWs()
            finish(wsOpened ? 'ws_error' : 'ws_failed')
          }
        }, 3000)
        streamCancelRef.current = cancelWs
      })

      // 2) SSE POST fallback — same event set (04-api-contract.md §2).
      if (outcome === 'ws_failed') {
        await streamViaSse(apiBase, convId, content, handleEvent)
      }
    } catch (err) {
      if (onAuthError(err)) {
        const ok = await tryReauth()
        if (ok) return send(content)
        return
      }
      pushMessage({ role: 'assistant', content: `⚠ ${err.message}`, error: true })
      setStatus('ready')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => () => streamCancelRef.current?.(), [])

  if (status === 'login') {
    return <LoginForm onLogin={handleLogin} onAuthNeeded={onAuthNeeded} apiBase={apiBase} />
  }

  return (
    <div className="chat-root">
      <header className="chat-header">
        <span className="chat-title">AI Assistant</span>
        <span className={`chat-dot ${status}`} title={status} />
      </header>
      <div className="chat-scroll" ref={scrollRef}>
        {messages.length === 0 && <div className="chat-welcome">{WELCOME}</div>}
        {messages.map((m, i) => (
          <MessageBubble key={i} msg={m} />
        ))}
        {busy && messages[messages.length - 1]?.role === 'user' && (
          <div className="chat-typing">…</div>
        )}
      </div>
      <footer className="chat-footer">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="Ask about your knowledge base…"
          disabled={busy}
        />
        <button className="chat-send" onClick={() => send(input)} disabled={busy || !input.trim()}>
          Send
        </button>
      </footer>
    </div>
  )
}

function MessageBubble({ msg }) {
  const className = `msg msg-${msg.role}${msg.error ? ' msg-error' : ''}`
  const time = msg.created_at ? formatTime(msg.created_at) : formatTime(Date.now())
  return (
    <div className={className}>
      <div className="msg-text">{msg.content || '…'}</div>
      {msg.citations?.length > 0 && (
        <div className="msg-citations">
          Sources: {[...new Set(msg.citations)].map((c) => (
            <span key={c} className="citation">{c}</span>
          ))}
        </div>
      )}
      <div className="msg-meta">{time}</div>
    </div>
  )
}

function LoginForm({ onLogin, onAuthNeeded, apiBase }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const err = await onLogin(email, password)
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <div className="login-root">
      <div className="login-title">Sign in</div>
      <form onSubmit={submit} className="login-form">
        <input
          className="login-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
          autoComplete="username"
          required
        />
        <input
          className="login-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          autoComplete="current-password"
          required
        />
        {error && <div className="login-error">{error}</div>}
        <button className="login-submit" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <div className="login-hint">
        Prefer host-supplied auth? The widget emits <code>auth_needed</code> when it has no token.
      </div>
    </div>
  )
}
