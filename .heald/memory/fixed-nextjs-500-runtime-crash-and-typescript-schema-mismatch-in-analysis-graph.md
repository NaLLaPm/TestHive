---
type: decision
title: "Fixed Next.js 500 runtime crash and TypeScript schema mismatch in analysis graph"
timestamp: 2026-10-09T06:36:47.995257600+00:00
---
Resolved 500 Internal Server Error on Next.js dev server: 1) Harmonized AnalysisGraphNodeSchema and AnalysisGraphEdgeSchema optional defaults with UI consumer types across packages/contracts, apps/web/src/components/analysis-graph-view.tsx, and Stat component; 2) Purged stale .next build cache and killed stale webpack worker process that triggered missing ./345.js runtime chunk errors; 3) Verified clean production build and local dev server responding with HTTP 200.
