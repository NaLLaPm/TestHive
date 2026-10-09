import { z } from "zod";

export const QuestionSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
});
export type Question = z.infer<typeof QuestionSchema>;

export const StimulusSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("url"), url: z.string().url(), goal: z.string().min(3) }),
  z.object({
    type: z.literal("questions"),
    prompt: z.string(),
    questions: z.array(QuestionSchema).min(1),
  }),
  z.object({ type: z.literal("text"), title: z.string().optional(), body: z.string().min(1) }),
]);
export type Stimulus = z.infer<typeof StimulusSchema>;

export const RunKindSchema = z.enum(["url_journey", "survey", "copy_test"]);
export type RunKind = z.infer<typeof RunKindSchema>;
