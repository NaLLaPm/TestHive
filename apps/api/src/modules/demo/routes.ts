import type { FastifyInstance } from "fastify";
import fs from "node:fs";
import path from "node:path";

import { fileURLToPath } from "node:url";
import { getDb, runsRepo } from "@testhive/db";

function findRepoRoot(): string {
  let cur = path.dirname(fileURLToPath(import.meta.url));
  while (cur) {
    if (fs.existsSync(path.join(cur, "turbo.json")) || fs.existsSync(path.join(cur, "pnpm-workspace.yaml"))) {
      return cur;
    }
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return process.cwd();
}

function getManifestPath(): string {
  const localPath = path.resolve(process.cwd(), "data", "demo-manifest.json");
  if (fs.existsSync(localPath)) return localPath;
  const rootPath = path.resolve(findRepoRoot(), "data", "demo-manifest.json");
  return rootPath;
}

interface DemoManifestEntry {
  demoId: string;
  title: string;
  description: string;
  runId: string | null;
}

function readManifest(): DemoManifestEntry[] {
  const manifestPath = getManifestPath();
  if (!fs.existsSync(manifestPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  } catch {
    return [];
  }
}

export async function demoRoutes(app: FastifyInstance) {
  app.get("/api/demo/runs", async () => {
    const manifest = readManifest();
    if (manifest.length > 0 && manifest.some((m) => Boolean(m.runId))) {
      return manifest;
    }
    try {
      const db = getDb();
      const runs = runsRepo(db).list().filter((r) => r.state === "completed");
      if (runs.length > 0) {
        return runs.slice(0, 2).map((r, i) => ({
          demoId: i === 0 ? "before-fix" : "after-fix",
          title: `Completed run: ${(r.stimulus as Record<string, unknown> | null)?.goal ?? "Journey"}`,
          description: `Real completed run with ${r.donePersonas} personas.`,
          runId: r.id,
        }));
      }
    } catch {}
    return manifest;
  });

  app.post("/api/demo/runs/:demoId/load", async (req, reply) => {
    const { demoId } = req.params as { demoId: string };
    const entry = readManifest().find((e) => e.demoId === demoId);
    if (entry && entry.runId) {
      return { runId: entry.runId };
    }
    try {
      const db = getDb();
      const runs = runsRepo(db).list().filter((r) => r.state === "completed");
      if (runs.length > 0) {
        const fallbackRun = demoId === "before-fix" ? runs[0] : (runs[1] ?? runs[0]);
        if (fallbackRun) {
          return { runId: fallbackRun.id };
        }
      }
    } catch {}

    reply.code(404);
    return { error: "demo run not found; run `pnpm demo:seed` first" };
  });
}
