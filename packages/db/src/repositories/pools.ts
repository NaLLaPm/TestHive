import { eq } from "drizzle-orm";
import type { Db } from "../client.js";
import { personaPools } from "../schema/pools.js";

export function poolsRepo(db: Db) {
  return {
    list: () => db.select().from(personaPools).all(),
    getById: (id: string) => db.select().from(personaPools).where(eq(personaPools.id, id)).get(),
    getBySlug: (slug: string) =>
      db.select().from(personaPools).where(eq(personaPools.slug, slug)).get(),
    getDefault: () =>
      db.select().from(personaPools).where(eq(personaPools.isDefault, true)).get(),
    insert: (row: typeof personaPools.$inferInsert) =>
      db.insert(personaPools).values(row).run(),
    update: (id: string, patch: Partial<typeof personaPools.$inferInsert>) =>
      db.update(personaPools).set(patch).where(eq(personaPools.id, id)).run(),
  };
}
