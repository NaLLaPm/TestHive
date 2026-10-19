"use client";

import Link from "next/link";
import { useRuns } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";

const STATE_KIND: Record<string, string> = {
  completed: "success",
  failed: "failure",
  cancelled: "neutral",
};

export default function RunsPage() {
  const { data: runs } = useRuns();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Run history</h1>
      <div className="card divide-y divide-border">
        {(runs ?? []).map((r) => (
          <Link key={r.id} href={`/runs/${r.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-panel2/60 transition">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">
                {r.stimulus.type === "url"
                  ? r.stimulus.url
                  : r.stimulus.type === "source_code"
                    ? `[Source Code] ${r.stimulus.projectName || r.stimulus.url}`
                    : r.kind}
              </div>
              <div className="text-xs text-muted truncate">{new Date(r.createdAt).toLocaleString()} · {r.donePersonas}/{r.totalPersonas}</div>
            </div>
            <div className="shrink-0">
              <Badge kind={STATE_KIND[r.state] ?? "neutral"}>{r.state}</Badge>
            </div>
          </Link>
        ))}
        {(runs ?? []).length === 0 && <p className="text-muted text-sm p-4">No runs yet.</p>}
      </div>
    </div>
  );
}
