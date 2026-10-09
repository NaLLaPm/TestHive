import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { personaPools } from "./pools.js";

export const runs = sqliteTable("runs", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  poolId: text("pool_id")
    .notNull()
    .references(() => personaPools.id),
  stimulus: text("stimulus", { mode: "json" }).notNull(),
  config: text("config", { mode: "json" }).notNull().default("{}"),
  state: text("state").notNull().default("created"),
  totalPersonas: integer("total_personas").notNull().default(0),
  donePersonas: integer("done_personas").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const runPersonas = sqliteTable("run_personas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  runId: text("run_id")
    .notNull()
    .references(() => runs.id),
  personaId: text("persona_id").notNull(),
  mode: text("mode").notNull(),
  status: text("status").notNull().default("pending"),
  outcome: text("outcome"),
});
