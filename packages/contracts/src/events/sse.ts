import { z } from "zod";

export const PoolStateEventSchema = z.object({
  type: z.literal("pool.state"),
  state: z.string(),
  progress: z.object({ done: z.number(), total: z.number() }),
});

export const PoolReadyEventSchema = z.object({
  type: z.literal("pool.ready"),
  poolId: z.string().uuid(),
});

export const PoolErrorEventSchema = z.object({
  type: z.literal("pool.error"),
  message: z.string(),
});

export const RunStateEventSchema = z.object({
  type: z.literal("run.state"),
  state: z.string(),
  progress: z.object({ done: z.number(), total: z.number() }),
});

export const PersonaStartedEventSchema = z.object({
  type: z.literal("persona.started"),
  personaId: z.string().uuid(),
  mode: z.enum(["deep", "light"]),
});

export const PersonaStepEventSchema = z.object({
  type: z.literal("persona.step"),
  personaId: z.string().uuid(),
  step: z.number().int(),
  action: z.record(z.string(), z.unknown()),
  note: z.string().nullable(),
});

export const PersonaDoneEventSchema = z.object({
  type: z.literal("persona.done"),
  personaId: z.string().uuid(),
  outcome: z.enum(["success", "failure", "partial"]),
  clusterId: z.number().int().nullable(),
});

export const GraphUpdatedEventSchema = z.object({
  type: z.literal("graph.updated"),
  nodeUpdates: z.array(
    z.object({
      id: z.string().uuid(),
      status: z.string(),
      outcome: z.string().nullable(),
    }),
  ),
});

export const IssueFoundEventSchema = z.object({
  type: z.literal("issue.found"),
  issueId: z.string().uuid(),
  title: z.string(),
  count: z.number().int(),
});

export const SpreadRoundEventSchema = z.object({
  type: z.literal("spread.round"),
  round: z.number().int(),
  newAdopters: z.array(z.string().uuid()),
});

export const RunCompletedEventSchema = z.object({
  type: z.literal("run.completed"),
  runId: z.string().uuid(),
});

export const RunErrorEventSchema = z.object({
  type: z.literal("run.error"),
  message: z.string(),
  recoverable: z.boolean(),
});

export const SSEEventSchema = z.discriminatedUnion("type", [
  PoolStateEventSchema,
  PoolReadyEventSchema,
  PoolErrorEventSchema,
  RunStateEventSchema,
  PersonaStartedEventSchema,
  PersonaStepEventSchema,
  PersonaDoneEventSchema,
  GraphUpdatedEventSchema,
  IssueFoundEventSchema,
  SpreadRoundEventSchema,
  RunCompletedEventSchema,
  RunErrorEventSchema,
]);
export type SSEEvent = z.infer<typeof SSEEventSchema>;
