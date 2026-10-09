"use client";

import React from "react";
import type { FunnelStep } from "@testhive/contracts";

interface FunnelViewProps {
  steps?: FunnelStep[];
}

const STAGE_ICONS: Record<string, string> = {
  landing: "🌐",
  product: "🛍️",
  cart: "🛒",
  checkout: "💳",
  success: "🎉",
};

export function FunnelView({ steps }: FunnelViewProps) {
  if (!steps || steps.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-panel2 border border-border text-center text-muted text-xs">
        No funnel journey telemetry recorded for this benchmark.
      </div>
    );
  }

  const initialCount = steps[0]?.reachedCount || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-sm text-text flex items-center gap-2">
            <span>User Journey Funnel</span>
            <span className="text-xs font-normal text-muted font-mono">
              (Landing → Product → Cart → Checkout → Success)
            </span>
          </h3>
          <p className="text-xs text-muted">
            Tracking drop-off rates across product conversion stages.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-purple font-semibold">
            Overall Conversion: {Math.round((steps[steps.length - 1]?.conversionPct ?? 0) * 100)}%
          </span>
        </div>
      </div>

      {/* Stepped Visual Funnel Flow */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {steps.map((st, i) => {
          const widthPct = Math.max(12, Math.round((st.reachedCount / initialCount) * 100));
          const isFinal = i === steps.length - 1;
          const dropPct = Math.round(st.dropOffPct * 100);
          const convPct = Math.round(st.conversionPct * 100);

          return (
            <div
              key={st.id}
              className={`p-4 rounded-2xl border transition relative flex flex-col justify-between ${
                isFinal
                  ? "bg-[#81C995]/10 border-[#81C995]/40 text-text"
                  : "bg-panel border-border hover:border-purple/40 shadow-xs"
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono text-muted text-[11px]">Step 0{st.order}</span>
                  <span className="text-base">{STAGE_ICONS[st.id] ?? "📍"}</span>
                </div>

                <div className="font-bold text-sm text-text">{st.name}</div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-text">
                    {st.reachedCount}
                  </span>
                  <span className="text-xs font-mono text-purple font-semibold">
                    {convPct}% conv.
                  </span>
                </div>

                {/* Progress Visual Bar */}
                <div className="w-full h-2 bg-purple/15 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFinal ? "bg-[#81C995]" : "bg-purple"
                    }`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>

              {/* Drop-off Indicator */}
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px]">
                {st.dropOffCount > 0 ? (
                  <>
                    <span className="text-[#A82B24] font-semibold flex items-center gap-1">
                      <span>📉</span> -{st.dropOffCount} dropped
                    </span>
                    <span className="font-mono text-[#A82B24] bg-[#F28B82]/20 px-1.5 py-0.5 rounded border border-[#F28B82]/40 font-semibold">
                      {dropPct}% drop
                    </span>
                  </>
                ) : (
                  <span className="text-[#1C6938] font-semibold text-[11px] flex items-center gap-1">
                    <span>✨</span> {isFinal ? "Target Completed" : "Zero Drop-off"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary table for detailed scrutiny */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-panel shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border text-muted uppercase text-[10px] tracking-wider font-mono">
              <th className="py-2.5 px-4">Stage</th>
              <th className="py-2.5 px-4">Agents Reached</th>
              <th className="py-2.5 px-4">Conversion Rate</th>
              <th className="py-2.5 px-4">Drop-off Count</th>
              <th className="py-2.5 px-4">Stage Drop-off %</th>
              <th className="py-2.5 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {steps.map((st, idx) => (
              <tr key={st.id} className="hover:bg-panel2/50 transition">
                <td className="py-3 px-4 font-semibold text-text flex items-center gap-2">
                  <span>{STAGE_ICONS[st.id] ?? "•"}</span>
                  <span>{st.name}</span>
                </td>
                <td className="py-3 px-4 font-mono text-text font-semibold">
                  {st.reachedCount}
                </td>
                <td className="py-3 px-4 font-mono text-purple font-semibold">
                  {Math.round(st.conversionPct * 100)}%
                </td>
                <td className="py-3 px-4 font-mono text-[#A82B24] font-semibold">
                  {st.dropOffCount > 0 ? `-${st.dropOffCount}` : "0"}
                </td>
                <td className="py-3 px-4 font-mono text-muted">
                  {st.dropOffCount > 0 ? `${Math.round(st.dropOffPct * 100)}%` : "0%"}
                </td>
                <td className="py-3 px-4 text-right font-mono text-[11px]">
                  {idx === steps.length - 1 ? (
                    <span className="text-[#1C6938] font-semibold">Completed</span>
                  ) : st.dropOffPct > 0.2 ? (
                    <span className="text-[#A82B24] font-semibold">High Drop-off</span>
                  ) : (
                    <span className="text-muted">Nominal</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
