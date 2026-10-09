import { z } from "zod";
import { SpreadParamsSchema, SpreadResultSchema } from "../domain/spread.js";

export const PostSpreadRequestSchema = SpreadParamsSchema;
export const GetSpreadResponseSchema = SpreadResultSchema;
