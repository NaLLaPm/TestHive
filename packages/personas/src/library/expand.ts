import type { Traits } from "@testhive/contracts";
import { PersonaExpansionBatchSchema, type PersonaExpansion } from "@testhive/contracts";
import { generateStructured } from "@testhive/llm";

function describeTraitsForPrompt(t: Traits, idx: number): string {
  return `${idx}. age ${t.ageGroup}, ${t.occupation}, ${t.region} area, ${t.languageLevel} language, tech comfort ${t.techComfort}/5, patience ${t.patience}/5, attention span ${t.attentionSpan}, device ${t.device}, connection ${t.connection}, accessibility ${t.accessibility}, budget sensitivity ${t.budgetSens}/5, payment trust ${t.paymentTrust}/5, goal style ${t.goalStyle}`;
}

/** Turn a batch of 10-20 trait vectors into backstory/voice/quirks via one LLM call. */
export async function expandTraitBatch(
  batch: Traits[],
  provider?: "fake" | "gemini" | "ollama",
): Promise<PersonaExpansion[]> {
  const prompt = [
    "You generate short, realistic user-research personas from trait vectors.",
    "For EACH numbered trait vector below, write a brief backstory (2-3 sentences, no product mentions),",
    "a short description of their voice/tone, and 2-3 behavioural quirks.",
    "Never give a persona a product opinion; they are product-agnostic.",
    "Return JSON: { items: [{ backstory, voice, quirks: string[] }, ...] } in the SAME order, one item per vector.",
    "",
    ...batch.map((t, i) => describeTraitsForPrompt(t, i + 1)),
  ].join("\n");

  const result = await generateStructured(PersonaExpansionBatchSchema, prompt, {
    provider,
    label: "persona-expansion",
    useCache: false,
  });

  if (result.items.length !== batch.length) {
    // pad/truncate defensively so a short/long LLM batch never breaks the pipeline
    const items = [...result.items];
    while (items.length < batch.length) {
      items.push({ backstory: "A person going about their day.", voice: "Neutral.", quirks: ["observant"] });
    }
    return items.slice(0, batch.length);
  }
  return result.items;
}
