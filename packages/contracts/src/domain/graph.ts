import { z } from "zod";

export const EdgeKindSchema = z.enum(["similarity", "social"]);
export type EdgeKind = z.infer<typeof EdgeKindSchema>;

export const PersonaEdgeSchema = z.object({
  poolId: z.string().uuid(),
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  kind: EdgeKindSchema,
  weight: z.number().min(0).max(1),
});
export type PersonaEdge = z.infer<typeof PersonaEdgeSchema>;

export const PersonaClusterSchema = z.object({
  poolId: z.string().uuid(),
  clusterId: z.number().int(),
  label: z.string(),
  description: z.string(),
  size: z.number().int(),
  topTraits: z.record(z.string(), z.string()),
});
export type PersonaCluster = z.infer<typeof PersonaClusterSchema>;

export const GraphNodeSchema = z.object({
  id: z.string().uuid(),
  clusterId: z.number().int().nullable(),
  ageGroup: z.string(),
  device: z.string(),
  region: z.string(),
  occupation: z.string().optional(),
});
export type GraphNode = z.infer<typeof GraphNodeSchema>;

export const GraphPayloadSchema = z.object({
  poolId: z.string().uuid(),
  nodes: z.array(GraphNodeSchema),
  edges: z.array(PersonaEdgeSchema),
  clusters: z.array(PersonaClusterSchema),
});
export type GraphPayload = z.infer<typeof GraphPayloadSchema>;
