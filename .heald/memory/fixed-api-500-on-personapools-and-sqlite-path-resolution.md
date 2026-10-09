---
type: decision
title: "Fixed API 500 on persona_pools and SQLite path resolution"
timestamp: 2026-10-09T15:16:08.628780500+00:00
---
Fixed Drizzle migration path parsing on Windows in packages/db/src/migrate.ts using fileURLToPath. Updated packages/db/src/client.ts to dynamically resolve relative DATABASE_PATH against workspace root so APIs running from apps/api find data/testhive.db correctly without crashing on missing persona_pools table. Also ensured apps/api routes resolve demo manifests and screenshots against workspace root.
