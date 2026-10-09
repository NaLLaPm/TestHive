import { z } from "zod";

export const PoolStatusSchema = z.enum([
  "queued",
  "sampling",
  "expanding",
  "building_graph",
  "labeling_clusters",
  "ready",
  "failed",
]);
export type PoolStatus = z.infer<typeof PoolStatusSchema>;

export const DiversityReportSchema = z.object({
  size: z.number().int(),
  byTrait: z.record(z.string(), z.record(z.string(), z.number())),
  clusterCount: z.number().int(),
  duplicatesRejected: z.number().int(),
});
export type DiversityReport = z.infer<typeof DiversityReportSchema>;

export const PersonaPoolSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  version: z.number().int(),
  size: z.number().int(),
  seed: z.number().int(),
  status: PoolStatusSchema,
  generatorConfig: z.record(z.string(), z.unknown()).default({}),
  diversityReport: DiversityReportSchema.nullable(),
  isDefault: z.boolean(),
  createdAt: z.string(),
});
export type PersonaPool = z.infer<typeof PersonaPoolSchema>;

export const PoolBuildConfigSchema = z.object({
  slug: z.string().min(1),
  size: z.number().int().min(10).max(5000).default(1000),
  seed: z.number().int().default(42),
  isDefault: z.boolean().default(false),
});
export type PoolBuildConfig = z.infer<typeof PoolBuildConfigSchema>;
