"use client";

import { useEffect, useRef, useState } from "react";
import { createSession, streamChat, getToken, ChatMessage, ChatResponse, Citation } from "@/lib/api";
import MessageBubble from "./MessageBubble";

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);

    const token = getToken();
    if (!token) return;

    let sid = sessionId;
    if (!sid) {
      try {
        const session = await createSession(text.slice(0, 60), token);
        sid = session.id;
        setSessionId(sid);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to start session");
        return;
      }
    }

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((m) => [...m, userMsg]);

    const assistantId = crypto.randomUUID();
    setMessages((m) => [...m, { id: assistantId, role: "assistant", content: "" }]);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const meta = await streamChat(
        sid,
        text,
        token,
        (delta) => {
          setMessages((m) =>
            m.map((msg) => (msg.id === assistantId ? { ...msg, content: msg.content + delta } : msg)),
          );
        },
        (citations) => {
          setMessages((m) => m.map((msg) => (msg.id === assistantId ? { ...msg, citations } : msg)));
        },
        controller.signal,
      );
      finish(assistantId, meta);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Request failed");
      setMessages((m) => m.filter((msg) => msg.id !== assistantId || msg.content !== ""));
    } finally {
      setLoading(false);
    }
  };

  const finish = (id: string, meta: ChatResponse) => {
    setMessages((m) =>
      m.map((msg) =>
        msg.id === id
          ? {
              ...msg,
              content: meta.answer,
              citations: meta.citations,
              confidence: meta.confidence,
              grounded: meta.grounded,
              refusal: meta.refusal,
            }
          : msg,
      ),
    );
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-slate-400">
              <h2 className="text-2xl font-semibold text-slate-700">Ask about your knowledge base</h2>
              <p className="mt-2">Answers are grounded in your ingested sources with citations.</p>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="h-3 w-3 animate-pulse rounded-full bg-brand-500" />
              Thinking…
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {error && (
        <div className="mx-auto mb-2 max-w-3xl rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="border-t border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Type your question…"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          <button
            onClick={() => void send()}
            disabled={loading || !input.trim()}
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
