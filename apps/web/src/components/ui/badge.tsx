import React from "react";

export interface BadgeProps {
  children?: React.ReactNode;
  kind?: "neutral" | "success" | "failure" | "warning" | "critical" | "high" | "medium" | "low" | string;
  className?: string;
}

export function Badge({ children, kind = "neutral", className = "" }: BadgeProps) {
  if (!children) return null;

  let colorClasses = "bg-surface-cream text-text-muted border-border-warm";
  const k = (kind || "").toLowerCase();

  if (k === "success" || k === "passed" || k === "completed") {
    colorClasses = "bg-status-success-bg text-status-success border-status-success-border";
  } else if (k === "failure" || k === "failed" || k === "critical" || k === "high") {
    colorClasses = "bg-status-error-bg text-status-error border-status-error-border";
  } else if (k === "warning" || k === "partial" || k === "medium" || k === "running") {
    colorClasses = "bg-status-warning-bg text-honey-dark border-status-warning-border";
  } else if (k === "low" || k === "info") {
    colorClasses = "bg-lavender-tint text-primary border-border-accent-tint";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border font-mono tracking-tight capitalize ${colorClasses} ${className}`}
    >
      {children}
    </span>
  );
}
