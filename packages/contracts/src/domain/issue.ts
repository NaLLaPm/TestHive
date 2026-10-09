import { z } from "zod";

export const SeveritySchema = z.enum(["low", "medium", "high", "critical"]);
export type Severity = z.infer<typeof SeveritySchema>;

export const EvidenceSchema = z.object({
  personaId: z.string().uuid(),
  quote: z.string(),
  step: z.number().int().nullable(),
  screenshot: z.string().nullable(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const IssueSchema = z.object({
  issueId: z.string().uuid(),
  runId: z.string().uuid(),
  title: z.string(),
  severity: SeveritySchema,
  affectedPersonas: z.number().int(),
  affectedClusters: z.array(z.number().int()),
  evidence: z.array(EvidenceSchema),
  suggestedFix: z.string(),
  // Impact ranking fields (affectedShare * failureRate * effort)
  affectedShare: z.number().min(0).max(1).optional(),
  failureRate: z.number().min(0).max(1).optional(),
  effort: z.enum(["low", "medium", "high"]).optional(),
  impactScore: z.number().optional(),
  screenshot: z.string().nullable().optional(),
});
export type Issue = z.infer<typeof IssueSchema>;
