import type { Traits } from "@testhive/contracts";
import { seededRng } from "@testhive/llm";
import crypto from "node:crypto";

type WeightedList<T extends string | number> = [T, number][];

function weightedPick<T extends string | number>(rng: () => number, list: WeightedList<T>): T {
  const total = list.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [value, weight] of list) {
    r -= weight;
    if (r <= 0) return value;
  }
  return list[list.length - 1]![0];
}

const AGE_GROUPS: WeightedList<Traits["ageGroup"]> = [
  ["13-17", 5], ["18-24", 25], ["25-34", 30], ["35-49", 22], ["50-64", 12], ["65+", 6],
];
const OCCUPATIONS: WeightedList<Traits["occupation"]> = [
  ["student", 20], ["gig_worker", 10], ["office_worker", 25], ["shopkeeper", 10],
  ["retiree", 8], ["homemaker", 10], ["unemployed", 6], ["freelancer", 6],
  ["farmer", 3], ["healthcare_worker", 2],
];
const REGIONS: WeightedList<Traits["region"]> = [
  ["metro", 40], ["tier-2", 40], ["rural", 20],
];
const LANGUAGE_LEVELS: WeightedList<Traits["languageLevel"]> = [
  ["native", 20], ["fluent", 35], ["conversational", 30], ["basic", 15],
];
const ATTENTION_SPANS: WeightedList<Traits["attentionSpan"]> = [
  ["short", 40], ["medium", 40], ["long", 20],
];
const DEVICES: WeightedList<Traits["device"]> = [
  ["low-end android", 30], ["mid android", 30], ["iphone", 20], ["laptop", 15], ["tablet", 5],
];
const CONNECTIONS: WeightedList<Traits["connection"]> = [
  ["3g", 25], ["4g", 50], ["broadband", 25],
];
const GOAL_STYLES: WeightedList<Traits["goalStyle"]> = [
  ["explorer", 25], ["goal_driven", 40], ["bargain_hunter", 25], ["skeptic", 10],
];
// Rare but must always be represented at a forced minimum rate.
const ACCESSIBILITY: WeightedList<Traits["accessibility"]> = [
  ["none", 85], ["low_vision", 5], ["color_blind", 4], ["motor", 3], ["screen_reader", 3],
];

function intInRange(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function sampleOneTraits(rng: () => number): Traits {
  return {
    ageGroup: weightedPick(rng, AGE_GROUPS),
    occupation: weightedPick(rng, OCCUPATIONS),
    region: weightedPick(rng, REGIONS),
    languageLevel: weightedPick(rng, LANGUAGE_LEVELS),
    techComfort: intInRange(rng, 1, 5),
    patience: intInRange(rng, 1, 5),
    attentionSpan: weightedPick(rng, ATTENTION_SPANS),
    device: weightedPick(rng, DEVICES),
    connection: weightedPick(rng, CONNECTIONS),
    accessibility: weightedPick(rng, ACCESSIBILITY),
    budgetSens: intInRange(rng, 1, 5),
    paymentTrust: intInRange(rng, 1, 5),
    goalStyle: weightedPick(rng, GOAL_STYLES),
  };
}

const ENUM_INDEX = {
  ageGroup: ["13-17", "18-24", "25-34", "35-49", "50-64", "65+"],
  occupation: ["student", "gig_worker", "office_worker", "shopkeeper", "retiree", "homemaker", "unemployed", "freelancer", "farmer", "healthcare_worker"],
  region: ["metro", "tier-2", "rural"],
  languageLevel: ["native", "fluent", "conversational", "basic"],
  attentionSpan: ["short", "medium", "long"],
  device: ["low-end android", "mid android", "iphone", "laptop", "tablet"],
  connection: ["3g", "4g", "broadband"],
  accessibility: ["none", "low_vision", "color_blind", "motor", "screen_reader"],
  goalStyle: ["explorer", "goal_driven", "bargain_hunter", "skeptic"],
} as const;

export function traitsToVector(t: Traits): number[] {
  return [
    ENUM_INDEX.ageGroup.indexOf(t.ageGroup),
    ENUM_INDEX.occupation.indexOf(t.occupation),
    ENUM_INDEX.region.indexOf(t.region),
    ENUM_INDEX.languageLevel.indexOf(t.languageLevel),
    t.techComfort,
    t.patience,
    ENUM_INDEX.attentionSpan.indexOf(t.attentionSpan),
    ENUM_INDEX.device.indexOf(t.device),
    ENUM_INDEX.connection.indexOf(t.connection),
    ENUM_INDEX.accessibility.indexOf(t.accessibility),
    t.budgetSens,
    t.paymentTrust,
    ENUM_INDEX.goalStyle.indexOf(t.goalStyle),
  ];
}

export function traitsHash(t: Traits): string {
  return crypto.createHash("sha1").update(JSON.stringify(t)).digest("hex");
}

function vectorDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i]! - b[i]!) ** 2;
  return Math.sqrt(sum);
}

export interface SampleTraitsOptions {
  size: number;
  seed: number;
  dedupeDistanceThreshold?: number;
  minAccessibilityCount?: number;
}

export interface SampleTraitsResult {
  traits: Traits[];
  duplicatesRejected: number;
}

/** Sample `size` diverse, de-duplicated trait vectors with a seeded RNG (reproducible). */
export function sampleTraits(opts: SampleTraitsOptions): SampleTraitsResult {
  const { size, seed } = opts;
  const dedupeDistanceThreshold = opts.dedupeDistanceThreshold ?? 0.6;
  const minAccessibilityCount = opts.minAccessibilityCount ?? Math.max(5, Math.round(size * 0.03));
  const rng = seededRng(`sample:${seed}:${size}`);

  const seenHashes = new Set<string>();
  const vectors: number[][] = [];
  const result: Traits[] = [];
  let duplicatesRejected = 0;

  function tryAdd(t: Traits): boolean {
    const hash = traitsHash(t);
    if (seenHashes.has(hash)) return false;
    const vec = traitsToVector(t);
    for (const v of vectors) {
      if (vectorDistance(vec, v) < dedupeDistanceThreshold) {
        return false;
      }
    }
    seenHashes.add(hash);
    vectors.push(vec);
    result.push(t);
    return true;
  }

  // Force a minimum number of each rare accessibility profile first.
  const rareProfiles: Traits["accessibility"][] = ["low_vision", "color_blind", "motor", "screen_reader"];
  for (const profile of rareProfiles) {
    let added = 0;
    let attempts = 0;
    while (added < Math.ceil(minAccessibilityCount / rareProfiles.length) && attempts < 200 && result.length < size) {
      const base = sampleOneTraits(rng);
      const forced: Traits = { ...base, accessibility: profile };
      if (tryAdd(forced)) added++;
      attempts++;
    }
  }

  let attempts = 0;
  const maxAttempts = size * 50;
  while (result.length < size && attempts < maxAttempts) {
    const t = sampleOneTraits(rng);
    if (!tryAdd(t)) duplicatesRejected++;
    attempts++;
  }

  // If dedupe was too strict to reach size, relax and fill remaining without the distance check.
  while (result.length < size) {
    const t = sampleOneTraits(rng);
    const hash = traitsHash(t);
    if (!seenHashes.has(hash)) {
      seenHashes.add(hash);
      result.push(t);
    }
  }

  return { traits: result, duplicatesRejected };
}
