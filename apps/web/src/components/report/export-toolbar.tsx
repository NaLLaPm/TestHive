"use client";

import React, { useState } from "react";

interface ExportToolbarProps {
  runId: string;
}

export function ExportToolbar({ runId }: ExportToolbarProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Share Link Button */}
      <button
        type="button"
        onClick={handleShare}
        className="px-3.5 py-2 rounded-2xl bg-white border border-border text-text text-xs font-semibold hover:border-purple/50 hover:bg-lavender/10 transition flex items-center gap-1.5 shadow-xs"
      >
        <span>{copied ? "✓" : "🔗"}</span>
        <span>{copied ? "Link Copied!" : "Share Link"}</span>
      </button>

      {/* PDF Export Button */}
      <button
        type="button"
        onClick={handlePrint}
        className="px-3.5 py-2 rounded-2xl bg-white border border-border text-text text-xs font-semibold hover:border-cyan/70 hover:bg-cyan/15 transition flex items-center gap-1.5 shadow-xs"
      >
        <span>📄</span>
        <span>Export PDF</span>
      </button>

      {/* CI JSON Export Button */}
      <a
        href={`/api/runs/${runId}/report.json`}
        download={`report-${runId}.json`}
        className="px-3.5 py-2 rounded-2xl bg-white border border-border text-text text-xs font-semibold hover:border-purple/50 hover:bg-lavender/10 transition flex items-center gap-1.5 shadow-xs"
      >
        <span>⚙️</span>
        <span>JSON (CI)</span>
      </a>

      {/* Markdown Export Button */}
      <a
        href={`/api/runs/${runId}/report.md`}
        download={`report-${runId}.md`}
        className="px-4 py-2 rounded-2xl bg-purple text-cream font-bold text-xs hover:bg-lavender hover:text-text transition flex items-center gap-1.5 shadow-sm"
      >
        <span>⬇</span>
        <span>Download .md</span>
      </a>
    </div>
  );
}
