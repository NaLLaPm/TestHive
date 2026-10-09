"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  usePools,
  useCreateRun,
  useRuns,
  useDemoRuns,
  useRun,
  useSegments,
  useIssues,
  useRunPersonas,
  useSpread,
  useReport,
} from "@/lib/queries";
import { api } from "@testhive/api-client";
import { Badge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { SegmentBarChart } from "@/components/charts/segment-bar-chart";
import { SeverityBars } from "@/components/charts/severity-bars";
import { TraitHeatmap } from "@/components/charts/trait-heatmap";
import { AdoptionCurve } from "@/components/charts/adoption-curve";
import { FunnelView } from "@/components/report/funnel-view";
import { FrictionHeatmap } from "@/components/report/friction-heatmap";
import { ExportToolbar } from "@/components/report/export-toolbar";
import { renderMarkdown } from "@/lib/markdown";
import { BenchmarkLiveModal } from "@/components/benchmark-live-modal";

type TabId =
  | "launchpad"
  | "presets"
  | "analytics"
  | "spread"
  | "report";

export default function PixelDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("launchpad");

  // Query hooks
  const { data: pools } = usePools();
  const { data: runs } = useRuns();
  const { data: demos } = useDemoRuns();
  const createRun = useCreateRun();

  // Selected run for deep inspection tabs (default to latest completed run or latest run)
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Fallback to latest run if none explicitly chosen
  const activeRunId = selectedRunId || (runs && runs.length > 0 ? runs[0]!.id : null);

  const { data: currentRun } = useRun(activeRunId ?? undefined);
  const { data: segments } = useSegments(activeRunId ?? undefined);
  const { data: issues } = useIssues(activeRunId ?? undefined);
  const { data: personas } = useRunPersonas(activeRunId ?? undefined);
  const { data: spread, refetch: refetchSpread } = useSpread(activeRunId ?? undefined);
  const { data: report } = useReport(activeRunId ?? undefined);

  // Form states for Launchpad
  const [poolId, setPoolId] = useState<string>("");
  const [url, setUrl] = useState("http://localhost:8989/before");
  const [goal, setGoal] = useState("Buy a pair of wireless earbuds");
  const [error, setError] = useState<string | null>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [spreadSimulating, setSpreadSimulating] = useState(false);

  // Active live test panel modal state
  const [activeRunModal, setActiveRunModal] = useState<{
    runId: string;
    poolId: string | null;
    targetUrl: string;
    userGoal: string;
    expectedPersonas: number;
  } | null>(null);

  // Persona filter in Results/Analytics tab
  const [personaFilter, setPersonaFilter] = useState<"all" | "success" | "failure" | "partial">("all");

  const readyPools = (pools ?? []).filter((p) => p.status === "ready");
  const defaultPool = readyPools.find((p) => p.isDefault) ?? readyPools[0];
  const activeSelectedPool = readyPools.find((p) => p.id === poolId) ?? defaultPool;

  async function onStartRun(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const targetPool = readyPools.find((p) => p.id === poolId) ?? defaultPool;
      const totalPoolSize = targetPool?.size ?? 1000;
      const res = await createRun.mutateAsync({
        kind: "url_journey",
        poolId: poolId || null,
        stimulus: { type: "url", url, goal },
        selection: { strategy: "all", count: totalPoolSize, seed: 42 },
        deepCount: 15,
        maxSteps: 8,
        concurrency: 10,
        useCache: true,
      } as any);

      // Open live testing/loading panel modal with real-time persona metrics
      setActiveRunModal({
        runId: res.runId,
        poolId: res.poolId ?? poolId ?? null,
        targetUrl: url,
        userGoal: goal,
        expectedPersonas: totalPoolSize,
      });
      setSelectedRunId(res.runId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function onLoadPresetDemo(demoId: string) {
    setLoadingDemo(true);
    try {
      const res = await api.loadDemoRun(demoId);
      setSelectedRunId(res.runId);
      setActiveTab("analytics");
    } finally {
      setLoadingDemo(false);
    }
  }

  async function onRerunSpread() {
    if (!activeRunId) return;
    setSpreadSimulating(true);
    try {
      await api.postSpread(activeRunId, { rounds: 6, seedStrategy: "positive_verdict", seed: 42 });
      await refetchSpread();
    } finally {
      setSpreadSimulating(false);
    }
  }

  const filteredPersonas = (personas ?? []).filter(
    (p) => personaFilter === "all" || p.outcome === personaFilter
  );

  return (
    <div className="space-y-8">
      {/* Pixel OS Header & Glance Widget */}
      <section className="bg-white/85 border border-border rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-lavender/20 via-cyan/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
              Simulate 1,000 Real Users in Parallel
            </h1>
            <p className="text-muted text-sm sm:text-base max-w-2xl leading-relaxed">
              Synthesize 11,953 trait connections, test checkout friction, monitor live SSE events,
              and calculate viral Word-of-Mouth cascade diffusion across human demographic clusters.
            </p>
          </div>

          {/* Quick Glances / Quick Actions */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <Link
              href="/personas"
              className="px-4 py-2.5 rounded-2xl bg-white border border-border hover:border-purple/50 transition flex items-center gap-2 text-xs font-semibold text-text group shadow-xs"
            >
              <span>👥</span>
              <span>Inspect & Alter Personas</span>
            </Link>
            {defaultPool && (
              <Link
                href={`/library/${defaultPool.id}`}
                className="px-4 py-2.5 rounded-2xl bg-white border border-border hover:border-purple/50 transition flex items-center gap-2.5 text-xs font-semibold text-text group shadow-xs"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-purple group-hover:scale-125 transition" />
                <span>Explore 2D Force Graph</span>
              </Link>
            )}
            {activeRunId && (
              <Link
                href={`/runs/${activeRunId}/live`}
                className="px-4 py-2.5 rounded-2xl bg-purple text-cream hover:bg-lavender hover:text-text transition flex items-center gap-2 text-xs font-bold shadow-xs"
              >
                <span className="w-2 h-2 rounded-full bg-cream animate-ping" />
                <span>Live Execution Console</span>
              </Link>
            )}
          </div>
        </div>

        {/* Pixel OS Quick Settings Bar / Run Selector */}
        {runs && runs.length > 0 && (
          <div className="mt-6 pt-5 border-t border-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Active Benchmark:
              </span>
              <select
                value={activeRunId ?? ""}
                onChange={(e) => setSelectedRunId(e.target.value)}
                className="bg-white text-text border border-border rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-purple transition shadow-xs"
              >
                {runs.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.stimulus.type === "url" ? r.stimulus.url : r.kind} ({r.state})
                  </option>
                ))}
              </select>
            </div>
            {currentRun && (
              <div className="flex items-center gap-3 text-xs text-muted">
                <span>
                  Personas: <strong className="text-text">{currentRun.donePersonas}/{currentRun.totalPersonas}</strong>
                </span>
                <span>•</span>
                <span>
                  Status:{" "}
                  <Badge kind={currentRun.state === "completed" ? "success" : currentRun.state === "failed" ? "failure" : "neutral"}>
                    {currentRun.state}
                  </Badge>
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Pixel OS Material Tab Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border">
        {[
          { id: "launchpad", label: "1. Launch Pad" },
          { id: "presets", label: "2. Preset Showroom" },
          { id: "analytics", label: "3. Analytics & UX Frictions" },
          { id: "spread", label: "4. Word-of-Mouth Spread" },
          { id: "report", label: "5. Executive Report" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? "bg-purple text-cream shadow-sm font-bold"
                  : "bg-white/80 border border-border text-muted hover:text-text hover:border-purple/40"
              }`}
            >
              <span>{tab.label}</span>
              {tab.id === "analytics" && issues && issues.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-cyan" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: LAUNCH PAD & BENCHMARK FEED */}
      {activeTab === "launchpad" && (
        <div className="space-y-8">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Launch Form Tile */}
            <div className="lg:col-span-7 bg-white border border-border rounded-3xl p-6 sm:p-7 shadow-xs relative">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-text">Configure Test Run</h2>
                  <p className="text-xs text-muted mt-0.5">
                    Select a pool, define the target URL & user goal, and adjust agent sample density.
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-purple/15 flex items-center justify-center text-purple">
                  ⚡
                </div>
              </div>

              {readyPools.length === 0 ? (
                <div className="p-6 rounded-2xl bg-panel2 border border-dashed border-border text-center space-y-3">
                  <p className="text-muted text-sm">
                    No persona pool is currently ready in SQLite.
                  </p>
                  <Link
                    href="/library"
                    className="inline-block px-4 py-2 rounded-xl bg-purple text-cream font-semibold text-xs hover:bg-lavender hover:text-text transition shadow-xs"
                  >
                    Build Pool in Library
                  </Link>
                </div>
              ) : (
                <form onSubmit={onStartRun} className="space-y-5">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-muted block mb-1.5">
                      Persona Pool (1,000 Nodes)
                    </label>
                    <select
                      value={poolId}
                      onChange={(e) => setPoolId(e.target.value)}
                      className="w-full bg-white border border-border text-text rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple transition shadow-xs"
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
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-muted block mb-1.5">
                      Stimulus Target URL
                    </label>
                    <div className="relative">
                      <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="http://localhost:8989/before"
                        className="w-full bg-white border border-border text-text rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple transition pr-24 font-mono shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setUrl("http://localhost:8989/before")}
                        className="absolute right-2 top-2 px-2.5 py-1 text-[11px] rounded-lg bg-panel2 border border-border text-muted hover:text-text"
                      >
                        Reset Demo
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-muted block mb-1.5">
                      Simulated User Goal
                    </label>
                    <input
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="e.g., Buy a pair of wireless earbuds"
                      className="w-full bg-white border border-border text-text rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple transition shadow-xs"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-muted/10 border border-muted/30 text-muted text-xs">
                      {error}
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-panel2 border border-border flex items-center justify-between text-xs text-muted">
                    <span className="font-semibold text-text">Target Corpus:</span>
                    <span>
                      Runs entire prebuilt pool (
                      <strong className="text-purple font-mono font-bold">
                        {activeSelectedPool?.size ?? 1000} Personas
                      </strong>
                      ) without sub-sampling limits
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={createRun.isPending}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple via-lavender to-cyan text-cream font-bold text-sm tracking-wide shadow-md hover:opacity-95 disabled:opacity-50 transition transform active:scale-[0.99]"
                  >
                    {createRun.isPending
                      ? "Executing Benchmark Run…"
                      : `Launch Benchmark Run (${activeSelectedPool?.size ?? 1000} Prebuilt Personas)`}
                  </button>
                </form>
              )}
            </div>

            {/* Quick Links & Benchmark Feeds */}
            <div className="lg:col-span-5 space-y-6">
              {/* Pixel OS Quick Card for Graph Explorer */}
              <div className="bg-white border border-border rounded-3xl p-6 shadow-xs relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-text text-sm">Persona Graph Explorer</h3>
                  <span className="text-xs text-purple font-mono font-semibold">1,000 Nodes</span>
                </div>
                <p className="text-xs text-muted mb-4 leading-relaxed">
                  Interactive 2D Network Force Graph rendering 11,953 similarity connections,
                  demographic clusters, and backstories.
                </p>
                {defaultPool ? (
                  <Link
                    href={`/library/${defaultPool.id}`}
                    className="block text-center w-full py-2.5 rounded-xl bg-panel2 border border-border text-xs font-semibold text-text hover:border-purple hover:text-purple transition"
                  >
                    Open Library & Graph Explorer →
                  </Link>
                ) : (
                  <Link
                    href="/library"
                    className="block text-center w-full py-2.5 rounded-xl bg-panel2 border border-border text-xs font-semibold text-text hover:border-purple transition"
                  >
                    View Library →
                  </Link>
                )}
              </div>

              {/* Recent Runs Feed */}
              <div className="bg-white border border-border rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-text text-sm">Recent Benchmark Runs</h3>
                  <Link href="/runs" className="text-xs text-purple font-semibold hover:underline">
                    View all ({runs?.length ?? 0})
                  </Link>
                </div>
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {(runs ?? []).slice(0, 6).map((r) => (
                    <div
                      key={r.id}
                      onClick={() => {
                        setSelectedRunId(r.id);
                        setActiveTab("analytics");
                      }}
                      className="cursor-pointer p-3.5 rounded-2xl bg-panel2 border border-border hover:border-purple/40 transition flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-xs text-text line-clamp-1">
                          {r.stimulus.type === "url" ? r.stimulus.url : r.kind}
                        </div>
                        <div className="text-[11px] text-muted">
                          {r.donePersonas}/{r.totalPersonas} personas •{" "}
                          {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge
                        kind={
                          r.state === "completed"
                            ? "success"
                            : r.state === "failed"
                              ? "failure"
                              : "neutral"
                        }
                      >
                        {r.state}
                      </Badge>
                    </div>
                  ))}
                  {(runs ?? []).length === 0 && (
                    <p className="text-muted text-xs py-4 text-center">No benchmark runs recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRESET DEMO SHOWROOM */}
      {activeTab === "presets" && (
        <div className="space-y-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold text-text">Preset Demo Showroom</h2>
            <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
              Instant one-click navigation straight into comparative results for pre-baked benchmarks.
              Compare how the persona collective acts on <strong>ShopKart (before fix)</strong> versus{" "}
              <strong>ShopKart (after fix)</strong>.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {(demos ?? []).map((d) => (
              <div
                key={d.demoId}
                className="bg-white border border-border rounded-3xl p-6 shadow-xs hover:border-purple/50 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted font-mono">{d.demoId}</span>
                  </div>
                  <h3 className="text-lg font-bold text-text">{d.title}</h3>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">{d.description}</p>
                </div>

                <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
                  <button
                    onClick={() => onLoadPresetDemo(d.demoId)}
                    disabled={loadingDemo}
                    className="px-4 py-2.5 rounded-xl bg-purple text-cream font-bold text-xs hover:bg-lavender hover:text-text transition disabled:opacity-50 shadow-xs"
                  >
                    {loadingDemo ? "Loading…" : "Inspect Results & Heatmap →"}
                  </button>
                  <Link
                    href="/demo"
                    className="text-xs text-muted hover:text-text transition underline"
                  >
                    Demo page
                  </Link>
                </div>
              </div>
            ))}

            {(demos ?? []).length === 0 && (
              <div className="col-span-2 p-8 rounded-3xl bg-panel2 border border-border text-center space-y-3">
                <p className="text-muted text-sm">
                  No cached demo runs found. Generate pre-baked benchmarks with:
                </p>
                <code className="inline-block bg-white text-purple border border-border px-3 py-1.5 rounded-xl text-xs font-mono">
                  pnpm demo:seed
                </code>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ANALYTICS & SEGMENTATION DASHBOARD */}
      {activeTab === "analytics" && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-text">Analytics & Segmentation</h2>
              <p className="text-xs text-muted mt-0.5">
                Cluster success rates, multi-trait correlations, and clustered UX friction points.
              </p>
            </div>
            {activeRunId && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/runs/${activeRunId}/results`}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-border text-xs font-semibold text-text hover:border-purple transition shadow-xs"
                >
                  Full Results Page ↗
                </Link>
                <Link
                  href={`/runs/${activeRunId}/live`}
                  className="px-3.5 py-1.5 rounded-xl bg-purple text-cream text-xs font-bold hover:bg-lavender hover:text-text transition shadow-xs"
                >
                  Watch Live Graph ↗
                </Link>
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid sm:grid-cols-4 gap-4">
            <Stat
              label="Tested Personas"
              value={currentRun ? `${currentRun.donePersonas}/${currentRun.totalPersonas}` : "—"}
            />
            <Stat
              label="Success Rate (95% CI)"
              value={
                segments
                  ? `${Math.round(segments.overall.successRate * 100)}%${
                      segments.overall.marginOfError !== undefined
                        ? ` ± ${Math.round(segments.overall.marginOfError * 100)}%`
                        : ""
                    }`
                  : "—"
              }
              sub={segments ? `Total sample n=${segments.overall.n}` : undefined}
            />
            <Stat
              label="Baseline Control"
              value={
                segments?.baselineControl
                  ? segments.baselineControl.allPassed
                    ? "100% (Healthy)"
                    : `${Math.round(segments.baselineControl.successRate * 100)}% (Site Issue)`
                  : "Active"
              }
              sub={segments?.baselineControl ? `n=${segments.baselineControl.n} controls` : undefined}
            />
            <Stat
              label="Detected UX Issues"
              value={issues ? `${issues.length} frictions` : "—"}
              sub={
                issues && issues.length > 0
                  ? `Highest: ${issues[0]?.severity.toUpperCase()}`
                  : undefined
              }
            />
          </div>

          {/* Baseline Check Alert Banner */}
          {segments?.baselineControl && (
            <div
              className={`p-4 rounded-2xl border ${
                segments.baselineControl.allPassed
                  ? "bg-cyan/15 border-cyan/40 text-text"
                  : "bg-muted/10 border-muted/30 text-muted"
              } flex items-center justify-between`}
            >
              <div className="space-y-0.5">
                <div className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <span>{segments.baselineControl.allPassed ? "🛡️ Baseline Control: Passed" : "⚠️ Baseline Control: Site Failure"}</span>
                  <Badge kind={segments.baselineControl.allPassed ? "success" : "failure"}>
                    {segments.baselineControl.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  {segments.baselineControl.note}
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-3 py-1 rounded-xl bg-white border border-border">
                {segments.baselineControl.n} control agents
              </span>
            </div>
          )}

          {/* Cluster Bar Chart */}
          {segments && (
            <div className="bg-white border border-border rounded-3xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-text text-sm">Cluster Success Rate Bar Chart</h3>
                  <p className="text-xs text-muted">
                    Shows 95% Confidence Interval (e.g. 21% ± 9%). Clusters with n &lt; 10 are greyed out.
                  </p>
                </div>
                <Badge kind="neutral">Demographic Segments</Badge>
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
            </div>
          )}

          {/* Multi-trait Heatmap */}
          {segments && (
            <div className="bg-white border border-border rounded-3xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-text text-sm">Multi-Trait Heatmap</h3>
                  <p className="text-xs text-muted">
                    Age Group vs. Device vs. Connection vs. Tech Comfort.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-[#1C5B66] font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan" /> High Success
                  </span>
                  <span className="flex items-center gap-1 text-muted">
                    <span className="w-2.5 h-2.5 rounded-full bg-muted/40" /> Friction
                  </span>
                </div>
              </div>
              <TraitHeatmap byTrait={segments.byTrait as any} />
            </div>
          )}

          {/* Clustered UX Frictions & Severity Bars */}
          {issues && issues.length > 0 && (
            <div className="bg-white border border-border rounded-3xl p-6 shadow-xs space-y-6">
              <div>
                <h3 className="font-bold text-text text-sm">
                  Clustered UX Frictions Sorted by Severity
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  High, medium, and low issues with persona quotes and suggested fixes.
                </p>
              </div>

              <SeverityBars data={issues} />

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                {issues.map((issue) => (
                  <div
                    key={issue.issueId}
                    className="p-5 rounded-2xl bg-panel2 border border-border space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-bold text-sm text-text">{issue.title}</div>
                      <Badge kind={issue.severity}>{issue.severity}</Badge>
                    </div>

                    <div className="text-xs text-muted">
                      ~{issue.affectedPersonas} personas affected • Clusters:{" "}
                      {issue.affectedClusters.join(", ") || "All"}
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-border text-xs text-text font-medium shadow-2xs">
                      💡 <strong className="text-purple">Suggested Fix:</strong>{" "}
                      {issue.suggestedFix}
                    </div>

                    {issue.evidence[0] && (
                      <div className="text-xs text-muted italic bg-white/80 p-2.5 rounded-lg border-l-2 border-purple">
                        "{issue.evidence[0].quote}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Persona Outcome Filter Tabs */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-text text-sm">Individual Persona Inspector</h3>
              <div className="flex gap-1.5 bg-white p-1 rounded-2xl border border-border shadow-xs">
                {(["all", "success", "partial", "failure"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setPersonaFilter(f)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition ${
                      personaFilter === f
                        ? "bg-purple text-cream font-bold shadow-xs"
                        : "text-muted hover:text-text hover:bg-lavender/20"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPersonas.slice(0, 18).map((p) => (
                <Link
                  key={p.personaId}
                  href={`/runs/${activeRunId}/personas/${p.personaId}`}
                  className="bg-white border border-border rounded-2xl p-4 hover:border-purple/50 transition group shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-muted uppercase">
                      {p.mode} agent
                    </span>
                    <Badge kind={p.outcome ?? "neutral"}>{p.outcome ?? p.status}</Badge>
                  </div>

                  <div className="text-xs text-text font-semibold mt-2 group-hover:text-purple transition">
                    Persona #{p.personaId.slice(0, 8)}
                  </div>

                  {p.result && (
                    <div className="text-xs text-muted mt-2 line-clamp-2">
                      {p.result.frictionNotes[0] ?? "Smooth user experience observed."}
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-t border-border/60 text-[10px] text-purple font-semibold flex items-center justify-between">
                    <span>Inspect journey replay →</span>
                    <span>
                      {p.result?.sentiment !== undefined ? `Sentiment: ${p.result.sentiment > 0 ? "+" : ""}${p.result.sentiment}` : ""}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WORD-OF-MOUTH DIFFUSION */}
      {activeTab === "spread" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-text">Word-of-Mouth Diffusion</h2>
              <p className="text-xs text-muted mt-0.5">
                6-round social cascade simulation modeling viral adoption across peer networks.
              </p>
            </div>
            <button
              onClick={onRerunSpread}
              disabled={spreadSimulating || !activeRunId}
              className="px-4 py-2.5 rounded-2xl bg-purple text-cream font-bold text-xs hover:bg-lavender hover:text-text transition disabled:opacity-50 shadow-xs"
            >
              {spreadSimulating ? "Simulating Cascade…" : "Re-run 6-Round Cascade"}
            </button>
          </div>

          {spread ? (
            <div className="space-y-6">
              <div className="bg-white border border-border rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-text text-sm">
                    Adoption Curve (Cumulative Adopters Over Time)
                  </h3>
                  <span className="text-xs text-purple font-mono font-semibold">
                    {spread.totalReached} / {spread.poolSize} Personas Reached (
                    {Math.round((spread.totalReached / spread.poolSize) * 100)}%)
                  </span>
                </div>
                <AdoptionCurve
                  data={spread.rounds.map((r) => ({
                    round: r.round,
                    cumulativeAdopters: r.cumulativeAdopters,
                  }))}
                  poolSize={spread.poolSize}
                />
              </div>

              {/* Round-by-Round Breakdown */}
              <div className="bg-white border border-border rounded-3xl p-6 shadow-xs">
                <h3 className="font-bold text-text text-sm mb-4">Round-by-Round Progression</h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {spread.rounds.map((r) => (
                    <div
                      key={r.round}
                      className="p-4 rounded-2xl bg-panel2 border border-border flex flex-col justify-between"
                    >
                      <div className="text-xs text-muted font-mono">Cascade Round {r.round}</div>
                      <div className="text-xl font-bold text-text mt-1">
                        +{r.newAdopters.length}{" "}
                        <span className="text-xs font-normal text-muted">new</span>
                      </div>
                      <div className="text-xs text-purple mt-2 font-semibold">
                        Total: {r.cumulativeAdopters} adopters
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-panel2 border border-border text-center space-y-3">
              <p className="text-muted text-sm">
                No viral diffusion cascade recorded for the active benchmark.
              </p>
              <button
                onClick={onRerunSpread}
                disabled={spreadSimulating || !activeRunId}
                className="px-4 py-2 rounded-xl bg-purple text-cream font-semibold text-xs hover:bg-lavender hover:text-text transition shadow-xs"
              >
                Run Cascade Simulation
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: EXECUTIVE REPORT VIEW */}
      {activeTab === "report" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-text">Executive Report View</h2>
              <p className="text-xs text-muted mt-0.5">
                Multi-format deliverables: interactive funnel, friction heatmap, and CI exports.
              </p>
            </div>
            {activeRunId && (
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/runs/${activeRunId}/report`}
                  className="px-4 py-2 rounded-2xl bg-white border border-border text-xs font-semibold text-purple hover:border-purple transition shadow-xs"
                >
                  Open Full Interactive Report →
                </Link>
                <ExportToolbar runId={activeRunId} />
              </div>
            )}
          </div>

          {report ? (
            <div className="space-y-6">
              {/* Funnel Overview */}
              {report.funnel && report.funnel.length > 0 && (
                <div className="bg-white border border-border rounded-3xl p-6 shadow-xs">
                  <FunnelView steps={report.funnel} />
                </div>
              )}

              {/* Friction Heatmap */}
              {report.frictionHeatmap && report.frictionHeatmap.length > 0 && (
                <div className="bg-white border border-border rounded-3xl p-6 shadow-xs">
                  <FrictionHeatmap elements={report.frictionHeatmap} />
                </div>
              )}

              {/* Markdown Source Summary */}
              <div
                className="bg-white border border-border rounded-3xl p-8 max-w-4xl shadow-xs prose prose-stone prose-headings:text-text prose-a:text-purple"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(report.markdown) }}
              />
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-panel2 border border-border text-center text-muted text-sm">
              Report not ready yet. Ensure the benchmark run has completed.
            </div>
          )}
        </div>
      )}

      {/* Real-time Benchmark Run Testing & Loading Panel Modal */}
      {activeRunModal && (
        <BenchmarkLiveModal
          runId={activeRunModal.runId}
          poolId={activeRunModal.poolId}
          targetUrl={activeRunModal.targetUrl}
          userGoal={activeRunModal.userGoal}
          expectedPersonas={activeRunModal.expectedPersonas}
          onClose={() => setActiveRunModal(null)}
          onNavigateToResults={() => {
            setSelectedRunId(activeRunModal.runId);
            setActiveRunModal(null);
            setActiveTab("analytics");
          }}
        />
      )}
    </div>
  );
}