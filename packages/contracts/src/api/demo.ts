import { z } from "zod";

export const DemoRunSchema = z.object({
  demoId: z.string(),
  title: z.string(),
  description: z.string(),
  runId: z.string().uuid().nullable(),
});
export const ListDemoRunsResponseSchema = z.array(DemoRunSchema);
export const LoadDemoRunResponseSchema = z.object({
  runId: z.string().uuid(),
});
