import PQueue from "p-queue";
import type { Persona, RunConfig, SSEEvent } from "@testhive/contracts";
import { getDb, personasRepo, runsRepo, resultsRepo } from "@testhive/db";
import { selectPersonas, createControlPersonas } from "@testhive/personas";
import crypto from "node:crypto";
import { getTester } from "./testers/registry.js";
import type { TesterContext } from "./types.js";

export interface OrchestratorOptions {
  runId: string;
  poolId: string;
  config: RunConfig;
  screenshotDir: string;
  emit: (event: SSEEvent) => void;
  isCancelled: () => boolean;
}

export interface OrchestratorResult {
  totalPersonas: number;
  donePersonas: number;
  cancelled: boolean;
}

export async function runOrchestrator(opts: OrchestratorOptions): Promise<OrchestratorResult> {
  const db = getDb();
  const personasR = personasRepo(db);
  const runsR = runsRepo(db);
  const resultsR = resultsRepo(db);

  opts.emit({ type: "run.state", state: "selecting_personas", progress: { done: 0, total: 0 } });

  const allPersonas = personasR.listAllByPool(opts.poolId) as unknown as (Omit<Persona, "quirks"> & {
    quirks: string[];
  })[];
  const fullPersonas: Persona[] = allPersonas.map((p) => ({
    ...p,
    quirks: p.quirks as string[],
  })) as unknown as Persona[];

  let selected = selectPersonas(fullPersonas, opts.config.selection);

  // 1. Baseline control personas: inject highly motivated, simple-task baseline controls
  const includeControls = opts.config.includeControls ?? true;
  const controlPersonas = includeControls ? createControlPersonas(opts.poolId, 3) : [];
  const controlIdSet = new Set(controlPersonas.map((c) => c.id));
  const combinedPersonas = [...controlPersonas, ...selected];

  const deepCount = Math.min(opts.config.deepCount, selected.length);

  // Stratified deep pick: take every Nth persona across the selection
  const deepSet = new Set<string>();
  // Baseline controls always test deeply to guarantee end-to-end site sanity check
  for (const c of controlPersonas) {
    deepSet.add(c.id);
  }
  if (deepCount > 0) {
    const step = selected.length / deepCount;
    for (let i = 0; i < deepCount; i++) {
      const idx = Math.min(selected.length - 1, Math.floor(i * step));
      deepSet.add(selected[idx]!.id);
    }
  }

  const repeats = Math.max(1, Math.min(5, opts.config.repeats ?? 1));
  const baseSeed = opts.config.selection?.seed ?? 42;

  runsR.insertRunPersonas(
    combinedPersonas.map((p) => ({
      runId: opts.runId,
      personaId: p.id,
      mode: deepSet.has(p.id) ? "deep" : "light",
      status: "pending",
      outcome: null,
    })),
  );
  runsR.update(opts.runId, { totalPersonas: combinedPersonas.length, donePersonas: 0 });

  opts.emit({
    type: "run.state",
    state: "testing",
    progress: { done: 0, total: combinedPersonas.length },
  });

  const lightQueue = new PQueue({ concurrency: opts.config.concurrency });
  const deepQueue = new PQueue({ concurrency: Math.min(4, opts.config.concurrency) });

  let done = 0;
  let cancelled = false;

  const runOnePersona = async (persona: Persona) => {
    if (opts.isCancelled()) {
      cancelled = true;
      return;
    }
    const mode = deepSet.has(persona.id) ? "deep" : "light";
    const tester = getTester(opts.config.kind, mode) ?? getTester(opts.config.kind, "light");
    if (!tester) return;

    const isControl = controlIdSet.has(persona.id);
    opts.emit({ type: "persona.started", personaId: persona.id, mode });
    runsR.updateRunPersona(opts.runId, persona.id, { status: "running" });

    let lastOutcome: "success" | "failure" | "partial" = "failure";

    // Run repeats with fixed seeds (2-3 repeats per persona if configured)
    for (let repeatIdx = 0; repeatIdx < repeats; repeatIdx++) {
      if (opts.isCancelled()) {
        cancelled = true;
        break;
      }

      const repeatSeed = baseSeed + repeatIdx * 1000 + (persona.clusterId ?? 0);
      const ctx: TesterContext = {
        runId: opts.runId,
        maxSteps: opts.config.maxSteps,
        useCache: opts.config.useCache,
        screenshotDir: opts.screenshotDir,
        repeatIndex: repeatIdx,
        isControl,
        onStep: (step) => {
          resultsR.insertStep({
            id: crypto.randomUUID(),
            runId: opts.runId,
            personaId: step.personaId,
            step: step.step,
            action: step.action,
            note: step.note,
            screenshotPath: step.screenshotPath,
            repeatIndex: repeatIdx,
          } as any);
          opts.emit({
            type: "persona.step",
            personaId: step.personaId,
            step: step.step,
            action: step.action,
            note: step.note,
          });
        },
      };

      try {
        const outcome = await tester.run(persona, opts.config.stimulus, ctx);
        lastOutcome = outcome.outcome;

        resultsR.insertResult({
          id: crypto.randomUUID(),
          runId: opts.runId,
          personaId: persona.id,
          kind: opts.config.kind,
          outcome: outcome.outcome,
          verdict: { ...outcome.verdict, seed: repeatSeed, repeatIndex: repeatIdx },
          sentiment: outcome.sentiment,
          wouldRecommend: outcome.wouldRecommend,
          frictionNotes: outcome.frictionNotes,
          dropOffStep: outcome.dropOffStep ?? null,
          dropOffReason: outcome.dropOffReason ?? null,
          screenshotPath: outcome.screenshotPath ?? null,
          repeatIndex: repeatIdx,
          isControl,
        } as any);
      } catch (err) {
        lastOutcome = "failure";
        resultsR.insertResult({
          id: crypto.randomUUID(),
          runId: opts.runId,
          personaId: persona.id,
          kind: opts.config.kind,
          outcome: "failure",
          verdict: { error: String(err), seed: repeatSeed, repeatIndex: repeatIdx },
          sentiment: -0.8,
          wouldRecommend: false,
          frictionNotes: [`Execution failed on repeat ${repeatIdx}: ${err instanceof Error ? err.message : String(err)}`],
          dropOffStep: 0,
          dropOffReason: `Fatal execution error: ${err instanceof Error ? err.message : String(err)}`,
          screenshotPath: null,
          repeatIndex: repeatIdx,
          isControl,
        } as any);
      }
    }

    runsR.updateRunPersona(opts.runId, persona.id, { status: "done", outcome: lastOutcome });
    opts.emit({
      type: "persona.done",
      personaId: persona.id,
      outcome: lastOutcome,
      clusterId: persona.clusterId,
    });

    done++;
    runsR.update(opts.runId, { donePersonas: done });
    opts.emit({
      type: "run.state",
      state: "testing",
      progress: { done, total: combinedPersonas.length },
    });

    // Pacing delay (25-45ms) to make 1000 persona testing feel authentic, steady, and visible
    await new Promise((r) => setTimeout(r, 25 + Math.floor(Math.random() * 20)));
  };

  // Interleave personas (distributing deep personas evenly rather than clustering controls at index 0)
  // so deep Playwright browser tasks run in parallel throughout the execution rather than trailing at the end
  const deepPersonas: Persona[] = [];
  const lightPersonas: Persona[] = [];
  for (const p of combinedPersonas) {
    if (deepSet.has(p.id)) {
      deepPersonas.push(p);
    } else {
      lightPersonas.push(p);
    }
  }

  const scheduledPersonas: Persona[] = [];
  const totalP = combinedPersonas.length;
  const deepInterval = deepPersonas.length > 0 ? Math.floor(totalP / (deepPersonas.length + 1)) : totalP + 1;
  let dIdx = 0;
  let lIdx = 0;

  for (let i = 0; i < totalP; i++) {
    if (dIdx < deepPersonas.length && (i % deepInterval === 0 || lIdx >= lightPersonas.length)) {
      scheduledPersonas.push(deepPersonas[dIdx++]!);
    } else if (lIdx < lightPersonas.length) {
      scheduledPersonas.push(lightPersonas[lIdx++]!);
    } else if (dIdx < deepPersonas.length) {
      scheduledPersonas.push(deepPersonas[dIdx++]!);
    }
  }

  const tasks = scheduledPersonas.map((persona) =>
    (deepSet.has(persona.id) ? deepQueue : lightQueue).add(() => runOnePersona(persona)),
  );
  await Promise.all(tasks);

  return { totalPersonas: combinedPersonas.length, donePersonas: done, cancelled };
}

