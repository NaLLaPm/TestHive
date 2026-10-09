import { eq } from "drizzle-orm";
import type { Db } from "../client.js";
import { llmCache } from "../schema/llm-cache.js";

export function llmCacheRepo(db: Db) {
  return {
    get: (promptHash: string) =>
      db.select().from(llmCache).where(eq(llmCache.promptHash, promptHash)).get(),
    set: (row: typeof llmCache.$inferInsert) =>
      db.insert(llmCache).values(row).onConflictDoNothing().run(),
  };
}
