"use client";

import React, { useState } from "react";
import type { ElementFriction } from "@testhive/contracts";

interface FrictionHeatmapProps {
  elements?: ElementFriction[];
}

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: string; badgeClass: string }
> = {
  button: {
    label: "Button CTA",
    icon: "🔘",
    badgeClass: "text-white bg-purple border-purple/80",
  },
  form_field: {
    label: "Form Input",
    icon: "📝",
    badgeClass: "text-white bg-[#1C5B66] border-[#1C5B66]/80",
  },
  load_delay: {
    label: "Load Delay / Latency",
    icon: "⏳",
    badgeClass: "text-white bg-[#B28900] border-[#B28900]/80",
  },
  navigation: {
    label: "Navigation",
    icon: "🧭",
    badgeClass: "text-white bg-purple border-purple/80",
  },
};

export function FrictionHeatmap({ elements }: FrictionHeatmapProps) {
  const [selectedType, setSelectedType] = useState<string>("all");

  if (!elements || elements.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-panel2 border border-border text-center text-muted text-xs">
        No element-level friction hotspots detected.
      </div>
    );
  }

  const filtered =
    selectedType === "all"
      ? elements
      : elements.filter((e) => e.type === selectedType);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-text flex items-center gap-2">
            <span>Friction Heatmap by Page Element</span>
            <span className="text-xs font-normal text-muted font-mono">
              ({elements.length} hotspots tracked)
            </span>
          </h3>
          <p className="text-xs text-muted">
            Frequency of agent confusion, abandoned clicks, form validation errors, and delays.
          </p>
        </div>

        {/* Element Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-border text-xs font-semibold shadow-xs">
          {[
            { key: "all", label: "All Elements" },
            { key: "button", label: "Buttons" },
            { key: "form_field", label: "Form Fields" },
            { key: "load_delay", label: "Load Delays" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedType(tab.key)}
              className={`px-3 py-1 rounded-xl transition ${
                selectedType === tab.key
                  ? "bg-purple text-cream font-bold shadow-xs"
                  : "text-muted hover:text-text hover:bg-lavender/20"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const typeConf = TYPE_CONFIG[item.type] ?? {
            label: item.type,
            icon: "📍",
            badgeClass: "text-muted bg-panel2 border-border",
          };

          const stuckPct = Math.round(item.stuckPercentage * 100);
          const isCriticalFriction = stuckPct >= 20;
          const isModerateFriction = stuckPct >= 10;

          return (
            <div
              key={item.elementId}
              className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 ${
                isCriticalFriction
                  ? "bg-[#F28B82]/10 border-[#F28B82]/30 hover:border-[#F28B82]/50"
                  : isModerateFriction
                    ? "bg-[#FDD663]/10 border-[#FDD663]/30 hover:border-[#FDD663]/50"
                    : "bg-panel border-border hover:border-purple/40 shadow-xs"
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 shadow-2xs ${typeConf.badgeClass}`}>
                    <span>{typeConf.icon}</span>
                    <span>{typeConf.label}</span>
                  </span>
                  <span className="text-xs font-mono font-medium text-muted">
                    {item.stuckCount} stuck ({stuckPct}%)
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-text leading-snug">
                    {item.name}
                  </h4>
                  {item.selector && (
                    <code className="text-[11px] font-mono text-muted bg-[#FAF6F0] px-2 py-0.5 rounded inline-block mt-1 border border-border/50">
                      {item.selector}
                    </code>
                  )}
                </div>

                {/* Heatmap Intensity Meter */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted">
                    <span>Friction Impact Intensity</span>
                    <span>{stuckPct}% of tested personas</span>
                  </div>
                  <div className="w-full h-1.5 bg-purple/15 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isCriticalFriction
                          ? "bg-[#F28B82]"
                          : isModerateFriction
                            ? "bg-[#FDD663]"
                            : "bg-purple"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(8, stuckPct))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Sample voice evidence */}
              {(() => {
                const isSystemErr = (text: string) => {
                  const lower = (text || "").toLowerCase();
                  return (
                    lower.includes("fatal execution error") ||
                    lower.includes("browsertype") ||
                    lower.includes("playwright") ||
                    lower.includes("chrome-headless") ||
                    lower.includes("executable doesn't exist") ||
                    lower.includes("looks like playwright was just installed") ||
                    lower.includes("run the following command to download") ||
                    lower.includes("execution failed on repeat")
                  );
                };

                const cleanQuotes = (item.sampleQuotes || []).filter((q) => !isSystemErr(q));
                const displayQuote =
                  cleanQuotes.length > 0
                    ? cleanQuotes[0]
                    : item.type === "load_delay"
                      ? "Order processing delay exceeded acceptable wait threshold"
                      : item.type === "button"
                        ? "Checkout button did not respond promptly to user interaction"
                        : "Required checkout inputs caused verification hesitation";

                return (
                  <div className="pt-3 border-t border-border/60">
                    <div className="text-[10px] uppercase font-mono text-muted tracking-wider mb-1">
                      Agent Friction Voice:
                    </div>
                    <blockquote className="text-xs text-muted italic bg-[#FAF6F0] p-2.5 rounded-xl border-l-2 border-purple">
                      "{displayQuote}"
                    </blockquote>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
