export interface Citation {
  chunk_id: string;
  url: string;
  heading?: string | null;
  snippet: string;
  score?: number | null;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatResponse {
  answer: string;
  grounded: boolean;
  confidence: number;
  citations: Citation[];
  model: Record<string, string>;
  usage: Usage;
  refusal: boolean;
  message_id?: string | null;
  session_id?: string | null;
  degraded: boolean;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface SessionInfo {
  id: string;
  title: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  confidence?: number | null;
  grounded?: boolean | null;
  refusal?: boolean;
  processing_ms?: number | null;
}

export interface ApiError {
  detail: string;
  code?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOKEN_KEY = "agentai.access_token";

export function getToken(): string | null {
  return typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) : null;
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  const bearer = token ?? getToken();
  if (bearer) headers["Authorization"] = `Bearer ${bearer}`;
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as ApiError;
      detail = body.detail || detail;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<TokenPair> {
  const pair = await apiFetch<TokenPair>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(pair.access_token);
  return pair;
}

export async function createSession(title?: string, token?: string): Promise<SessionInfo> {
  return apiFetch<SessionInfo>(
    "/api/v1/chat/sessions",
    { method: "POST", body: JSON.stringify({ title: title ?? "New conversation" }) },
    token,
  );
}

/** Streams an SSE chat response from POST /api/v1/chat/stream. */
export async function streamChat(
  sessionId: string,
  question: string,
  token: string | undefined,
  onDelta: (text: string) => void,
  onCitations: (citations: Citation[]) => void,
  signal?: AbortSignal,
): Promise<ChatResponse> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api/v1/chat/stream`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, question }),
    signal,
  });

  if (!res.ok || !res.body) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let meta: ChatResponse | null = null;

  const parseEvent = (raw: string) => {
    const eventLine = raw.split("\n").find((l) => l.startsWith("event:"));
    const dataLine = raw.split("\n").find((l) => l.startsWith("data:"));
    if (!dataLine) return;
    const eventName = eventLine ? eventLine.slice("event:".length).trim() : "message";
    const payload = dataLine.slice("data:".length).trim();
    if (!payload) return;
    const evt = JSON.parse(payload) as Record<string, unknown>;
    switch (eventName) {
      case "delta":
        if (typeof evt.text === "string") onDelta(evt.text);
        break;
      case "citations":
        if (Array.isArray(evt.citations)) onCitations(evt.citations as Citation[]);
        break;
      case "done":
        meta = {
          answer: typeof evt.answer === "string" ? evt.answer : "",
          grounded: Boolean(evt.grounded),
          confidence: typeof evt.confidence === "number" ? evt.confidence : 0,
          citations: Array.isArray(evt.citations) ? (evt.citations as Citation[]) : [],
          model: (evt.model as Record<string, string>) ?? {},
          usage: (evt.usage as Usage) ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          refusal: Boolean(evt.refusal),
          degraded: Boolean(evt.degraded),
        };
        break;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      if (raw.trim()) parseEvent(raw);
    }
  }
  if (buffer.trim()) parseEvent(buffer);

  if (!meta) {
    throw new Error("Stream ended before response metadata was received.");
  }
  return meta;
}
