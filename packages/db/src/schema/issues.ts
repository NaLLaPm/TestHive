import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { runs } from "./runs.js";

export const issues = sqliteTable("issues", {
  id: text("id").primaryKey(),
  runId: text("run_id")
    .notNull()
    .references(() => runs.id),
  title: text("title").notNull(),
  severity: text("severity").notNull(),
  affectedPersonas: integer("affected_personas").notNull().default(0),
  affectedClusters: text("affected_clusters", { mode: "json" }).notNull().default("[]"),
  evidence: text("evidence", { mode: "json" }).notNull().default("[]"),
  suggestedFix: text("suggested_fix").notNull().default(""),
});

export const spreadResults = sqliteTable("spread_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  runId: text("run_id")
    .notNull()
    .references(() => runs.id),
  params: text("params", { mode: "json" }).notNull().default("{}"),
  rounds: text("rounds", { mode: "json" }).notNull().default("[]"),
});

export const reports = sqliteTable("reports", {
  runId: text("run_id")
    .primaryKey()
    .references(() => runs.id),
  json: text("json", { mode: "json" }).notNull().default("{}"),
  markdown: text("markdown").notNull().default(""),
});
