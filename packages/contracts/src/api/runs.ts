import { z } from "zod";
import { RunConfigSchema, RunSchema } from "../domain/run.js";
import { PersonaResultSchema } from "../domain/result.js";

export const CreateRunRequestSchema = RunConfigSchema;
export const CreateRunResponseSchema = z.object({
  runId: z.string().uuid(),
  poolId: z.string().uuid(),
  state: z.string(),
});

export const ListRunsResponseSchema = z.array(RunSchema);
export const GetRunResponseSchema = RunSchema;

export const ListRunPersonasQuerySchema = z.object({
  clusterId: z.coerce.number().int().optional(),
  status: z.string().optional(),
  outcome: z.string().optional(),
});

export const RunPersonaWithResultSchema = z.object({
  personaId: z.string().uuid(),
  mode: z.enum(["deep", "light"]),
  status: z.string(),
  outcome: z.string().nullable(),
  clusterId: z.number().int().nullable(),
  result: PersonaResultSchema.nullable(),
});
export const ListRunPersonasResponseSchema = z.array(RunPersonaWithResultSchema);

export const NodeStatesResponseSchema = z.array(
  z.object({
    id: z.string().uuid(),
    status: z.string(),
    outcome: z.string().nullable(),
  }),
);
