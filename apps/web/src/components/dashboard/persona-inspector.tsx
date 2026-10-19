"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Smile,
  Frown,
  Meh,
  Eye,
  SlidersHorizontal,
  X,
  List,
  LayoutGrid,
  Activity,
  Layers,
} from "lucide-react";

export interface PersonaItem {
  personaId: string;
  mode: "deep" | "light";
  status: string;
  outcome: string | null;
  clusterId?: number | null;
  result?: {
    id: string;
    runId: string;
    personaId: string;
    kind: string;
    outcome: string;
    verdict: Record<string, unknown>;
    sentiment: number;
    wouldRecommend: boolean;
    frictionNotes: string[];
    dropOffStep?: number | null;
    dropOffReason?: string | null;
    screenshotPath?: string | null;
  } | null;
}

interface PersonaInspectorProps {
  personas: PersonaItem[];
  activeRunId: string | null;
}

export function PersonaInspector({ personas, activeRunId }: PersonaInspectorProps) {
  const [outcomeFilter, setOutcomeFilter] = useState<"all" | "success" | "partial" | "failure">("all");
  const [modeFilter, setModeFilter] = useState<"all" | "deep" | "light">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Selected persona for full detailed inspection modal
  const [activePersona, setActivePersona] = useState<PersonaItem | null>(null);

  // Outcome counts for summary strip
  const counts = useMemo(() => {
    const res = { all: personas.length, success: 0, partial: 0, failure: 0, deep: 0, light: 0 };
    personas.forEach((p) => {
      const outcome = (p.outcome || "").toLowerCase();
      if (outcome === "success") res.success++;
      else if (outcome === "partial") res.partial++;
      else if (outcome === "failure") res.failure++;

      if (p.mode === "deep") res.deep++;
      else if (p.mode === "light") res.light++;
    });
    return res;
  }, [personas]);

  // Filtered personas
  const filtered = useMemo(() => {
    return personas.filter((p) => {
      // Outcome filter
      if (outcomeFilter !== "all") {
        if ((p.outcome || "").toLowerCase() !== outcomeFilter) return false;
      }

      // Mode filter
      if (modeFilter !== "all") {
        if (p.mode !== modeFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = p.personaId.toLowerCase().includes(q);
        const clusterMatch = p.clusterId !== undefined && `cluster ${p.clusterId}`.includes(q);
        const noteMatch = (p.result?.frictionNotes || []).some((n) => n.toLowerCase().includes(q));
        const dropMatch = (p.result?.dropOffReason || "").toLowerCase().includes(q);

        if (!idMatch && !clusterMatch && !noteMatch && !dropMatch) return false;
      }

      return true;
    });
  }, [personas, outcomeFilter, modeFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedPersonas = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className="space-y-5">
      {/* 1. Header & Summary Bar */}
      <div className="bg-surface-white border border-border-warm rounded-3xl p-5 shadow-soft-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
              Persona Swarm Telemetry
            </span>
          </div>
          <h3 className="text-lg font-bold text-text-primary mt-0.5">Individual Persona Inspector</h3>
          <p className="text-xs text-text-muted">
            Inspect individual cognitive thought streams, sentiment polarity, and friction drop-off points.
          </p>
        </div>

        {/* Quick Outcome Filter Pills */}
        <div className="flex items-center gap-1.5 bg-surface-cream p-1 rounded-2xl border border-border-warm overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All Swarm", count: counts.all },
            { id: "success", label: "Passed", count: counts.success, color: "text-status-success" },
            { id: "partial", label: "Stuck", count: counts.partial, color: "text-honey-dark" },
            { id: "failure", label: "Dropped", count: counts.failure, color: "text-status-error" },
          ].map((tab) => {
            const isActive = outcomeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setOutcomeFilter(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? "bg-surface-white text-text-primary font-bold shadow-xs border border-border-warm"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-white/60"
                }`}
              >
                <span className={tab.color}>{tab.label}</span>
                <span className="text-[10px] font-mono px-1.5 rounded-full bg-black/5 text-text-tertiary">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Controls & Search Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-surface-white border border-border-warm shadow-soft-card text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by persona ID, friction notes, or drop-off step..."
            className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-surface-cream border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-lavender-light shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode & Mode Filter */}
        <div className="flex items-center gap-2">
          {/* Deep / Light Toggle */}
          <button
            onClick={() => {
              setModeFilter(modeFilter === "all" ? "deep" : modeFilter === "deep" ? "light" : "all");
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl bg-surface-cream border border-border-subtle text-xs font-semibold text-text-muted hover:text-text-primary transition flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3 h-3 text-primary" />
            <span>{modeFilter === "all" ? "All Modes" : modeFilter === "deep" ? "Deep Agents" : "Light Agents"}</span>
          </button>

          {/* List vs Cards View Toggle */}
          <div className="flex items-center bg-surface-cream p-0.5 rounded-xl border border-border-subtle">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "list"
                  ? "bg-surface-white text-primary shadow-2xs"
                  : "text-text-muted hover:text-text-primary"
              }`}
              title="Compact Row List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "cards"
                  ? "bg-surface-white text-primary shadow-2xs"
                  : "text-text-muted hover:text-text-primary"
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. CONTENT: Sleek List View (Default) OR Airy Card Grid */}
      {viewMode === "list" ? (
        <div className="bg-surface-white border border-border-warm rounded-3xl overflow-hidden shadow-soft-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[620px]">
              <thead>
                <tr className="bg-surface-cream border-b border-border-warm text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
                  <th className="py-3 px-4">Persona Agent</th>
                  <th className="py-3 px-4">Cohort</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Valence</th>
                  <th className="py-3 px-4">Key Observation / Friction</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs">
                {paginatedPersonas.map((p) => {
                  const outcome = (p.outcome || "").toLowerCase();
                  const isSuccess = outcome === "success";
                  const isFailure = outcome === "failure";
                  const sentiment = p.result?.sentiment;
                  const wouldRecommend = p.result?.wouldRecommend;
                  const dropStep = p.result?.dropOffStep;

                  return (
                    <tr
                      key={p.personaId}
                      className="hover:bg-surface-cream/50 transition cursor-pointer group"
                      onClick={() => setActivePersona(p)}
                    >
                      {/* Persona Identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 border ${
                              isSuccess
                                ? "bg-status-success-bg border-status-success-border text-status-success"
                                : isFailure
                                ? "bg-status-error-bg border-status-error-border text-status-error"
                                : "bg-status-warning-bg border-status-warning-border text-honey-dark"
                            }`}
                          >
                            {p.personaId.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold font-mono text-text-primary group-hover:text-primary transition">
                                #{p.personaId.slice(0, 8)}
                              </span>
                              {p.mode === "deep" && (
                                <span className="px-1.5 py-0.2 rounded bg-lavender-tint text-primary text-[10px] font-semibold flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5" /> Deep
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-text-tertiary font-mono">
                              {p.status}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cohort */}
                      <td className="py-3.5 px-4 font-medium text-text-secondary">
                        {p.clusterId !== null && p.clusterId !== undefined ? `Cluster #${p.clusterId}` : "Cohort Member"}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <Badge kind={isSuccess ? "success" : isFailure ? "failure" : "neutral"}>
                          {p.outcome || p.status}
                        </Badge>
                      </td>

                      {/* Valence */}
                      <td className="py-3.5 px-4 text-center">
                        {sentiment !== undefined ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono font-semibold text-[11px] border ${
                              sentiment > 0.2
                                ? "bg-status-success-bg text-status-success border-status-success-border"
                                : sentiment < -0.2
                                ? "bg-status-error-bg text-status-error border-status-error-border"
                                : "bg-surface-cream text-text-muted border-border-subtle"
                            }`}
                          >
                            {sentiment > 0.2 ? (
                              <Smile className="w-3 h-3 text-status-success" />
                            ) : sentiment < -0.2 ? (
                              <Frown className="w-3 h-3 text-status-error" />
                            ) : (
                              <Meh className="w-3 h-3 text-text-muted" />
                            )}
                            {sentiment > 0 ? `+${sentiment.toFixed(2)}` : sentiment.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-text-tertiary">—</span>
                        )}
                      </td>

                      {/* Observation */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-xs text-text-muted truncate italic">
                          {p.result?.frictionNotes && p.result.frictionNotes.length > 0 ? (
                            `"${p.result.frictionNotes[0]}"`
                          ) : p.result?.dropOffReason ? (
                            `Drop-off: ${p.result.dropOffReason}`
                          ) : (
                            "Completed goal smoothly without blockers."
                          )}
                        </p>
                        {dropStep !== undefined && dropStep !== null && (
                          <span className="inline-block mt-0.5 text-[10px] font-mono font-semibold text-status-error">
                            Stuck at Step {dropStep}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setActivePersona(p)}
                            className="px-2.5 py-1 rounded-lg bg-surface-cream border border-border-subtle text-[11px] font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-white transition shadow-2xs"
                          >
                            Inspect
                          </button>
                          {activeRunId && (
                            <Link
                              href={`/runs/${activeRunId}/personas/${p.personaId}`}
                              className="p-1 rounded-lg text-primary hover:bg-lavender-tint transition"
                              title="Full Journey Replay"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Airy Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {paginatedPersonas.map((p) => {
            const outcome = (p.outcome || "").toLowerCase();
            const isSuccess = outcome === "success";
            const isFailure = outcome === "failure";
            const sentiment = p.result?.sentiment;

            return (
              <div
                key={p.personaId}
                onClick={() => setActivePersona(p)}
                className="bg-surface-white border border-border-warm rounded-2xl p-4 shadow-soft-card hover:border-lavender-light transition cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 border ${
                        isSuccess
                          ? "bg-status-success-bg border-status-success-border text-status-success"
                          : isFailure
                          ? "bg-status-error-bg border-status-error-border text-status-error"
                          : "bg-status-warning-bg border-status-warning-border text-honey-dark"
                      }`}
                    >
                      {p.personaId.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-xs font-mono text-text-primary">
                        #{p.personaId.slice(0, 8)}
                      </div>
                      <div className="text-[10px] text-text-tertiary">
                        {p.clusterId !== null && p.clusterId !== undefined ? `Cluster #${p.clusterId}` : "Cohort Member"}
                      </div>
                    </div>
                  </div>
                  <Badge kind={isSuccess ? "success" : isFailure ? "failure" : "neutral"}>
                    {p.outcome || p.status}
                  </Badge>
                </div>

                <div className="p-2.5 rounded-xl bg-surface-cream text-[11px] text-text-muted italic line-clamp-2">
                  {p.result?.frictionNotes && p.result.frictionNotes.length > 0 ? (
                    `"${p.result.frictionNotes[0]}"`
                  ) : p.result?.dropOffReason ? (
                    `Drop: ${p.result.dropOffReason}`
                  ) : (
                    "No friction encountered."
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border-subtle">
                  {sentiment !== undefined ? (
                    <span className="font-mono text-text-muted font-semibold">
                      Valence: {sentiment > 0 ? `+${sentiment.toFixed(2)}` : sentiment.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-text-tertiary">—</span>
                  )}
                  <span className="text-primary font-semibold flex items-center gap-0.5">
                    Inspect <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Pagination Strip */}
      <div className="flex items-center justify-between px-2 text-xs text-text-muted">
        <div>
          Showing <strong className="text-text-primary font-mono">{paginatedPersonas.length}</strong> of{" "}
          <strong className="text-text-primary font-mono">{filtered.length}</strong> matching agents
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-xl bg-surface-white border border-border-warm hover:bg-surface-cream disabled:opacity-40 transition shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-mono font-semibold text-text-primary">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-xl bg-surface-white border border-border-warm hover:bg-surface-cream disabled:opacity-40 transition shadow-2xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5. Detailed Persona Modal / Side-Drawer */}
      {activePersona && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface-white border border-border-warm rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 relative max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-lavender-tint border border-border-accent-tint flex items-center justify-center font-mono font-bold text-primary text-sm shadow-2xs">
                  {activePersona.personaId.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-text-primary font-mono">
                      Persona #{activePersona.personaId}
                    </h3>
                    {activePersona.mode === "deep" && (
                      <span className="px-2 py-0.5 rounded-md bg-lavender-tint text-primary text-xs font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Deep Agent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {activePersona.clusterId !== null && activePersona.clusterId !== undefined
                      ? `Assigned to Demographic Cluster #${activePersona.clusterId}`
                      : "Standard Cohort Swarm"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActivePersona(null)}
                className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-cream transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status & Key Metrics */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-surface-cream border border-border-subtle text-center">
                <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Outcome</div>
                <div className="mt-1">
                  <Badge kind={activePersona.outcome || activePersona.status}>
                    {activePersona.outcome || activePersona.status}
                  </Badge>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-surface-cream border border-border-subtle text-center">
                <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Sentiment</div>
                <div className="font-extrabold font-mono text-sm text-text-primary mt-1">
                  {activePersona.result?.sentiment !== undefined
                    ? activePersona.result.sentiment > 0
                      ? `+${activePersona.result.sentiment.toFixed(2)}`
                      : activePersona.result.sentiment.toFixed(2)
                    : "—"}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-surface-cream border border-border-subtle text-center">
                <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Net Promoter</div>
                <div className="text-xs font-bold mt-1">
                  {activePersona.result?.wouldRecommend !== undefined ? (
                    activePersona.result.wouldRecommend ? (
                      <span className="text-status-success flex items-center justify-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> Advocate
                      </span>
                    ) : (
                      <span className="text-status-error flex items-center justify-center gap-1">
                        <ThumbsDown className="w-3 h-3" /> Detractor
                      </span>
                    )
                  ) : (
                    <span className="text-text-tertiary">—</span>
                  )}
                </div>
              </div>
            </div>

            {/* Drop-off / Blockers Breakdown */}
            {activePersona.result?.dropOffReason && (
              <div className="p-3.5 rounded-2xl bg-status-error-bg border border-status-error-border space-y-1">
                <div className="text-xs font-bold text-status-error flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Drop-Off Point (Step {activePersona.result.dropOffStep ?? "N/A"})</span>
                </div>
                <p className="text-xs text-status-error leading-relaxed">
                  {activePersona.result.dropOffReason}
                </p>
              </div>
            )}

            {/* Friction Observations & Quotes */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Verbatim Friction Notes & Observations
              </div>
              <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                {activePersona.result?.frictionNotes && activePersona.result.frictionNotes.length > 0 ? (
                  activePersona.result.frictionNotes.map((note, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-surface-cream border border-border-subtle text-xs text-text-secondary leading-relaxed italic"
                    >
                      "{note}"
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-xl bg-surface-cream border border-border-subtle text-xs text-text-muted italic">
                    No friction anomalies reported during this persona's simulation.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Link */}
            <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
              <button
                onClick={() => setActivePersona(null)}
                className="px-4 py-2 rounded-xl bg-surface-cream hover:bg-surface-white border border-border-warm text-xs font-semibold text-text-muted transition"
              >
                Close
              </button>

              {activeRunId && (
                <Link
                  href={`/runs/${activeRunId}/personas/${activePersona.personaId}`}
                  className="px-4 py-2 rounded-xl bg-primary text-surface-white font-bold text-xs hover:bg-primary-hover transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>Open Full Journey Replay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
