import { z } from "zod";

export const AgeGroupSchema = z.enum(["13-17", "18-24", "25-34", "35-49", "50-64", "65+"]);
export type AgeGroup = z.infer<typeof AgeGroupSchema>;

export const OccupationSchema = z.enum([
  "student",
  "gig_worker",
  "office_worker",
  "shopkeeper",
  "retiree",
  "homemaker",
  "unemployed",
  "freelancer",
  "farmer",
  "healthcare_worker",
]);
export type Occupation = z.infer<typeof OccupationSchema>;

export const RegionSchema = z.enum(["metro", "tier-2", "rural"]);
export type Region = z.infer<typeof RegionSchema>;

export const LanguageLevelSchema = z.enum(["native", "fluent", "conversational", "basic"]);
export type LanguageLevel = z.infer<typeof LanguageLevelSchema>;

export const AttentionSpanSchema = z.enum(["short", "medium", "long"]);
export type AttentionSpan = z.infer<typeof AttentionSpanSchema>;

export const DeviceSchema = z.enum([
  "low-end android",
  "mid android",
  "iphone",
  "laptop",
  "tablet",
]);
export type Device = z.infer<typeof DeviceSchema>;

export const ConnectionSchema = z.enum(["3g", "4g", "broadband"]);
export type Connection = z.infer<typeof ConnectionSchema>;

export const AccessibilitySchema = z.enum([
  "none",
  "low_vision",
  "color_blind",
  "motor",
  "screen_reader",
]);
export type Accessibility = z.infer<typeof AccessibilitySchema>;

export const GoalStyleSchema = z.enum(["explorer", "goal_driven", "bargain_hunter", "skeptic"]);
export type GoalStyle = z.infer<typeof GoalStyleSchema>;

export const TraitsSchema = z.object({
  ageGroup: AgeGroupSchema,
  occupation: OccupationSchema,
  region: RegionSchema,
  languageLevel: LanguageLevelSchema,
  techComfort: z.number().int().min(1).max(5),
  patience: z.number().int().min(1).max(5),
  attentionSpan: AttentionSpanSchema,
  device: DeviceSchema,
  connection: ConnectionSchema,
  accessibility: AccessibilitySchema,
  budgetSens: z.number().int().min(1).max(5),
  paymentTrust: z.number().int().min(1).max(5),
  goalStyle: GoalStyleSchema,
});
export type Traits = z.infer<typeof TraitsSchema>;

export const DeviceProfileKeySchema = z.enum([
  "low-end-android-3g",
  "mid-android-4g",
  "iphone-wifi",
  "laptop-broadband",
  "tablet-wifi",
]);
export type DeviceProfileKey = z.infer<typeof DeviceProfileKeySchema>;
