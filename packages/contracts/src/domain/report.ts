import { z } from "zod";
import { IssueSchema } from "./issue.js";
import { SegmentsResponseSchema } from "./segment.js";

export const FunnelStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number().int(),
  reachedCount: z.number().int(),
  dropOffCount: z.number().int(),
  conversionPct: z.number().min(0).max(1),
  dropOffPct: z.number().min(0).max(1),
});
export type FunnelStep = z.infer<typeof FunnelStepSchema>;

export const ElementFrictionSchema = z.object({
  elementId: z.string(),
  name: z.string(),
  type: z.enum(["button", "form_field", "load_delay", "navigation"]),
  selector: z.string().optional(),
  stuckCount: z.number().int(),
  stuckPercentage: z.number().min(0).max(1),
  sampleQuotes: z.array(z.string()),
  affectedPersonas: z.array(z.string()),
});
export type ElementFriction = z.infer<typeof ElementFrictionSchema>;

export const ReportSchema = z.object({
  runId: z.string().uuid(),
  title: z.string(),
  summary: z.string(),
  segments: SegmentsResponseSchema,
  topIssues: z.array(IssueSchema),
  recommendations: z.array(z.string()),
  funnel: z.array(FunnelStepSchema).optional(),
  frictionHeatmap: z.array(ElementFrictionSchema).optional(),
  markdown: z.string(),
  generatedAt: z.string(),
});
export type Report = z.infer<typeof ReportSchema>;
