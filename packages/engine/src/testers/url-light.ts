import type { Persona, Stimulus } from "@testhive/contracts";
import { LightVerdictSchema } from "@testhive/contracts";
import { generateStructured } from "@testhive/llm";
import { renderPersonaPrompt } from "@testhive/personas";
import type { Tester, TesterContext, TesterOutcome } from "../types.js";
import { fetchPageText } from "../browser/fetch-text.js";

export const urlLightTester: Tester<"url_journey"> = {
  kind: "url_journey",
  mode: "light",
  async run(persona: Persona, stimulus: Stimulus, ctx: TesterContext): Promise<TesterOutcome> {
    if (stimulus.type !== "url") throw new Error("url_light requires a url stimulus");

    const pageText = await fetchPageText(stimulus.url).catch(
      () => "(page could not be loaded; evaluate based on the URL and goal alone)",
    );

    const prompt = [
      renderPersonaPrompt(persona),
      "",
      `You land on this page with the goal: "${stimulus.goal}"`,
      `URL: ${stimulus.url}`,
      "Page text (truncated):",
      pageText.slice(0, 4000),
      "",
      "Evaluate your experience as this person. Return JSON matching the schema.",
    ].join("\n");

    const verdict = await generateStructured(LightVerdictSchema, prompt, {
      provider: ctx.provider,
      useCache: ctx.useCache,
      label: "light-verdict",
    });

    const success = verdict.understoodPurpose && verdict.wouldContinue;
    const dropOffReason = !success
      ? (verdict.blockers?.[0] ?? (!verdict.understoodPurpose ? "Did not understand page purpose" : "Decided not to continue"))
      : null;

    return {
      outcome: success ? "success" : verdict.wouldContinue ? "partial" : "failure",
      verdict,
      sentiment: verdict.sentiment,
      wouldRecommend: verdict.wouldRecommend,
      frictionNotes: verdict.blockers,
      dropOffStep: success ? null : 1,
      dropOffReason,
      screenshotPath: null,
    };
  },
};

