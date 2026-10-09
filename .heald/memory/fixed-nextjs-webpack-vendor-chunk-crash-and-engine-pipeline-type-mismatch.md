---
type: decision
title: "Fixed Next.js webpack vendor chunk crash and engine pipeline type mismatch"
timestamp: 2026-10-09T09:39:03.281781300+00:00
---
1) Patched TypeScript type mismatch in packages/engine/src/run-pipeline.ts clusters mapping with explicit cast to satisfy AnalysisGraph topTraits contract. 2) Executed clean turbo build validating all 12 packages. 3) Terminated orphaned node processes occupying port 3000 and restarted fresh bun dev server, verifying root and dynamic SSR subroutes (/runs/[id]/results) return HTTP 200 without missing chunk errors.
