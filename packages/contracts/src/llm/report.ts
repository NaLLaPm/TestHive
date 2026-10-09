import { z } from "zod";

export const ReportWriterOutputSchema = z.object({
  title: z.string(),
  summary: z.string().min(20),
  recommendations: z.array(z.string()).min(1),
});
export type ReportWriterOutput = z.infer<typeof ReportWriterOutputSchema>;
