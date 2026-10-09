import "dotenv/config";
import { buildPool } from "@testhive/personas";
import type { LlmProviderName } from "@testhive/llm";

function arg(name: string, fallback?: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1];
}

async function main() {
  const slug = arg("slug", "default-v1")!;
  const size = Number(arg("size", "1000"));
  const seed = Number(arg("seed", "42"));
  const isDefault = process.argv.includes("--default") || slug === "default-v1";
  const provider = (process.env.LLM_PROVIDER as LlmProviderName) ?? "fake";

  console.log(`Building pool "${slug}" (size=${size}, seed=${seed}, provider=${provider})...`);
  const start = Date.now();

  const { poolId, diversityReport } = await buildPool({
    slug,
    size,
    seed,
    isDefault,
    provider,
    onProgress: (p) => {
      process.stdout.write(`\r[${p.state}] ${p.done}/${p.total}          `);
    },
  });

  const seconds = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nPool ready: ${poolId} (${seconds}s)`);
  console.log(`Clusters: ${diversityReport.clusterCount}, duplicates rejected: ${diversityReport.duplicatesRejected}`);
  console.log(JSON.stringify(diversityReport.byTrait, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
