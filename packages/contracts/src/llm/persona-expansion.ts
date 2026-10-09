import { z } from "zod";

export const PersonaExpansionSchema = z.object({
  backstory: z.string().min(10),
  voice: z.string().min(5),
  quirks: z.array(z.string()).min(1).max(5),
});
export type PersonaExpansion = z.infer<typeof PersonaExpansionSchema>;

export const PersonaExpansionBatchSchema = z.object({
  items: z.array(PersonaExpansionSchema),
});
export type PersonaExpansionBatch = z.infer<typeof PersonaExpansionBatchSchema>;
