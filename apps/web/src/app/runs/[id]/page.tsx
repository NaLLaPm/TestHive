"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useRun, useSegments } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";

const STATE_KIND: Record<string, string> = { completed: "success", failed: "failure", cancelled: "neutral" };

export default function RunOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: run } = useRun(id);
  const { data: segments } = useSegments(id);

  if (!run) return <p className="text-muted">Loading…</p>;

  const isActive = !["completed", "failed", "cancelled"].includes(run.state);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{run.stimulus.type === "url" ? run.stimulus.url : run.kind}</h1>
          <p className="text-muted text-sm mt-1">{run.stimulus.type === "url" ? run.stimulus.goal : ""}</p>
        </div>
        <Badge kind={STATE_KIND[run.state] ?? "neutral"}>{run.state}</Badge>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Link href={`/runs/${id}/live`} className="card px-4 py-2 text-sm hover:border-accent/40">Live graph</Link>
        <Link href={`/runs/${id}/results`} className="card px-4 py-2 text-sm hover:border-accent/40">Results</Link>
        <Link href={`/runs/${id}/spread`} className="card px-4 py-2 text-sm hover:border-accent/40">Spread</Link>
        <Link href={`/runs/${id}/report`} className="card px-4 py-2 text-sm hover:border-accent/40">Report</Link>
      </div>

      {isActive && (
        <div className="card p-4 text-sm text-muted">
          Run in progress ({run.donePersonas}/{run.totalPersonas}). Watch it live on the{" "}
          <Link href={`/runs/${id}/live`} className="text-accent underline">Live graph</Link> page.
        </div>
      )}

      <div className="grid sm:grid-cols-4 gap-4">
        <Stat label="Personas" value={`${run.donePersonas}/${run.totalPersonas}`} />
        <Stat
          label="Success rate (95% CI)"
          value={
            segments
              ? `${Math.round(segments.overall.successRate * 100)}%${
                  segments.overall.marginOfError !== undefined
                    ? ` ± ${Math.round(segments.overall.marginOfError * 100)}%`
                    : ""
                }`
              : "—"
          }
          sub={segments ? `n=${segments.overall.n}` : undefined}
        />
        <Stat
          label="Baseline control"
          value={
            segments?.baselineControl
              ? segments.baselineControl.allPassed
                ? "100% (Healthy)"
                : `${Math.round(segments.baselineControl.successRate * 100)}% (Site Issue)`
              : "Active"
          }
          sub={segments?.baselineControl ? `n=${segments.baselineControl.n} controls` : undefined}
        />
        <Stat
          label="Reproducibility"
          value={
            segments?.repeatVariance
              ? `${Math.round(segments.repeatVariance.consistencyScore * 100)}%`
              : "Deterministic"
          }
          sub={segments?.repeatVariance ? `variance: ${segments.repeatVariance.avgVariance}` : "fixed seed"}
        />
      </div>

    </div>
  );
}
