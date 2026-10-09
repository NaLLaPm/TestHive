import { eq } from "drizzle-orm";
import type { Db } from "../client.js";
import { personaResults, steps } from "../schema/results.js";

export function resultsRepo(db: Db) {
  return {
    insertResult: (row: typeof personaResults.$inferInsert) =>
      db.insert(personaResults).values(row).run(),
    listByRun: (runId: string) =>
      db.select().from(personaResults).where(eq(personaResults.runId, runId)).all(),
    insertStep: (row: typeof steps.$inferInsert) => db.insert(steps).values(row).run(),
    listStepsByRun: (runId: string) =>
      db.select().from(steps).where(eq(steps.runId, runId)).all(),
    listStepsByPersona: (runId: string, personaId: string) =>
      db
        .select()
        .from(steps)
        .where(eq(steps.runId, runId))
        .all()
        .filter((s) => s.personaId === personaId),
  };
}

