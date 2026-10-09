import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { buildPool } from "@testhive/personas";
import { getDb, poolsRepo, runsRepo } from "@testhive/db";
import { runFullPipeline } from "@testhive/engine";
import type { RunConfig } from "@testhive/contracts";
import type { LlmProviderName } from "@testhive/llm";

const MANIFEST_PATH = path.resolve(process.cwd(), "data", "demo-manifest.json");
const DEMO_SITE_PORT = Number(process.env.DEMO_SITE_PORT ?? 8989);
const DEMO_HOST = process.env.DEMO_SITE_HOST ?? `http://localhost:${DEMO_SITE_PORT}`;
const provider = (process.env.LLM_PROVIDER as LlmProviderName) ?? "fake";

function arg(name: string, fallback: string): string {
  const idx = process.argv.indexOf(`--${name}`);
  return idx === -1 ? fallback : process.argv[idx + 1]!;
}

async function ensurePool(slug: string, size: number): Promise<string> {
  const db = getDb();
  const pools = poolsRepo(db);
  const existing = pools.getBySlug(slug);
  if (existing && existing.status === "ready") return existing.id;

  console.log(`Building pool "${slug}" (size=${size})...`);
  const { poolId } = await buildPool({
    slug,
    size,
    seed: 42,
    isDefault: slug === "default-v1",
    provider,
    onProgress: (p) => process.stdout.write(`\r[${p.state}] ${p.done}/${p.total}          `),
  });
  console.log(`\nPool ready: ${poolId}`);
  return poolId;
}

async function runDemoScenario(poolId: string, label: string, url: string, runSize: number): Promise<string> {
  const db = getDb();
  const runsR = runsRepo(db);
  const runId = crypto.randomUUID();
  const config: RunConfig = {
    kind: "url_journey",
    poolId,
    stimulus: { type: "url", url, goal: "Buy a pair of wireless earbuds" },
    selection: { strategy: "stratified", count: runSize, seed: 42 },
    deepCount: Math.min(10, runSize),
    maxSteps: 8,
    concurrency: 10,
    useCache: true,
  };
  runsR.insert({
    id: runId,
    kind: config.kind,
    poolId,
    stimulus: config.stimulus,
    config,
    state: "created",
    totalPersonas: 0,
    donePersonas: 0,
  });

  console.log(`\nRunning demo scenario "${label}" against ${url} ...`);
  await runFullPipeline({
    runId,
    poolId,
    config,
    emit: (ev) => {
      if (ev.type === "run.state") process.stdout.write(`\r[${label}] ${ev.state} ${ev.progress.done}/${ev.progress.total}          `);
    },
    isCancelled: () => false,
    provider,
  });
  console.log(`\nDemo scenario "${label}" complete: run ${runId}`);
  return runId;
}

async function main() {
  const size = Number(arg("pool-size", arg("size", "200")));
  const seed = Number(arg("seed", "42"));
  const poolSlug = arg("pool", "default-v1");
  const poolId = await ensurePool(poolSlug, size);

  const customUrl = arg("url", "");
  const beforeUrl = customUrl ? customUrl : arg("url-before", `${DEMO_HOST}/before`);
  const afterUrl = customUrl ? customUrl : arg("url-after", `${DEMO_HOST}/after`);
  const goal = arg("goal", "Buy a pair of wireless earbuds");

  const beforeRunId = await runDemoScenario(poolId, "before-fix", beforeUrl, size);
  const afterRunId = await runDemoScenario(poolId, "after-fix", afterUrl, size);

  let hostLabel = "ShopKart";
  try {
    hostLabel = new URL(beforeUrl).hostname.replace(/^www\./, "");
  } catch {}

  const manifest = [
    {
      demoId: "before-fix",
      title: `${hostLabel} checkout (before fix)`,
      description: `Baseline run against ${beforeUrl} with ${size} personas: "${goal}". Expect friction and lower conversion.`,
      runId: beforeRunId,
    },
    {
      demoId: "after-fix",
      title: `${hostLabel} checkout (after fix)`,
      description: `Optimized run against ${afterUrl} with ${size} personas: "${goal}". Measure conversion and friction improvements.`,
      runId: afterRunId,
    },
  ];
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\nWrote demo manifest: ${MANIFEST_PATH}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
