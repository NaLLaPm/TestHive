"use client";

import { useState } from "react";
import Link from "next/link";
import { usePools, useCreatePool } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";

const STATUS_KIND: Record<string, string> = {
  ready: "success",
  failed: "failure",
};

export default function LibraryPage() {
  const { data: pools } = usePools();
  const createPool = useCreatePool();
  const [slug, setSlug] = useState("default-v1");
  const [size, setSize] = useState(1000);
  const [seed, setSeed] = useState(42);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createPool.mutateAsync({ slug, size, seed, isDefault: slug === "default-v1" });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Persona Library</h1>
          <p className="text-muted text-sm mt-1">Built once, reused by every run and every test kind.</p>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="bg-accent text-cream font-bold px-4 py-2 rounded-lg">
          {open ? "Cancel" : "Build new pool"}
        </button>
      </div>

      {open && (
        <form onSubmit={onSubmit} className="card p-5 max-w-lg space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Slug</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full mt-1 bg-panel2 border border-border rounded-lg px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">Size</label>
              <input type="number" value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full mt-1 bg-panel2 border border-border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">Seed</label>
              <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} className="w-full mt-1 bg-panel2 border border-border rounded-lg px-3 py-2" />
            </div>
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <button type="submit" disabled={createPool.isPending} className="bg-accent text-cream font-bold px-4 py-2 rounded-lg disabled:opacity-50">
            {createPool.isPending ? "Starting…" : "Start build"}
          </button>
        </form>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {(pools ?? []).map((p) => (
          <Link key={p.id} href={`/library/${p.id}`} className="card p-5 hover:border-accent/40 transition block">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{p.slug}</div>
              <Badge kind={STATUS_KIND[p.status] ?? "neutral"}>{p.status}</Badge>
            </div>
            <div className="text-sm text-muted mt-2">
              {p.size} personas · seed {p.seed} {p.isDefault && "· default"}
            </div>
            {p.diversityReport && (
              <div className="text-xs text-muted mt-1">{p.diversityReport.clusterCount} clusters</div>
            )}
          </Link>
        ))}
        {(pools ?? []).length === 0 && <p className="text-muted text-sm">No pools yet. Build one above.</p>}
      </div>
    </div>
  );
}
