import { z } from "zod";

export const LightVerdictSchema = z.object({
  understoodPurpose: z.boolean(),
  wouldContinue: z.boolean(),
  wouldSignUpOrPay: z.boolean(),
  blockers: z.array(z.string()),
  sentiment: z.number().min(-1).max(1),
  wouldRecommend: z.boolean(),
});
export type LightVerdict = z.infer<typeof LightVerdictSchema>;
