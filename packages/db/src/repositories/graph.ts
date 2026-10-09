import { eq } from "drizzle-orm";
import type { Db } from "../client.js";
import { personaEdges, personaClusters } from "../schema/graph.js";

export function graphRepo(db: Db) {
  return {
    insertEdges: (rows: (typeof personaEdges.$inferInsert)[]) => {
      if (rows.length === 0) return;
      const CHUNK = 500;
      db.transaction((txn) => {
        for (let i = 0; i < rows.length; i += CHUNK) {
          txn.insert(personaEdges).values(rows.slice(i, i + CHUNK)).run();
        }
      });
    },
    listEdges: (poolId: string) =>
      db.select().from(personaEdges).where(eq(personaEdges.poolId, poolId)).all(),
    insertClusters: (rows: (typeof personaClusters.$inferInsert)[]) => {
      if (rows.length === 0) return;
      db.insert(personaClusters).values(rows).run();
    },
    listClusters: (poolId: string) =>
      db.select().from(personaClusters).where(eq(personaClusters.poolId, poolId)).all(),
  };
}
