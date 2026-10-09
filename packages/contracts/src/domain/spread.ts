import { z } from "zod";

export const SpreadParamsSchema = z.object({
  rounds: z.number().int().min(1).max(20).default(6),
  seedStrategy: z.enum(["positive_verdict", "random"]).default("positive_verdict"),
  seed: z.number().int().default(42),
});
export type SpreadParams = z.infer<typeof SpreadParamsSchema>;

export const SpreadRoundSchema = z.object({
  round: z.number().int(),
  newAdopters: z.array(z.string().uuid()),
  cumulativeAdopters: z.number().int(),
});
export type SpreadRound = z.infer<typeof SpreadRoundSchema>;

export const SpreadResultSchema = z.object({
  runId: z.string().uuid(),
  params: SpreadParamsSchema,
  rounds: z.array(SpreadRoundSchema),
  totalReached: z.number().int(),
  poolSize: z.number().int(),
});
export type SpreadResult = z.infer<typeof SpreadResultSchema>;
