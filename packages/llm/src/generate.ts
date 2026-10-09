import type { z } from "zod";
import { getDb, llmCacheRepo } from "@testhive/db";
import { getLlmConfig, type LlmProviderName } from "./config.js";
import { fakeGenerate, hashString } from "./fake-faker.js";
import { geminiGenerate } from "./providers/gemini.js";
import { ollamaGenerate } from "./providers/ollama.js";

export interface GenerateStructuredOptions {
  provider?: LlmProviderName;
  useCache?: boolean;
  label?: string;
}

async function callProvider<T>(
  provider: LlmProviderName,
  schema: z.ZodType<T>,
  prompt: string,
): Promise<T> {
  switch (provider) {
    case "fake":
      return fakeGenerate(schema, prompt);
    case "gemini":
      return geminiGenerate(schema, prompt);
    case "ollama":
      return ollamaGenerate(schema, prompt);
    default:
      return fakeGenerate(schema, prompt);
  }
}

/**
 * One function every LLM-backed feature goes through: JSON-only, Zod-validated,
 * retried once with the validation error appended, cached by prompt hash.
 */
export async function generateStructured<T>(
  schema: z.ZodType<T>,
  prompt: string,
  options: GenerateStructuredOptions = {},
): Promise<T> {
  const cfg = getLlmConfig();
  const provider = options.provider ?? cfg.provider;
  const useCache = options.useCache ?? true;
  const cacheKey = hashString(`${provider}:${options.label ?? ""}:${prompt}`);

  if (useCache && provider !== "fake") {
    try {
      const cached = llmCacheRepo(getDb()).get(cacheKey);
      if (cached) {
        const parsed = schema.safeParse(cached.response);
        if (parsed.success) return parsed.data;
      }
    } catch {
      // cache lookup is best-effort
    }
  }

  let result: T;
  try {
    result = await callProvider(provider, schema, prompt);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const retryPrompt = `${prompt}\n\nYour previous response was invalid: ${errMsg}\nReturn ONLY valid JSON matching the schema.`;
    result = await callProvider(provider, schema, retryPrompt);
  }

  const validated = schema.safeParse(result);
  if (!validated.success) {
    const retryPrompt = `${prompt}\n\nYour previous response failed validation: ${validated.error.message}\nReturn ONLY valid JSON matching the schema exactly.`;
    const retried = await callProvider(provider, schema, retryPrompt);
    result = schema.parse(retried);
  } else {
    result = validated.data;
  }

  if (useCache && provider !== "fake") {
    try {
      llmCacheRepo(getDb()).set({
        promptHash: cacheKey,
        model: provider,
        response: result as object,
      });
    } catch {
      // best-effort
    }
  }

  return result;
}

export class FakeLLM {
  async generate<T>(schema: z.ZodType<T>, prompt: string): Promise<T> {
    return fakeGenerate(schema, prompt);
  }
}
