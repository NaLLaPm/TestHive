import { z } from "zod";
import { StimulusSchema, RunKindSchema } from "./stimulus.js";

export const RunStateSchema = z.enum([
  "created",
  "selecting_personas",
  "testing",
  "aggregating",
  "simulating_spread",
  "reporting",
  "completed",
  "failed",
  "cancelled",
]);
export type RunState = z.infer<typeof RunStateSchema>;

export const SelectionStrategySchema = z.enum(["stratified", "random", "filter", "all"]);
export type SelectionStrategy = z.infer<typeof SelectionStrategySchema>;

export const SelectionSchema = z.object({
  strategy: SelectionStrategySchema.default("stratified"),
  count: z.number().int().min(1).default(1000),
  seed: z.number().int().default(42),
  filter: z.record(z.string(), z.string()).optional(),
});
export type Selection = z.infer<typeof SelectionSchema>;

export const RunConfigSchema = z.object({
  kind: RunKindSchema,
  poolId: z.string().uuid().nullable(),
  stimulus: StimulusSchema,
  selection: SelectionSchema,
  deepCount: z.number().int().min(0).default(40),
  maxSteps: z.number().int().min(1).max(30).default(8),
  concurrency: z.number().int().min(1).max(50).default(10),
  useCache: z.boolean().default(true),
  repeats: z.number().int().min(1).max(5).default(1),
  includeControls: z.boolean().default(true),
});
export type RunConfig = z.infer<typeof RunConfigSchema>;


export const RunSchema = z.object({
  id: z.string().uuid(),
  kind: RunKindSchema,
  poolId: z.string().uuid(),
  stimulus: StimulusSchema,
  config: z.record(z.string(), z.unknown()),
  state: RunStateSchema,
  totalPersonas: z.number().int(),
  donePersonas: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Run = z.infer<typeof RunSchema>;
