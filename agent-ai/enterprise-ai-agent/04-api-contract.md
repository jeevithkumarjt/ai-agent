# API Contract

**Status: Locked.** `api/openapi.yaml` is the source of truth for the wire format. This page
documents the shape and the auth model.

## 1. Base

- All routes are namespaced under `/v1`.
- Auth: `Authorization: Bearer <JWT>` on every route except `/health` and `/v1/auth/login`.
  The token carries `tenant_id`, `user_id`, `exp` (see `01-architecture-decisions.md` ADR-005).
- Refresh via `POST /v1/auth/refresh` (short-lived access token + refresh token).

## 2. Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/v1/health` | none | Liveness |
| `POST` | `/v1/auth/login` | none | Exchange email+password for a token pair |
| `POST` | `/v1/auth/refresh` | none (refresh token in body) | Renew token pair |
| `POST` | `/v1/conversations` | Bearer | Create conversation, returns `conversation_id` |
| `GET` | `/v1/conversations/{id}/messages` | Bearer | History, paginated |
| `POST` | `/v1/conversations/{id}/messages` | Bearer | Send message, returns streamed response (SSE) |
| `WS` | `/v1/conversations/{id}/ws` | Bearer (query param) | Streaming conversation over WebSocket |

### Streaming events

The message endpoint streams Server-Sent Events. The WebSocket endpoint emits the same event
types as JSON frames. Both transports carry an identical event set (defined in
`02-agent-and-rag-workflow.md` §1):

| Event | Payload |
|---|---|
| `user_message` | `{ content }` |
| `text_delta` | `{ text }` |
| `tool_call_started` | `{ tool_name, input }` |
| `tool_call_completed` | `{ tool_name, duration_ms, success }` |
| `message_done` | `{ message_id, conversation_id, citations? }` |
| `error` | `{ message }` |

## 3. Pagination

`GET /v1/conversations/{id}/messages?limit=50&offset=0` returns:

```json
{ "items": [ ...Message... ], "total": 12, "limit": 50, "offset": 0 }
```

## 4. Auth model

- `POST /v1/auth/login {email, password}` → `{ access_token, refresh_token, token_type: "bearer", expires_in }`.
- Access token TTL: `JWT_ACCESS_TTL_MINUTES` (default 30). Refresh token TTL:
  `JWT_REFRESH_TTL_DAYS` (default 14).
- The widget holds the token **in memory only** (never `localStorage`) — see ADR-005 / §3.1 of
  `01-architecture-decisions.md`. On `401`, the widget emits an `auth_needed` event so the host
  page can supply a fresh token.
