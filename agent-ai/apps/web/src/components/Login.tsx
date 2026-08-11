"use client";

import { useState } from "react";
import { login } from "@/lib/api";

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState(process.env.NEXT_PUBLIC_DEFAULT_EMAIL || "owner@tryvium.ai");
  const [password, setPassword] = useState(process.env.NEXT_PUBLIC_DEFAULT_PASSWORD || "ChangeMe123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            AI
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Agent AI Knowledge Platform</h1>
            <p className="text-xs text-slate-400">Sign in to continue</p>
          </div>
        </div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        <label className="mb-1 block text-xs font-medium text-slate-500">Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          className="mb-5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        {error && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <button
          onClick={() => void submit()}
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
