import { z } from "zod";

export const ClusterLabelSchema = z.object({
  label: z.string().min(2).max(60),
  description: z.string().min(5),
});
export type ClusterLabel = z.infer<typeof ClusterLabelSchema>;
