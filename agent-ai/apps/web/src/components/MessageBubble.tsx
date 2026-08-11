"use client";

import { Citation, ChatMessage } from "@/lib/api";
import { AlertTriangle, ExternalLink, CheckCircle2 } from "lucide-react";

function Citations({ citations }: { citations: Citation[] }) {
  const unique = Array.from(new Map(citations.map((c) => [c.url, c])).values());
  return (
    <div className="mt-3 border-t border-slate-200 pt-2">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Sources</p>
      <ul className="space-y-1.5">
        {unique.map((c) => (
          <li key={c.url}>
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex max-w-full items-start gap-1.5 text-sm text-brand-600 hover:text-brand-700"
            >
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" />
              <span className="min-w-0">
                <span className="block truncate">{c.heading || c.url}</span>
                {c.snippet && <span className="block truncate text-xs text-slate-400">{c.snippet}</span>}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2.5 text-sm text-white">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
        {message.refusal ? (
          <div className="flex items-start gap-2 text-sm text-amber-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">I couldn&apos;t find a reliable answer.</p>
              <p className="mt-1 text-slate-600">
                The confidence threshold was not met, so I&apos;m refusing to speculate.
              </p>
            </div>
          </div>
        ) : message.content ? (
          <>
            <div className="prose-answer text-sm leading-relaxed text-slate-800">{message.content}</div>
            {message.citations && message.citations.length > 0 && <Citations citations={message.citations} />}
            {message.confidence != null && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                Confidence {Math.round(message.confidence * 100)}%
                {message.grounded == null ? null : message.grounded ? " · grounded" : " · ungrounded"}
              </div>
            )}
          </>
        ) : (
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        )}
      </div>
    </div>
  );
}
