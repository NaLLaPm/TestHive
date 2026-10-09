import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import type { z } from "zod";
import { getLlmConfig } from "../config.js";

export async function ollamaGenerate<T>(schema: z.ZodType<T>, prompt: string): Promise<T> {
  const cfg = getLlmConfig();
  const client = createOpenAI({ baseURL: cfg.ollama.baseUrl, apiKey: "ollama" });
  const { object } = await generateObject({
    model: client(cfg.ollama.model),
    schema,
    prompt,
    mode: "json",
  });
  return object as T;
}
