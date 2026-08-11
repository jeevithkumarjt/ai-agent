"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Source {
  id: string;
  tenant_id: string;
  type: string;
  display_name: string;
  config: Record<string, unknown>;
  state: string;
  version: number;
  last_crawl_at: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

interface Paginated {
  items: Source[];
  total: number;
  limit: number;
  offset: number;
}

export default function SourcesPanel() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Paginated>("/api/v1/sources");
      setSources(data.items);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const urlOf = (s: Source) => (s.config?.url as string | undefined) ?? (s.config?.sitemap_url as string | undefined) ?? "";

  const statusColor = (state: string) =>
    state === "enabled" ? "bg-green-100 text-green-700" : state === "disabled" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-800">Knowledge Sources</h2>
        <button onClick={() => void refresh()} className="text-sm text-brand-600 hover:text-brand-700">
          Refresh
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {loading && <p className="px-5 py-6 text-sm text-slate-400">Loading…</p>}
        {!loading && error && <p className="px-5 py-6 text-sm text-red-600">{error}</p>}
        {!loading && !error && sources.length === 0 && (
          <p className="px-5 py-6 text-sm text-slate-400">
            No sources yet. Run <code className="text-slate-600">scripts/bootstrap.sh</code> to start.
          </p>
        )}
        {sources.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-5 py-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">{s.display_name}</p>
              <a
                href={urlOf(s)}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-xs text-slate-400 hover:text-brand-600"
              >
                {urlOf(s)}
              </a>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <span className="text-xs text-slate-400">
                v{s.version}
                {s.last_crawl_at ? ` · ${new Date(s.last_crawl_at).toLocaleDateString()}` : ""}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(s.state)}`}>{s.state}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
