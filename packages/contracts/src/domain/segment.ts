import { z } from "zod";

export const SegmentStatSchema = z.object({
  successRate: z.number().min(0).max(1),

  n: z.number().int(),
  ciLower: z.number().min(0).max(1).optional(),
  ciUpper: z.number().min(0).max(1).optional(),
  marginOfError: z.number().min(0).max(1).optional(),
  isLowSample: z.boolean().optional(),
});
export type SegmentStat = z.infer<typeof SegmentStatSchema>;

export const ClusterSegmentSchema = SegmentStatSchema.extend({
  clusterId: z.number().int(),
  label: z.string(),
  description: z.string().optional(),
});
export type ClusterSegment = z.infer<typeof ClusterSegmentSchema>;

export const TraitSegmentSchema = SegmentStatSchema.extend({
  value: z.union([z.string(), z.number()]),
});
export type TraitSegment = z.infer<typeof TraitSegmentSchema>;

export const BaselineControlStatSchema = z.object({
  successRate: z.number().min(0).max(1),
  n: z.number().int(),
  allPassed: z.boolean(),
  status: z.enum(["healthy", "suspect_site_outage", "no_controls"]),
  note: z.string(),
});
export type BaselineControlStat = z.infer<typeof BaselineControlStatSchema>;

export const RepeatVarianceStatSchema = z.object({
  repeats: z.number().int(),
  avgVariance: z.number().min(0),
  consistencyScore: z.number().min(0).max(1),
  flakyCount: z.number().int(),
});
export type RepeatVarianceStat = z.infer<typeof RepeatVarianceStatSchema>;

export const SegmentsResponseSchema = z.object({
  overall: SegmentStatSchema,
  byCluster: z.array(ClusterSegmentSchema),
  byTrait: z.record(z.string(), z.array(TraitSegmentSchema)),
  minN: z.number().int().default(10).optional(),
  baselineControl: BaselineControlStatSchema.optional(),
  repeatVariance: RepeatVarianceStatSchema.optional(),
});
export type SegmentsResponse = z.infer<typeof SegmentsResponseSchema>;

