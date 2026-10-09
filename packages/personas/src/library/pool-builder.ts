import crypto from "node:crypto";
import type { Persona, DiversityReport, PoolBuildConfig } from "@testhive/contracts";
import { getDb, poolsRepo, personasRepo, graphRepo } from "@testhive/db";
import type { LlmProviderName } from "@testhive/llm";
import { buildEdges, detectClusters, labelCluster, summarizeCluster } from "@testhive/graph";
import { sampleTraits, traitsToVector, traitsHash } from "./sampler.js";
import { expandTraitBatch } from "./expand.js";
import { deviceProfileKeyFor } from "./device-profiles.js";

export interface PoolBuildProgress {
  state: string;
  done: number;
  total: number;
}

export interface BuildPoolOptions extends PoolBuildConfig {
  provider?: LlmProviderName;
  expandBatchSize?: number;
  onProgress?: (p: PoolBuildProgress) => void;
}

export async function buildPool(opts: BuildPoolOptions): Promise<{ poolId: string; diversityReport: DiversityReport }> {
  const db = getDb();
  const pools = poolsRepo(db);
  const personasR = personasRepo(db);
  const graph = graphRepo(db);
  const batchSize = opts.expandBatchSize ?? 15;
  const report = (state: string, done: number, total: number) => opts.onProgress?.({ state, done, total });

  const existing = pools.getBySlug(opts.slug);
  const poolId = existing?.id ?? crypto.randomUUID();

  if (!existing) {
    pools.insert({
      id: poolId,
      slug: opts.slug,
      version: 1,
      size: opts.size,
      seed: opts.seed,
      status: "sampling",
      generatorConfig: { provider: opts.provider ?? "fake" },
      isDefault: opts.isDefault,
    });
  } else {
    pools.update(poolId, { status: "sampling" });
  }

  report("sampling", 0, opts.size);
  const { traits, duplicatesRejected } = sampleTraits({ size: opts.size, seed: opts.seed });
  report("sampling", opts.size, opts.size);

  pools.update(poolId, { status: "expanding" });
  const personas: Persona[] = [];
  for (let i = 0; i < traits.length; i += batchSize) {
    const batch = traits.slice(i, i + batchSize);
    const expansions = await expandTraitBatch(batch, opts.provider);
    for (let j = 0; j < batch.length; j++) {
      const t = batch[j]!;
      const exp = expansions[j]!;
      personas.push({
        id: crypto.randomUUID(),
        poolId,
        traits: t,
        traitVector: traitsToVector(t),
        traitsHash: traitsHash(t),
        backstory: exp.backstory,
        voice: exp.voice,
        quirks: exp.quirks,
        deviceProfileKey: deviceProfileKeyFor(t.device, t.connection),
        clusterId: null,
        schemaVersion: 1,
      });
    }
    report("expanding", personas.length, traits.length);
  }

  personasR.insertMany(
    personas.map((p) => ({
      id: p.id,
      poolId: p.poolId,
      traits: p.traits,
      traitVector: p.traitVector,
      traitsHash: p.traitsHash,
      backstory: p.backstory,
      voice: p.voice,
      quirks: p.quirks,
      deviceProfileKey: p.deviceProfileKey,
      clusterId: p.clusterId,
      schemaVersion: p.schemaVersion,
    })),
  );

  pools.update(poolId, { status: "building_graph" });
  report("building_graph", 0, 1);
  const edges = buildEdges(personas, { poolId, seed: opts.seed });
  graph.insertEdges(
    edges.map((e) => ({ poolId: e.poolId, sourceId: e.sourceId, targetId: e.targetId, kind: e.kind, weight: e.weight })),
  );
  const assignments = detectClusters(personas, edges);
  const clusterIdByPersona = new Map(assignments.map((a) => [a.personaId, a.clusterId]));
  for (const p of personas) p.clusterId = clusterIdByPersona.get(p.id) ?? null;
  personasR.updateClusters(assignments.map((a) => ({ id: a.personaId, clusterId: a.clusterId })));
  report("building_graph", 1, 1);

  pools.update(poolId, { status: "labeling_clusters" });
  const byCluster = new Map<number, Persona[]>();
  for (const p of personas) {
    const c = p.clusterId ?? -1;
    if (!byCluster.has(c)) byCluster.set(c, []);
    byCluster.get(c)!.push(p);
  }
  const clusterRows: {
    poolId: string;
    clusterId: number;
    label: string;
    description: string;
    size: number;
    topTraits: Record<string, string>;
  }[] = [];
  let labeled = 0;
  for (const [clusterId, members] of byCluster) {
    const summary = summarizeCluster(clusterId, members);
    const label = await labelCluster(summary, opts.provider);
    clusterRows.push({
      poolId,
      clusterId,
      label: label.label,
      description: label.description,
      size: members.length,
      topTraits: summary.topTraits,
    });
    labeled++;
    report("labeling_clusters", labeled, byCluster.size);
  }
  graph.insertClusters(clusterRows);

  const diversityReport: DiversityReport = {
    size: personas.length,
    byTrait: computeByTraitCounts(personas),
    clusterCount: byCluster.size,
    duplicatesRejected,
  };

  pools.update(poolId, { status: "ready", diversityReport: diversityReport as unknown as object });
  report("ready", opts.size, opts.size);

  return { poolId, diversityReport };
}

function computeByTraitCounts(personas: Persona[]): Record<string, Record<string, number>> {
  const keys = Object.keys(personas[0]?.traits ?? {});
  const out: Record<string, Record<string, number>> = {};
  for (const key of keys) {
    const counts: Record<string, number> = {};
    for (const p of personas) {
      const v = String((p.traits as Record<string, unknown>)[key]);
      counts[v] = (counts[v] ?? 0) + 1;
    }
    out[key] = counts;
  }
  return out;
}
