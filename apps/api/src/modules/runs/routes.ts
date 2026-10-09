import type { FastifyInstance } from "fastify";
import crypto from "node:crypto";
import {
  getDb,
  runsRepo,
  resultsRepo,
  issuesRepo,
  personasRepo,
} from "@testhive/db";
import { CreateRunRequestSchema, PostSpreadRequestSchema } from "@testhive/contracts";
import { simulateSpread } from "@testhive/graph";
import { emitEvent, getHistory, subscribe } from "../../realtime/bus.js";
import { executeRun, resolvePoolId } from "./service.js";
import { cancelRun } from "./cancel.js";

export async function runRoutes(app: FastifyInstance) {
  const db = getDb();
  const runsR = runsRepo(db);
  const resultsR = resultsRepo(db);
  const issuesR = issuesRepo(db);
  const personasR = personasRepo(db);

  app.post("/api/runs", async (req, reply) => {
    const body = CreateRunRequestSchema.parse(req.body);
    const poolId = resolvePoolId(body.poolId);
    if (!poolId) {
      reply.code(409);
      return { error: "Pool is not ready. Build a pool first (pnpm pool:build)." };
    }
    const runId = crypto.randomUUID();
    runsR.insert({
      id: runId,
      kind: body.kind,
      poolId,
      stimulus: body.stimulus,
      config: body,
      state: "created",
      totalPersonas: 0,
      donePersonas: 0,
    });
    void executeRun(runId, poolId, body);
    reply.code(201);
    return { runId, poolId, state: "created" };
  });

  app.get("/api/runs", async () => runsR.list());

  app.get("/api/runs/:runId", async (req, reply) => {
    const { runId } = req.params as { runId: string };
    const row = runsR.getById(runId);
    if (!row) {
      reply.code(404);
      return { error: "not found" };
    }
    return row;
  });

  app.post("/api/runs/:runId/cancel", async (req) => {
    const { runId } = req.params as { runId: string };
    cancelRun(runId);
    return runsR.getById(runId);
  });

  app.get("/api/runs/:runId/stream", async (req, reply) => {
    const { runId } = req.params as { runId: string };
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });
    for (const ev of getHistory(runId)) {
      reply.raw.write(`data: ${JSON.stringify(ev)}\n\n`);
    }
    const unsubscribe = subscribe(runId, (ev) => {
      reply.raw.write(`data: ${JSON.stringify(ev)}\n\n`);
    });
    req.raw.on("close", unsubscribe);
  });

  app.get("/api/runs/:runId/node-states", async (req) => {
    const { runId } = req.params as { runId: string };
    const rps = runsR.listRunPersonas(runId);
    return rps.map((rp) => ({ id: rp.personaId, status: rp.status, outcome: rp.outcome }));
  });

  app.get("/api/runs/:runId/personas", async (req) => {
    const { runId } = req.params as { runId: string };
    const query = req.query as { clusterId?: string; status?: string; outcome?: string };
    const rps = runsR.listRunPersonas(runId);
    const results = resultsR.listByRun(runId);
    const resultByPersona = new Map(results.map((r) => [r.personaId, r]));
    const personaIds = rps.map((rp) => rp.personaId);
    const personaRows = personaIds.map((id) => personasR.getById(id)).filter(Boolean);
    const clusterById = new Map(personaRows.map((p) => [p!.id, p!.clusterId]));

    let items = rps.map((rp) => ({
      personaId: rp.personaId,
      mode: rp.mode as "deep" | "light",
      status: rp.status,
      outcome: rp.outcome,
      clusterId: clusterById.get(rp.personaId) ?? null,
      result: resultByPersona.get(rp.personaId) ?? null,
    }));

    if (query.clusterId !== undefined) items = items.filter((i) => String(i.clusterId) === query.clusterId);
    if (query.status) items = items.filter((i) => i.status === query.status);
    if (query.outcome) items = items.filter((i) => i.outcome === query.outcome);
    return items;
  });

  app.get("/api/runs/:runId/personas/:personaId/transcript", async (req) => {
    const { runId, personaId } = req.params as { runId: string; personaId: string };
    return resultsR.listStepsByPersona(runId, personaId);
  });

  app.get("/api/runs/:runId/segments", async (req, reply) => {
    const { runId } = req.params as { runId: string };
    const run = runsR.getById(runId);
    if (!run) {
      reply.code(404);
      return { error: "not found" };
    }
    const { computeSegments } = await import("@testhive/analytics");
    const { graphRepo } = await import("@testhive/db");
    const graph = graphRepo(db);
    const allPersonas = personasR.listAllByPool(run.poolId);
    const results = resultsR.listByRun(runId);
    const clusters = graph.listClusters(run.poolId);
    const labelByCluster = Object.fromEntries(clusters.map((c) => [c.clusterId, c.label]));
    labelByCluster[9999] = "Baseline Controls";
    const descriptionByCluster = Object.fromEntries(clusters.map((c) => [c.clusterId, c.description]));
    descriptionByCluster[9999] = "Standardized benchmark persona with simplified task execution to verify environment health.";
    return computeSegments(allPersonas as any, results as any, labelByCluster, descriptionByCluster, 10);
  });

  app.get("/api/runs/:runId/issues", async (req) => {
    const { runId } = req.params as { runId: string };
    return issuesR.listByRun(runId);
  });

  app.post("/api/runs/:runId/spread", async (req, reply) => {
    const { runId } = req.params as { runId: string };
    const run = runsR.getById(runId);
    if (!run) {
      reply.code(404);
      return { error: "not found" };
    }
    const params = PostSpreadRequestSchema.parse(req.body ?? {});
    const { graphRepo } = await import("@testhive/db");
    const graph = graphRepo(db);
    const allPersonas = personasR.listAllByPool(run.poolId);
    const results = resultsR.listByRun(runId);
    const resultByPersona = new Map(results.map((r) => [r.personaId, r]));
    const nodes = allPersonas.map((p) => {
      const r = resultByPersona.get(p.id);
      return {
        personaId: p.id,
        satisfaction: r?.sentiment ?? 0,
        positiveVerdict: r ? r.outcome === "success" : false,
        influence: 0.5,
        resistance: 1 - (p.traits as any).paymentTrust / 5,
      };
    });
    const edges = graph.listEdges(run.poolId) as any;
    const sim = simulateSpread(nodes, edges, params);
    issuesR.insertSpread({ runId, params, rounds: sim.rounds });
    for (const round of sim.rounds) {
      emitEvent(runId, { type: "spread.round", round: round.round, newAdopters: round.newAdopters });
    }
    return { runId, params, rounds: sim.rounds, totalReached: sim.totalReached, poolSize: allPersonas.length };
  });

  app.get("/api/runs/:runId/spread", async (req, reply) => {
    const { runId } = req.params as { runId: string };
    const row = issuesR.latestSpread(runId);
    if (!row) {
      reply.code(404);
      return { error: "no spread simulation yet" };
    }
    const run = runsR.getById(runId)!;
    const allPersonas = personasR.listAllByPool(run.poolId);
    return {
      runId,
      params: row.params,
      rounds: row.rounds,
      totalReached: (row.rounds as any[]).at(-1)?.cumulativeAdopters ?? 0,
      poolSize: allPersonas.length,
    };
  });

  app.get("/api/runs/:runId/report", async (req, reply) => {
    const { runId } = req.params as { runId: string };
    const row = issuesR.getReport(runId);
    if (!row) {
      reply.code(404);
      return { error: "report not ready" };
    }
    return row.json;
  });

  app.get("/api/runs/:runId/report.json", async (req, reply) => {
    const { runId } = req.params as { runId: string };
    const row = issuesR.getReport(runId);
    if (!row) {
      reply.code(404);
      return { error: "report not ready" };
    }
    reply.header("Content-Type", "application/json");
    reply.header("Content-Disposition", `attachment; filename="report-${runId}.json"`);
    return row.json;
  });

  app.get("/api/runs/:runId/report.md", async (req, reply) => {
    const { runId } = req.params as { runId: string };
    const row = issuesR.getReport(runId);
    if (!row) {
      reply.code(404);
      return "Report not ready";
    }
    reply.header("Content-Type", "text/markdown");
    reply.header("Content-Disposition", `attachment; filename="report-${runId}.md"`);
    return row.markdown;
  });
}
