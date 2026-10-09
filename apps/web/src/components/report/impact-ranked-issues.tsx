"use client";

import React, { useState } from "react";
import type { Issue } from "@testhive/contracts";
import { Badge } from "@/components/ui/badge";

interface ImpactRankedIssuesProps {
  issues?: Issue[];
}

const EFFORT_COLORS: Record<string, string> = {
  low: "bg-[#81C995]/20 text-[#1C6938] border-[#81C995]/40",
  medium: "bg-[#FDD663]/25 text-[#8D6B00] border-[#FDD663]/40",
  high: "bg-[#BDA6CE]/25 text-[#4A396E] border-[#BDA6CE]/40",
};

export function ImpactRankedIssues({ issues }: ImpactRankedIssuesProps) {
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  if (!issues || issues.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-panel2 border border-border text-center text-muted text-xs">
        No critical UX issues or friction points detected.
      </div>
    );
  }

  // Ensure sorted by impactScore descending
  const sortedIssues = [...issues].sort(
    (a, b) => (b.impactScore ?? 0) - (a.impactScore ?? 0),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-sm text-text flex items-center gap-2">
            <span>Prioritized Fixes Ranked by Impact</span>
            <span className="text-xs font-normal text-muted font-mono">
              (Affected Share × Failure Rate × Effort)
            </span>
          </h3>
          <p className="text-xs text-muted">
            Algorithmically scored to maximize ROI: fixes affecting the highest share of failing agents with lowest relative engineering lift.
          </p>
        </div>
        <div className="text-xs font-mono text-muted bg-white px-3 py-1 rounded-xl border border-border shadow-xs">
          Formula: <span className="text-purple font-semibold">Impact = S_aff × F_rate × Effort</span>
        </div>
      </div>

      <div className="space-y-4">
        {sortedIssues.map((issue, idx) => {
          const effort = issue.effort ?? "medium";
          const effortBadgeClass = EFFORT_COLORS[effort] ?? EFFORT_COLORS.medium;
          const sharePct =
            issue.affectedShare !== undefined
              ? Math.round(issue.affectedShare * 100)
              : null;
          const failPct =
            issue.failureRate !== undefined
              ? Math.round(issue.failureRate * 100)
              : null;
          const screenshot =
            issue.screenshot ||
            issue.evidence.find((e) => Boolean(e.screenshot))?.screenshot ||
            null;

          return (
            <div
              key={issue.issueId}
              className="p-6 rounded-3xl bg-panel border border-border hover:border-purple/40 transition shadow-xs space-y-4"
            >
              {/* Header with Title and Metric Badges */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-panel2 text-muted border border-border">
                      #{idx + 1}
                    </span>
                    <h4 className="text-base font-bold text-text">
                      {issue.title}
                    </h4>
                    <Badge kind={issue.severity}>{issue.severity}</Badge>
                  </div>
                  <div className="text-xs text-muted flex items-center gap-2 flex-wrap">
                    <span>
                      Affects <strong>~{issue.affectedPersonas}</strong> personas
                    </span>
                    <span>•</span>
                    <span>
                      Clusters:{" "}
                      {issue.affectedClusters.length > 0
                        ? issue.affectedClusters.map((c) => `#${c}`).join(", ")
                        : "All Segments"}
                    </span>
                  </div>
                </div>

                {/* Impact & Effort Scoring Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  {issue.impactScore !== undefined && (
                    <div className="px-3 py-1 rounded-xl bg-purple/15 text-purple border border-purple/30 font-mono text-xs font-bold flex items-center gap-1.5">
                      <span>⚡ Impact:</span>
                      <span>{issue.impactScore.toFixed(3)}</span>
                    </div>
                  )}
                  <div
                    className={`px-3 py-1 rounded-xl font-mono text-xs font-semibold border capitalize ${effortBadgeClass}`}
                  >
                    Effort: {effort}
                  </div>
                </div>
              </div>

              {/* Impact Formula Breakdown Banner */}
              <div className="p-3 rounded-2xl bg-panel2/80 border border-border text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="font-mono text-muted flex items-center gap-3 flex-wrap">
                  {sharePct !== null && (
                    <span>
                      Affected Share: <strong className="text-text">{sharePct}%</strong>
                    </span>
                  )}
                  {failPct !== null && (
                    <span>
                      Failure Rate: <strong className="text-[#A82B24]">{failPct}%</strong>
                    </span>
                  )}
                  <span>
                    Effort Weight: <strong className="text-purple">{effort}</strong>
                  </span>
                </div>
                {issue.impactScore !== undefined && (
                  <span className="font-mono text-xs font-bold text-purple">
                    Score: {issue.impactScore.toFixed(3)}
                  </span>
                )}
              </div>

              {/* Actionable Concrete Fix Card */}
              <div className="p-4 rounded-2xl bg-[#81C995]/15 border border-[#81C995]/40 space-y-1">
                <div className="text-xs font-bold text-[#1C6938] flex items-center gap-1.5 uppercase tracking-wider">
                  <span>🛠️ Concrete Fix:</span>
                </div>
                <p className="text-xs text-text leading-relaxed font-medium">
                  {issue.suggestedFix}
                </p>
              </div>

              {/* Screenshot Preview & Evidence Voice */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Screenshot Column */}
                <div className="md:col-span-1 space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-muted tracking-wider block">
                    Visual Evidence:
                  </span>
                  {screenshot ? (
                    <div
                      onClick={() =>
                        setSelectedScreenshot(
                          screenshot.startsWith("/")
                            ? screenshot
                            : `/api/assets/${encodeURIComponent(screenshot)}`,
                        )
                      }
                      className="cursor-pointer group relative rounded-xl overflow-hidden border border-border bg-panel2 h-32 flex items-center justify-center hover:border-purple transition"
                    >
                      <img
                        src={
                          screenshot.startsWith("/")
                            ? screenshot
                            : `/api/assets/${encodeURIComponent(screenshot)}`
                        }
                        alt={`Screenshot for ${issue.title}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                        onError={(e) => {
                          // Fallback to placeholder if asset endpoint is not serving actual disk image
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-purple/20 group-hover:bg-purple/10 flex items-center justify-center text-xs font-semibold text-text gap-1 transition">
                        <span className="px-3 py-1.5 rounded-xl bg-white/95 text-purple shadow-xs font-bold border border-border">🔍 View Screenshot</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 rounded-xl border border-dashed border-border/80 bg-panel2/50 flex flex-col items-center justify-center text-center p-3 text-muted text-xs">
                      <span>📸 No screenshot attached</span>
                      <span className="text-[10px] text-muted/60 mt-1">Trace logged via DOM events</span>
                    </div>
                  )}
                </div>

                {/* Evidence Traces Quotes Column */}
                <div className="md:col-span-2 space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-muted tracking-wider block">
                    Grounded Persona Quotes:
                  </span>
                  <div className="space-y-2">
                    {issue.evidence.slice(0, 2).map((ev, eIdx) => (
                      <div
                        key={eIdx}
                        className="text-xs text-muted italic bg-panel2 p-3 rounded-xl border-l-2 border-purple"
                      >
                        "{ev.quote}"
                        {ev.step !== null && (
                          <span className="not-italic text-[10px] font-mono text-purple font-semibold ml-2">
                            (Step {ev.step})
                          </span>
                        )}
                      </div>
                    ))}
                    {issue.evidence.length === 0 && (
                      <div className="text-xs text-muted italic p-3">
                        No direct voice quotes extracted for this issue.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Screenshot Lightbox Modal */}
      {selectedScreenshot && (
        <div
          onClick={() => setSelectedScreenshot(null)}
          className="fixed inset-0 z-50 bg-purple/20 flex items-center justify-center p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[90vh] bg-panel border border-border rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col"
          >
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-mono text-purple font-semibold">Visual Evidence Capture</span>
              <button
                onClick={() => setSelectedScreenshot(null)}
                className="text-xs font-bold text-muted hover:text-text px-2 py-1 rounded-lg bg-panel2 border border-border"
              >
                ✕ Close
              </button>
            </div>
            <div className="overflow-auto rounded-2xl border border-border">
              <img
                src={selectedScreenshot}
                alt="Enlarged screenshot capture"
                className="max-w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
