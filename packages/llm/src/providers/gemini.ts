import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import type { z } from "zod";
import { getLlmConfig } from "../config.js";

export async function geminiGenerate<T>(schema: z.ZodType<T>, prompt: string): Promise<T> {
  const cfg = getLlmConfig();
  if (!cfg.gemini.apiKey) {
    throw new Error("GEMINI_API_KEY not set; cannot use gemini provider");
  }
  const google = createGoogleGenerativeAI({ apiKey: cfg.gemini.apiKey });
  const { object } = await generateObject({
    model: google(cfg.gemini.model),
    schema,
    prompt,
  });
  return object as T;
}
