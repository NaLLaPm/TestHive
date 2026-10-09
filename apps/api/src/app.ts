import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import fs from "node:fs";
import { poolRoutes } from "./modules/pools/routes.js";
import { runRoutes } from "./modules/runs/routes.js";
import { demoRoutes } from "./modules/demo/routes.js";

import { fileURLToPath } from "node:url";

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

export async function buildApp() {
  const app = Fastify({ logger: true, bodyLimit: 5 * 1024 * 1024 });

  await app.register(cors, { origin: true });

  const screenshotDir = path.resolve(findRepoRoot(), "data", "screenshots");
  fs.mkdirSync(screenshotDir, { recursive: true });
  await app.register(fastifyStatic, {
    root: screenshotDir,
    prefix: "/api/assets/",
  });

  app.get("/api/health", async () => ({ status: "ok", version: "0.1.0" }));

  await app.register(poolRoutes);
  await app.register(runRoutes);
  await app.register(demoRoutes);

  app.setErrorHandler((err: Error & { statusCode?: number }, _req, reply) => {
    app.log.error(err);
    const status = err.statusCode ?? 500;
    reply.code(status).send({ error: err.message });
  });

  return app;
}
