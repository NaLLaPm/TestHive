---
type: decision
title: "Applied Drizzle migration for grounded persona results and steps schema"
timestamp: 2026-10-09T00:49:41.284903500+00:00
---
Generated migration 0001_real_lionheart.sql and applied it via tsx packages/db/src/migrate.ts to add missing columns (drop_off_step, drop_off_reason, screenshot_path, repeat_index, is_control) to persona_results and steps tables, resolving HTTP 500 on /api/runs/:runId/personas.
