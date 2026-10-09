import { eq } from "drizzle-orm";
import type { Db } from "../client.js";
import { issues, spreadResults, reports } from "../schema/issues.js";

export function issuesRepo(db: Db) {
  return {
    insertMany: (rows: (typeof issues.$inferInsert)[]) => {
      if (rows.length === 0) return;
      db.insert(issues).values(rows).run();
    },
    listByRun: (runId: string) => db.select().from(issues).where(eq(issues.runId, runId)).all(),
    insertSpread: (row: typeof spreadResults.$inferInsert) =>
      db.insert(spreadResults).values(row).run(),
    latestSpread: (runId: string) =>
      db
        .select()
        .from(spreadResults)
        .where(eq(spreadResults.runId, runId))
        .orderBy(spreadResults.id)
        .all()
        .at(-1) ?? null,
    upsertReport: (row: typeof reports.$inferInsert) =>
      db.insert(reports).values(row).onConflictDoUpdate({
        target: reports.runId,
        set: { json: row.json, markdown: row.markdown },
      }).run(),
    getReport: (runId: string) =>
      db.select().from(reports).where(eq(reports.runId, runId)).get(),
  };
}
