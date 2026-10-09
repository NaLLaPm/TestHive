import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { personaPools } from "./pools.js";

export const personaEdges = sqliteTable("persona_edges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  poolId: text("pool_id")
    .notNull()
    .references(() => personaPools.id),
  sourceId: text("source_id").notNull(),
  targetId: text("target_id").notNull(),
  kind: text("kind").notNull(),
  weight: real("weight").notNull(),
});

export const personaClusters = sqliteTable("persona_clusters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  poolId: text("pool_id")
    .notNull()
    .references(() => personaPools.id),
  clusterId: integer("cluster_id").notNull(),
  label: text("label").notNull(),
  description: text("description").notNull(),
  size: integer("size").notNull(),
  topTraits: text("top_traits", { mode: "json" }).notNull().default("{}"),
});
