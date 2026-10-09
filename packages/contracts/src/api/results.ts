import { z } from "zod";
import { SegmentsResponseSchema } from "../domain/segment.js";
import { IssueSchema } from "../domain/issue.js";
import { StepSchema } from "../domain/step.js";

export const GetSegmentsResponseSchema = SegmentsResponseSchema;
export const GetIssuesResponseSchema = z.array(IssueSchema);
export const GetTranscriptResponseSchema = z.array(StepSchema);
