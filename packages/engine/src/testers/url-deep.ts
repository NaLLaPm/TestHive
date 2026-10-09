import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Persona, Stimulus } from "@testhive/contracts";
import { DeepActionSchema } from "@testhive/contracts";
import { generateStructured } from "@testhive/llm";
import { renderPersonaPrompt, getDeviceProfile } from "@testhive/personas";
import type { Tester, TesterContext, TesterOutcome } from "../types.js";
import { getSharedBrowser } from "../browser/browser-manager.js";
import { extractPageState } from "../browser/extract.js";
import { executeAction } from "../browser/act.js";

export const urlDeepTester: Tester<"url_journey"> = {
  kind: "url_journey",
  mode: "deep",
  async run(persona: Persona, stimulus: Stimulus, ctx: TesterContext): Promise<TesterOutcome> {
    if (stimulus.type !== "url") throw new Error("url_deep requires a url stimulus");

    const profile = getDeviceProfile(persona.deviceProfileKey);
    const browser = await getSharedBrowser();
    const context = await browser.newContext({
      viewport: profile.viewport,
      userAgent: profile.userAgent,
      isMobile: profile.isMobile,
    });

    const frictionNotes: string[] = [];
    let outcome: TesterOutcome["outcome"] = "failure";
    let sentiment = 0;
    let wouldRecommend = false;
    let lastEmotion = "neutral";

    let dropOffStep: number | null = null;
    let dropOffReason: string | null = null;
    let finalScreenshotPath: string | null = null;

    try {
      const page = await context.newPage();
      if (profile.throttle) {
        const cdp = await context.newCDPSession(page).catch(() => null);
        if (cdp) {
          await cdp
            .send("Network.emulateNetworkConditions", {
              offline: false,
              downloadThroughput: (profile.throttle.downloadKbps * 1024) / 8,
              uploadThroughput: (profile.throttle.uploadKbps * 1024) / 8,
              latency: profile.throttle.latencyMs,
            })
            .catch(() => undefined);
        }
      }

      await page.goto(stimulus.url, { waitUntil: "domcontentloaded", timeout: 20_000 }).catch((e) => {
        const msg = `Page failed to load: ${(e as Error).message}`;
        frictionNotes.push(msg);
        dropOffReason = msg;
        dropOffStep = 0;
      });

      const systemPrompt = renderPersonaPrompt(persona);
      let finished = false;

      for (let step = 1; step <= ctx.maxSteps && !finished; step++) {
        const state = await extractPageState(page);
        const elementsDesc = state.elements
          .map((e) => `[${e.idx}] <${e.tag}> role=${e.role} text="${e.text}"`)
          .join("\n");

        const prompt = [
          systemPrompt,
          "",
          `Your goal right now: "${stimulus.goal}"`,
          `Current page URL: ${state.url}`,
          `Page title: ${state.title}`,
          `Visible text (truncated): ${state.text.slice(0, 1500)}`,
          "",
          "Interactive elements you can act on:",
          elementsDesc || "(none found)",
          "",
          `This is step ${step} of ${ctx.maxSteps}.`,
          'Decide your next action. Use "done" if you completed the goal, "give_up" if you are stuck or frustrated.',
          "Return JSON matching the schema.",
        ].join("\n");

        const action = await generateStructured(DeepActionSchema, prompt, {
          provider: ctx.provider,
          useCache: false,
          label: "deep-action",
        });

        lastEmotion = action.emotion;
        if (action.reasoning) frictionNotes.push(action.reasoning);

        let screenshotPath: string | null = null;
        if (action.action === "give_up" || action.confused || step === ctx.maxSteps) {
          screenshotPath = await saveScreenshot(page, ctx.screenshotDir, ctx.runId, persona.id, step);
          if (screenshotPath) finalScreenshotPath = screenshotPath;
        }

        ctx.onStep?.({
          personaId: persona.id,
          step,
          action: action as unknown as Record<string, unknown>,
          note: action.reasoning,
          screenshotPath,
          repeatIndex: ctx.repeatIndex,
        });

        if (action.action === "done") {
          outcome = "success";
          sentiment = action.emotion === "delighted" ? 0.8 : 0.3;
          wouldRecommend = action.emotion !== "frustrated" && action.emotion !== "anxious";
          finished = true;
        } else if (action.action === "give_up") {
          outcome = "failure";
          sentiment = -0.6;
          wouldRecommend = false;
          finished = true;
          dropOffStep = step;
          dropOffReason = action.reasoning || `Gave up at step ${step} with emotion "${action.emotion}"`;
        } else {
          await executeAction(page, action);
        }
      }

      if (!finished) {
        outcome = "partial";
        sentiment = lastEmotion === "frustrated" ? -0.3 : 0;
        wouldRecommend = false;
        dropOffStep = ctx.maxSteps;
        dropOffReason = `Ran out of steps (${ctx.maxSteps}) before reaching goal.`;
        frictionNotes.push(dropOffReason);
        if (!finalScreenshotPath) {
          finalScreenshotPath = await saveScreenshot(page, ctx.screenshotDir, ctx.runId, persona.id, ctx.maxSteps);
        }
      }
    } finally {
      await context.close().catch(() => undefined);
    }

    return {
      outcome,
      verdict: { emotion: lastEmotion, dropOffStep, dropOffReason },
      sentiment,
      wouldRecommend,
      frictionNotes,
      dropOffStep,
      dropOffReason,
      screenshotPath: finalScreenshotPath,
    };

  },
};

async function saveScreenshot(
  page: import("playwright").Page,
  dir: string,
  runId: string,
  personaId: string,
  step: number,
): Promise<string | null> {
  try {
    fs.mkdirSync(path.join(dir, runId), { recursive: true });
    const filename = `${personaId}-step${step}-${crypto.randomUUID().slice(0, 8)}.png`;
    const filePath = path.join(dir, runId, filename);
    await page.screenshot({ path: filePath, timeout: 3000 });
    return path.join(runId, filename);
  } catch {
    return null;
  }
}
