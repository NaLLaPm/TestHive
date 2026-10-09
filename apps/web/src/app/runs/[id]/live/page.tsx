"use client";

import { useParams } from "next/navigation";
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

  useEffect(() => {
    if (!id) return;
    api.getNodeStates(id).then((states) => {
      for (const s of states) nodeStatesRef.current.set(s.id, s);
      forceRerender((v) => v + 1);
    });
  }, [id]);

  useEffect(() => {
    for (const ev of events) {
      if (ev.type === "persona.started") {
        nodeStatesRef.current.set(ev.personaId, { id: ev.personaId, status: "running", outcome: null });
        setFeed((f) => [`▶ persona started (${ev.mode})`, ...f].slice(0, 60));
      } else if (ev.type === "persona.done") {
        nodeStatesRef.current.set(ev.personaId, { id: ev.personaId, status: "done", outcome: ev.outcome });
        setFeed((f) => [`✔ persona done — ${ev.outcome}`, ...f].slice(0, 60));
      } else if (ev.type === "issue.found") {
        setFeed((f) => [`⚠ issue found: ${ev.title} (${ev.count})`, ...f].slice(0, 60));
      } else if (ev.type === "spread.round") {
        setFeed((f) => [`🌐 spread round ${ev.round}: +${ev.newAdopters.length} adopters`, ...f].slice(0, 60));
      } else if (ev.type === "run.state") {
        setFeed((f) => [`→ state: ${ev.state} (${ev.progress.done}/${ev.progress.total})`, ...f].slice(0, 60));
      } else if (ev.type === "run.completed") {
        setFeed((f) => [`✅ run completed`, ...f].slice(0, 60));
      } else if (ev.type === "run.error") {
        setFeed((f) => [`✖ error: ${ev.message}`, ...f].slice(0, 60));
      }
    }
    if (events.length > 0) forceRerender((v) => v + 1);
  }, [events]);

  const progress = useMemo(() => {
    if (!run) return { done: 0, total: 0 };
    return { done: run.donePersonas, total: run.totalPersonas };
  }, [run]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Live run</h1>
        {run && <Badge kind={run.state === "completed" ? "success" : "neutral"}>{run.state}</Badge>}
      </div>

      <div className="card p-3">
        <div className="h-2 bg-panel2 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
          />
        </div>
        <div className="text-xs text-muted mt-1">{progress.done}/{progress.total} personas</div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-4">
          <h2 className="font-semibold mb-3">Persona graph</h2>
          {graph ? (
            <NetworkGraph graph={graph} nodeStates={nodeStatesRef.current} height={460} title="Live Persona Graph" />
          ) : (
            <p className="text-muted text-sm">Loading graph…</p>
          )}
        </div>
        <div className="card p-4">
          <h2 className="font-semibold mb-3">Progress feed</h2>
          <div className="space-y-1.5 max-h-[460px] overflow-y-auto text-sm font-mono">
            {feed.map((line, i) => (
              <div key={i} className="text-muted">{line}</div>
            ))}
            {feed.length === 0 && <p className="text-muted text-sm">Waiting for events…</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
