import type { FunnelStep, PersonaResult } from "@testhive/contracts";

export interface PersonaStepRecord {
  personaId: string;
  step: number;
  action?: Record<string, unknown>;
  note?: string | null;
}

export function computeFunnel(
  results: PersonaResult[],
  steps: PersonaStepRecord[] = [],
  totalPersonasCount?: number,
): FunnelStep[] {
  const total = totalPersonasCount && totalPersonasCount > 0 ? totalPersonasCount : Math.max(results.length, 1);

  // Group steps by persona
  const stepsByPersona = new Map<string, PersonaStepRecord[]>();
  for (const s of steps) {
    if (!stepsByPersona.has(s.personaId)) stepsByPersona.set(s.personaId, []);
    stepsByPersona.get(s.personaId)!.push(s);
  }

  // Determine highest stage reached by each persona (1 to 5)
  // Stage 1: Landing
  // Stage 2: Product Detail
  // Stage 3: Cart
  // Stage 4: Checkout
  // Stage 5: Success
  const stageReachedCounts = [0, 0, 0, 0, 0, 0]; // 1-indexed (1..5)
  const dropOffStageCounts = [0, 0, 0, 0, 0, 0];

  for (const r of results) {
    let maxStage = 1; // Everyone touches Landing

    if (r.outcome === "success") {
      maxStage = 5;
    } else if (typeof r.dropOffStep === "number") {
      // Use dropOffStep directly from results
      if (r.dropOffStep <= 1) maxStage = 1;
      else if (r.dropOffStep === 2) maxStage = 2;
      else if (r.dropOffStep === 3) maxStage = 3;
      else if (r.dropOffStep === 4) maxStage = 4;
      else maxStage = 5;
    } else {
      // In-progress personas: use recorded step traces to determine stage
      const pSteps = stepsByPersona.get(r.personaId) ?? [];
      for (const st of pSteps) {
        const act = (st.action ?? {}) as Record<string, unknown>;
        const actionType = String(act.type ?? "");

        if (actionType === "done") {
          maxStage = 5;
        } else if (actionType === "give_up") {
          // Dropped off at this step — use step number as stage indicator
          const stepNum = st.step;
          if (stepNum <= 1) maxStage = Math.max(maxStage, 1);
          else if (stepNum === 2) maxStage = Math.max(maxStage, 2);
          else if (stepNum === 3) maxStage = Math.max(maxStage, 3);
          else if (stepNum === 4) maxStage = Math.max(maxStage, 4);
          else maxStage = Math.max(maxStage, 5);
        }
      }
      // Also use the highest step number reached for granularity
      if (pSteps.length > 0) {
        const maxStep = Math.max(...pSteps.map((s) => s.step));
        maxStage = Math.max(maxStage, Math.min(maxStep, 5));
      }
    }

    // Mark stages reached
    for (let s = 1; s <= maxStage; s++) {
      stageReachedCounts[s] = (stageReachedCounts[s] ?? 0) + 1;
    }

    // Mark drop-off if not successful
    if (r.outcome !== "success") {
      dropOffStageCounts[maxStage] = (dropOffStageCounts[maxStage] ?? 0) + 1;
    }
  }

  const stageDefinitions = [
    { id: "landing", name: "Landing", order: 1 },
    { id: "product", name: "Product Detail", order: 2 },
    { id: "cart", name: "Cart", order: 3 },
    { id: "checkout", name: "Checkout", order: 4 },
    { id: "success", name: "Success", order: 5 },
  ];

  return stageDefinitions.map((def, idx) => {
    const stageNum = idx + 1;
    // Scale reachedCount proportionally if total > results.length
    const rawReached = stageReachedCounts[stageNum] ?? 0;
    const reachedCount = results.length > 0
      ? Math.round((rawReached / results.length) * total)
      : (stageNum === 1 ? total : 0);

    const rawDropOff = dropOffStageCounts[stageNum] ?? 0;
    const dropOffCount = results.length > 0
      ? Math.round((rawDropOff / results.length) * total)
      : 0;

    const conversionPct = total > 0 ? Math.round((reachedCount / total) * 1000) / 1000 : 0;
    const dropOffPct = reachedCount > 0 ? Math.round((dropOffCount / reachedCount) * 1000) / 1000 : 0;

    return {
      id: def.id,
      name: def.name,
      order: def.order,
      reachedCount,
      dropOffCount,
      conversionPct,
      dropOffPct,
    };
  });
}
