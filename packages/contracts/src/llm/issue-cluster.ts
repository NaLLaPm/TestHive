import { z } from "zod";

export const IssueClusterSchema = z.object({
  title: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  suggestedFix: z.string(),
  memberNoteIndexes: z.array(z.number().int()).default([]),
  effort: z.enum(["low", "medium", "high"]).optional(),
  failureRate: z.number().min(0).max(1).optional(),
});

export const IssueClusterBatchSchema = z.object({
  issues: z.array(IssueClusterSchema),
});
export type IssueClusterBatch = z.infer<typeof IssueClusterBatchSchema>;
