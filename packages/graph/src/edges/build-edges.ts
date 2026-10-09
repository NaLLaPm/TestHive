import type { Persona, PersonaEdge } from "@testhive/contracts";
import { seededRng } from "@testhive/llm";

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! ** 2;
    nb += b[i]! ** 2;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export interface BuildEdgesOptions {
  poolId: string;
  topK?: number;
  socialLongRangeCount?: number;
  seed?: number;
}

/** similarity edges (cosine on trait vector, top-k per node) + social edges
 * (same region/age group + a few random long-range links). */
export function buildEdges(personas: Persona[], opts: BuildEdgesOptions): PersonaEdge[] {
  const topK = opts.topK ?? 6;
  const longRange = opts.socialLongRangeCount ?? 3;
  const rng = seededRng(`edges:${opts.seed ?? 42}:${opts.poolId}`);
  const edges: PersonaEdge[] = [];
  const n = personas.length;

  // Similarity edges: approximate top-k via normalized vectors + bucket by region/age to
  // keep this O(n * bucket) instead of O(n^2) for large pools.
  const vecs = personas.map((p) => normalizeVector(p.traitVector));
  const buckets = new Map<string, number[]>();
  personas.forEach((p, i) => {
    const key = `${p.traits.region}:${p.traits.ageGroup}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(i);
  });

  for (let i = 0; i < n; i++) {
    const p = personas[i]!;
    const key = `${p.traits.region}:${p.traits.ageGroup}`;
    const candidates = buckets.get(key)!.length > topK * 3 ? buckets.get(key)! : [...Array(n).keys()];
    const sims: { j: number; s: number }[] = [];
    for (const j of candidates) {
      if (j === i) continue;
      sims.push({ j, s: cosineSim(vecs[i]!, vecs[j]!) });
    }
    sims.sort((a, b) => b.s - a.s);
    for (const { j, s } of sims.slice(0, topK)) {
      if (s <= 0) continue;
      edges.push({
        poolId: opts.poolId,
        sourceId: p.id,
        targetId: personas[j]!.id,
        kind: "similarity",
        weight: Math.max(0, Math.min(1, s)),
      });
    }
  }

  // Social edges: same region+age group clique sample, plus a few random long-range links.
  for (const [, idxs] of buckets) {
    for (let a = 0; a < idxs.length; a++) {
      const linksForA = Math.min(3, idxs.length - 1);
      for (let k = 0; k < linksForA; k++) {
        const b = idxs[Math.floor(rng() * idxs.length)]!;
        if (b === idxs[a]) continue;
        edges.push({
          poolId: opts.poolId,
          sourceId: personas[idxs[a]!]!.id,
          targetId: personas[b]!.id,
          kind: "social",
          weight: 0.3 + rng() * 0.4,
        });
      }
    }
  }
  for (let i = 0; i < n * longRange; i++) {
    const a = Math.floor(rng() * n);
    const b = Math.floor(rng() * n);
    if (a === b) continue;
    edges.push({
      poolId: opts.poolId,
      sourceId: personas[a]!.id,
      targetId: personas[b]!.id,
      kind: "social",
      weight: 0.1 + rng() * 0.2,
    });
  }

  return edges;
}

function normalizeVector(v: number[]): number[] {
  const max = Math.max(1, ...v.map((x) => Math.abs(x)));
  return v.map((x) => x / max);
}
