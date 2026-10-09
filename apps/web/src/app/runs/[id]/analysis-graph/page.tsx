"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useRun, useAnalysisGraph } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { AnalysisGraphView } from "@/components/analysis-graph-view";

const STATE_KIND: Record<string, string> = {
  completed: "success",
  failed: "failure",
  cancelled: "neutral",
};

export default function RunAnalysisGraphPage() {
  const { id } = useParams<{ id: string }>();
  const { data: run } = useRun(id);
  const { data: analysisGraph, isLoading } = useAnalysisGraph(id);

  if (isLoading) {
    return (
      <div className="p-16 text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-purple border-t-transparent animate-spin mx-auto" />
        <p className="text-muted text-xs font-mono">Synthesizing post-run analysis graph…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header and Nav Links */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/runs/${id}`} className="text-xs font-mono text-purple hover:underline font-semibold">
              ← Run #{id.slice(0, 8)}
            </Link>
            <span className="text-xs text-muted">•</span>
            <span className="text-xs text-muted font-mono">Causal Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            Run Analysis Graph
          </h1>
          <p className="text-muted text-xs sm:text-sm mt-1">
            Visualizes causal relationships between demographic cohorts, discovered UX frictions, and journey drop-off milestones.
          </p>
        </div>

        {run && <Badge kind={STATE_KIND[run.state] ?? "neutral"}>{run.state}</Badge>}
      </div>

      {/* Subpage Navigation Pills */}
      <div className="flex gap-2.5 flex-wrap">
        <Link href={`/runs/${id}`} className="px-4 py-2 rounded-xl bg-white border border-border text-xs font-semibold text-text hover:border-purple transition shadow-2xs">
          Overview
        </Link>
        <Link href={`/runs/${id}/live`} className="px-4 py-2 rounded-xl bg-white border border-border text-xs font-semibold text-text hover:border-purple transition shadow-2xs">
          Live Graph
        </Link>
        <Link href={`/runs/${id}/results`} className="px-4 py-2 rounded-xl bg-white border border-border text-xs font-semibold text-text hover:border-purple transition shadow-2xs">
          Results
        </Link>
        <Link href={`/runs/${id}/analysis-graph`} className="px-4 py-2 rounded-xl bg-purple text-cream text-xs font-bold shadow-xs">
          Analysis Graph
        </Link>
        <Link href={`/runs/${id}/spread`} className="px-4 py-2 rounded-xl bg-white border border-border text-xs font-semibold text-text hover:border-purple transition shadow-2xs">
          Spread
        </Link>
        <Link href={`/runs/${id}/report`} className="px-4 py-2 rounded-xl bg-white border border-border text-xs font-semibold text-text hover:border-purple transition shadow-2xs">
          Executive Report
        </Link>
      </div>

      {/* Metric Stat Strip */}
      {analysisGraph && (
        <div className="grid sm:grid-cols-4 gap-4">
          <Stat
            label="Total Graph Nodes"
            value={String(analysisGraph.metrics.totalNodes)}
            sub={`${analysisGraph.metrics.clustersCount} cohorts · ${analysisGraph.metrics.issuesCount} frictions`}
          />
          <Stat
            label="Causal Connections"
            value={String(analysisGraph.metrics.totalEdges)}
            sub="Friction & drop-off links"
          />
          <Stat
            label="Funnel Stages"
            value={String(analysisGraph.metrics.funnelStagesCount)}
            sub="Step-by-step conversion"
          />
          <Stat
            label="Primary Bottleneck"
            value={analysisGraph.metrics.topBottleneck || "None detected"}
            sub="Highest abandonment driver"
          />
        </div>
      )}

      {/* Interactive Force Graph */}
      {analysisGraph ? (
        <AnalysisGraphView graph={analysisGraph} height={560} />
      ) : (
        <div className="p-12 rounded-3xl bg-panel border border-border text-center space-y-3">
          <div className="text-2xl">🕸️</div>
          <h2 className="text-base font-bold text-text">No Analysis Graph Ready</h2>
          <p className="text-muted text-xs max-w-md mx-auto">
            The analysis graph is automatically generated upon completion of the test run pipeline.
          </p>
        </div>
      )}
    </div>
  );
}
