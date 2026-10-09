export type LlmProviderName = "fake" | "gemini" | "ollama";

export function getLlmConfig() {
  const provider = (process.env.LLM_PROVIDER ?? "fake") as LlmProviderName;
  return {
    provider,
    gemini: {
      apiKey: process.env.GEMINI_API_KEY ?? "",
      model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
    },
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/v1",
      model: process.env.OLLAMA_MODEL ?? "qwen2.5:0.5b",
    },
    cheapTierProvider: (process.env.LLM_CHEAP_PROVIDER ?? process.env.LLM_PROVIDER ?? "fake") as LlmProviderName,
    strongTierProvider: (process.env.LLM_STRONG_PROVIDER ?? process.env.LLM_PROVIDER ?? "fake") as LlmProviderName,
  };
}
