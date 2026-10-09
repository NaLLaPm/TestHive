"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRun } from "@/lib/queries";
import { useSSE } from "@/lib/use-sse";
import { api } from "@testhive/api-client";
import { NetworkGraph, type NodeState } from "@/components/network-graph";
import { Badge } from "@/components/ui/badge";
import type { GraphPayload } from "@testhive/contracts";

export default function LiveRunPage() {
  const { id } = useParams<{ id: string }>();
  const { data: run } = useRun(id);
  const [graph, setGraph] = useState<GraphPayload | null>(null);
  const nodeStatesRef = useRef<Map<string, NodeState>>(new Map());
  const [, forceRerender] = useState(0);
  const [feed, setFeed] = useState<string[]>([]);
  const events = useSSE(id ? `/api/runs/${id}/stream` : null);

  useEffect(() => {
    if (!run?.poolId) return;
    api.getGraph(run.poolId).then(setGraph).catch(() => undefined);
  }, [run?.poolId]);

  const [activeWorkers, setActiveWorkers] = useState<Map<string, { id: string; mode: string; step?: number; action?: string }>>(new Map());
  const [successCount, setSuccessCount] = useState(0);
  const [partialCount, setPartialCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [liveIssues, setLiveIssues] = useState<Array<{ id: string; title: string; count: number }>>([]);

  useEffect(() => {
    if (!id) return;
    api.getNodeStates(id).then((states) => {
      let s = 0;
      let p = 0;
      let f = 0;
      for (const st of states) {
        nodeStatesRef.current.set(st.id, st);
        if (st.status === "done") {
          if (st.outcome === "success") s++;
          else if (st.outcome === "partial") p++;
          else if (st.outcome === "failure") f++;
        }
      }
      setSuccessCount(s);
      setPartialCount(p);
      setFailureCount(f);
      forceRerender((v) => v + 1);
    });
  }, [id]);

  useEffect(() => {
    for (const ev of events) {
      if (ev.type === "persona.started") {
        nodeStatesRef.current.set(ev.personaId, { id: ev.personaId, status: "running", outcome: null });
        setActiveWorkers((prev) => {
          const next = new Map(prev);
          next.set(ev.personaId, { id: ev.personaId, mode: ev.mode, step: 1, action: "Initialized persona journey" });
          if (next.size > 10) {
            const first = next.keys().next().value;
            if (first) next.delete(first);
          }
          return next;
        });
        setFeed((f) => [`▶ Persona #${ev.personaId.slice(0, 6)} started (${ev.mode} agent)`, ...f].slice(0, 80));
      } else if (ev.type === "persona.step") {
        const actionDesc =
          typeof ev.action === "object" && ev.action !== null
            ? (ev.action as any).action || "Evaluating step"
            : "Executing step";
        setActiveWorkers((prev) => {
          const next = new Map(prev);
          const current = next.get(ev.personaId);
          if (current) {
            next.set(ev.personaId, { ...current, step: ev.step, action: ev.note || actionDesc });
          }
          return next;
        });
        setFeed((f) => [`  ↳ Persona #${ev.personaId.slice(0, 6)} Step ${ev.step}: ${ev.note || actionDesc}`, ...f].slice(0, 80));
      } else if (ev.type === "persona.done") {
        nodeStatesRef.current.set(ev.personaId, { id: ev.personaId, status: "done", outcome: ev.outcome });
        setActiveWorkers((prev) => {
          const next = new Map(prev);
          next.delete(ev.personaId);
          return next;
        });
        if (ev.outcome === "success") setSuccessCount((c) => c + 1);
        else if (ev.outcome === "partial") setPartialCount((c) => c + 1);
        else if (ev.outcome === "failure") setFailureCount((c) => c + 1);
        setFeed((f) => [`✔ Persona #${ev.personaId.slice(0, 6)} completed — outcome: ${ev.outcome}`, ...f].slice(0, 80));
      } else if (ev.type === "issue.found") {
        setLiveIssues((prev) => (prev.some((i) => i.id === ev.issueId) ? prev : [{ id: ev.issueId, title: ev.title, count: ev.count }, ...prev]));
        setFeed((f) => [`⚠ Friction discovered: "${ev.title}" (affected ~${ev.count} personas)`, ...f].slice(0, 80));
      } else if (ev.type === "spread.round") {
        setFeed((f) => [`🌐 Social cascade Round ${ev.round}: +${ev.newAdopters.length} peer adopters reached`, ...f].slice(0, 80));
      } else if (ev.type === "run.state") {
        setFeed((f) => [`→ Run phase shifted to: ${ev.state} (${ev.progress.done}/${ev.progress.total})`, ...f].slice(0, 80));
      } else if (ev.type === "run.completed") {
        setFeed((f) => [`✅ Benchmark run completed. All personas synthesized.`, ...f].slice(0, 80));
      } else if (ev.type === "run.error") {
        setFeed((f) => [`✖ Benchmark execution error: ${ev.message}`, ...f].slice(0, 80));
      }
    }
    if (events.length > 0) forceRerender((v) => v + 1);
  }, [events]);

  const progress = useMemo(() => {
    if (!run) return { done: 0, total: 0 };
    return { done: run.donePersonas, total: run.totalPersonas };
  }, [run]);

  const pct = Math.min(100, Math.round(((progress.done || 0) / Math.max(1, progress.total || 1)) * 100));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              {run?.state !== "completed" && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${run?.state === "completed" ? "bg-emerald-500" : "bg-purple"}`}></span>
            </span>
            <h1 className="text-2xl font-bold text-text">
              Live Testing Console: {progress.total} Personas
            </h1>
          </div>
          <p className="text-xs text-muted font-mono mt-1">
            {run?.stimulus.type === "url" ? run.stimulus.url : run?.kind} {run?.stimulus.type === "url" ? `· "${run.stimulus.goal}"` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {run && (
            <Badge kind={run.state === "completed" ? "success" : run.state === "failed" ? "failure" : "neutral"}>
              {run.state.toUpperCase()}
            </Badge>
          )}
          {id && (
            <Link
              href={`/runs/${id}/results`}
              className="px-3.5 py-1.5 rounded-xl bg-purple text-cream text-xs font-bold hover:bg-lavender hover:text-text transition shadow-xs"
            >
              Results & Heatmap →
            </Link>
          )}
        </div>
      </div>

      {/* Progress & Live Persona Metric Bar */}
      <div className="card p-5 space-y-3 bg-white border border-border rounded-3xl shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text">
              Parallel Testing Execution: <strong className="font-mono text-purple">{progress.done}</strong> / {progress.total} personas
            </span>
            <span className="text-muted font-mono">({pct}%)</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {successCount} Passed
            </span>
            <span className="text-amber-700 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> {partialCount} Partial
            </span>
            <span className="text-rose-700 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> {failureCount} Dropped
            </span>
          </div>
        </div>

        <div className="h-3.5 w-full bg-panel2 rounded-full overflow-hidden border border-border p-0.5 shadow-inner">
          <div
            className={`h-full bg-gradient-to-r from-purple via-lavender to-cyan rounded-full transition-all duration-300 relative overflow-hidden shadow-xs ${
              run?.state !== "completed" && run?.state !== "failed" ? "animate-progress-shiver" : ""
            }`}
            style={{ width: `${pct}%` }}
          >
            {/* Glass shimmer sweep highlight */}
            <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none animate-shimmer-sweep" />
            <div className="absolute inset-0 bg-white/15 animate-pulse pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Active Workers Strip */}
      {activeWorkers.size > 0 && (
        <div className="card p-4 bg-panel2 border border-border rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple animate-ping" />
              Active Testing Workers ({activeWorkers.size})
            </span>
            <span className="text-[10px] font-mono text-muted">concurrency=10</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {Array.from(activeWorkers.values()).map((w) => (
              <div key={w.id} className="p-2.5 rounded-xl bg-white border border-border shadow-xs text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-text text-[11px]">#{w.id.slice(0, 6)}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple/15 text-purple font-semibold uppercase">{w.mode}</span>
                </div>
                <div className="text-[10px] text-muted line-clamp-1 italic">{w.action}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discovered Issues Alert Strip */}
      {liveIssues.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
          <div className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
            <span>⚠ Real-time UX Frictions Flagged ({liveIssues.length})</span>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
            {liveIssues.map((issue) => (
              <div key={issue.id} className="p-2.5 rounded-xl bg-white border border-amber-200 text-xs flex items-center justify-between shadow-2xs">
                <span className="font-medium text-text truncate mr-2">{issue.title}</span>
                <span className="font-mono text-[10px] text-amber-700 font-bold shrink-0">~{issue.count} personas</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2D Force Graph & Live Progress Feed */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5 bg-white border border-border rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-text">Persona Force Graph (1,000 Nodes)</h2>
            <div className="flex items-center gap-3 text-[11px] text-muted">
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Success
              </span>
              <span className="flex items-center gap-1 text-rose-700">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Dropped
              </span>
              <span className="flex items-center gap-1 text-cyan-800">
                <span className="w-2 h-2 rounded-full bg-cyan animate-ping" /> Testing
              </span>
            </div>
          </div>
          {graph ? (
            <NetworkGraph graph={graph} nodeStates={nodeStatesRef.current} height={500} title="Live Persona Graph" />
          ) : (
            <div className="h-[500px] flex items-center justify-center p-8 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-purple border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-muted">Mounting live persona graph…</p>
            </div>
          )}
        </div>

        <div className="card p-5 bg-white border border-border rounded-3xl shadow-xs flex flex-col h-[570px]">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h2 className="font-bold text-sm text-text">Live Execution Feed</h2>
            <span className="text-[10px] font-mono text-purple font-semibold bg-purple/10 px-2 py-0.5 rounded-full">SSE Live</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono pr-1 rounded-2xl bg-panel2 p-3 border border-border shadow-inner">
            {feed.map((line, i) => (
              <div key={i} className="text-muted leading-relaxed break-all border-b border-border/40 pb-1.5 last:border-none">
                {line}
              </div>
            ))}
            {feed.length === 0 && <p className="text-muted text-xs text-center py-6">Connecting to real-time event bus…</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
