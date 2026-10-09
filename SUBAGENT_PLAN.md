# Subagent Plan: Replace Hardcoded/Fake Data with Real Sources

## Assumptions
- SQLite DB is populated (has real pool/run/persona/result data)
- LLM provider is available or "fake" is acceptable fallback for generation only
- Subagents work independently; no inter-agent coordination needed

## Agent 1: Mock Module → Real DB Queries
**Target:** `packages/contracts/src/mocks/index.ts`
**Current:** Hardcoded `mockPool`, `mockPersona`, `mockGraph`, `mockRun`, `mockSegments`, `mockIssue`, `mockSpread`, `mockReport` with `00000000-...` UUIDs.
**Plan:** Replace each mock with a factory function that reads from the real DB:
- `mockPool` → `poolsRepo(db).getById(...)` or `poolsRepo(db).getDefault()`
- `mockPersona` → `personasRepo(db).listAllByPool(poolId)[0]`
- `mockRun` → `runsRepo(db).list()[0]`
- `mockSegments` → call `computeSegments()` with real data
- `mockIssue` → call `clusterIssues()` with real friction notes
- `mockSpread` → call `simulateSpread()` with real nodes/edges
- `mockReport` → call `writeReport()` with real segments/issues
**Keep:** Schema validation in `mocks.test.ts` — just point it at real data instead.
**Acceptance:** `mocks.test.ts` passes with real DB data; no `00000000-` UUIDs in output.

## Agent 2: Demo Seed Script → Real Runs
**Target:** `scripts/seed-demo.ts`
**Current:** Hardcoded demo IDs (`before-fix`/`after-fix`), titles, stimulus URLs (`localhost:8989`).
**Plan:**
- Keep demo IDs as labels but derive title/description from real pool/run metadata
- Accept `--url` flag for stimulus URL instead of hardcoded localhost
- Record real `runId` from `runFullPipeline()` into manifest (already done)
- Add `--pool-size` and `--seed` flags for reproducibility
**Acceptance:** `pnpm demo:seed --url https://example.com --size 200` produces manifest with real runIds, non-hardcoded titles.

## Agent 3: Baseline Controls → Real Control Personas
**Target:** `packages/engine/src/run-pipeline.ts` lines 68–70, `packages/analytics/src/segments.ts` lines 50–51
**Current:** Cluster 9999 fabricates "Baseline Controls" with no real personas.
**Plan:**
- Remove cluster 9999 injection from pipeline
- Create a real "control" pool or tag personas with `isControl: true` trait
- `computeSegments()` filters on `isControl` flag instead of `clusterId === 9999` or `personaId.includes("c001")`
- Baseline control stats computed from real control persona results
**Acceptance:** `segments.baselineControl` reflects actual control persona outcomes; no `9999` cluster references.

## Agent 4: Funnel → Real Step Traces
**Target:** `packages/analytics/src/funnel.ts`
**Current:** Hardcoded 5 stage names, URL keyword heuristics, `landingCount = max(reached, total)` scaling.
**Plan:**
- Replace URL keyword matching with real `StepSchema` data from `resultsR.listStepsByRun()`
- Map steps to stages via `action.url` / `action.type` fields from actual recorded steps
- Remove artificial scaling — use `totalPersonasCount` from run config, not `Math.max(reached, total)`
- Keep 5-stage structure (domain concept) but derive reached/dropoff from real traces
**Acceptance:** Funnel numbers match actual persona step traces; no `landingCount` override.

## Agent 5: Issue Clustering → LLM-Generated
**Target:** `packages/analytics/src/issues.ts`
**Current:** `severityFromSize()` arbitrary thresholds, `failureRate` by severity lookup, effort by keyword matching.
**Plan:**
- Keep `groupByKeyword()` for grouping (that's real evidence)
- Replace `severityFromSize()` with LLM call via `generateStructured()` using issue evidence
- Replace hardcoded `failureRate` mapping with LLM-derived rate or compute from actual result data
- Replace keyword-based effort with LLM classification or compute from actual fix complexity
- Fallback to heuristics only if LLM call fails
**Acceptance:** Issues have LLM-derived severity/failureRate/effort; heuristics only as fallback.

## Execution Order
1. Agent 1 first (mocks are used by tests + other agents may reference mock data)
2. Agent 3 (baseline controls — affects pipeline + analytics)
3. Agent 4 (funnel — independent)
4. Agent 5 (issues — independent)
5. Agent 2 (demo seed — depends on real runs existing)

## Verification
- Run `pnpm test` (or `npx vitest run`) after each agent
- Run `pnpm build` to check TypeScript after all agents
- Check that no `00000000-0000-0000-0000-000000000xxx` UUIDs remain in production code