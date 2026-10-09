import type { Persona, Stimulus } from "@testhive/contracts";
import { SurveyAnswersSchema } from "@testhive/contracts";
import { generateStructured } from "@testhive/llm";
import { renderPersonaPrompt } from "@testhive/personas";
import type { Tester, TesterContext, TesterOutcome } from "../types.js";

export const surveyLightTester: Tester<"survey"> = {
  kind: "survey",
  mode: "light",
  async run(persona: Persona, stimulus: Stimulus, ctx: TesterContext): Promise<TesterOutcome> {
    if (stimulus.type !== "questions") throw new Error("survey_light requires a questions stimulus");

    const prompt = [
      renderPersonaPrompt(persona),
      "",
      stimulus.prompt,
      "",
      "Answer each question briefly, in your own voice:",
      ...stimulus.questions.map((q, i) => `${i + 1}. [id=${q.id}] ${q.text}`),
      "",
      "Return JSON matching the schema, one answer per question id, in order.",
    ].join("\n");

    const answers = await generateStructured(SurveyAnswersSchema, prompt, {
      provider: ctx.provider,
      useCache: ctx.useCache,
      label: "survey-answers",
    });

    const success = answers.overallSentiment > 0;
    const dropOffReason = !success
      ? (answers.answers.find((a) => a.sentiment < 0)?.answer ?? "Negative sentiment across survey answers")
      : null;

    return {
      outcome: success ? "success" : answers.overallSentiment === 0 ? "partial" : "failure",
      verdict: answers,
      sentiment: answers.overallSentiment,
      wouldRecommend: answers.wouldRecommend,
      frictionNotes: answers.answers.filter((a) => a.sentiment < 0).map((a) => a.answer),
      dropOffStep: success ? null : 1,
      dropOffReason,
      screenshotPath: null,
    };
  },
};

