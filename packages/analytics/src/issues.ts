import crypto from "node:crypto";
import type { Issue, PersonaResult, Severity } from "@testhive/contracts";
import { IssueClusterSchema } from "@testhive/contracts";
import { generateStructured, type LlmProviderName } from "@testhive/llm";

const STOPWORDS = new Set([
  "the", "a", "an", "to", "of", "and", "is", "it", "this", "that", "i", "on", "in", "for",
  "was", "were", "with", "at", "my", "me", "but", "so", "not", "no", "be", "as", "if",
  "could", "would", "did", "do", "does", "there", "here", "you", "your", "they", "then",
]);

function keywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
}

export interface FrictionNote {
  personaId: string;
  clusterId: number | null;
  note: string;
  step: number | null;
  screenshot: string | null;
}

interface Group {
  keyword: string;
  notes: FrictionNote[];
}

function groupByKeyword(notes: FrictionNote[], maxGroups: number): Group[] {
  const freq = new Map<string, number>();
  const notesWithKeywords = notes.map((n) => ({ note: n, kws: keywords(n.note) }));
  for (const { kws } of notesWithKeywords) {
    const unique = new Set(kws);
    for (const k of unique) freq.set(k, (freq.get(k) ?? 0) + 1);
  }
  const sortedKeywords = [...freq.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);

  const used = new Set<number>();
  const groups: Group[] = [];
  for (const kw of sortedKeywords) {
    if (groups.length >= maxGroups) break;
    const members: FrictionNote[] = [];
    notesWithKeywords.forEach((entry, idx) => {
      if (used.has(idx)) return;
      if (entry.kws.includes(kw)) {
        members.push(entry.note);
        used.add(idx);
      }
    });
    if (members.length >= 2) groups.push({ keyword: kw, notes: members });
  }

  // Catch-all group for anything left over, so no evidence is silently dropped.
  const leftover = notesWithKeywords.filter((_, idx) => !used.has(idx)).map((e) => e.note);
  if (leftover.length > 0) groups.push({ keyword: "general friction", notes: leftover });

  return groups;
}

function severityFromSize(size: number, total: number): Severity {
  const ratio = total > 0 ? size / total : 0;
  if (ratio > 0.3) return "critical";
  if (ratio > 0.15) return "high";
  if (ratio > 0.05) return "medium";
  return "low";
}

export async function clusterIssues(
  runId: string,
  notes: FrictionNote[],
  totalPersonas: number,
  provider?: LlmProviderName,
  maxIssues = 8,
): Promise<Issue[]> {
  if (notes.length === 0) return [];
  const groups = groupByKeyword(notes, maxIssues).sort((a, b) => b.notes.length - a.notes.length);

  const issues: Issue[] = [];
  for (const group of groups.slice(0, maxIssues)) {
    const sample = group.notes.slice(0, 5);
    const prompt = [
      `Users ran into friction related to "${group.keyword}" while testing a product.`,
      "Sample quotes from different test personas:",
      ...sample.map((n, i) => `${i + 1}. "${n.note}"`),
      "",
      "Analyze this friction and return JSON matching the schema:",
      "- title: short, specific issue title",
      "- severity: low, medium, high, or critical",
      "- effort: estimated developer effort to fix (low, medium, or high)",
      "- failureRate: estimated likelihood (0.0 to 1.0) that this issue causes user abandonment or failure",
      "- suggestedFix: one actionable fix",
      "- memberNoteIndexes: indices of representative quotes",
    ].join("\n");

    const result = await generateStructured(IssueClusterSchema, prompt, {
      provider,
      useCache: false,
      label: "issue-cluster",
    }).catch(() => ({
      title: `Friction around "${group.keyword}"`,
      severity: severityFromSize(group.notes.length, totalPersonas),
      suggestedFix: "Investigate this friction point and simplify the affected step.",
      memberNoteIndexes: [] as number[],
      failureRate: undefined as number | undefined,
      effort: undefined as "low" | "medium" | "high" | undefined,
    }));

    const clusters = new Set(group.notes.map((n) => n.clusterId).filter((c): c is number => c !== null));
    const affectedCount = new Set(group.notes.map((n) => n.personaId)).size;
    const affectedShare = totalPersonas > 0 ? Math.round((affectedCount / totalPersonas) * 1000) / 1000 : 0;

    const severity = (result.severity as Severity) ?? severityFromSize(group.notes.length, totalPersonas);
    const failureRate = typeof result.failureRate === "number" && !isNaN(result.failureRate)
      ? Math.round(result.failureRate * 1000) / 1000
      : (severity === "critical" ? 0.95 : severity === "high" ? 0.85 : severity === "medium" ? 0.65 : 0.45);

    const textForEffort = `${result.title || group.keyword} ${result.suggestedFix || ""}`.toLowerCase();
    const effort: "low" | "medium" | "high" = result.effort ?? (
      textForEffort.includes("contrast") || textForEffort.includes("color") || textForEffort.includes("text") || textForEffort.includes("label") || textForEffort.includes("size")
        ? "low"
        : textForEffort.includes("redesign") || textForEffort.includes("architecture") || textForEffort.includes("backend") || textForEffort.includes("api")
          ? "high"
          : "medium"
    );

    const effortWeight = effort === "high" ? 3 : effort === "medium" ? 2 : 1;
    // Impact Formula: affectedShare * failureRate * effort
    const impactScore = Math.round(affectedShare * failureRate * effortWeight * 1000) / 1000;

    const screenshot = sample.find((n) => Boolean(n.screenshot))?.screenshot ?? null;

    issues.push({
      issueId: crypto.randomUUID(),
      runId,
      title: result.title || `Friction around "${group.keyword}"`,
      severity,
      affectedPersonas: affectedCount,
      affectedClusters: [...clusters],
      evidence: sample.map((n) => ({
        personaId: n.personaId,
        quote: n.note,
        step: n.step,
        screenshot: n.screenshot,
      })),
      suggestedFix: result.suggestedFix || "Investigate and address this friction point.",
      affectedShare,
      failureRate,
      effort,
      impactScore,
      screenshot,
    });
  }

  return issues.sort((a, b) => (b.impactScore ?? 0) - (a.impactScore ?? 0));
}

export function resultsToFrictionNotes(
  results: PersonaResult[],
  clusterByPersona: Map<string, number | null>,
  stepsByPersona?: Map<string, { step: number; action: Record<string, unknown>; note: string | null; screenshotPath: string | null }[]>,
): FrictionNote[] {
  const notes: FrictionNote[] = [];
  for (const r of results) {
    const clusterId = clusterByPersona.get(r.personaId) ?? null;
    const personaSteps = stepsByPersona?.get(r.personaId) ?? [];

    // 1. If persona stated a reason for abandoning or has dropOffReason, prioritize it as concrete trace evidence
    if (r.dropOffReason) {
      notes.push({
        personaId: r.personaId,
        clusterId,
        note: `Drop-off at step ${r.dropOffStep ?? "end"}: ${r.dropOffReason}`,
        step: r.dropOffStep ?? null,
        screenshot: r.screenshotPath ?? null,
      });
    }

    // 2. Add step-level actions where friction, confusion, or give_up occurred
    for (const s of personaSteps) {
      const act = s.action as any;
      if (act?.action === "give_up" || act?.confused || s.note) {
        const text = s.note || `Step ${s.step}: abandoned via ${act?.action ?? "action"}`;
        notes.push({
          personaId: r.personaId,
          clusterId,
          note: text,
          step: s.step,
          screenshot: s.screenshotPath ?? r.screenshotPath ?? null,
        });
      }
    }

    // 3. Fallback to frictionNotes
    for (const note of r.frictionNotes) {
      if (!note || note.length < 3) continue;
      // Avoid duplicate notes if dropOffReason already covers it
      if (r.dropOffReason && (note.includes(r.dropOffReason) || r.dropOffReason.includes(note))) continue;
      notes.push({
        personaId: r.personaId,
        clusterId,
        note,
        step: r.dropOffStep ?? null,
        screenshot: r.screenshotPath ?? null,
      });
    }
  }
  return notes;
}

