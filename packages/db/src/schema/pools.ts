import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const personaPools = sqliteTable("persona_pools", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  version: integer("version").notNull().default(1),
  size: integer("size").notNull(),
  seed: integer("seed").notNull(),
  status: text("status").notNull().default("queued"),
  generatorConfig: text("generator_config", { mode: "json" }).notNull().default("{}"),
  diversityReport: text("diversity_report", { mode: "json" }),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});
