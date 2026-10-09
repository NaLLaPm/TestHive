import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";
import { personaPools } from "./pools.js";

export const personas = sqliteTable(
  "personas",
  {
    id: text("id").primaryKey(),
    poolId: text("pool_id")
      .notNull()
      .references(() => personaPools.id),
    traits: text("traits", { mode: "json" }).notNull(),
    traitVector: text("trait_vector", { mode: "json" }).notNull(),
    traitsHash: text("traits_hash").notNull(),
    backstory: text("backstory").notNull().default(""),
    voice: text("voice").notNull().default(""),
    quirks: text("quirks", { mode: "json" }).notNull().default("[]"),
    deviceProfileKey: text("device_profile_key").notNull(),
    clusterId: integer("cluster_id"),
    schemaVersion: integer("schema_version").notNull().default(1),
  },
  (t) => ({
    poolHashUnique: unique().on(t.poolId, t.traitsHash),
  }),
);
