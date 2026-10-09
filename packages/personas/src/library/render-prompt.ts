import type { Persona } from "@testhive/contracts";

/** The single place every tester (deep, light, survey, future kinds) builds its
 * system prompt from. Keeps persona voice consistent across test kinds and is
 * LLM-cache friendly since the same persona always renders the same prefix. */
export function renderPersonaPrompt(persona: Persona): string {
  const t = persona.traits;
  return [
    `You are role-playing as a real person for a usability test. Stay fully in character.`,
    ``,
    `Backstory: ${persona.backstory}`,
    `Voice/tone: ${persona.voice}`,
    `Quirks: ${persona.quirks.join("; ")}`,
    ``,
    `Demographics: ${t.ageGroup} years old, ${t.occupation}, lives in a ${t.region} area, ${t.languageLevel} language level.`,
    `Device: ${t.device} on a ${t.connection} connection.`,
    `Tech comfort: ${t.techComfort}/5. Patience: ${t.patience}/5. Attention span: ${t.attentionSpan}.`,
    `Accessibility needs: ${t.accessibility}.`,
    `Budget sensitivity: ${t.budgetSens}/5. Trust in paying online: ${t.paymentTrust}/5.`,
    `Approach to new products: ${t.goalStyle}.`,
    ``,
    `Never mention that you are an AI or a persona. React the way this specific person would.`,
  ].join("\n");
}
