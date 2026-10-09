import { z } from "zod";

export const TestModeSchema = z.enum(["deep", "light"]);
export type TestMode = z.infer<typeof TestModeSchema>;

export const OutcomeSchema = z.enum(["success", "failure", "partial"]);
export type Outcome = z.infer<typeof OutcomeSchema>;

export const RunPersonaSchema = z.object({
  runId: z.string().uuid(),
  personaId: z.string().uuid(),
  mode: TestModeSchema,
  status: z.enum(["pending", "running", "done", "error"]),
  outcome: OutcomeSchema.nullable(),
});
export type RunPersona = z.infer<typeof RunPersonaSchema>;

export const PersonaResultSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  personaId: z.string().uuid(),
  kind: z.string(),
  outcome: OutcomeSchema,
  verdict: z.record(z.string(), z.unknown()),
  sentiment: z.number().min(-1).max(1),
  wouldRecommend: z.boolean(),
  frictionNotes: z.array(z.string()),
  dropOffStep: z.number().int().nullable().optional(),
  dropOffReason: z.string().nullable().optional(),
  screenshotPath: z.string().nullable().optional(),
  repeatIndex: z.number().int().default(0).optional(),
  isControl: z.boolean().default(false).optional(),
});
export type PersonaResult = z.infer<typeof PersonaResultSchema>;

