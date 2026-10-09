"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSSE } from "@/lib/use-sse";
import { api } from "@testhive/api-client";
import { NetworkGraph, type NodeState } from "@/components/network-graph";
import { Badge } from "@/components/ui/badge";
import type { GraphPayload } from "@testhive/contracts";

interface LiveTestModalProps {
  runId: string;
  poolId?: string | null;
  targetUrl: string;
  userGoal: string;
  expectedPersonas: number;
  onClose: () => void;
  onNavigateToResults?: () => void;
}

interface ActivePersonaItem {
  id: string;
  step?: number;
  mode: "deep" | "light";
  actionText?: string;
  status: "running" | "done";
  outcome?: string;
  durationSec: number;
}

interface LogItem {
  id: string;
  time: string;
  text: string;
  type: "start" | "step" | "done" | "issue" | "state" | "error";
}

export function BenchmarkLiveModal({
  runId,
  poolId,
  targetUrl,
  userGoal,
  expectedPersonas,
  onClose,
  onNavigateToResults,
}: LiveTestModalProps) {
  const [graph, setGraph] = useState<GraphPayload | null>(null);
  const nodeStatesRef = useRef<Map<string, NodeState>>(new Map());
  const [, forceRerender] = useState(0);

  const [runState, setRunState] = useState<string>("initializing");
  const [doneCount, setDoneCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(expectedPersonas || 1000);
  const [successCount, setSuccessCount] = useState<number>(0);
  const [partialCount, setPartialCount] = useState<number>(0);
  const [failureCount, setFailureCount] = useState<number>(0);

  // Active testing workers/personas currently executing steps
  const [activeWorkers, setActiveWorkers] = useState<Map<string, ActivePersonaItem>>(new Map());

  // Real-time terminal log stream
  const [feed, setFeed] = useState<LogItem[]>([]);

  // Discovered issues in real time
  const [liveIssues, setLiveIssues] = useState<Array<{ id: string; title: string; count: number }>>([]);

  const events = useSSE(`/api/runs/${runId}/stream`);

  // Track processed SSE events index to prevent duplicate increments
  const processedEventsIndexRef = useRef(0);

  // Fetch initial graph
  useEffect(() => {
    if (!poolId) return;
    api.getGraph(poolId).then(setGraph).catch(() => undefined);
  }, [poolId]);

  // Periodic polling fallback to stay 100% in sync with backend database status
  useEffect(() => {
    if (!runId) return;

    let active = true;
    const syncRunAndNodes = async () => {
      try {
        const [run, states] = await Promise.all([
          api.getRun(runId),
          api.getNodeStates(runId),
        ]);
        if (!active) return;

        if (run) {
          setRunState(run.state);
          if (run.totalPersonas > 0) setTotalCount(run.totalPersonas);
          if (run.donePersonas !== undefined && run.donePersonas !== null) {
            setDoneCount(run.donePersonas);
          }
        }

        let d = 0;
        let s = 0;
        let p = 0;
        let f = 0;
        for (const st of states) {
          nodeStatesRef.current.set(st.id, st);
          if (st.status === "done") {
            d++;
            if (st.outcome === "success") s++;
            else if (st.outcome === "partial") p++;
            else if (st.outcome === "failure") f++;
          }
        }
        if (d > 0) {
          setDoneCount((prev) => Math.max(prev, d));
          setSuccessCount(s);
          setPartialCount(p);
          setFailureCount(f);
        }
        forceRerender((v) => v + 1);
      } catch {
        // ignore polling errors
      }
    };

    syncRunAndNodes();
    const interval = setInterval(syncRunAndNodes, 1500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [runId]);

  // Handle SSE events incrementally
  useEffect(() => {
    if (!events.length) return;
    const startIndex = processedEventsIndexRef.current;
    if (startIndex >= events.length) return;

    const newEvents = events.slice(startIndex);
    processedEventsIndexRef.current = events.length;

    for (const ev of newEvents) {
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

      if (ev.type === "run.state") {
        setRunState(ev.state);
        if (ev.state === "testing") {
          if (ev.progress?.total) setTotalCount(ev.progress.total);
          if (ev.progress?.done !== undefined) setDoneCount((prev) => Math.max(prev, ev.progress.done));
        } else if (ev.state === "completed") {
          setDoneCount((prev) => (totalCount > 0 ? totalCount : prev));
        }

        const item: LogItem = {
          id: Math.random().toString(),
          time: timeStr,
          text: `Run phase shifted to: ${ev.state.replace(/_/g, " ")} (${ev.progress.done}/${ev.progress.total})`,
          type: "state",
        };
        setFeed((f) => [item, ...f].slice(0, 100));
      } else if (ev.type === "persona.started") {
        nodeStatesRef.current.set(ev.personaId, { id: ev.personaId, status: "running", outcome: null });

        setActiveWorkers((prev) => {
          const next = new Map(prev);
          next.set(ev.personaId, {
            id: ev.personaId,
            mode: ev.mode,
            step: 1,
            actionText: `Navigating to ${targetUrl}`,
            status: "running",
            durationSec: 0,
          });
          // keep up to 12 active workers in view
          if (next.size > 12) {
            const firstKey = next.keys().next().value;
            if (firstKey) next.delete(firstKey);
          }
          return next;
        });

        const item: LogItem = {
          id: Math.random().toString(),
          time: timeStr,
          text: `Persona #${ev.personaId.slice(0, 6)} spawned [${ev.mode} mode]`,
          type: "start",
        };
        setFeed((f) => [item, ...f].slice(0, 100));
      } else if (ev.type === "persona.step") {
        const actionDesc =
          typeof ev.action === "object" && ev.action !== null
            ? (ev.action as any).action || (ev.action as any).type || "Evaluated DOM element"
            : "Executing next action";

        setActiveWorkers((prev) => {
          const next = new Map(prev);
          const current = next.get(ev.personaId);
          if (current) {
            next.set(ev.personaId, {
              ...current,
              step: ev.step,
              actionText: ev.note || actionDesc,
            });
          }
          return next;
        });

        const item: LogItem = {
          id: Math.random().toString(),
          time: timeStr,
          text: `Persona #${ev.personaId.slice(0, 6)} Step ${ev.step}: ${ev.note || actionDesc}`,
          type: "step",
        };
        setFeed((f) => [item, ...f].slice(0, 100));
      } else if (ev.type === "persona.done") {
        nodeStatesRef.current.set(ev.personaId, { id: ev.personaId, status: "done", outcome: ev.outcome });

        setActiveWorkers((prev) => {
          const next = new Map(prev);
          next.delete(ev.personaId);
          return next;
        });

        setDoneCount((c) => c + 1);
        if (ev.outcome === "success") setSuccessCount((c) => c + 1);
        else if (ev.outcome === "partial") setPartialCount((c) => c + 1);
        else if (ev.outcome === "failure") setFailureCount((c) => c + 1);

        const item: LogItem = {
          id: Math.random().toString(),
          time: timeStr,
          text: `Persona #${ev.personaId.slice(0, 6)} finished with outcome: ${ev.outcome.toUpperCase()}`,
          type: "done",
        };
        setFeed((f) => [item, ...f].slice(0, 100));
      } else if (ev.type === "issue.found") {
        setLiveIssues((prev) => {
          if (prev.some((i) => i.id === ev.issueId)) return prev;
          return [{ id: ev.issueId, title: ev.title, count: ev.count }, ...prev];
        });
        const item: LogItem = {
          id: Math.random().toString(),
          time: timeStr,
          text: `UX Friction flagged: "${ev.title}" (affected ~${ev.count} personas)`,
          type: "issue",
        };
        setFeed((f) => [item, ...f].slice(0, 100));
      } else if (ev.type === "spread.round") {
        const item: LogItem = {
          id: Math.random().toString(),
          time: timeStr,
          text: `Social Diffusion Round ${ev.round}: +${ev.newAdopters.length} peer adopters reached`,
          type: "state",
        };
        setFeed((f) => [item, ...f].slice(0, 100));
      } else if (ev.type === "run.completed") {
        setRunState("completed");
        setDoneCount((prev) => (totalCount > 0 ? totalCount : prev));
        const item: LogItem = {
          id: Math.random().toString(),
          time: timeStr,
          text: `Benchmark execution complete! Synthesized all telemetry and generated executive report.`,
          type: "state",
        };
        setFeed((f) => [item, ...f].slice(0, 100));
      } else if (ev.type === "run.error") {
        setRunState("failed");
        const item: LogItem = {
          id: Math.random().toString(),
          time: timeStr,
          text: `Error during execution: ${ev.message}`,
          type: "error",
        };
        setFeed((f) => [item, ...f].slice(0, 100));
      }
    }

    forceRerender((v) => v + 1);
  }, [events, targetUrl, totalCount]);

  // Compute progress percentage
  const pct = Math.min(100, Math.round(((doneCount || 0) / Math.max(1, totalCount)) * 100));
  const isComplete = runState === "completed";
  const isFailed = runState === "failed";

  // Quick stats calculations
  const totalFinished = doneCount || 1;
  const successPct = Math.round((successCount / totalFinished) * 100);
  const failurePct = Math.round((failureCount / totalFinished) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-white border border-border rounded-3xl shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-6 bg-panel2 border-b border-border flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                {!isComplete && !isFailed && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    isComplete ? "bg-emerald-500" : isFailed ? "bg-rose-500" : "bg-purple"
                  }`}
                ></span>
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-text tracking-tight flex items-center gap-2">
                {isComplete ? (
                  "Benchmark Complete"
                ) : isFailed ? (
                  "Benchmark Run Error"
                ) : runState === "selecting_personas" || runState === "initializing" || runState === "created" ? (
                  <>
                    <span>Building Swarm…</span>
                    <span className="text-sm font-normal text-muted">
                      ({totalCount} Persona Agents)
                    </span>
                  </>
                ) : (
                  <>
                    <span>Using Parallel Agents</span>
                    <span className="text-sm font-normal text-muted">
                      ({totalCount} Personas Active)
                    </span>
                  </>
                )}
              </h2>
              <Badge
                kind={
                  isComplete
                    ? "success"
                    : isFailed
                    ? "failure"
                    : runState === "testing"
                    ? "neutral"
                    : "neutral"
                }
              >
                {runState === "selecting_personas" || runState === "initializing" || runState === "created"
                  ? "BUILDING SWARM"
                  : runState === "testing"
                  ? "PARALLEL AGENTS RUNNING"
                  : runState.replace(/_/g, " ").toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-muted font-mono truncate max-w-xl">
              <span className="text-text font-semibold">Target:</span> {targetUrl} &nbsp;·&nbsp;
              <span className="text-text font-semibold">Goal:</span> "{userGoal}"
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <Link
              href={`/runs/${runId}/live`}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-border text-xs font-semibold text-text hover:border-purple hover:text-purple transition shadow-xs flex items-center gap-1.5"
            >
              <span>Full Screen Live View</span>
              <span>↗</span>
            </Link>
            {isComplete && onNavigateToResults && (
              <button
                type="button"
                onClick={onNavigateToResults}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple via-lavender to-cyan text-cream font-bold text-xs shadow-xs hover:opacity-95 transition"
              >
                Inspect Results & Analytics →
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white border border-border text-muted hover:text-text hover:bg-lavender/20 flex items-center justify-center transition"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Real-time Progress Bar Strip */}
        <div className="bg-panel2 px-4 sm:px-6 pb-4 pt-1 border-b border-border shrink-0 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-text flex items-center gap-1.5">
                {!isComplete && !isFailed && (
                  <span className="w-2 h-2 rounded-full bg-purple animate-ping shrink-0" />
                )}
                Testing Progress: <strong className="font-mono text-purple">{doneCount}</strong> / {totalCount} personas
              </span>
              <span className="text-muted font-mono font-medium">({pct}%)</span>
              {!isComplete && !isFailed && (
                <span className="hidden sm:inline-block text-[11px] font-mono text-purple/80 italic">
                  {pct >= 95 ? "Synthesizing final personas & control baselines..." : "Parallel swarm active..."}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {successCount} Passed ({successPct}%)
              </span>
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> {partialCount} Partial
              </span>
              <span className="text-rose-700 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> {failureCount} Dropped ({failurePct}%)
              </span>
            </div>
          </div>

          <div
            className={`h-4 w-full bg-white rounded-full overflow-hidden border border-border relative p-0.5 shadow-inner ${
              !isComplete && !isFailed ? "animate-panel-shiver" : ""
            }`}
          >
            <div
              className={`h-full bg-gradient-to-r from-purple via-lavender to-cyan rounded-full transition-all duration-300 relative overflow-hidden shadow-sm ${
                !isComplete && !isFailed ? "animate-progress-shiver" : ""
              }`}
              style={{ width: `${Math.max(pct, isComplete ? 100 : 1)}%` }}
            >
              {/* Glass shimmer sweep highlight */}
              <div
                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none animate-shimmer-sweep"
              />
              {/* Subtle continuous micro-pulse */}
              <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Modal Center Layout: Graph (Left) & Real-time Live Telemetry + Logs (Right) */}
        <div className="flex-1 grid lg:grid-cols-12 min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Left Panel: Live Visual Force Graph Simulation */}
          <div className="lg:col-span-7 flex flex-col min-h-[300px] lg:min-h-0 bg-[#FAF6F0] relative overflow-hidden">
            <div className="absolute top-3 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border text-[11px] font-semibold text-text shadow-xs">
              <span className="w-2 h-2 rounded-full bg-purple animate-pulse" />
              <span>Real-Time Persona Network Nodes</span>
              <span className="text-muted">·</span>
              <span className="text-muted font-mono">{graph?.nodes.length ?? totalCount} Nodes</span>
            </div>

            <div className="absolute top-3 right-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-border text-[10px] text-muted shadow-xs">
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Done (Success)
              </span>
              <span className="flex items-center gap-1 text-rose-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Dropped
              </span>
              <span className="flex items-center gap-1 text-cyan-800 font-medium">
                <span className="w-2 h-2 rounded-full bg-cyan animate-ping" /> Active
              </span>
            </div>

            <div className="flex-1 w-full h-full min-h-[320px]">
              {graph ? (
                <NetworkGraph
                  graph={graph}
                  nodeStates={nodeStatesRef.current}
                  height={undefined}
                  className="h-full w-full border-none rounded-none"
                  showControls={true}
                  controlsClassName="bottom-3 left-3"
                />
              ) : (
                <div className="h-full flex items-center justify-center p-8 text-center space-y-2">
                  <div className="w-6 h-6 border-2 border-purple border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-muted">Mounting live persona graph constellation…</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Concurrent Active Workers & Live Telemetry Stream */}
          <div className="lg:col-span-5 flex flex-col min-h-0 bg-white">
            {/* Active Workers Accordion / Real-time execution cards */}
            <div className="p-3.5 border-b border-border bg-panel2 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple animate-ping" />
                  <span className="text-xs font-bold text-text uppercase tracking-wider">
                    Parallel Agents Active ({activeWorkers.size})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple/15 text-purple">
                    parallel swarm
                  </span>
                  <span className="text-[10px] font-mono text-muted">concurrency=10</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {Array.from(activeWorkers.values()).map((worker) => (
                  <div
                    key={worker.id}
                    className="p-2 rounded-xl bg-white border border-border shadow-xs flex flex-col justify-between text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text font-mono">
                        #{worker.id.slice(0, 6)}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-purple/15 text-purple font-mono text-[9px] uppercase font-bold">
                        {worker.mode}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted line-clamp-1 italic">
                      {worker.actionText || `Step ${worker.step}`}
                    </div>
                  </div>
                ))}
                {activeWorkers.size === 0 && (
                  <div className="col-span-2 py-3 text-center text-xs text-muted">
                    {isComplete ? "All testing workers completed." : "Dispatching parallel testing workers…"}
                  </div>
                )}
              </div>
            </div>

            {/* Live Issues Detected (if any flagged) */}
            {liveIssues.length > 0 && (
              <div className="p-3 border-b border-border bg-amber-50/60 shrink-0">
                <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <span>⚠ Live Friction Points Flagged ({liveIssues.length})</span>
                </div>
                <div className="space-y-1.5 max-h-24 overflow-y-auto">
                  {liveIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="text-xs bg-white/90 p-1.5 rounded-lg border border-amber-200/80 text-text flex items-center justify-between"
                    >
                      <span className="font-medium truncate mr-2">{issue.title}</span>
                      <span className="text-[10px] font-mono text-amber-700 font-bold shrink-0">
                        ~{issue.count} personas
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Terminal SSE Feed */}
            <div className="flex-1 flex flex-col min-h-0 p-3.5 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-text uppercase tracking-wider">
                  Live Event Telemetry Log
                </span>
                <span className="text-[10px] text-muted font-mono">SSE Stream Connected</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1 rounded-xl bg-panel2 p-2.5 border border-border shadow-inner">
                {feed.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-2 leading-relaxed ${
                      item.type === "done"
                        ? "text-emerald-700 font-medium"
                        : item.type === "issue"
                        ? "text-amber-700 font-medium"
                        : item.type === "error"
                        ? "text-rose-700 font-bold"
                        : item.type === "start"
                        ? "text-purple"
                        : "text-muted"
                    }`}
                  >
                    <span className="text-muted/60 shrink-0 text-[10px]">{item.time}</span>
                    <span className="break-all">{item.text}</span>
                  </div>
                ))}
                {feed.length === 0 && (
                  <div className="text-muted text-xs p-4 text-center">
                    Connecting to live execution stream…
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-panel2 border-t border-border flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-muted flex items-center gap-2">
            <span>Pool: <strong className="text-text font-mono">{poolId?.slice(0, 8) || "default"}</strong></span>
            <span>·</span>
            <span>Estimated Personas: <strong className="text-text font-mono">{totalCount}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-border text-xs font-semibold text-text hover:bg-panel2 transition shadow-xs"
            >
              Close & Keep Running in Background
            </button>
            <Link
              href={`/runs/${runId}/live`}
              className="px-4 py-2 rounded-xl bg-purple text-cream text-xs font-bold hover:bg-lavender hover:text-text transition shadow-xs"
            >
              Open Dedicated Live Dashboard ↗
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
