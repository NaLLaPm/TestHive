---
type: decision
title: "Prebuilt persona corpus persistence and alterable roster management"
timestamp: 2026-10-08T14:14:38.145868600+00:00
---
Retained prebuilt persona pools permanently in SQLite to guarantee instant, deterministic reuse across every subsequent benchmark run. Added PATCH /api/pools/:poolId/personas/:personaId endpoint and built /personas interactive directory page enabling filtering, inspection, and fine-grained trait/backstory alterations that persist back into the prebuilt pool.
