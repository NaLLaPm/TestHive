---
type: decision
title: "Auto-migrated database schema and added node dispersion and drag pinning"
timestamp: 2026-10-08T17:24:57.854089107+00:00
---
1) Added automated migration bootstrap to packages/db/src/client.ts so freshly cloned repositories automatically execute Drizzle SQLite schema migrations on first startup; 2) Updated NetworkGraph in apps/web/src/components/network-graph.tsx to increase charge repulsion from -50 to -180 and link distance from 32 to 65 for wide node scattering; 3) Implemented node pinning via onNodeDragEnd and pinnedPositionsRef so dragging/moving any persona node permanently preserves its placed coordinates without snapping back.
