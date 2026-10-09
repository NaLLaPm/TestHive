import Graph from "graphology";
import louvain from "graphology-communities-louvain";
import type { Persona, PersonaEdge } from "@testhive/contracts";

export interface ClusterAssignment {
  personaId: string;
  clusterId: number;
}

/** Run Louvain community detection on the similarity subgraph of the pool. */
export function detectClusters(personas: Persona[], edges: PersonaEdge[]): ClusterAssignment[] {
  const graph = new Graph({ type: "undirected" });
  for (const p of personas) graph.addNode(p.id);
  for (const e of edges) {
    if (e.kind !== "similarity") continue;
    if (!graph.hasNode(e.sourceId) || !graph.hasNode(e.targetId)) continue;
    if (e.sourceId === e.targetId) continue;
    if (graph.hasEdge(e.sourceId, e.targetId)) continue;
    graph.addEdge(e.sourceId, e.targetId, { weight: e.weight });
  }

  if (graph.size === 0) {
    // No edges (degenerate case): everyone in one cluster.
    return personas.map((p) => ({ personaId: p.id, clusterId: 0 }));
  }

  const communities = louvain(graph, { resolution: 1 });
  // Normalize cluster ids to a dense 0..k-1 range for nicer labels.
  const remap = new Map<number, number>();
  let next = 0;
  const assignments: ClusterAssignment[] = [];
  for (const p of personas) {
    const raw = communities[p.id] ?? 0;
    if (!remap.has(raw)) remap.set(raw, next++);
    assignments.push({ personaId: p.id, clusterId: remap.get(raw)! });
  }
  return assignments;
}
