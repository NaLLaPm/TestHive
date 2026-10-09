import path from "node:path";
import type { RunConfig } from "@testhive/contracts";
import { getDb, poolsRepo } from "@testhive/db";
import { runFullPipeline } from "@testhive/engine";
import type { LlmProviderName } from "@testhive/llm";
import { emitEvent } from "../../realtime/bus.js";
import { isCancelled } from "./cancel.js";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

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

const SCREENSHOT_DIR = path.resolve(findRepoRoot(), "data", "screenshots");

export async function executeRun(runId: string, poolId: string, config: RunConfig): Promise<void> {
  await runFullPipeline({
    runId,
    poolId,
    config,
    screenshotDir: SCREENSHOT_DIR,
    provider: (process.env.LLM_PROVIDER as LlmProviderName) ?? "fake",
    emit: (ev) => emitEvent(runId, ev),
    isCancelled: () => isCancelled(runId),
  }).catch(() => {
    // error state + event already recorded inside runFullPipeline
  });
}

export function resolvePoolId(requestedPoolId: string | null): string | null {
  const db = getDb();
  const pools = poolsRepo(db);
  if (requestedPoolId) {
    const row = pools.getById(requestedPoolId);
    return row && row.status === "ready" ? row.id : null;
  }
  const def = pools.getDefault();
  return def && def.status === "ready" ? def.id : null;
}
