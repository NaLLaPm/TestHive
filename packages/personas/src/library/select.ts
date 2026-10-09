import crypto from "node:crypto";
import type { Persona, Selection } from "@testhive/contracts";
import { seededRng } from "@testhive/llm";

function shuffleSeeded<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

/** Deterministic selection of a subset of an already-built pool. Never generates personas. */
export function selectPersonas(allPersonas: Persona[], selection: Selection): Persona[] {
  const rng = seededRng(`select:${selection.seed}:${selection.strategy}:${selection.count}`);

  if (selection.strategy === "all") return allPersonas;

  if (selection.strategy === "filter" && selection.filter) {
    const entries = Object.entries(selection.filter);
    const filtered = allPersonas.filter((p) =>
      entries.every(([k, v]) => String((p.traits as Record<string, unknown>)[k]) === v),
    );
    return shuffleSeeded(filtered, rng).slice(0, selection.count);
  }

  if (selection.strategy === "random") {
    return shuffleSeeded(allPersonas, rng).slice(0, selection.count);
  }

  // stratified (default): proportional per cluster, covers every cluster even in small runs.
  const byCluster = new Map<number, Persona[]>();
  for (const p of allPersonas) {
    const c = p.clusterId ?? -1;
    if (!byCluster.has(c)) byCluster.set(c, []);
    byCluster.get(c)!.push(p);
  }
  const clusters = [...byCluster.entries()].sort((a, b) => a[0] - b[0]);
  const total = allPersonas.length;
  const picked: Persona[] = [];

  for (const [, members] of clusters) {
    const shuffled = shuffleSeeded(members, rng);
    const share = Math.max(1, Math.round((members.length / total) * selection.count));
    picked.push(...shuffled.slice(0, share));
  }

  // Trim or top up to hit the exact requested count deterministically.
  if (picked.length > selection.count) {
    return shuffleSeeded(picked, rng).slice(0, selection.count);
  }
  if (picked.length < selection.count) {
    const pickedIds = new Set(picked.map((p) => p.id));
    const remaining = shuffleSeeded(
      allPersonas.filter((p) => !pickedIds.has(p.id)),
      rng,
    );
    picked.push(...remaining.slice(0, selection.count - picked.length));
  }
  return picked;
}

/** Baseline control personas: highly motivated, high tech comfort, broadband connection,
 * patient, forgiving, simple-task mindset. If they fail, it signals a site outage/critical bug
 * rather than an agent/demographic idiosyncrasy. */
export function createControlPersonas(poolId: string, count = 3): Persona[] {
  const controls: Persona[] = [];
  for (let i = 0; i < count; i++) {
    controls.push({
      id: crypto.randomUUID(),
      poolId,
      traits: {
        ageGroup: "25-34",
        occupation: "office_worker",
        region: "metro",
        languageLevel: "native",
        techComfort: 5,
        patience: 5,
        attentionSpan: "long",
        device: "laptop",
        connection: "broadband",
        accessibility: "none",
        budgetSens: 1,
        paymentTrust: 5,
        goalStyle: "goal_driven",
      },
      traitVector: [2, 2, 0, 0, 5, 5, 2, 3, 2, 0, 1, 5, 1],
      traitsHash: `control-hash-${poolId}-${i + 1}`,
      backstory: `Baseline Control Persona #${i + 1}: Highly motivated expert user on high-speed fiber internet and a modern laptop. Patient, focused, and determined to complete the checkout task cleanly.`,
      voice: "Direct, helpful, clear, and persevering.",
      quirks: ["follows instructions methodically", "resilient to minor UI delays"],
      deviceProfileKey: "laptop-broadband",
      clusterId: null,
      isControl: true,
      schemaVersion: 1,
    });
  }
  return controls;
}

