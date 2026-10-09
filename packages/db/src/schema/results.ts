import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { runs } from "./runs.js";

export const personaResults = sqliteTable("persona_results", {
  id: text("id").primaryKey(),
  runId: text("run_id")
    .notNull()
    .references(() => runs.id),
  personaId: text("persona_id").notNull(),
  kind: text("kind").notNull(),
  outcome: text("outcome").notNull(),
  verdict: text("verdict", { mode: "json" }).notNull().default("{}"),
  sentiment: real("sentiment").notNull().default(0),
  wouldRecommend: integer("would_recommend", { mode: "boolean" }).notNull().default(false),
  frictionNotes: text("friction_notes", { mode: "json" }).notNull().default("[]"),
  dropOffStep: integer("drop_off_step"),
  dropOffReason: text("drop_off_reason"),
  screenshotPath: text("screenshot_path"),
  repeatIndex: integer("repeat_index").notNull().default(0),
  isControl: integer("is_control", { mode: "boolean" }).notNull().default(false),
});

export const steps = sqliteTable("steps", {
  id: text("id").primaryKey(),
  runId: text("run_id")
    .notNull()
    .references(() => runs.id),
  personaId: text("persona_id").notNull(),
  step: integer("step").notNull(),
  action: text("action", { mode: "json" }).notNull().default("{}"),
  note: text("note"),
  screenshotPath: text("screenshot_path"),
  repeatIndex: integer("repeat_index").notNull().default(0),
});

