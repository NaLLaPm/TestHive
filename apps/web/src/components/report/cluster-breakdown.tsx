"use client";

import React from "react";
import type { ClusterSegment } from "@testhive/contracts";

interface ClusterBreakdownProps {
  clusters?: ClusterSegment[];
}

export function ClusterBreakdown({ clusters }: ClusterBreakdownProps) {
  if (!clusters || clusters.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-panel2 border border-border text-center text-muted text-xs">
        No demographic clusters detected.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-sm text-text flex items-center gap-2">
          <span>AI-Named Persona Clusters</span>
          <span className="text-xs font-normal text-muted font-mono">
            ({clusters.length} segments analyzed)
          </span>
        </h3>
        <p className="text-xs text-muted">
          Each cluster represents an LLM-synthesized demographic profile with natural language descriptions and empirical success rates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clusters.map((c) => {
          const successPct = Math.round(c.successRate * 100);
          const moePct =
            c.marginOfError !== undefined ? Math.round(c.marginOfError * 100) : null;
          const isHighSuccess = successPct >= 70;
          const isFailing = successPct <= 40;

          return (
            <div
              key={c.clusterId}
              className={`p-5 rounded-3xl border transition flex flex-col justify-between space-y-4 ${
                c.isLowSample
                  ? "bg-panel2/40 border-border/50 opacity-75"
                  : isFailing
                    ? "bg-[#F28B82]/10 border-[#F28B82]/30 hover:border-[#F28B82]/50"
                    : isHighSuccess
                      ? "bg-[#81C995]/10 border-[#81C995]/30 hover:border-[#81C995]/50"
                      : "bg-panel border-border hover:border-purple/40 shadow-xs"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-muted">
                    Cluster #{c.clusterId}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-muted">n={c.n}</span>
                    {c.isLowSample && (
                      <span className="text-[#8D6B00] bg-[#FDD663]/20 px-1.5 py-0.2 rounded font-semibold">
                        low sample
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="font-bold text-sm text-text leading-snug">
                  {c.label}
                </h4>

                <p className="text-xs text-muted leading-relaxed line-clamp-3">
                  {c.description || "Synthesized persona cluster based on shared traits, device profile, and behavioral tendencies."}
                </p>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[10px] uppercase font-mono text-muted">
                    Success Rate (95% CI)
                  </div>
                  <div className="font-mono text-base font-bold text-text flex items-baseline gap-1.5">
                    <span
                      className={
                        isHighSuccess
                          ? "text-[#1C6938]"
                          : isFailing
                            ? "text-[#A82B24]"
                            : "text-text"
                      }
                    >
                      {successPct}%
                    </span>
                    {moePct !== null && (
                      <span className="text-xs text-muted font-normal">
                        ±{moePct}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-16 h-2 bg-purple/15 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isHighSuccess
                        ? "bg-[#81C995]"
                        : isFailing
                          ? "bg-[#F28B82]"
                          : "bg-purple"
                    }`}
                    style={{ width: `${successPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
