import { and, eq, sql } from "drizzle-orm";
import type { Db } from "../client.js";
import { personas } from "../schema/personas.js";

export function personasRepo(db: Db) {
  return {
    insertMany: (rows: (typeof personas.$inferInsert)[]) => {
      if (rows.length === 0) return;
      const CHUNK = 200;
      db.transaction((txn) => {
        for (let i = 0; i < rows.length; i += CHUNK) {
          txn.insert(personas).values(rows.slice(i, i + CHUNK)).run();
        }
      });
    },
    getById: (id: string) => db.select().from(personas).where(eq(personas.id, id)).get(),
    listByPool: (poolId: string, limit = 50, offset = 0) =>
      db
        .select()
        .from(personas)
        .where(eq(personas.poolId, poolId))
        .limit(limit)
        .offset(offset)
        .all(),
    listAllByPool: (poolId: string) =>
      db.select().from(personas).where(eq(personas.poolId, poolId)).all(),
    countByPool: (poolId: string) =>
      db
        .select({ count: sql<number>`count(*)` })
        .from(personas)
        .where(eq(personas.poolId, poolId))
        .get(),
    listByCluster: (poolId: string, clusterId: number) =>
      db
        .select()
        .from(personas)
        .where(and(eq(personas.poolId, poolId), eq(personas.clusterId, clusterId)))
        .all(),
    update: (id: string, partial: Partial<typeof personas.$inferInsert>) => {
      db.update(personas).set(partial).where(eq(personas.id, id)).run();
      return db.select().from(personas).where(eq(personas.id, id)).get();
    },
    updateClusters: (updates: { id: string; clusterId: number }[]) => {
      db.transaction((txn) => {
        for (const u of updates) {
          txn.update(personas).set({ clusterId: u.clusterId }).where(eq(personas.id, u.id)).run();
        }
      });
    },
  };
}
