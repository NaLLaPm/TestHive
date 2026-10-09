import type {
  Persona,
  PersonaResult,
  SegmentsResponse,
  ClusterSegment,
  TraitSegment,
  BaselineControlStat,
  RepeatVarianceStat,
} from "@testhive/contracts";

export interface ClusterLabelLookup {
  [clusterId: number]: string;
}

/** Computes Wilson score interval (or normal approximation margin of error) for a proportion. */
export function computeConfidenceInterval(successRate: number, n: number, z = 1.96): {
  ciLower: number;
  ciUpper: number;
  marginOfError: number;
} {
  if (n <= 0) return { ciLower: 0, ciUpper: 0, marginOfError: 0 };
  // Wilson score interval with continuity correction
  const p = Math.max(0, Math.min(1, successRate));
  const denominator = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denominator;
  const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denominator;

  const ciLower = Math.max(0, Math.round((center - margin) * 1000) / 1000);
  const ciUpper = Math.min(1, Math.round((center + margin) * 1000) / 1000);
  const marginOfError = Math.round(((ciUpper - ciLower) / 2) * 1000) / 1000;

  return { ciLower, ciUpper, marginOfError };
}

export function computeSegments(
  personas: Persona[],
  results: PersonaResult[],
  clusterLabels: ClusterLabelLookup,
  clusterDescriptionsOrMinN?: Record<number, string> | number,
  minNArg = 10,
): SegmentsResponse {
  const clusterDescriptions =
    typeof clusterDescriptionsOrMinN === "object" ? clusterDescriptionsOrMinN : undefined;
  const minN =
    typeof clusterDescriptionsOrMinN === "number" ? clusterDescriptionsOrMinN : minNArg;
  const resultByPersona = new Map(results.map((r) => [r.personaId, r]));
  const successOf = (r: PersonaResult | undefined) => (r ? (r.outcome === "success" ? 1 : 0) : null);

  // 1. Separate baseline controls from normal pool personas
  const controlResults = results.filter((r) => Boolean(r.isControl || (r as any).is_control || r.personaId.includes("c001")));
  const controlPersonaIds = new Set(controlResults.map((r) => r.personaId));
  const nonControlPersonas = personas.filter(
    (p) => !p.isControl && !(p as any).is_control && !controlPersonaIds.has(p.id) && p.clusterId !== 9999 && !p.id.includes("c001"),
  );

  let totalSuccess = 0;
  let totalN = 0;
  const byCluster = new Map<number, { success: number; n: number }>();
  const byTrait: Record<string, Map<string, { success: number; n: number }>> = {};

  for (const p of nonControlPersonas) {
    const r = resultByPersona.get(p.id);
    const s = successOf(r);
    if (s === null) continue;
    totalSuccess += s;
    totalN += 1;

    const clusterId = p.clusterId ?? -1;
    if (!byCluster.has(clusterId)) byCluster.set(clusterId, { success: 0, n: 0 });
    const c = byCluster.get(clusterId)!;
    c.success += s;
    c.n += 1;

    for (const [traitKey, traitVal] of Object.entries(p.traits)) {
      if (!byTrait[traitKey]) byTrait[traitKey] = new Map();
      const key = String(traitVal);
      const m = byTrait[traitKey]!;
      if (!m.has(key)) m.set(key, { success: 0, n: 0 });
      const t = m.get(key)!;
      t.success += s;
      t.n += 1;
    }
  }

  const overallRate = totalN > 0 ? totalSuccess / totalN : 0;
  const overallCI = computeConfidenceInterval(overallRate, totalN);

  const byClusterOut: ClusterSegment[] = [...byCluster.entries()]
    .map(([clusterId, v]) => {
      const rate = v.n > 0 ? v.success / v.n : 0;
      const ci = computeConfidenceInterval(rate, v.n);
      return {
        clusterId,
        label: clusterLabels[clusterId] ?? `Cluster ${clusterId}`,
        description: clusterDescriptions?.[clusterId],
        n: v.n,
        successRate: rate,
        ciLower: ci.ciLower,
        ciUpper: ci.ciUpper,
        marginOfError: ci.marginOfError,
        isLowSample: v.n < minN,
      };
    })
    .sort((a, b) => a.successRate - b.successRate);

  const byTraitOut: Record<string, TraitSegment[]> = {};
  for (const [traitKey, m] of Object.entries(byTrait)) {
    byTraitOut[traitKey] = [...m.entries()]
      .map(([value, v]) => {
        const rate = v.n > 0 ? v.success / v.n : 0;
        const ci = computeConfidenceInterval(rate, v.n);
        return {
          value,
          n: v.n,
          successRate: rate,
          ciLower: ci.ciLower,
          ciUpper: ci.ciUpper,
          marginOfError: ci.marginOfError,
          isLowSample: v.n < minN,
        };
      })
      .sort((a, b) => a.successRate - b.successRate);
  }

  // 2. Compute baseline control status
  let baselineControl: BaselineControlStat | undefined;
  if (controlResults.length > 0) {
    const passedControls = controlResults.filter((r) => r.outcome === "success").length;
    const rate = passedControls / controlResults.length;
    const allPassed = passedControls === controlResults.length;
    baselineControl = {
      n: controlResults.length,
      successRate: rate,
      allPassed,
      status: allPassed ? "healthy" : "suspect_site_outage",
      note: allPassed
        ? "All highly motivated control personas succeeded. Failures in other clusters can be confidently attributed to UX friction."
        : "Warning: Control personas failed! This indicates a site outage, broken flow, or environment failure rather than agent inability.",
    };
  }

  // 3. Compute repeat variance across runs
  const byPersonaAllResults = new Map<string, PersonaResult[]>();
  for (const r of results) {
    if (!byPersonaAllResults.has(r.personaId)) byPersonaAllResults.set(r.personaId, []);
    byPersonaAllResults.get(r.personaId)!.push(r);
  }

  let totalVariance = 0;
  let personasWithRepeats = 0;
  let flakyCount = 0;
  let maxRepeats = 1;

  for (const [, runList] of byPersonaAllResults) {
    if (runList.length > 1) {
      personasWithRepeats++;
      maxRepeats = Math.max(maxRepeats, runList.length);
      const outcomes: number[] = runList.map((x) => (x.outcome === "success" ? 1 : 0));
      const mean = outcomes.reduce((a: number, b: number) => a + b, 0) / outcomes.length;
      const variance = outcomes.reduce((sum: number, val: number) => sum + (val - mean) ** 2, 0) / (outcomes.length - 1);
      totalVariance += variance;
      if (variance > 0) flakyCount++;

    }
  }

  const repeatVariance: RepeatVarianceStat | undefined =
    personasWithRepeats > 0
      ? {
          repeats: maxRepeats,
          avgVariance: Math.round((totalVariance / personasWithRepeats) * 1000) / 1000,
          consistencyScore:
            Math.round((1 - flakyCount / personasWithRepeats) * 1000) / 1000,
          flakyCount,
        }
      : undefined;

  return {
    overall: {
      successRate: overallRate,
      n: totalN,
      ciLower: overallCI.ciLower,
      ciUpper: overallCI.ciUpper,
      marginOfError: overallCI.marginOfError,
      isLowSample: totalN < minN,
    },
    byCluster: byClusterOut,
    byTrait: byTraitOut,
    minN,
    baselineControl,
    repeatVariance,
  };
}

