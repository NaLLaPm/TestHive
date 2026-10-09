"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useReport } from "@/lib/queries";
import { Streamdown } from "streamdown";
import { FunnelView } from "@/components/report/funnel-view";
import { FrictionHeatmap } from "@/components/report/friction-heatmap";
import { ImpactRankedIssues } from "@/components/report/impact-ranked-issues";
import { ClusterBreakdown } from "@/components/report/cluster-breakdown";
import { ExportToolbar } from "@/components/report/export-toolbar";
import { Badge } from "@/components/ui/badge";

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const { data: report, isLoading } = useReport(id);
  const [viewMode, setViewMode] = useState<"interactive" | "markdown">("interactive");

  if (isLoading) {
    return (
      <div className="p-12 text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-pixelLilac border-t-transparent animate-spin mx-auto" />
        <p className="text-muted text-xs font-mono">Loading executive report telemetry…</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 rounded-3xl bg-panel border border-border text-center space-y-3 max-w-xl mx-auto my-12 shadow-sm">
        <div className="text-2xl">📋</div>
        <h2 className="text-lg font-bold text-text">Report Not Ready</h2>
        <p className="text-muted text-xs leading-relaxed">
          The evaluation run #{id.slice(0, 8)} is still progressing or has not generated an executive report yet.
        </p>
        <Link
          href={`/runs/${id}`}
          className="inline-block px-4 py-2 rounded-xl bg-purple text-cream font-bold text-xs hover:bg-lavender hover:text-text transition shadow-xs"
        >
          View Live Run Progress →
        </Link>
      </div>
    );
  }

  const overall = report.segments.overall;
  const overallPct = Math.round(overall.successRate * 100);
  const overallMoe =
    overall.marginOfError !== undefined ? Math.round(overall.marginOfError * 100) : null;
  const baselineControl = report.segments.baselineControl;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 print:p-0 print:space-y-6">
      {/* Print Styles for Crisp Executive PDF Export */}
      <style jsx global>{`
        @media print {
          nav, aside, button, .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: #241E33 !important;
          }
          .card, .bg-panel, .bg-panel2 {
            background: white !important;
            color: #241E33 !important;
            border-color: #ddd !important;
            box-shadow: none !important;
          }
          .text-muted {
            color: #555 !important;
          }
          a {
            text-decoration: underline;
          }
        }
      `}</style>

      {/* Header and Export Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-mono text-purple hover:underline no-print font-semibold"
            >
              ← Dashboard
            </Link>
            <span className="text-xs text-muted no-print">•</span>
            <span className="text-xs font-mono text-muted">Run #{id.slice(0, 8)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">
            {report.title}
          </h1>
          <p className="text-xs text-muted">
            Synthesized {new Date(report.generatedAt).toLocaleDateString()} across{" "}
            <strong className="text-text">{overall.n}</strong> simulated personas with verified trace evidence.
          </p>
        </div>

        <div className="no-print">
          <ExportToolbar runId={id} />
        </div>
      </div>

      {/* Top Level Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-panel border border-border shadow-xs">
          <div className="text-[11px] uppercase font-mono text-muted">Overall Success (95% CI)</div>
          <div className="text-2xl font-bold font-mono text-text mt-1">
            {overallPct}%{overallMoe !== null ? ` ± ${overallMoe}%` : ""}
          </div>
          <div className="text-[11px] text-muted mt-1 font-mono">Sample n={overall.n} personas</div>
        </div>

        <div className="p-5 rounded-3xl bg-panel border border-border shadow-xs">
          <div className="text-[11px] uppercase font-mono text-muted">Baseline Control</div>
          <div className="text-2xl font-bold font-mono mt-1 flex items-center gap-2">
            {baselineControl ? (
              <span className={baselineControl.allPassed ? "text-[#1C6938]" : "text-[#A82B24]"}>
                {Math.round(baselineControl.successRate * 100)}%
              </span>
            ) : (
              <span className="text-text">Active</span>
            )}
          </div>
          <div className="text-[11px] text-muted mt-1">
            {baselineControl?.allPassed ? "Verified environmental health" : "Site friction isolated"}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-panel border border-border shadow-xs">
          <div className="text-[11px] uppercase font-mono text-muted">Funnel Conversion</div>
          <div className="text-2xl font-bold font-mono text-purple mt-1">
            {report.funnel && report.funnel.length > 0
              ? `${Math.round((report.funnel[report.funnel.length - 1]?.conversionPct ?? 0) * 100)}%`
              : `${overallPct}%`}
          </div>
          <div className="text-[11px] text-muted mt-1">
            {report.funnel ? `${report.funnel.length} journey stages tracked` : "5 stages modeled"}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-panel border border-border shadow-xs">
          <div className="text-[11px] uppercase font-mono text-muted">Frictions Identified</div>
          <div className="text-2xl font-bold font-mono text-purple mt-1">
            {report.topIssues.length} issues
          </div>
          <div className="text-[11px] text-muted mt-1">
            Ranked by impact & engineering effort
          </div>
        </div>
      </div>

      {/* Executive Summary Narrative */}
      <div className="p-6 rounded-3xl bg-panel border border-border space-y-2 shadow-xs">
        <h3 className="font-bold text-sm text-text flex items-center gap-2">
          <span>Executive Summary</span>
          <Badge kind="accent">AI Synthesized</Badge>
        </h3>
        <p className="text-sm text-text leading-relaxed">
          {report.summary}
        </p>
      </div>

      {/* View Switcher Tabs (no-print) */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3 no-print">
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-border text-xs font-semibold shadow-xs">
          <button
            onClick={() => setViewMode("interactive")}
            className={`px-4 py-1.5 rounded-xl transition ${
              viewMode === "interactive"
                ? "bg-purple text-cream font-bold shadow-xs"
                : "text-muted hover:text-text hover:bg-lavender/20"
            }`}
          >
            📊 Visual Executive Insights
          </button>
          <button
            onClick={() => setViewMode("markdown")}
            className={`px-4 py-1.5 rounded-xl transition ${
              viewMode === "markdown"
                ? "bg-purple text-cream font-bold shadow-xs"
                : "text-muted hover:text-text hover:bg-lavender/20"
            }`}
          >
            📝 Markdown Source
          </button>
        </div>

        <div className="text-xs text-muted font-mono hidden sm:block">
          Export available in .md, .json & .pdf
        </div>
      </div>

      {/* TAB 1: VISUAL EXECUTIVE INSIGHTS */}
      {viewMode === "interactive" ? (
        <div className="space-y-10">
          {/* 1. FUNNEL VIEW */}
          <section className="bg-panel border border-border rounded-3xl p-6 shadow-xs">
            <FunnelView steps={report.funnel} />
          </section>

          {/* 2. FRICTION HEATMAP BY PAGE ELEMENT */}
          <section className="bg-panel border border-border rounded-3xl p-6 shadow-xs">
            <FrictionHeatmap elements={report.frictionHeatmap} />
          </section>

          {/* 3. IMPACT-RANKED FIXES WITH SCREENSHOTS */}
          <section className="bg-panel border border-border rounded-3xl p-6 shadow-xs">
            <ImpactRankedIssues issues={report.topIssues} />
          </section>

          {/* 4. AI-NAMED CLUSTERS BREAKDOWN */}
          <section className="bg-panel border border-border rounded-3xl p-6 shadow-xs">
            <ClusterBreakdown clusters={report.segments.byCluster} />
          </section>

          {/* 5. STRATEGIC RECOMMENDATIONS */}
          {report.recommendations && report.recommendations.length > 0 && (
            <section className="bg-panel border border-border rounded-3xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-sm text-text flex items-center gap-2">
                  <span>Priority Product Recommendations</span>
                  <span className="text-xs font-normal text-muted font-mono">
                    ({report.recommendations.length} action items)
                  </span>
                </h3>
                <p className="text-xs text-muted">
                  Prescribed actions based on user drop-off analysis and cross-cluster variance.
                </p>
              </div>

              <div className="grid gap-3">
                {report.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-panel2 border border-border flex items-start gap-3"
                  >
                    <span className="w-6 h-6 rounded-full bg-purple/20 text-purple flex items-center justify-center font-mono text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-xs text-text leading-relaxed font-medium">
                      {rec}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        /* TAB 2: RAW MARKDOWN DOCUMENT (RENDERED VIA STREAMDOWN) */
        <div className="bg-panel border border-border rounded-3xl p-8 max-w-4xl shadow-sm leading-relaxed text-text">
          <Streamdown
            className="prose prose-stone max-w-none text-text prose-headings:text-text prose-headings:tracking-tight prose-a:text-purple prose-code:bg-panel2 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-xs"
            controls={{
              table: { copy: true },
              code: { copy: true },
            }}
          >
            {report.markdown}
          </Streamdown>
        </div>
      )}
    </div>
  );
}
