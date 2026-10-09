import type { PersonaEdge, SpreadParams, SpreadRound } from "@testhive/contracts";
import { seededRng } from "@testhive/llm";

export interface SpreadNodeInput {
  personaId: string;
  satisfaction: number; // -1..1, usually from persona_result sentiment
  positiveVerdict: boolean;
  influence?: number; // 0..1, defaults to 0.5
  resistance?: number; // 0..1, defaults from patience/skepticism
}

export interface SimulateSpreadResult {
  rounds: SpreadRound[];
  totalReached: number;
}

/** P(v adopts) = weight * satisfaction(u) * influence(u) * (1 - resistance(v)), per edge per round. */
export function simulateSpread(
  nodes: SpreadNodeInput[],
  edges: PersonaEdge[],
  params: SpreadParams,
): SimulateSpreadResult {
  const rng = seededRng(`spread:${params.seed}`);
  const byId = new Map(nodes.map((n) => [n.personaId, n]));
  const adjacency = new Map<string, PersonaEdge[]>();
  for (const e of edges) {
    if (!adjacency.has(e.sourceId)) adjacency.set(e.sourceId, []);
    adjacency.get(e.sourceId)!.push(e);
  }

  const adopters = new Set<string>();
  if (params.seedStrategy === "positive_verdict") {
    for (const n of nodes) if (n.positiveVerdict) adopters.add(n.personaId);
  } else {
    for (const n of nodes) if (rng() < 0.1) adopters.add(n.personaId);
  }

  const rounds: SpreadRound[] = [];
  let frontier = new Set(adopters);

  for (let round = 1; round <= params.rounds; round++) {
    const newAdopters: string[] = [];
    const nextFrontier = new Set<string>();
    for (const u of frontier) {
      const uNode = byId.get(u);
      if (!uNode) continue;
      const influence = uNode.influence ?? 0.5;
      const satisfaction = Math.max(0, (uNode.satisfaction + 1) / 2); // normalize -1..1 -> 0..1
      const neighbors = adjacency.get(u) ?? [];
      for (const edge of neighbors) {
        const v = edge.targetId;
        if (adopters.has(v)) continue;
        const vNode = byId.get(v);
        if (!vNode) continue;
        const resistance = vNode.resistance ?? 0.4;
        const p = edge.weight * satisfaction * influence * (1 - resistance);
        if (rng() < p) {
          adopters.add(v);
          newAdopters.push(v);
          nextFrontier.add(v);
        }
      }
    }
    rounds.push({ round, newAdopters, cumulativeAdopters: adopters.size });
    frontier = nextFrontier;
    if (frontier.size === 0) break;
  }

  return { rounds, totalReached: adopters.size };
}
