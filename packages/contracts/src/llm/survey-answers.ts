import { z } from "zod";

export const SurveyAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.string(),
  sentiment: z.number().min(-1).max(1),
});

export const SurveyAnswersSchema = z.object({
  answers: z.array(SurveyAnswerSchema),
  overallSentiment: z.number().min(-1).max(1),
  wouldRecommend: z.boolean(),
});
export type SurveyAnswers = z.infer<typeof SurveyAnswersSchema>;
