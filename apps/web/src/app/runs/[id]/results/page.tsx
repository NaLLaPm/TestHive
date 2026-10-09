"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useSegments, useIssues, useRunPersonas } from "@/lib/queries";
import { SegmentBarChart } from "@/components/charts/segment-bar-chart";
import { SeverityBars } from "@/components/charts/severity-bars";
import { TraitHeatmap } from "@/components/charts/trait-heatmap";
import { Badge } from "@/components/ui/badge";

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: segments } = useSegments(id);
  const { data: issues } = useIssues(id);
  const { data: personas } = useRunPersonas(id);
  const [filter, setFilter] = useState<"all" | "success" | "failure" | "partial">("all");

  const filtered = (personas ?? []).filter((p) => filter === "all" || p.outcome === filter);

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Results</h1>

      {segments && (
        <section className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Success rate by cluster (95% CI)</h2>
              <p className="text-xs text-muted mt-0.5">
                Clusters with n &lt; 10 are greyed out to prevent noisy conclusions.
              </p>
            </div>
            {segments.baselineControl && (
              <Badge kind={segments.baselineControl.allPassed ? "success" : "failure"}>
                Baseline: {segments.baselineControl.status === "healthy" ? "All Controls Passed" : "Site Outage Flagged"}
              </Badge>
            )}
          </div>
          <SegmentBarChart
            data={segments.byCluster.map((c) => ({
              label: c.label,
              successRate: c.successRate,
              n: c.n,
              marginOfError: c.marginOfError,
              isLowSample: c.isLowSample,
            }))}
          />
        </section>
      )}

      {segments?.baselineControl && (
        <section className={`card p-5 border-l-4 ${segments.baselineControl.allPassed ? "border-l-[#81C995]" : "border-l-danger"}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Baseline Check: Control Personas</h3>
            <span className="text-xs font-mono text-muted">{segments.baselineControl.n} high-motivation agents</span>
          </div>
          <p className="text-xs text-muted mt-2 leading-relaxed">
            {segments.baselineControl.note}
          </p>
        </section>
      )}

      {segments && (
        <section className="card p-5">
          <h2 className="font-semibold mb-4">Success rate by trait</h2>
          <TraitHeatmap byTrait={segments.byTrait as any} />
        </section>
      )}

      {issues && issues.length > 0 && (
        <section className="card p-5">
          <h2 className="font-semibold mb-4">Top issues (Grounded in Trace Evidence)</h2>
          <SeverityBars data={issues} />
          <div className="space-y-4 mt-5">
            {issues.map((issue) => (
              <div key={issue.issueId} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{issue.title}</div>
                  <Badge kind={issue.severity}>{issue.severity}</Badge>
                </div>
                <div className="text-xs text-muted">
                  ~{issue.affectedPersonas} affected · clusters {issue.affectedClusters.join(", ") || "—"}
                </div>
                <div className="text-sm bg-panel2/60 p-3 rounded-lg border border-border">
                  💡 <strong className="text-accent">Suggested fix:</strong> {issue.suggestedFix}
                </div>
                {issue.evidence && issue.evidence.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Verifiable Trace Quotes & Screenshots:
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {issue.evidence.map((ev, idx) => (
                        <div key={idx} className="bg-panel2/40 p-3 rounded-lg border border-border/80 text-xs space-y-2">
                          <div className="text-muted italic">"{ev.quote}"</div>
                          <div className="flex items-center justify-between text-[11px] text-muted">
                            <span>Persona #{ev.personaId.slice(0, 8)}</span>
                            <span>{ev.step !== null ? `Step ${ev.step}` : "Drop-off"}</span>
                          </div>
                          {ev.screenshot && (
                            <img
                              src={`/api/assets/${ev.screenshot}`}
                              alt="Grounded drop-off screenshot"
                              className="rounded border border-border w-full max-h-36 object-cover"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}


      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Personas</h2>
          <div className="flex gap-1">
            {(["all", "success", "partial", "failure"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border ${filter === f ? "border-accent text-accent" : "border-border text-muted"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.slice(0, 60).map((p) => (
            <Link
              key={p.personaId}
              href={`/runs/${id}/personas/${p.personaId}`}
              className="card p-3 hover:border-accent/40 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">{p.mode}</span>
                <Badge kind={p.outcome ?? "neutral"}>{p.outcome ?? p.status}</Badge>
              </div>
              {p.result && (
                <div className="text-xs text-muted mt-2 line-clamp-2">
                  {p.result.frictionNotes[0] ?? "No friction notes."}
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
