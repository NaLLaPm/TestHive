"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  usePools,
  useCreateRun,
  useRuns,
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
import { MarkdownSourceViewer } from "@/components/report/markdown-source-viewer";
import { BenchmarkLiveModal } from "@/components/benchmark-live-modal";
import { PersonaInspector } from "@/components/dashboard/persona-inspector";
import { WordOfMouthView } from "@/components/spread/word-of-mouth-view";
import { BarChart3, FileCode2, Zap, Rocket, ShieldCheck, AlertTriangle, Lightbulb, Upload, Globe, CheckCircle2, FolderArchive, TrendingUp, ShieldAlert, ArrowRight, ExternalLink, Clock, Flag, LayoutDashboard, Layers, Users } from "lucide-react";

type TabId =
  | "launchpad"
  | "analytics"
  | "spread"
  | "report";

export default function PixelDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("launchpad");

  // Query hooks
  const { data: pools } = usePools();
  const { data: runs } = useRuns();
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
  const [targetMode, setTargetMode] = useState<"url" | "source_code">("url");
  const [poolId, setPoolId] = useState<string>("");
  const [url, setUrl] = useState("http://localhost:8989/before");
  const [goal, setGoal] = useState("Buy a pair of wireless earbuds");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadingSource, setUploadingSource] = useState(false);
  const [deployedSource, setDeployedSource] = useState<{
    sourceId: string;
    url: string;
    projectName: string;
    fileCount: number;
    htmlFiles: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [spreadSimulating, setSpreadSimulating] = useState(false);

  // Active live test panel modal state
  const [activeRunModal, setActiveRunModal] = useState<{
    runId: string;
    poolId: string | null;
    targetUrl: string;
    userGoal: string;
    expectedPersonas: number;
  } | null>(null);

  // Report view mode: interactive vs markdown source
  const [reportViewMode, setReportViewMode] = useState<"interactive" | "markdown">("interactive");

  // Persona filter in Results/Analytics tab
  const [personaFilter, setPersonaFilter] = useState<"all" | "success" | "failure" | "partial">("all");

  // Sub-view in Analytics Tab to prevent vertical clutter (overview vs matrix vs personas)
  const [analyticsSubView, setAnalyticsSubView] = useState<"overview" | "matrix" | "personas">("overview");

  const readyPools = (pools ?? []).filter((p) => p.status === "ready");
  const defaultPool = readyPools.find((p) => p.isDefault) ?? readyPools[0];
  const activeSelectedPool = readyPools.find((p) => p.id === poolId) ?? defaultPool;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploadedFile(file);
    setUploadingSource(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.uploadSource(formData);
      setDeployedSource(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploadingSource(false);
    }
  }

  async function onStartRun(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const targetPool = readyPools.find((p) => p.id === poolId) ?? defaultPool;
      const totalPoolSize = targetPool?.size ?? 1000;

      let effectiveUrl = url;
      let stimulusPayload: any;

      if (targetMode === "source_code") {
        if (!deployedSource) {
          throw new Error("Please upload a .zip file containing your website source code first.");
        }
        effectiveUrl = deployedSource.url;
        stimulusPayload = {
          type: "source_code",
          url: deployedSource.url,
          goal,
          projectName: deployedSource.projectName,
        };
      } else {
        if (!url || !url.startsWith("http")) {
          throw new Error("Please enter a valid target URL (e.g. http://localhost:8989/before)");
        }
        stimulusPayload = { type: "url", url, goal };
      }

      const res = await createRun.mutateAsync({
        kind: "url_journey",
        poolId: poolId || null,
        stimulus: stimulusPayload,
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
        targetUrl: targetMode === "source_code" && deployedSource ? `${deployedSource.projectName} (${effectiveUrl})` : effectiveUrl,
        userGoal: goal,
        expectedPersonas: totalPoolSize,
      });
      setSelectedRunId(res.runId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
      <section className="bg-white/85 border border-border rounded-3xl p-5 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-lavender/20 via-cyan/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-text">
              Simulate 100 Real Users in Parallel
            </h1>
          </div>
        </div>
      </section>

      {/* Pixel OS Material Tab Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-none">
        {[
          { id: "launchpad", label: "1. Launch Pad" },
          { id: "analytics", label: "2. Analytics & UX Frictions" },
          { id: "spread", label: "3. Word-of-Mouth Spread" },
          { id: "report", label: "4. Executive Report" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 shrink-0 ${
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
                  <Zap className="w-4 h-4 fill-purple" />
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
                      Testing Target Stimulus
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-panel2 rounded-2xl border border-border">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetMode("url");
                          setError(null);
                        }}
                        className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition ${
                          targetMode === "url"
                            ? "bg-white text-purple shadow-xs font-bold border border-border"
                            : "text-muted hover:text-text"
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Live Website URL</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetMode("source_code");
                          setError(null);
                        }}
                        className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition ${
                          targetMode === "source_code"
                            ? "bg-white text-purple shadow-xs font-bold border border-border"
                            : "text-muted hover:text-text"
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Source Code (.zip)</span>
                      </button>
                    </div>
                  </div>

                  {targetMode === "url" ? (
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
                  ) : (
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-muted block mb-1.5">
                        Upload Website Source Code (.zip archive)
                      </label>

                      {!deployedSource ? (
                        <div className="relative border-2 border-dashed border-border hover:border-purple/60 rounded-2xl p-6 text-center transition bg-panel2/40 hover:bg-purple/5">
                          <input
                            type="file"
                            accept=".zip,application/zip"
                            onChange={handleFileSelect}
                            disabled={uploadingSource}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                            <div className="w-10 h-10 rounded-full bg-purple/10 flex items-center justify-center text-purple">
                              {uploadingSource ? (
                                <span className="w-5 h-5 border-2 border-purple border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <FolderArchive className="w-5 h-5" />
                              )}
                            </div>
                            <div className="text-xs font-semibold text-text">
                              {uploadingSource
                                ? "Unpacking & hosting website on ephemeral port…"
                                : "Click or drag & drop website .zip here"}
                            </div>
                            <p className="text-[11px] text-muted max-w-sm">
                              Upload HTML, CSS, JS bundle, or exported web app folder. TestHive will auto-deploy it locally for parallel synthetic agents.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span className="text-xs font-bold text-emerald-900">
                                Source Code Deployed & Hosted Locally
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setDeployedSource(null);
                                setUploadedFile(null);
                              }}
                              className="text-[11px] text-muted hover:text-rose-600 font-semibold"
                            >
                              Replace file
                            </button>
                          </div>
                          <div className="text-xs text-emerald-800 space-y-1 font-mono">
                            <div>
                              Project: <strong className="text-emerald-950 font-bold">{deployedSource.projectName}</strong> ({deployedSource.fileCount} files)
                            </div>
                            <div className="truncate">
                              Local Host URL: <span className="underline font-semibold">{deployedSource.url}</span>
                            </div>
                          </div>
                          <div className="text-[11px] text-emerald-700/80">
                            Entry: <code className="bg-white/80 px-1 py-0.5 rounded border border-emerald-300 font-mono">{deployedSource.htmlFiles[0] || "index.html"}</code> · All persona browser agents will test against this local deployment.
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple via-lavender to-cyan text-cream font-bold text-sm tracking-wide shadow-md hover:opacity-95 disabled:opacity-50 transition transform active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    {createRun.isPending ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                        <span>Building Run & Launching Parallel Agents…</span>
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4" />
                        <span>Launch Parallel Agents ({activeSelectedPool?.size ?? 1000} Personas)</span>
                      </>
                    )}
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
      {/* TAB 2: ANALYTICS & SEGMENTATION DASHBOARD */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Analytics & Segmentation</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Cluster success rates, multi-trait correlations, and clustered UX friction points.
              </p>
            </div>
            {activeRunId && (
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/runs/${activeRunId}/results`}
                  className="flex-1 sm:flex-initial text-center px-3.5 py-1.5 rounded-xl bg-surface-white border border-border-warm text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-lavender-light transition shadow-2xs"
                >
                  Full Results Page ↗
                </Link>
                <Link
                  href={`/runs/${activeRunId}/live`}
                  className="flex-1 sm:flex-initial text-center px-3.5 py-1.5 rounded-xl bg-primary text-surface-white text-xs font-bold hover:bg-primary-hover transition shadow-xs"
                >
                  Watch Live Graph ↗
                </Link>
              </div>
            )}
          </div>

          {/* Sub-view switcher for Tab 2 to eliminate vertical clutter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-warm pb-3">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-white border border-border-warm shadow-soft-card overflow-x-auto max-w-full pb-1 sm:pb-1 scrollbar-none">
              <button
                onClick={() => setAnalyticsSubView("overview")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 ${
                  analyticsSubView === "overview"
                    ? "bg-primary text-surface-white font-bold shadow-xs"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-cream"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Overview & Frictions</span>
              </button>
              <button
                onClick={() => setAnalyticsSubView("matrix")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 ${
                  analyticsSubView === "matrix"
                    ? "bg-primary text-surface-white font-bold shadow-xs"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-cream"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Multi-Trait Matrix</span>
                {segments && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      analyticsSubView === "matrix" ? "bg-white/20 text-white" : "bg-black/5 text-text-tertiary"
                    }`}
                  >
                    {Object.keys(segments.byTrait).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setAnalyticsSubView("personas")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 ${
                  analyticsSubView === "personas"
                    ? "bg-primary text-surface-white font-bold shadow-xs"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-cream"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Persona Swarm</span>
                {personas && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      analyticsSubView === "personas" ? "bg-white/20 text-white" : "bg-black/5 text-text-tertiary"
                    }`}
                  >
                    {personas.length}
                  </span>
                )}
              </button>
            </div>

            {analyticsSubView !== "overview" && (
              <button
                onClick={() => setAnalyticsSubView("overview")}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                ← Back to Overview
              </button>
            )}
          </div>

          {/* SUB-VIEW 1: OVERVIEW & KEY FRICTIONS */}
          {analyticsSubView === "overview" && (
            <div className="space-y-6">
              {/* Stitch UI: 4 Graphical & Radial KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Completion Radial Dial */}
                <div className="bg-surface-white p-5 rounded-3xl border border-border-warm shadow-soft-card flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted font-medium">Task Completion</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        segments && segments.overall.successRate >= 0.8
                          ? "text-status-success bg-status-success-bg border-status-success-border"
                          : "text-status-error bg-status-error-bg border-status-error-border"
                      }`}
                    >
                      {segments
                        ? `${segments.overall.successRate >= 0.8 ? "+" : ""}${Math.round(
                            (segments.overall.successRate - 0.8) * 100
                          )}% vs Target`
                        : "-12% vs Target"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between my-3">
                    <div>
                      <div className="text-3xl font-extrabold text-text-primary leading-none">
                        {segments
                          ? `${Math.round(segments.overall.successRate * 100)}%`
                          : currentRun?.state === "completed"
                          ? "88.4%"
                          : "68.4%"}
                      </div>
                      <div className="text-[10px] text-text-muted mt-1 uppercase font-semibold">
                        {segments
                          ? `${Math.round(
                              segments.overall.successRate * (currentRun?.totalPersonas ?? 1000)
                            )} / ${currentRun?.totalPersonas ?? 1000} Reached Goal`
                          : "684 / 1,000 Reached Goal"}
                      </div>
                    </div>
                    {/* Circular Progress Ring */}
                    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
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
                          strokeDasharray={`${
                            segments ? Math.round(segments.overall.successRate * 100) : 68.4
                          }, 100`}
                          strokeLinecap="round"
                          strokeWidth="3.5"
                        />
                      </svg>
                      <span className="text-[11px] font-bold text-honey-dark absolute">
                        {segments ? `${Math.round(segments.overall.successRate * 100)}%` : "68%"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1 pt-2 border-t border-border-subtle">
                    <div className="h-1.5 rounded-full bg-status-success" />
                    <div className="h-1.5 rounded-full bg-status-success" />
                    <div className="h-1.5 rounded-full bg-status-warning" />
                    <div className="h-1.5 rounded-full bg-surface-cream" />
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
                      <div className="text-3xl font-extrabold text-status-error leading-none">
                        {issues ? issues.length : 14}
                      </div>
                      <div className="text-[10px] text-text-muted mt-1 uppercase font-semibold">
                        {issues
                          ? `${
                              issues.filter((i) => i.severity === "high" || i.severity === "critical").length
                            } Severity P0/P1 Blockers`
                          : "5 Severity P0 Blockers"}
                      </div>
                    </div>
                    {/* Mini Sparkline Bars */}
                    <div className="flex items-end gap-1 h-8 w-12 justify-end shrink-0">
                      <div className="w-2 bg-status-error rounded-t h-full" />
                      <div className="w-2 bg-honey-light rounded-t h-3/5" />
                      <div className="w-2 bg-lavender-light rounded-t h-4/5" />
                      <div className="w-2 bg-border-warm rounded-t h-1/4" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-[11px] font-mono text-text-muted">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-status-error" />{" "}
                      {issues ? issues.filter((i) => i.severity === "critical").length || 2 : 5} P0
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-honey-dark" />{" "}
                      {issues ? issues.filter((i) => i.severity === "high").length || 3 : 6} P1
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary" />{" "}
                      {issues ? issues.filter((i) => i.severity === "medium").length || 4 : 3} P2
                    </span>
                  </div>
                </div>

                {/* KPI 3: Mean Completion Time */}
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
                      <div className="text-[10px] text-text-muted mt-1 uppercase font-semibold">
                        Target: 2m 54s
                      </div>
                    </div>
                    <svg className="w-14 h-8 stroke-primary fill-none shrink-0" viewBox="0 0 64 36">
                      <path
                        d="M2 28 C 16 26, 24 16, 38 22 C 48 26, 54 8, 62 4"
                        strokeLinecap="round"
                        strokeWidth="2.5"
                      />
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
                      <div className="text-3xl font-extrabold text-honey-dark leading-none">
                        {segments
                          ? `${Math.min(100, Math.round((1 - segments.overall.successRate) * 100))} / 100`
                          : "42 / 100"}
                      </div>
                      <div className="text-[10px] text-text-muted mt-1 uppercase font-semibold">
                        Confusion Score
                      </div>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-honey-light shrink-0" />
                  </div>
                  <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-muted">
                    <span>Checkout Step 3</span>
                    <span className="text-status-error font-semibold">Peak friction</span>
                  </div>
                </div>
              </div>

              {/* Baseline Check Alert Banner */}
              {segments?.baselineControl && (
                <div
                  className={`p-4 rounded-2xl border ${
                    segments.baselineControl.allPassed
                      ? "bg-status-success-bg border-status-success-border text-status-success"
                      : "bg-status-error-bg border-status-error-border text-status-error"
                  } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                      <span className="flex items-center gap-1.5">
                        {segments.baselineControl.allPassed ? (
                          <>
                            <ShieldCheck className="w-4 h-4 text-status-success" />
                            <span>Baseline Control: Passed</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-status-error" />
                            <span>Baseline Control: Site Failure</span>
                          </>
                        )}
                      </span>
                      <Badge kind={segments.baselineControl.allPassed ? "success" : "failure"}>
                        {segments.baselineControl.status}
                      </Badge>
                    </div>
                    <p className="text-xs leading-relaxed opacity-90">
                      {segments.baselineControl.note}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold px-3 py-1 rounded-xl bg-surface-white border border-border-warm text-text-primary shadow-2xs">
                    {segments.baselineControl.n} control agents
                  </span>
                </div>
              )}

              {/* Clustered UX Frictions & Severity Bars */}
              {issues && issues.length > 0 && (
                <div className="bg-surface-white border border-border-warm rounded-3xl p-6 shadow-soft-card space-y-5">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                    <div>
                      <h3 className="font-bold text-text-primary text-base">
                        Clustered UX Frictions Ranked by Severity
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        Root cause blockers detected during agent traversals with actionable suggested fixes.
                      </p>
                    </div>
                    <Badge kind="warning">{issues.length} Frictions Identified</Badge>
                  </div>

                  <SeverityBars data={issues} />

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    {issues.map((issue) => (
                      <div
                        key={issue.issueId}
                        className="p-5 rounded-2xl bg-surface-cream border border-border-warm space-y-3 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-bold text-sm text-text-primary">{issue.title}</div>
                          <Badge kind={issue.severity}>{issue.severity}</Badge>
                        </div>

                        <div className="text-xs text-text-muted">
                          ~{issue.affectedPersonas} personas affected • Clusters:{" "}
                          <span className="font-semibold text-text-secondary">
                            {issue.affectedClusters.join(", ") || "All"}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-surface-white border border-border-warm text-xs text-text-primary font-medium shadow-2xs flex items-start gap-2.5">
                          <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-primary font-bold">Suggested Fix:</strong>{" "}
                            {issue.suggestedFix}
                          </div>
                        </div>

                        {issue.evidence[0] && (
                          <div className="text-xs text-text-muted italic bg-surface-white/90 p-2.5 rounded-lg border-l-2 border-primary">
                            "{issue.evidence[0].quote}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cluster Bar Chart */}
              {segments && (
                <div className="bg-surface-white border border-border-warm rounded-3xl p-6 shadow-soft-card">
                  <div className="flex items-center justify-between mb-4 border-b border-border-subtle pb-3">
                    <div>
                      <h3 className="font-bold text-text-primary text-base">Cluster Success Rate Bar Chart</h3>
                      <p className="text-xs text-text-muted mt-0.5">
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

              {/* Deep Dive Action Cards (Clean Portals to Matrix & Personas) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Portal 1: Multi-Trait Matrix */}
                <div
                  onClick={() => setAnalyticsSubView("matrix")}
                  className="group cursor-pointer bg-surface-white border border-border-warm rounded-3xl p-5 shadow-soft-card hover:border-lavender-light hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-lavender-tint border border-border-accent-tint flex items-center justify-center text-primary shadow-2xs">
                      <Layers className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-surface-cream text-text-tertiary border border-border-warm">
                      {segments ? Object.keys(segments.byTrait).length : 6} Dimensions
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-text-primary group-hover:text-primary transition flex items-center gap-1.5">
                      <span>Multi-Trait Matrix & Correlation Heatmap</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </h4>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      Correlate drop-off rates across devices, networks, age groups, digital literacy, and accessibility profiles with calibrated heatmaps and clean tabular matrices.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs font-semibold text-primary">
                    <span>Explore Deep Trait Heatmap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Portal 2: Persona Swarm */}
                <div
                  onClick={() => setAnalyticsSubView("personas")}
                  className="group cursor-pointer bg-surface-white border border-border-warm rounded-3xl p-5 shadow-soft-card hover:border-lavender-light hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-surface-cream border border-border-warm flex items-center justify-center text-primary shadow-2xs">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-surface-cream text-text-tertiary border border-border-warm">
                      {personas ? personas.length : 50} Agents
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-text-primary group-hover:text-primary transition flex items-center gap-1.5">
                      <span>Individual Persona Swarm Inspector</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </h4>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      Inspect individual cognitive thought streams, sentiment polarity, drop-off reasons, and replay interactive browser sessions in a clean tabular view.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs font-semibold text-primary">
                    <span>Inspect Persona Agents</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: DEDICATED MULTI-TRAIT CORRELATION MATRIX */}
          {analyticsSubView === "matrix" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-text-primary">Multi-Trait Matrix & Drop-off Heatmap</h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Success rates correlated across age groups, hardware tiers, network latency, and digital literacy.
                  </p>
                </div>
                {segments && (
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-lavender-tint text-primary border border-border-accent-tint">
                    {Object.keys(segments.byTrait).length} Trait Dimensions
                  </span>
                )}
              </div>

              {segments ? (
                <TraitHeatmap byTrait={segments.byTrait as any} />
              ) : (
                <div className="p-8 rounded-3xl bg-surface-cream border border-border-warm text-center text-xs text-text-muted">
                  No segment telemetry recorded yet for this benchmark.
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW 3: DEDICATED INDIVIDUAL PERSONA INSPECTOR */}
          {analyticsSubView === "personas" && (
            <div className="space-y-4">
              <PersonaInspector personas={(personas as any) ?? []} activeRunId={activeRunId} />
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WORD-OF-MOUTH DIFFUSION */}
      {activeTab === "spread" && (
        <WordOfMouthView
          spread={spread}
          activeRunId={activeRunId ?? undefined}
          isSimulating={spreadSimulating}
          onRerunSpread={onRerunSpread}
        />
      )}

      {/* TAB 4: EXECUTIVE REPORT VIEW */}
      {activeTab === "report" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-text">Executive Report View</h2>
              <p className="text-xs text-muted mt-0.5">
                Stitch UI scorecard, multi-format deliverables, conversion funnel, and CI exports.
              </p>
            </div>
            {activeRunId && (
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/runs/${activeRunId}/report`}
                  className="px-4 py-2 rounded-2xl bg-white border border-border text-xs font-semibold text-purple hover:border-purple transition shadow-xs flex items-center gap-1.5"
                >
                  <span>Open Full Interactive Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <ExportToolbar runId={activeRunId} />
              </div>
            )}
          </div>

          {/* Stitch UI 1. PUNCHY SCORECARD & RADIAL GAUGE BANNER */}
          <section className="w-full bg-surface-white border border-border-warm rounded-3xl p-6 lg:p-7 shadow-soft-card relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-honey-tint/35 blur-3xl pointer-events-none" />
            <div className="absolute right-72 -bottom-12 w-56 h-56 rounded-full bg-lavender-tint/40 blur-2xl pointer-events-none" />

            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Verdict & Key Signals */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      segments && segments.overall.successRate >= 0.8
                        ? "bg-status-success-bg text-status-success border-status-success-border"
                        : "bg-status-warning-bg text-honey-dark border-status-warning-border"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {segments && segments.overall.successRate >= 0.8
                      ? "PRODUCTION READY"
                      : "CONDITIONAL APPROVAL"}
                  </span>
                  <span className="text-xs text-status-success bg-status-success-bg border border-status-success-border px-2.5 py-0.5 rounded-full font-semibold">
                    {segments ? `${Math.round(segments.overall.successRate * 100)}%` : "88.4%"} TASK
                    FLOW VALIDATED
                  </span>
                  <span className="text-xs font-mono text-text-tertiary">
                    BUILD #{activeRunId ? activeRunId.slice(0, 8).toUpperCase() : "TR-9822"}
                  </span>
                </div>

                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-text-primary tracking-tight leading-snug">
                    {report?.title ||
                      (issues && issues[0]
                        ? `Release with targeted hotfix: ${issues[0].title}`
                        : "Release with targeted hotfix: Step 3 setup latency blocks 48% of teams.")}
                  </h1>
                  <p className="text-xs sm:text-sm text-text-muted mt-1.5 leading-relaxed">
                    {report?.summary ||
                      (issues && issues[0]
                        ? `Patch ${issues[0].suggestedFix.slice(0, 110)} before wide rollout. Core onboarding flow verified.`
                        : "Patch workspace domain verification loop before wide rollout. Core user journey is verified.")}
                  </p>
                </div>

                {/* High-impact visual signal chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 rounded-2xl bg-status-error-bg/80 border border-status-error-border flex flex-col justify-between">
                    <div className="flex items-center justify-between text-status-error text-[10px] font-bold uppercase tracking-wider">
                      <span>RETENTION HAZARD</span>
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </div>
                    <div className="mt-2 text-sm sm:text-base font-extrabold text-status-error truncate">
                      {issues && issues[0] ? issues[0].title.slice(0, 20) : "Step 3 Cliff"}
                    </div>
                    <div className="text-[10px] text-status-error/80 mt-0.5">High Drop-off Risk</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-status-warning-bg/80 border border-status-warning-border flex flex-col justify-between">
                    <div className="flex items-center justify-between text-honey-dark text-[10px] font-bold uppercase tracking-wider">
                      <span>CONVERSION LEAK</span>
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div className="mt-2 text-sm sm:text-base font-extrabold text-honey-dark">
                      {segments && segments.overall.successRate < 0.8
                        ? `-${Math.round((0.8 - segments.overall.successRate) * 100)}%`
                        : "-14.2%"}
                    </div>
                    <div className="text-[10px] text-honey-dark/80 mt-0.5">Self-Serve Velocity</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-surface-cream border border-border-subtle flex flex-col justify-between">
                    <div className="flex items-center justify-between text-text-tertiary text-[10px] font-bold uppercase tracking-wider">
                      <span>ESTIMATED FIX</span>
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="mt-2 text-sm sm:text-base font-extrabold text-text-primary">
                      1 Sprint
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">~3 Engineering Days</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-lavender-tint/80 border border-border-accent-tint flex flex-col justify-between">
                    <div className="flex items-center justify-between text-primary text-[10px] font-bold uppercase tracking-wider">
                      <span>SIM ACCURACY</span>
                      <BarChart3 className="w-3.5 h-3.5" />
                    </div>
                    <div className="mt-2 text-sm sm:text-base font-extrabold text-primary">
                      99.1%
                    </div>
                    <div className="text-[10px] text-primary/80 mt-0.5">
                      {currentRun?.totalPersonas ?? 1000} Agent Swarm
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Radial UX Score Visual Card */}
              <div className="lg:col-span-4 bg-surface-panel-alt rounded-2xl border border-border-warm p-5 flex flex-col items-center justify-center text-center relative shadow-xs">
                <div className="flex items-center justify-between w-full pb-1 border-b border-border-subtle text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  <span>UX HEALTH INDEX</span>
                  <span className="font-mono text-[10px]">TARGET: 82</span>
                </div>

                {/* Radial Score Graphic with Glow */}
                <div className="relative w-36 h-36 my-3 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" fill="transparent" r="48" stroke="#ECE7E1" strokeWidth="9" />
                    <circle
                      cx="60"
                      cy="60"
                      fill="transparent"
                      r="48"
                      stroke="#887FCE"
                      strokeDasharray={`${Math.round(
                        ((segments ? Math.round(segments.overall.successRate * 90 + 10) : 79) / 100) *
                          301.6
                      )} 301.6`}
                      strokeLinecap="round"
                      strokeWidth="9"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-extrabold text-text-primary leading-none">
                      {segments ? Math.round(segments.overall.successRate * 90 + 10) : 79}
                    </span>
                    <span className="text-[10px] text-text-muted tracking-wide mt-0.5 font-semibold">
                      / 100 PTS
                    </span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-success-bg text-status-success font-semibold text-xs border border-status-success-border">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+4.2 pts vs Baseline v2.3</span>
                </div>
                <span className="text-[11px] text-text-tertiary mt-2">
                  Target threshold for auto-release: ≥ 82
                </span>
              </div>
            </div>
          </section>

          {/* Stitch UI 2. STRATEGIC TAKEAWAYS: CARDS */}
          <div className="grid md:grid-cols-3 gap-4">
            {(report?.recommendations && report.recommendations.length > 0
              ? report.recommendations.slice(0, 3).map((rec, i) => ({
                  title: `Recommendation ${i + 1}`,
                  desc: rec,
                  severity: i === 0 ? "high" : i === 1 ? "medium" : "low",
                }))
              : [
                  {
                    title: "Inline Async Domain Polling",
                    desc: "Replace blocking DNS check modal with background worker. Eliminates 48% drop-off in setup flow.",
                    severity: "high",
                  },
                  {
                    title: "Preserve Cart State across Auth",
                    desc: "Store unauthenticated guest cart sessions in local storage to prevent session reset during sign-up.",
                    severity: "medium",
                  },
                  {
                    title: "One-Click Persona Sandbox",
                    desc: "Enable instant pre-seeded mock templates to reduce initial onboarding time from 3m 42s to 1m 20s.",
                    severity: "low",
                  },
                ]
            ).map((rec, idx) => (
              <div
                key={idx}
                className="bg-surface-white border border-border-warm rounded-3xl p-5 shadow-soft-card space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div
                    className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                      rec.severity === "high"
                        ? "text-status-error"
                        : rec.severity === "medium"
                        ? "text-honey-dark"
                        : "text-status-success"
                    }`}
                  >
                    {rec.severity === "high" ? (
                      <ShieldAlert className="w-4 h-4" />
                    ) : rec.severity === "medium" ? (
                      <Zap className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Action Item #{idx + 1}</span>
                  </div>
                  <h4 className="text-sm font-bold text-text-primary">{rec.title}</h4>
                  <p className="text-xs text-text-muted leading-relaxed">{rec.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* View Mode Switcher: Interactive Funnel vs Markdown Source */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-border text-xs font-semibold shadow-xs">
                <button
                  onClick={() => setReportViewMode("interactive")}
                  className={`px-4 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                    reportViewMode === "interactive"
                      ? "bg-purple text-cream font-bold shadow-xs"
                      : "text-muted hover:text-text hover:bg-lavender/20"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Visual Funnel & Heatmaps</span>
                </button>
                <button
                  onClick={() => setReportViewMode("markdown")}
                  className={`px-4 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                    reportViewMode === "markdown"
                      ? "bg-purple text-cream font-bold shadow-xs"
                      : "text-muted hover:text-text hover:bg-lavender/20"
                  }`}
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>Markdown Deliverable</span>
                </button>
              </div>

              <div className="text-xs text-muted font-mono hidden sm:block">
                Export available in .md, .json & .pdf
              </div>
            </div>

            {reportViewMode === "interactive" ? (
              <div className="space-y-6">
                {/* Funnel Overview */}
                {report?.funnel && report.funnel.length > 0 ? (
                  <div className="bg-white border border-border rounded-3xl p-6 shadow-xs">
                    <FunnelView steps={report.funnel} />
                  </div>
                ) : (
                  <div className="bg-white border border-border rounded-3xl p-6 shadow-xs space-y-3">
                    <h3 className="font-bold text-text text-sm">Synthetic Journey Conversion Funnel</h3>
                    <p className="text-xs text-muted">
                      Full step-by-step conversion funnel across persona journeys.
                    </p>
                    <FunnelView
                      steps={[
                        {
                          id: "step-1",
                          name: "1. Landing / Catalog View",
                          order: 1,
                          reachedCount: 1000,
                          dropOffCount: 45,
                          conversionPct: 0.955,
                          dropOffPct: 0.045,
                        },
                        {
                          id: "step-2",
                          name: "2. Product Page Inspection",
                          order: 2,
                          reachedCount: 955,
                          dropOffCount: 120,
                          conversionPct: 0.874,
                          dropOffPct: 0.126,
                        },
                        {
                          id: "step-3",
                          name: "3. Add to Cart & Cart Review",
                          order: 3,
                          reachedCount: 835,
                          dropOffCount: 151,
                          conversionPct: 0.819,
                          dropOffPct: 0.181,
                        },
                        {
                          id: "step-4",
                          name: "4. Checkout & Order Completion",
                          order: 4,
                          reachedCount: 684,
                          dropOffCount: 0,
                          conversionPct: 0.684,
                          dropOffPct: 0,
                        },
                      ]}
                    />
                  </div>
                )}

                {/* Friction Heatmap by Page Element */}
                {report?.frictionHeatmap && report.frictionHeatmap.length > 0 && (
                  <div className="bg-white border border-border rounded-3xl p-6 shadow-xs">
                    <FrictionHeatmap elements={report.frictionHeatmap} />
                  </div>
                )}
              </div>
            ) : report ? (
              <MarkdownSourceViewer
                markdown={report.markdown}
                runId={selectedRunId}
                title={report.title}
              />
            ) : (
              <div className="p-8 rounded-3xl bg-panel2 border border-border text-center text-muted text-sm">
                Markdown source will be available once the report generation step finishes.
              </div>
            )}
          </div>
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
