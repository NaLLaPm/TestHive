import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema/index.js";
import fs from "node:fs";
import path from "node:path";

import { fileURLToPath } from "node:url";

function findRepoRoot(): string {
  let cur = path.dirname(fileURLToPath(import.meta.url));
  while (cur) {
    if (fs.existsSync(path.join(cur, "turbo.json")) || fs.existsSync(path.join(cur, "pnpm-workspace.yaml"))) {
      return cur;
    }
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return process.cwd();
}

const DEFAULT_PATH = "./data/testhive.db";

function resolveDbPath(rawPath?: string): string {
  const target = rawPath ?? DEFAULT_PATH;
  return path.isAbsolute(target) ? target : path.resolve(findRepoRoot(), target);
}

import { migrate } from "drizzle-orm/better-sqlite3/migrator";

export function createDb(dbPath: string = resolveDbPath(process.env.DATABASE_PATH)) {
  const resolvedPath = path.isAbsolute(dbPath) ? dbPath : resolveDbPath(dbPath);
  const dir = path.dirname(resolvedPath);
  if (dir && dir !== "." && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const sqlite = new Database(resolvedPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });

  // Auto-migrate tables on initialization if database is fresh/unmigrated
  try {
    const hasPoolsTable = sqlite.prepare("SELECT count(*) as cnt FROM sqlite_master WHERE type='table' AND name='persona_pools'").get() as { cnt: number } | undefined;
    if (!hasPoolsTable || hasPoolsTable.cnt === 0) {
      const migrationsDir = path.resolve(findRepoRoot(), "packages", "db", "migrations");
      if (fs.existsSync(migrationsDir)) {
        migrate(db, { migrationsFolder: migrationsDir });
      }
    }
  } catch (err) {
    // Non-fatal if already migrating concurrently
  }

  return db;
}

export type Db = ReturnType<typeof createDb>;

let _db: Db | null = null;
export function getDb(): Db {
  if (!_db) _db = createDb();
  return _db;
}

export { schema };
