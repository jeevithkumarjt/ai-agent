"use client";

import Chat from "@/components/Chat";
import Login from "@/components/Login";
import { getToken } from "@/lib/api";
import { useState } from "react";

export default function HomePage() {
  const [authed, setAuthed] = useState<boolean>(() => getToken() !== null);

  return (
    <main className="flex h-screen flex-col">
      {authed ? (
        <>
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                AI
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Agent AI Knowledge Platform</p>
                <p className="text-xs text-slate-400">Grounded answers with citations</p>
              </div>
            </div>
            <nav className="flex items-center gap-4 text-sm">
              <a
                href="/admin"
                className="rounded-lg px-3 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Admin
              </a>
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                Sources indexed
              </span>
            </nav>
          </header>
          <Chat />
        </>
      ) : (
        <Login onSuccess={() => setAuthed(true)} />
      )}
    </main>
  );
}
