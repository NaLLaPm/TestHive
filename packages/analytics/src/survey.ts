import type { PersonaResult } from "@testhive/contracts";

export interface SurveySummary {
  n: number;
  overallSentiment: number;
  wouldRecommendRate: number;
  perQuestion: Record<string, { avgSentiment: number; n: number }>;
}

/** Proves library reuse: same PersonaResult shape, a different aggregation lens. */
export function summarizeSurvey(results: PersonaResult[]): SurveySummary {
  if (results.length === 0) {
    return { n: 0, overallSentiment: 0, wouldRecommendRate: 0, perQuestion: {} };
  }
  let sentimentSum = 0;
  let recommendCount = 0;
  const perQuestion: Record<string, { sum: number; n: number }> = {};

  for (const r of results) {
    sentimentSum += r.sentiment;
    if (r.wouldRecommend) recommendCount++;
    const answers = (r.verdict as { answers?: { questionId: string; sentiment: number }[] }).answers ?? [];
    for (const a of answers) {
      if (!perQuestion[a.questionId]) perQuestion[a.questionId] = { sum: 0, n: 0 };
      perQuestion[a.questionId]!.sum += a.sentiment;
      perQuestion[a.questionId]!.n += 1;
    }
  }

  const perQuestionOut: Record<string, { avgSentiment: number; n: number }> = {};
  for (const [qid, v] of Object.entries(perQuestion)) {
    perQuestionOut[qid] = { avgSentiment: v.sum / v.n, n: v.n };
  }

  return {
    n: results.length,
    overallSentiment: sentimentSum / results.length,
    wouldRecommendRate: recommendCount / results.length,
    perQuestion: perQuestionOut,
  };
}
