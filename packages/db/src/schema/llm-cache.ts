import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const llmCache = sqliteTable("llm_cache", {
  promptHash: text("prompt_hash").primaryKey(),
  model: text("model").notNull(),
  response: text("response", { mode: "json" }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});
