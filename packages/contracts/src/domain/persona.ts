import { z } from "zod";
import { DeviceProfileKeySchema, TraitsSchema } from "./traits.js";

export const PersonaSchema = z.object({
  id: z.string().uuid(),
  poolId: z.string().uuid(),
  traits: TraitsSchema,
  traitVector: z.array(z.number()),
  traitsHash: z.string(),
  backstory: z.string(),
  voice: z.string(),
  quirks: z.array(z.string()),
  deviceProfileKey: DeviceProfileKeySchema,
  clusterId: z.number().int().nullable(),
  schemaVersion: z.number().int().default(1),
  isControl: z.boolean().default(false).optional(),
});
export type Persona = z.infer<typeof PersonaSchema>;

export const PersonaSummarySchema = PersonaSchema.pick({
  id: true,
  traits: true,
  clusterId: true,
  deviceProfileKey: true,
});
export type PersonaSummary = z.infer<typeof PersonaSummarySchema>;
