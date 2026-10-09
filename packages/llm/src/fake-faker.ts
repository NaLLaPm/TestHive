import { z } from "zod";
import crypto from "node:crypto";

/** Deterministic mulberry32 PRNG seeded from a string. */
export function seededRng(seedStr: string): () => number {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

const WORDS = [
  "quick", "careful", "curious", "busy", "skeptical", "excited", "tired", "hopeful",
  "practical", "cautious", "friendly", "focused", "distracted", "thrifty", "patient",
  "price", "screen", "button", "signup", "checkout", "menu", "loading", "video",
  "deal", "coupon", "review", "friend", "family", "app", "page", "offer",
  "cart", "payment", "delivery", "shipping", "discount", "banner", "input", "modal",
  "header", "footer", "contrast", "readable", "confusing", "intuitive", "laggy",
  "responsive", "smooth", "unresponsive", "broken", "clear", "straightforward",
  "complicated", "misleading", "trustworthy", "secure", "verified", "helpful",
];

export function seededUuid(rng: () => number): string {
  const hex = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      s += "-";
    } else if (i === 14) {
      s += "4";
    } else if (i === 19) {
      s += hex[Math.floor(rng() * 4) + 8];
    } else {
      s += hex[Math.floor(rng() * 16)];
    }
  }
  return s;
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)] as T;
}

function sentence(rng: () => number, minWords = 6, maxWords = 14): string {
  const n = minWords + Math.floor(rng() * (maxWords - minWords));
  const words: string[] = [];
  for (let i = 0; i < n; i++) words.push(pick(rng, WORDS));
  const s = words.join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}

/** Walk a Zod schema and produce deterministic schema-valid fake data using rng. */
export function zodFake(schema: z.ZodTypeAny, rng: () => number): unknown {
  const def = (schema as any)._def;

  if (schema instanceof z.ZodOptional) return rng() < 0.15 ? undefined : zodFake(schema.unwrap(), rng);
  if (schema instanceof z.ZodNullable) return rng() < 0.1 ? null : zodFake(schema.unwrap(), rng);
  if (schema instanceof z.ZodDefault) return zodFake(def.innerType, rng);
  if (schema instanceof z.ZodEffects) return zodFake(def.schema, rng);

  if (schema instanceof z.ZodString) {
    if (def.checks?.some((c: any) => c.kind === "uuid")) {
      return seededUuid(rng);
    }
    if (def.checks?.some((c: any) => c.kind === "url")) {
      return "https://example.com/" + pick(rng, WORDS);
    }
    const maxCheck = def.checks?.find((c: any) => c.kind === "max");
    const max = maxCheck ? Math.min(maxCheck.value, 200) : 200;
    let s = sentence(rng, 4, 10);
    while (s.length > max) s = s.slice(0, Math.max(5, max - 1)) + ".";
    return s;
  }

  if (schema instanceof z.ZodNumber) {
    const min = def.checks?.find((c: any) => c.kind === "min")?.value ?? -1;
    const max = def.checks?.find((c: any) => c.kind === "max")?.value ?? 1;
    const isInt = def.checks?.some((c: any) => c.kind === "int");
    const v = min + rng() * (max - min);
    return isInt ? Math.round(v) : Math.round(v * 100) / 100;
  }

  if (schema instanceof z.ZodBoolean) return rng() < 0.5;

  if (schema instanceof z.ZodEnum) {
    return pick(rng, def.values as string[]);
  }

  if (schema instanceof z.ZodLiteral) return def.value;

  if (schema instanceof z.ZodArray) {
    const min = def.minLength?.value ?? 1;
    const max = Math.max(min, def.maxLength?.value ?? min + 2);
    const n = min + Math.floor(rng() * (max - min + 1));
    return Array.from({ length: n }, () => zodFake(def.type, rng));
  }

  if (schema instanceof z.ZodRecord) {
    return {};
  }

  if (schema instanceof z.ZodUnion || schema instanceof z.ZodDiscriminatedUnion) {
    const options = schema instanceof z.ZodDiscriminatedUnion
      ? Array.from((schema as any).options.values())
      : (def.options as z.ZodTypeAny[]);
    return zodFake(pick(rng, options as z.ZodTypeAny[]), rng);
  }

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(shape)) {
      const val = zodFake(shape[key], rng);
      if (val !== undefined) out[key] = val;
    }
    return out;
  }

  return null;
}

export function fakeGenerate<T>(schema: z.ZodType<T>, promptOrSeed: string): T {
  const rng = seededRng(hashString(promptOrSeed));
  const data = zodFake(schema, rng);
  return schema.parse(data);
}
