import type { Persona } from "@testhive/contracts";
import { ClusterLabelSchema, type ClusterLabel } from "@testhive/contracts";
import { generateStructured } from "@testhive/llm";

function topValue<T extends string | number>(values: T[]): [T, number] {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: T = values[0]!;
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return [best, bestCount];
}

export interface ClusterSummary {
  clusterId: number;
  size: number;
  topTraits: Record<string, string>;
}

export function summarizeCluster(clusterId: number, members: Persona[]): ClusterSummary {
  const topTraits: Record<string, string> = {};
  const keys: (keyof Persona["traits"])[] = [
    "ageGroup", "occupation", "region", "device", "connection", "goalStyle", "accessibility",
  ];
  for (const key of keys) {
    const [val] = topValue(members.map((m) => String(m.traits[key])));
    topTraits[key] = val;
  }
  return { clusterId, size: members.length, topTraits };
}

export async function labelCluster(
  summary: ClusterSummary,
  provider?: "fake" | "gemini" | "ollama",
): Promise<ClusterLabel> {
  const prompt = [
    `A persona cluster of ${summary.size} people shares these dominant traits:`,
    ...Object.entries(summary.topTraits).map(([k, v]) => `- ${k}: ${v}`),
    "",
    "Give this cluster a short, memorable label (2-5 words) and a one-sentence description.",
    "Return JSON: { label, description }.",
  ].join("\n");
  return generateStructured(ClusterLabelSchema, prompt, {
    provider,
    label: "cluster-label",
    useCache: false,
  });
}
