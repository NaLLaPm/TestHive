import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.coerce.number().int().default(8787),
  DATABASE_PATH: z.string().default("./data/testhive.db"),
  LLM_PROVIDER: z.enum(["fake", "gemini", "ollama"]).default("fake"),
  GEMINI_API_KEY: z.string().optional().default(""),
  GEMINI_MODEL: z.string().optional().default("gemini-2.0-flash"),
  OLLAMA_BASE_URL: z.string().optional().default("http://127.0.0.1:11434/v1"),
  OLLAMA_MODEL: z.string().optional().default("qwen2.5:0.5b"),
  DEMO_SITE_PORT: z.coerce.number().int().default(8989),
  NEXT_PUBLIC_API_URL: z.string().optional().default("http://localhost:8787"),
  NEXT_PUBLIC_USE_MOCKS: z.string().optional().default("false"),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return EnvSchema.parse(source);
}
