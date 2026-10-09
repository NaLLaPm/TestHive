import { z } from "zod";
import { PersonaPoolSchema, PoolBuildConfigSchema } from "../domain/pool.js";
import { PersonaSchema } from "../domain/persona.js";
import { GraphPayloadSchema, PersonaClusterSchema } from "../domain/graph.js";

export const ListPoolsResponseSchema = z.array(PersonaPoolSchema);
export const CreatePoolRequestSchema = PoolBuildConfigSchema;
export const CreatePoolResponseSchema = PersonaPoolSchema;
export const GetPoolResponseSchema = PersonaPoolSchema;

export const ListPersonasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  clusterId: z.coerce.number().int().optional(),
  trait: z.string().optional(),
  value: z.string().optional(),
});
export const ListPersonasResponseSchema = z.object({
  items: z.array(PersonaSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

export const GetPersonaResponseSchema = PersonaSchema;
export const UpdatePersonaRequestSchema = z.object({
  backstory: z.string().optional(),
  voice: z.string().optional(),
  quirks: z.array(z.string()).optional(),
  deviceProfileKey: PersonaSchema.shape.deviceProfileKey.optional(),
  traits: PersonaSchema.shape.traits.partial().optional(),
});
export const UpdatePersonaResponseSchema = PersonaSchema;
export const GetGraphResponseSchema = GraphPayloadSchema;
export const GetClustersResponseSchema = z.array(PersonaClusterSchema);

