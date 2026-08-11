import SourcesPanel from "@/components/admin/SourcesPanel";
import Link from "next/link";

export const metadata = { title: "Admin · Agent AI" };

export default function AdminPage() {
  return (
    <main className="min-h-screen">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <Link href="/" className="text-sm font-semibold text-slate-800">
          ← Back to chat
        </Link>
        <h1 className="text-sm font-semibold text-slate-800">Knowledge Admin</h1>
      </header>
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <SourcesPanel />
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard label="Sources" value="—" hint="active sources" />
          <StatCard label="Pages" value="—" hint="indexed pages" />
          <StatCard label="Last eval" value="—" hint="golden dataset gate" />
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-800">{value}</p>
      <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
    </div>
  );
}
