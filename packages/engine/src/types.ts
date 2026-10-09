import type { Persona, RunKind, Stimulus } from "@testhive/contracts";
import type { LlmProviderName } from "@testhive/llm";

export interface TesterContext {
  runId: string;
  maxSteps: number;
  provider?: LlmProviderName;
  useCache: boolean;
  screenshotDir: string;
  repeatIndex?: number;
  isControl?: boolean;
  onStep?: (step: {
    personaId: string;
    step: number;
    action: Record<string, unknown>;
    note: string | null;
    screenshotPath: string | null;
    repeatIndex?: number;
  }) => void;
}

export interface TesterOutcome {
  outcome: "success" | "failure" | "partial";
  verdict: Record<string, unknown>;
  sentiment: number;
  wouldRecommend: boolean;
  frictionNotes: string[];
  dropOffStep?: number | null;
  dropOffReason?: string | null;
  screenshotPath?: string | null;
}


export interface Tester<K extends RunKind = RunKind> {
  kind: K;
  mode: "deep" | "light";
  run(persona: Persona, stimulus: Stimulus, ctx: TesterContext): Promise<TesterOutcome>;
}
