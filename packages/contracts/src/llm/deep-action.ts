import { z } from "zod";

export const DeepActionSchema = z.object({
  action: z.enum(["click", "type", "scroll", "give_up", "done"]),
  targetIdx: z.number().int().nullable(),
  text: z.string().nullable(),
  reasoning: z.string().max(280),
  confused: z.boolean(),
  emotion: z.enum(["neutral", "frustrated", "delighted", "anxious"]),
});
export type DeepAction = z.infer<typeof DeepActionSchema>;
