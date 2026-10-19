"use client";

import { useState } from "react";
import Link from "next/link";
import {
  usePools,
  useRuns,
  useRun,
  useSegments,
  useIssues,
  useRunPersonas,
  useSpread,
  useReport,
} from "@/lib/queries";
import { WordOfMouthView } from "@/components/spread/word-of-mouth-view";
import {
  Rocket,
  Zap,
  Globe,
  Upload,
  BarChart3,
  Users,
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Share2,
  FileText,
  Activity,
  Layers,
  Sparkles,
  Play,
  RotateCcw,
  Sliders,
  ExternalLink,
} from "lucide-react";

type StitchViewMode = "dashboard" | "launchpad" | "analytics" | "spread" | "report";

export default function StitchPreviewPage() {
  const [activeView, setActiveView] = useState<StitchViewMode>("dashboard");
  const [targetMode, setTargetMode] = useState<"url" | "source_code">("url");
  const [url, setUrl] = useState("http://localhost:8989/before");
  const [goal, setGoal] = useState("Buy a pair of wireless earbuds");
  const [poolId, setPoolId] = useState<string>("");
  const [personaFilter, setPersonaFilter] = useState<string>("all");

  const { data: pools } = usePools();
  const { data: runs } = useRuns();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const activeRunId = selectedRunId || (runs && runs.length > 0 ? runs[0]!.id : null);
  const { data: currentRun } = useRun(activeRunId ?? undefined);
  const { data: segments } = useSegments(activeRunId ?? undefined);
  const { data: issues } = useIssues(activeRunId ?? undefined);
  const { data: personas } = useRunPersonas(activeRunId ?? undefined);
  const { data: spread } = useSpread(activeRunId ?? undefined);
  const { data: report } = useReport(activeRunId ?? undefined);

  const readyPools = (pools ?? []).filter((p) => p.status === "ready");

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-canvas-ivory border border-border-warm rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft-card">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-lavender-tint border border-border-accent-tint flex items-center justify-center text-primary font-bold">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-lavender-tint px-2 py-0.5 rounded-full">
                Stitch AI Preview Mode
              </span>
              <span className="text-xs text-text-tertiary">Light Design System</span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Live interactive preview of all 5 exported Stitch redesign views.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-border-warm bg-surface-white hover:bg-surface-cream text-text-primary transition"
          >
            Back to Classic Dashboard
          </Link>
        </div>
      </div>

      {/* Global Stitch Navigation Switcher for 5 Core Screens */}
      <div className="bg-surface-white border border-border-warm rounded-2xl p-2 soft-card-shadow flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: "dashboard", label: "Dashboard Overview", icon: Activity, pill: "Overview" },
          { id: "launchpad", label: "1. Launch Pad", icon: Rocket, pill: "Stage 1" },
          { id: "analytics", label: "2. Analytics & UX", icon: BarChart3, pill: "Stage 2" },
          { id: "spread", label: "3. Word-of-Mouth", icon: Share2, pill: "Stage 3" },
          { id: "report", label: "4. Executive Report", icon: FileText, pill: "Stage 4" },
        ].map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as StitchViewMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-lavender-light text-surface-white shadow-sm font-bold"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-cream"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? "bg-white/25 text-white" : "bg-surface-cream text-text-tertiary"
                }`}
              >
                {item.pill}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. DASHBOARD OVERVIEW SCREEN                                              */}
      {/* ========================================================================= */}
      {activeView === "dashboard" && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="bg-surface-white border border-border-warm rounded-[28px] p-6 sm:p-8 shadow-soft-card flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-status-success animate-ping"></span>
                <span className="text-xs font-mono font-bold text-text-primary">1,000 Agents Armed</span>
                <span className="text-xs text-text-muted">• Synthetic Testing Ready</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
                Simulate 100 Real Users in Parallel
              </h1>
              <p className="text-xs sm:text-sm text-text-muted max-w-xl">
                Deploy diverse persona cohorts with autonomous perception, cognitive reasoning, and journey pathing.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveView("launchpad")}
                className="flex items-center gap-2 bg-lavender-light hover:bg-primary text-surface-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-sm active:scale-95 transition-all"
              >
                <Rocket className="w-4 h-4" />
                Launch Simulation
              </button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-white p-5 rounded-3xl border border-border-warm shadow-soft-card flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-text-muted font-medium">
                <span>Active Persona Pool</span>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="my-2">
                <div className="text-3xl font-extrabold text-text-primary tracking-tight">1,000</div>
                <div className="text-[11px] text-text-muted mt-0.5">Nodes Indexed • SQLite Cache</div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-status-success">
                <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                <span>Ready for sampling</span>
              </div>
            </div>

            <div className="bg-surface-white p-5 rounded-3xl border border-border-warm shadow-soft-card flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-text-muted font-medium">
                <span>Latest Run Verdict</span>
                <CheckCircle2 className="w-4 h-4 text-status-success" />
              </div>
              <div className="my-2">
                <div className="text-3xl font-extrabold text-status-success tracking-tight">
                  {currentRun ? (currentRun.state === "completed" ? "88.4%" : currentRun.state) : "Ready"}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">Task Flow Completion Rate</div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-honey-dark">
                <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
                <span>Conditional Pass</span>
              </div>
            </div>

            <div className="bg-surface-white p-5 rounded-3xl border border-border-warm shadow-soft-card flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-text-muted font-medium">
                <span>Critical UX Blockers</span>
                <ShieldAlert className="w-4 h-4 text-status-error" />
              </div>
              <div className="my-2">
                <div className="text-3xl font-extrabold text-status-error tracking-tight">
                  {issues ? issues.filter((i) => i.severity === "high" || i.severity === "critical").length : 3}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">Severity P0 & P1 Hazards</div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-status-error">
                <span className="w-1.5 h-1.5 rounded-full bg-status-error" />
                <span>Checkout drop-off detected</span>
              </div>
            </div>

            <div className="bg-surface-white p-5 rounded-3xl border border-border-warm shadow-soft-card flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-text-muted font-medium">
                <span>Viral Spread Factor</span>
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div className="my-2">
                <div className="text-3xl font-extrabold text-text-primary tracking-tight">
                  {spread && spread.rounds && spread.rounds.length > 0 ? (spread.totalReached / (spread.rounds.length * 100) + 1).toFixed(2) : "1.24"}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">K-Factor Cascade (+18%)</div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-status-success">
                <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                <span>Exponential propagation</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Runs */}
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-surface-white border border-border-warm rounded-3xl p-6 shadow-soft-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-text-primary">Recent Cohort Simulations</h3>
                  <p className="text-xs text-text-muted">Multi-agent test runs recorded in this workspace.</p>
                </div>
                <Link
                  href="/runs"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  View All Runs <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-2">
                {(runs ?? []).slice(0, 4).map((r) => {
                  const goalTitle =
                    r.stimulus && "goal" in r.stimulus
                      ? (r.stimulus as { goal: string }).goal
                      : r.stimulus && "url" in r.stimulus
                      ? (r.stimulus as { url: string }).url
                      : "Synthetic testing journey";

                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRunId(r.id)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        r.id === activeRunId
                          ? "bg-lavender-tint/50 border-primary"
                          : "bg-surface-panel-alt border-border-subtle hover:border-border-warm"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-text-primary">
                            Run #{r.id.slice(0, 8)}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              r.state === "completed"
                                ? "bg-status-success-bg text-status-success border border-status-success-border"
                                : "bg-status-warning-bg text-honey-dark border border-status-warning-border"
                            }`}
                          >
                            {r.state}
                          </span>
                        </div>
                        <div className="text-xs text-text-muted truncate max-w-md">{goalTitle}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-bold text-text-primary font-mono">
                            {r.totalPersonas ?? 1000} Agents
                          </div>
                          <div className="text-[10px] text-text-tertiary">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {(!runs || runs.length === 0) && (
                  <div className="text-center py-8 text-xs text-text-muted">
                    No runs yet. Click "Launch Simulation" above to run your first synthetic cohort.
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 bg-surface-white border border-border-warm rounded-3xl p-6 shadow-soft-card space-y-4">
              <h3 className="text-base font-bold text-text-primary">System Telemetry</h3>
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-surface-cream border border-border-subtle flex items-center justify-between">
                  <span className="text-xs text-text-muted">Persona Engine</span>
                  <span className="text-xs font-bold font-mono text-status-success">100% ONLINE</span>
                </div>
                <div className="p-3 rounded-2xl bg-surface-cream border border-border-subtle flex items-center justify-between">
                  <span className="text-xs text-text-muted">Cluster Sharding</span>
                  <span className="text-xs font-bold font-mono text-text-primary">4 Clusters (x250)</span>
                </div>
                <div className="p-3 rounded-2xl bg-surface-cream border border-border-subtle flex items-center justify-between">
                  <span className="text-xs text-text-muted">Reasoning Model</span>
                  <span className="text-xs font-bold font-mono text-primary">Gemini 3.8 Flash</span>
                </div>
                <div className="p-3 rounded-2xl bg-surface-cream border border-border-subtle flex items-center justify-between">
                  <span className="text-xs text-text-muted">MCP Status</span>
                  <span className="text-xs font-bold font-mono text-status-success">Stitch Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. LAUNCH PAD SCREEN (VISUAL REDESIGN)                                     */}
      {/* ========================================================================= */}
      {activeView === "launchpad" && (
        <div className="space-y-6">
          <div className="bg-surface-white border border-border-warm rounded-3xl p-6 shadow-soft-card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-primary font-mono uppercase tracking-wider">
                Stage 1 • Stepper Configuration
              </span>
              <h2 className="text-xl font-bold text-text-primary mt-1">Configure & Arm Agent Swarm</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Set stimulus parameters, target endpoint, and agent sample allocation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-honey-tint/80 border border-status-warning-border text-secondary text-xs font-semibold">
                <Zap className="w-3.5 h-3.5 text-honey-dark" />
                <span>12ms Latency Ready</span>
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Form */}
            <div className="lg:col-span-7 bg-surface-white border border-border-warm rounded-3xl p-6 shadow-soft-card space-y-5">
              <div>
                <label className="text-[11px] uppercase tracking-wider font-semibold text-text-muted block mb-1.5">
                  1. Target Persona Pool (Indexed Nodes)
                </label>
                <select
                  value={poolId}
                  onChange={(e) => setPoolId(e.target.value)}
                  className="w-full bg-surface-panel-alt border border-border-warm text-text-primary rounded-2xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-lavender-light shadow-xs"
                >
                  <option value="">Default pool (auto-select default-v1)</option>
                  {readyPools.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.slug} ({p.size} personas {p.isDefault ? "• default" : ""})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider font-semibold text-text-muted block mb-1.5">
                  2. Testing Target Mode
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-surface-cream rounded-2xl border border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setTargetMode("url")}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition ${
                      targetMode === "url"
                        ? "bg-surface-white text-primary shadow-xs font-bold border border-border-warm"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Live Website URL</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode("source_code")}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition ${
                      targetMode === "source_code"
                        ? "bg-surface-white text-primary shadow-xs font-bold border border-border-warm"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Source Code (.zip)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider font-semibold text-text-muted block mb-1.5">
                  3. Target Endpoint / Demo Stimulus
                </label>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-surface-panel-alt border border-border-warm text-text-primary rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-mono focus:outline-none focus:border-lavender-light shadow-xs"
                  placeholder="http://localhost:8989/before"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider font-semibold text-text-muted block mb-1.5">
                  4. User Goal / Journey Prompt
                </label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={2}
                  className="w-full bg-surface-panel-alt border border-border-warm text-text-primary rounded-2xl px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-lavender-light shadow-xs"
                />
              </div>

              <div className="pt-2">
                <Link
                  href="/"
                  className="w-full inline-flex items-center justify-center gap-2 bg-lavender-light hover:bg-primary text-surface-white font-semibold text-sm py-3 rounded-full shadow-sm active:scale-98 transition-all"
                >
                  <Rocket className="w-4 h-4" />
                  Deploy 1,000 Agents on Live App
                </Link>
              </div>
            </div>

            {/* Stepper info card */}
            <div className="lg:col-span-5 bg-surface-panel-alt border border-border-warm rounded-3xl p-6 shadow-soft-card space-y-4">
              <h3 className="text-base font-bold text-text-primary">Execution Pipeline</h3>
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-surface-white border border-border-subtle flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-surface-white text-xs font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">Persona Sampling</h4>
                    <p className="text-[11px] text-text-muted">
                      Synthesizes 1,000 distinct demographic profiles with real behavioral variance.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-white border border-border-subtle flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-lavender-light text-surface-white text-xs font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">Autonomous Exploration</h4>
                    <p className="text-[11px] text-text-muted">
                      Headed browser agents navigate DOM elements and capture friction metrics.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-white border border-border-subtle flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-honey-light text-secondary text-xs font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">WOM Cascade Simulation</h4>
                    <p className="text-[11px] text-text-muted">
                      Calculates viral adoption curves, referrals, and Net Promoter Score across 30 days.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ANALYTICS & UX FRICTIONS SCREEN (VISUAL REDESIGN)                       */}
      {/* ========================================================================= */}
      {activeView === "analytics" && (
        <div className="space-y-6">
          {/* Header & Filter */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-2 border-b border-border-subtle">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-lavender-tint text-primary font-mono text-[11px] font-bold">
                  COHORT RUN #{activeRunId ? activeRunId.slice(0, 8) : "TR-9428"}
                </span>
                <span className="text-xs text-text-muted flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Multi-agent Telemetry Cycle
                </span>
              </div>
              <h2 className="text-2xl font-bold text-text-primary">UX Friction & Drop-off Analysis</h2>
              <p className="text-xs text-text-muted">
                Aggregated multi-agent path telemetry across 1,000 synthetic test runs.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-surface-cream p-1.5 rounded-2xl border border-border-warm">
              <span className="text-xs text-text-muted px-2 font-medium">Filter:</span>
              <button
                onClick={() => setPersonaFilter("all")}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition ${
                  personaFilter === "all" ? "bg-surface-white text-text-primary shadow-xs" : "text-text-muted"
                }`}
              >
                All (1k)
              </button>
              <button
                onClick={() => setPersonaFilter("success")}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition ${
                  personaFilter === "success" ? "bg-surface-white text-status-success shadow-xs" : "text-text-muted"
                }`}
              >
                Success
              </button>
              <button
                onClick={() => setPersonaFilter("failure")}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition ${
                  personaFilter === "failure" ? "bg-surface-white text-status-error shadow-xs" : "text-text-muted"
                }`}
              >
                Drop-offs
              </button>
            </div>
          </div>

          {/* 4 Radial & Graphical KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Completion Radial Dial */}
            <div className="bg-surface-white p-5 rounded-3xl border border-border-warm shadow-soft-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium">Task Completion</span>
                <span className="text-[10px] font-bold text-status-error bg-status-error-bg px-2 py-0.5 rounded-full border border-status-error-border">
                  -12% vs Target
                </span>
              </div>
              <div className="flex items-center justify-between my-3">
                <div>
                  <div className="text-3xl font-extrabold text-text-primary leading-none">68.4%</div>
                  <div className="text-[10px] text-text-muted mt-1 uppercase font-semibold">684 / 1,000 Goal</div>
                </div>
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-surface-cream stroke-current"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      strokeWidth="3.5"
                    />
                    <path
                      className="text-status-warning stroke-current"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      strokeDasharray="68.4, 100"
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  </svg>
                  <span className="text-[11px] font-bold text-honey-dark absolute">68%</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1 pt-2 border-t border-border-subtle">
                <div className="h-1 rounded-full bg-status-success" />
                <div className="h-1 rounded-full bg-status-success" />
                <div className="h-1 rounded-full bg-status-warning" />
                <div className="h-1 rounded-full bg-surface-cream" />
              </div>
            </div>

            {/* KPI 2: Critical Friction Gates */}
            <div className="bg-surface-white p-5 rounded-3xl border border-border-warm shadow-soft-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium">Critical Friction Gates</span>
                <span className="text-[10px] font-bold text-status-error bg-status-error-bg px-2 py-0.5 rounded-full border border-status-error-border animate-pulse">
                  Action Required
                </span>
              </div>
              <div className="flex items-center justify-between my-3">
                <div>
                  <div className="text-3xl font-extrabold text-status-error leading-none">14</div>
                  <div className="text-[10px] text-text-muted mt-1 uppercase font-semibold">5 Severity P0 Blockers</div>
                </div>
                <div className="flex items-end gap-1 h-8 w-12 justify-end">
                  <div className="w-2 bg-status-error rounded-t h-full" />
                  <div className="w-2 bg-honey-light rounded-t h-3/5" />
                  <div className="w-2 bg-lavender-light rounded-t h-4/5" />
                  <div className="w-2 bg-border-warm rounded-t h-1/4" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-[11px] font-mono text-text-muted">
                <span>5 P0</span>
                <span>6 P1</span>
                <span>3 P2</span>
              </div>
            </div>

            {/* KPI 3: Mean Time */}
            <div className="bg-surface-white p-5 rounded-3xl border border-border-warm shadow-soft-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium">Mean Completion Time</span>
                <span className="text-[10px] text-text-muted font-bold bg-surface-cream px-2 py-0.5 rounded-full border border-border-warm">
                  +48s Lag
                </span>
              </div>
              <div className="flex items-center justify-between my-3">
                <div>
                  <div className="text-3xl font-extrabold text-text-primary leading-none">3m 42s</div>
                  <div className="text-[10px] text-text-muted mt-1 uppercase font-semibold">Target: 2m 54s</div>
                </div>
                <svg className="w-14 h-8 stroke-primary fill-none shrink-0" viewBox="0 0 64 36">
                  <path d="M2 28 C 16 26, 24 16, 38 22 C 48 26, 54 8, 62 4" strokeLinecap="round" strokeWidth="2.5" />
                  <circle className="fill-primary" cx="62" cy="4" r="3" />
                </svg>
              </div>
              <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-text-muted">
                <span>P50: 3m 12s</span>
                <span className="text-honey-dark font-semibold">P95: 5m 48s</span>
              </div>
            </div>

            {/* KPI 4: Frustration Index */}
            <div className="bg-surface-white p-5 rounded-3xl border border-border-warm shadow-soft-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium">Frustration Index</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-status-warning-bg border border-status-warning-border text-honey-dark px-2 py-0.5 rounded-full">
                  High Stress
                </span>
              </div>
              <div className="flex items-center justify-between my-3">
                <div>
                  <div className="text-3xl font-extrabold text-honey-dark leading-none">42 / 100</div>
                  <div className="text-[10px] text-text-muted mt-1 uppercase font-semibold">Confusion Score</div>
                </div>
                <AlertTriangle className="w-8 h-8 text-honey-light" />
              </div>
              <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-muted">
                <span>Checkout Step 3</span>
                <span className="text-status-error font-semibold">Peak friction</span>
              </div>
            </div>
          </div>

          {/* Friction Ranked Issues List */}
          <div className="bg-surface-white border border-border-warm rounded-3xl p-6 shadow-soft-card space-y-4">
            <h3 className="text-base font-bold text-text-primary">Impact-Ranked Friction Blockers</h3>
            <div className="space-y-3">
              {(issues && issues.length > 0
                ? issues
                : [
                    {
                      issueId: "1",
                      title: "Step 3: Setup Latency Blocks Domain Verification",
                      severity: "high" as const,
                      affectedPersonas: 480,
                      suggestedFix: "Personas repeatedly retry without visual confirmation, leading to abandonment.",
                    },
                    {
                      issueId: "2",
                      title: "Ambiguous CTA button text on Checkout Step 2",
                      severity: "medium" as const,
                      affectedPersonas: 210,
                      suggestedFix: "Text 'Continue' confused users between saving draft vs placing live order.",
                    },
                    {
                      issueId: "3",
                      title: "Mobile viewport overflow on confirmation screen",
                      severity: "low" as const,
                      affectedPersonas: 95,
                      suggestedFix: "Horizontal scrolling triggered on screens narrower than 375px.",
                    },
                  ]
              ).map((issue) => (
                <div
                  key={issue.issueId}
                  className="p-4 rounded-2xl bg-surface-panel-alt border border-border-warm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          issue.severity === "high" || issue.severity === "critical"
                            ? "bg-status-error-bg text-status-error border border-status-error-border"
                            : issue.severity === "medium"
                            ? "bg-status-warning-bg text-honey-dark border border-status-warning-border"
                            : "bg-surface-cream text-text-muted border border-border-subtle"
                        }`}
                      >
                        {issue.severity}
                      </span>
                      <h4 className="text-sm font-bold text-text-primary">{issue.title}</h4>
                    </div>
                    <p className="text-xs text-text-muted">{issue.suggestedFix}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-extrabold font-mono text-text-primary">
                      {issue.affectedPersonas} Personas
                    </div>
                    <div className="text-[10px] text-text-tertiary">Impacted in swarm</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. WORD-OF-MOUTH SPREAD SCREEN (VISUAL REDESIGN)                           */}
      {/* ========================================================================= */}
      {activeView === "spread" && (
        <WordOfMouthView
          spread={spread}
          activeRunId={activeRunId ?? undefined}
        />
      )}

      {/* ========================================================================= */}
      {/* 5. EXECUTIVE REPORT SCREEN (VISUAL REDESIGN)                               */}
      {/* ========================================================================= */}
      {activeView === "report" && (
        <div className="space-y-6">
          {/* Verdict Banner */}
          <div className="bg-surface-white border border-border-warm rounded-3xl p-6 lg:p-7 shadow-soft-card relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-status-warning-bg text-honey-dark border border-status-warning-border font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" /> CONDITIONAL APPROVAL
                  </span>
                  <span className="text-xs text-status-success bg-status-success-bg border border-status-success-border px-2.5 py-0.5 rounded-full font-semibold">
                    88.4% TASK FLOW VALIDATED
                  </span>
                  <span className="text-xs font-mono text-text-tertiary">BUILD #9822</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary leading-snug">
                  Release with targeted hotfix: Step 3 setup latency blocks 48% of teams.
                </h2>
                <p className="text-xs sm:text-sm text-text-muted">
                  Patch workspace domain verification loop before wide rollout. Core onboarding flow is verified.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-status-error-bg border border-status-error-border">
                    <div className="text-[10px] font-bold text-status-error uppercase">Retention Hazard</div>
                    <div className="text-base font-extrabold text-status-error mt-1">Step 3 Cliff</div>
                    <div className="text-[10px] text-status-error/80">High Drop-off</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-status-warning-bg border border-status-warning-border">
                    <div className="text-[10px] font-bold text-honey-dark uppercase">Conversion Leak</div>
                    <div className="text-base font-extrabold text-honey-dark mt-1">-14.2%</div>
                    <div className="text-[10px] text-honey-dark/80">Self-Serve Rate</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-surface-cream border border-border-subtle">
                    <div className="text-[10px] font-bold text-text-tertiary uppercase">Estimated Fix</div>
                    <div className="text-base font-extrabold text-text-primary mt-1">1 Sprint</div>
                    <div className="text-[10px] text-text-muted">~3 Eng Days</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-lavender-tint border border-border-accent-tint">
                    <div className="text-[10px] font-bold text-primary uppercase">Sim Accuracy</div>
                    <div className="text-base font-extrabold text-primary mt-1">99.1%</div>
                    <div className="text-[10px] text-primary/80">1,200 Swarm</div>
                  </div>
                </div>
              </div>

              {/* Scorecard Radial Gauge */}
              <div className="lg:col-span-4 bg-surface-panel-alt rounded-2xl border border-border-warm p-5 flex flex-col items-center justify-center text-center shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  UX Health Index
                </span>
                <div className="relative w-32 h-32 my-3 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" fill="transparent" r="48" stroke="#ECE7E1" strokeWidth="9" />
                    <circle
                      cx="60"
                      cy="60"
                      fill="transparent"
                      r="48"
                      stroke="#887FCE"
                      strokeDasharray="238 301.6"
                      strokeLinecap="round"
                      strokeWidth="9"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold text-text-primary leading-none">79</span>
                    <span className="text-[10px] text-text-muted mt-0.5 font-semibold">/ 100 PTS</span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-success-bg text-status-success text-xs font-semibold border border-status-success-border">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+4.2 pts vs Baseline</span>
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Recommendations Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-surface-white border border-border-warm rounded-3xl p-5 shadow-soft-card space-y-2">
              <div className="flex items-center gap-2 text-status-error font-bold text-xs uppercase">
                <ShieldAlert className="w-4 h-4" /> Recommendation 1
              </div>
              <h4 className="text-sm font-bold text-text-primary">Inline Async Domain Polling</h4>
              <p className="text-xs text-text-muted">
                Replace blocking DNS check modal with background worker. Eliminates 48% drop-off in setup.
              </p>
            </div>

            <div className="bg-surface-white border border-border-warm rounded-3xl p-5 shadow-soft-card space-y-2">
              <div className="flex items-center gap-2 text-honey-dark font-bold text-xs uppercase">
                <Zap className="w-4 h-4" /> Recommendation 2
              </div>
              <h4 className="text-sm font-bold text-text-primary">Preserve Cart State across Auth</h4>
              <p className="text-xs text-text-muted">
                Store unauthenticated guest cart sessions in local storage to prevent session reset during sign-up.
              </p>
            </div>

            <div className="bg-surface-white border border-border-warm rounded-3xl p-5 shadow-soft-card space-y-2">
              <div className="flex items-center gap-2 text-status-success font-bold text-xs uppercase">
                <CheckCircle2 className="w-4 h-4" /> Recommendation 3
              </div>
              <h4 className="text-sm font-bold text-text-primary">One-Click Persona Sandbox</h4>
              <p className="text-xs text-text-muted">
                Enable instant pre-seeded mock templates to reduce initial onboarding time from 3m 42s to 1m 20s.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
