import type { FastifyInstance } from "fastify";
import crypto from "node:crypto";
import { getDb, poolsRepo, personasRepo, graphRepo } from "@testhive/db";
import { CreatePoolRequestSchema, ListPersonasQuerySchema, UpdatePersonaRequestSchema } from "@testhive/contracts";
import { buildPool } from "@testhive/personas";
import { emitEvent, getHistory, subscribe } from "../../realtime/bus.js";
import type { LlmProviderName } from "@testhive/llm";

function poolRowToApi(row: ReturnType<ReturnType<typeof poolsRepo>["getById"]>) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    version: row.version,
    size: row.size,
    seed: row.seed,
    status: row.status,
    generatorConfig: row.generatorConfig as Record<string, unknown>,
    diversityReport: (row.diversityReport as object | null) ?? null,
    isDefault: row.isDefault,
    createdAt: row.createdAt,
  };
}

export async function poolRoutes(app: FastifyInstance) {
  const db = getDb();
  const pools = poolsRepo(db);
  const personas = personasRepo(db);
  const graph = graphRepo(db);

  app.get("/api/pools", async () => pools.list().map(poolRowToApi));

  app.post("/api/pools", async (req, reply) => {
    const body = CreatePoolRequestSchema.parse(req.body);
    const existing = pools.getBySlug(body.slug);
    if (existing) {
      reply.code(409);
      return { error: `Pool with slug "${body.slug}" already exists` };
    }
    const id = crypto.randomUUID();
    pools.insert({
      id,
      slug: body.slug,
      version: 1,
      size: body.size,
      seed: body.seed,
      status: "queued",
      generatorConfig: { provider: process.env.LLM_PROVIDER ?? "fake" },
      isDefault: body.isDefault,
    });

    // Fire and forget: build runs in the background, progress via SSE.
    void buildPool({
      ...body,
      provider: (process.env.LLM_PROVIDER as LlmProviderName) ?? "fake",
      onProgress: (p) => {
        emitEvent(id, { type: "pool.state", state: p.state, progress: { done: p.done, total: p.total } });
        if (p.state === "ready" && p.done === p.total) {
          emitEvent(id, { type: "pool.ready", poolId: id });
        }
      },
    }).catch((err) => {
      pools.update(id, { status: "failed" });
      emitEvent(id, { type: "pool.error", message: err instanceof Error ? err.message : String(err) });
    });

    reply.code(201);
    return poolRowToApi(pools.getById(id));
  });

  app.get("/api/pools/:poolId", async (req, reply) => {
    const { poolId } = req.params as { poolId: string };
    const row = pools.getById(poolId);
    if (!row) {
      reply.code(404);
      return { error: "not found" };
    }
    return poolRowToApi(row);
  });

  app.get("/api/pools/:poolId/stream", async (req, reply) => {
    const { poolId } = req.params as { poolId: string };
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });
    for (const ev of getHistory(poolId)) {
      reply.raw.write(`data: ${JSON.stringify(ev)}\n\n`);
    }
    const unsubscribe = subscribe(poolId, (ev) => {
      reply.raw.write(`data: ${JSON.stringify(ev)}\n\n`);
    });
    req.raw.on("close", unsubscribe);
  });

  app.get("/api/pools/:poolId/personas", async (req, reply) => {
    const { poolId } = req.params as { poolId: string };
    const query = ListPersonasQuerySchema.parse(req.query);
    let all = personas.listAllByPool(poolId);
    if (query.clusterId !== undefined) all = all.filter((p) => p.clusterId === query.clusterId);
    if (query.trait && query.value) {
      all = all.filter((p) => String((p.traits as Record<string, unknown>)[query.trait!]) === query.value);
    }
    const total = all.length;
    const start = (query.page - 1) * query.pageSize;
    const items = all.slice(start, start + query.pageSize);
    return { items, total, page: query.page, pageSize: query.pageSize };
  });

  app.get("/api/pools/:poolId/personas/:personaId", async (req, reply) => {
    const { personaId } = req.params as { poolId: string; personaId: string };
    const row = personas.getById(personaId);
    if (!row) {
      reply.code(404);
      return { error: "not found" };
    }
    return row;
  });

  app.patch("/api/pools/:poolId/personas/:personaId", async (req, reply) => {
    const { poolId, personaId } = req.params as { poolId: string; personaId: string };
    const existing = personas.getById(personaId);
    if (!existing || existing.poolId !== poolId) {
      reply.code(404);
      return { error: "Persona not found" };
    }

    const body = UpdatePersonaRequestSchema.parse(req.body);
    const updates: Record<string, unknown> = {};
    if (body.backstory !== undefined) updates.backstory = body.backstory;
    if (body.voice !== undefined) updates.voice = body.voice;
    if (body.quirks !== undefined) updates.quirks = body.quirks;
    if (body.deviceProfileKey !== undefined) updates.deviceProfileKey = body.deviceProfileKey;
    if (body.traits !== undefined) {
      const mergedTraits = { ...(existing.traits as Record<string, unknown>), ...body.traits };
      updates.traits = mergedTraits;
    }

    const updated = personas.update(personaId, updates as any);
    return updated;
  });

  app.get("/api/pools/:poolId/graph", async (req, reply) => {
    const { poolId } = req.params as { poolId: string };
    const nodes = personas.listAllByPool(poolId).map((p) => {
      const traits = (p.traits ?? {}) as Record<string, unknown>;
      return {
        id: p.id,
        clusterId: p.clusterId,
        ageGroup: (traits.ageGroup as string) ?? "Adult",
        device: (traits.device as string) ?? "Unknown",
        region: (traits.region as string) ?? "Global",
        occupation: (traits.occupation as string) ?? undefined,
      };
    });
    const edges = graph.listEdges(poolId);
    const clusters = graph.listClusters(poolId);
    reply.header("ETag", `"${poolId}-${nodes.length}-${edges.length}"`);
    return { poolId, nodes, edges, clusters };
  });

  app.get("/api/pools/:poolId/clusters", async (req) => {
    const { poolId } = req.params as { poolId: string };
    return graph.listClusters(poolId);
  });
}
