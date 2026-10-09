import { z } from "zod";

export const AnalysisNodeKindSchema = z.enum(["cluster", "issue", "funnel", "persona"]);
export type AnalysisNodeKind = z.infer<typeof AnalysisNodeKindSchema>;

export const AnalysisEdgeKindSchema = z.enum([
  "experienced_friction",
  "caused_drop_off",
  "funnel_flow",
  "belongs_to",
  "correlated",
]);
export type AnalysisEdgeKind = z.infer<typeof AnalysisEdgeKindSchema>;

export const AnalysisGraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: AnalysisNodeKindSchema,
  val: z.number().default(1),
  color: z.string().optional(),
  clusterId: z.number().int().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
  metrics: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  description: z.string().optional(),
  suggestedFix: z.string().optional(),
});
export type AnalysisGraphNode = z.infer<typeof AnalysisGraphNodeSchema>;

export const AnalysisGraphEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  kind: AnalysisEdgeKindSchema,
  weight: z.number().default(1),
  label: z.string().optional(),
});
export type AnalysisGraphEdge = z.infer<typeof AnalysisGraphEdgeSchema>;

export const AnalysisGraphSchema = z.object({
  runId: z.string().uuid(),
  poolId: z.string().uuid(),
  title: z.string(),
  summary: z.string(),
  nodes: z.array(AnalysisGraphNodeSchema),
  edges: z.array(AnalysisGraphEdgeSchema),
  metrics: z.object({
    totalNodes: z.number().int(),
    totalEdges: z.number().int(),
    clustersCount: z.number().int(),
    issuesCount: z.number().int(),
    funnelStagesCount: z.number().int(),
    topBottleneck: z.string().optional(),
  }),
  generatedAt: z.string(),
});
export type AnalysisGraph = z.infer<typeof AnalysisGraphSchema>;
