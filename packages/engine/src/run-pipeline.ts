import path from "node:path";
import type { Persona, PersonaResult, RunConfig, SSEEvent } from "@testhive/contracts";
import {
  getDb,
  personasRepo,
  graphRepo,
  runsRepo,
  resultsRepo,
  issuesRepo,
} from "@testhive/db";
import {
  computeSegments,
  computeFunnel,
  computeElementFriction,
  clusterIssues,
  resultsToFrictionNotes,
} from "@testhive/analytics";
import { simulateSpread, createFakeAnalysisGraph } from "@testhive/graph";
import { writeReport } from "@testhive/report";
import type { LlmProviderName } from "@testhive/llm";
import { runOrchestrator } from "./orchestrator.js";

export interface RunPipelineOptions {
  runId: string;
  poolId: string;
  config: RunConfig;
  emit: (event: SSEEvent) => void;
  isCancelled: () => boolean;
  provider?: LlmProviderName;
  screenshotDir?: string;
}

/** Full run lifecycle: testing -> aggregating -> simulating_spread -> reporting -> completed.
 * Shared by the API's async run executor and the CLI demo-seed script. */
export async function runFullPipeline(opts: RunPipelineOptions): Promise<void> {
  const db = getDb();
  const personasR = personasRepo(db);
  const graph = graphRepo(db);
  const runsR = runsRepo(db);
  const resultsR = resultsRepo(db);
  const issuesR = issuesRepo(db);
  const provider = opts.provider ?? ((process.env.LLM_PROVIDER as LlmProviderName) ?? "fake");
  const screenshotDir = opts.screenshotDir ?? path.resolve(process.cwd(), "data", "screenshots");

  try {
    await runOrchestrator({
      runId: opts.runId,
      poolId: opts.poolId,
      config: opts.config,
      screenshotDir,
      emit: opts.emit,
      isCancelled: opts.isCancelled,
    });

    if (opts.isCancelled()) {
      runsR.update(opts.runId, { state: "cancelled" });
      opts.emit({ type: "run.state", state: "cancelled", progress: { done: 0, total: 0 } });
      return;
    }

    runsR.update(opts.runId, { state: "aggregating" });
    opts.emit({ type: "run.state", state: "aggregating", progress: { done: 0, total: 1 } });

    const allPersonas = personasR.listAllByPool(opts.poolId) as unknown as Persona[];
    const results = resultsR.listByRun(opts.runId) as unknown as PersonaResult[];
    const clusters = graph.listClusters(opts.poolId);
    const labelByCluster = Object.fromEntries(clusters.map((c) => [c.clusterId, c.label]));
    const descriptionByCluster = Object.fromEntries(clusters.map((c) => [c.clusterId, c.description]));
    const clusterByPersona = new Map(allPersonas.map((p) => [p.id, p.clusterId ?? null]));

    // Fetch recorded steps for real trace evidence
    const recordedSteps = (resultsR as any).listStepsByRun ? (resultsR as any).listStepsByRun(opts.runId) : [];
    const stepsByPersona = new Map<string, any[]>();
    for (const s of recordedSteps) {
      if (!stepsByPersona.has(s.personaId)) stepsByPersona.set(s.personaId, []);
      stepsByPersona.get(s.personaId)!.push(s);
    }

    const segments = computeSegments(allPersonas, results, labelByCluster, descriptionByCluster, 10);
    const notes = resultsToFrictionNotes(results, clusterByPersona, stepsByPersona);
    const issues = await clusterIssues(opts.runId, notes, allPersonas.length, provider);
    const funnel = computeFunnel(results, recordedSteps, allPersonas.length);
    const frictionHeatmap = computeElementFriction(results, recordedSteps, notes, allPersonas.length);


    issuesR.insertMany(
      issues.map((i) => ({
        id: i.issueId,
        runId: opts.runId,
        title: i.title,
        severity: i.severity,
        affectedPersonas: i.affectedPersonas,
        affectedClusters: i.affectedClusters,
        evidence: i.evidence,
        suggestedFix: i.suggestedFix,
      })),
    );
    for (const issue of issues) {
      opts.emit({ type: "issue.found", issueId: issue.issueId, title: issue.title, count: issue.affectedPersonas });
    }

    runsR.update(opts.runId, { state: "simulating_spread" });
    opts.emit({ type: "run.state", state: "simulating_spread", progress: { done: 0, total: 1 } });

    const edges = graph.listEdges(opts.poolId) as unknown as {
      poolId: string;
      sourceId: string;
      targetId: string;
      kind: "similarity" | "social";
      weight: number;
    }[];
    const resultByPersona = new Map(results.map((r) => [r.personaId, r]));
    const spreadNodes = allPersonas.map((p) => {
      const r = resultByPersona.get(p.id);
      return {
        personaId: p.id,
        satisfaction: r?.sentiment ?? 0,
        positiveVerdict: r ? r.outcome === "success" : false,
        influence: 0.5,
        resistance: 1 - p.traits.paymentTrust / 5,
      };
    });
    const spreadParams = { rounds: 6, seedStrategy: "positive_verdict" as const, seed: opts.config.selection.seed };
    const spreadSim = simulateSpread(spreadNodes, edges, spreadParams);
    issuesR.insertSpread({ runId: opts.runId, params: spreadParams, rounds: spreadSim.rounds });
    for (const round of spreadSim.rounds) {
      opts.emit({ type: "spread.round", round: round.round, newAdopters: round.newAdopters });
    }

    runsR.update(opts.runId, { state: "reporting" });
    opts.emit({ type: "run.state", state: "reporting", progress: { done: 0, total: 1 } });

    const analysisGraph = createFakeAnalysisGraph({
      runId: opts.runId,
      poolId: opts.poolId,
      personas: allPersonas,
      results,
      clusters,
      issues,
      funnel,
      frictionHeatmap,
    });

    const report = await writeReport({
      runId: opts.runId,
      stimulus: opts.config.stimulus,
      segments,
      issues,
      funnel,
      frictionHeatmap,
      analysisGraph,
      provider,
    });
    issuesR.upsertReport({ runId: opts.runId, json: report as unknown as object, markdown: report.markdown });

    runsR.update(opts.runId, { state: "completed" });
    opts.emit({ type: "run.state", state: "completed", progress: { done: 1, total: 1 } });
    opts.emit({ type: "run.completed", runId: opts.runId });
  } catch (err) {
    runsR.update(opts.runId, { state: "failed" });
    opts.emit({
      type: "run.error",
      message: err instanceof Error ? err.message : String(err),
      recoverable: false,
    });
    throw err;
  }
}
