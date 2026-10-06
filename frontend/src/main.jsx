// Web Component entry (ADR-003). Builds <ai-agent-widget> with React inside a
// Shadow DOM so host-page CSS cannot leak in. Auth tokens live in memory only;
// when auth is missing/expired the widget emits a composed `auth_needed` event.
import { createRoot } from 'react-dom/client'
import ChatWidget from './components/ChatWidget.jsx'

const ATTRIBUTES = ['api-base', 'token']

class AiAgentWidget extends HTMLElement {
  static get observedAttributes() {
    return ATTRIBUTES
  }

  constructor() {
    super()
    this._root = createRoot(this.attachShadow({ mode: 'open' }))
    this._token = this.getAttribute('token') || ''
    this._apiBase = this.getAttribute('api-base') || 'http://localhost:8000'
    this._tenantId = this.getAttribute('tenant-id') || 'default'
  }

  attributeChangedCallback(name, _old, value) {
    if (name === 'api-base' && value) this._apiBase = value
    if (name === 'token' && value) this._token = value
    this._render()
  }

  async _fetchGuestToken() {
    if (this._token) return this._token
    try {
      const res = await fetch(`${this._apiBase}/v1/auth/guest`)
      if (!res.ok) throw new Error('guest session failed')
      const data = await res.json()
      this._token = data.access_token
      return this._token
    } catch (err) {
      console.warn('guest_token_fetch_failed', err)
      return null
    }
  }

  async _initGuestToken() {
    const token = await this._fetchGuestToken()
    if (token) this._token = token
  }

  connectedCallback() {
    this._initGuestToken().then(() => this._render())
  }

  // Emitted through the shadow boundary so host pages can react and supply tokens.
  _notifyAuthNeeded() {
    this.dispatchEvent(new CustomEvent('auth_needed', { bubbles: true, composed: true, detail: { apiBase: this._apiBase } }))
  }

  _render() {
    this._root.render(
      <ChatWidget
        apiBase={this._apiBase}
        tenantId={this._tenantId}
        initialToken={this._token}
        onAuthNeeded={() => this._notifyAuthNeeded()}
      />,
    )
  }
}

if (!customElements.get('ai-agent-widget')) {
  customElements.define('ai-agent-widget', AiAgentWidget)
}

export default AiAgentWidget