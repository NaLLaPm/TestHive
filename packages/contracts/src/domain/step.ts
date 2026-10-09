import { z } from "zod";

export const DeepActionKindSchema = z.enum(["click", "type", "scroll", "give_up", "done"]);
export type DeepActionKind = z.infer<typeof DeepActionKindSchema>;

export const StepSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  personaId: z.string().uuid(),
  step: z.number().int(),
  action: z.record(z.string(), z.unknown()),
  note: z.string().nullable(),
  screenshotPath: z.string().nullable(),
});
export type Step = z.infer<typeof StepSchema>;
