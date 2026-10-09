import { eq, sql } from "drizzle-orm";
import type { Db } from "../client.js";
import { runs, runPersonas } from "../schema/runs.js";

export function runsRepo(db: Db) {
  return {
    insert: (row: typeof runs.$inferInsert) => db.insert(runs).values(row).run(),
    getById: (id: string) => db.select().from(runs).where(eq(runs.id, id)).get(),
    list: () => db.select().from(runs).all(),
    update: (id: string, patch: Partial<typeof runs.$inferInsert>) =>
      db
        .update(runs)
        .set({ ...patch, updatedAt: sql`(current_timestamp)` })
        .where(eq(runs.id, id))
        .run(),
    insertRunPersonas: (rows: (typeof runPersonas.$inferInsert)[]) => {
      if (rows.length === 0) return;
      const CHUNK = 500;
      db.transaction((txn) => {
        for (let i = 0; i < rows.length; i += CHUNK) {
          txn.insert(runPersonas).values(rows.slice(i, i + CHUNK)).run();
        }
      });
    },
    listRunPersonas: (runId: string) =>
      db.select().from(runPersonas).where(eq(runPersonas.runId, runId)).all(),
    updateRunPersona: (
      runId: string,
      personaId: string,
      patch: Partial<typeof runPersonas.$inferInsert>,
    ) =>
      db
        .update(runPersonas)
        .set(patch)
        .where(sql`${runPersonas.runId} = ${runId} and ${runPersonas.personaId} = ${personaId}`)
        .run(),
  };
}
