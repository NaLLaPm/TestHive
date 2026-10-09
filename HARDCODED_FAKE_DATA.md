# Hardcoded / Fake Data Map

Every route, module, and constant that injects fabricated or hardcoded data instead of real DB/LLM traces.

---

## 1. Mock Data Module (central hub)

**File:** `packages/contracts/src/mocks/index.ts`

Exports 8 hardcoded objects, all with UUIDs in the `00000000-0000-0000-0000-000000000xxx` range:

| Export         | Hardcoded Values                                                    |
|----------------|---------------------------------------------------------------------|
| `mockPool`     | id `...0001`, slug `"default-v1"`, size 1000, seed 42, status `"ready"`, diversityReport hardcoded |
| `mockPersona`  | id `...0003`, clusterId 3, device `"low-end android"`, connection `"3g"`, paymentTrust 2 |
| `mockGraph`    | 1 node, 0 edges, 1 cluster labeled `"Impatient low-end mobile users"` |
| `mockRun`      | id `...0002`, kind `"url_journey"`, state `"completed"`, 1000/1000 done |
| `mockSegments` | overall successRate 0.58, 1 cluster segment, 1 trait segment         |
| `mockIssue`    | title `"Checkout button not noticed on small screens"`, severity `"high"`, affectedPersonas 87 |
| `mockSpread`   | rounds `[{round:1,newAdopters:[...0003],cumulativeAdopters:1}]`, totalReached 420 |
| `mockReport`   | 5-step funnel, 1 frictionHeatmap entry, hardcoded markdown `"# TestHive Report\n\n58% success rate overall."` |

Used by: `packages/contracts/src/mocks/mocks.test.ts` (schema validation only), and potentially by any consumer importing from this module.

---

## 2. Fake Data Generator (LLM-free faker)

**File:** `packages/llm/src/fake-faker.ts`

- `seededRng(seedStr)` — deterministic mulberry32 PRNG from a string seed
- `fakeGenerate(schema, promptOrSeed)` — walks any Zod schema and produces valid-but-fake data
- Word list is hardcoded: `["quick","careful","curious","busy","skeptical",...,"offer"]` (30 words)
- UUIDs generated via `crypto.randomUUID()` (not deterministic)
- URL strings hardcoded as `"https://example.com/" + pick(rng, WORDS)`
- Sentence generator: 4–14 words from the word list, capitalized, period-terminated

Used by: `packages/llm/src/generate.ts` as a fallback when no LLM provider is configured (provider `"fake"`).

---

## 3. Demo Routes (file-backed fake runs)

**File:** `apps/api/src/modules/demo/routes.ts`

| Route                        | Data Source                                    | Fake? |
|------------------------------|------------------------------------------------|-------|
| `GET /api/demo/runs`         | Reads `data/demo-manifest.json` from disk      | File-backed, populated by seed script |
| `POST /api/demo/runs/:demoId/load` | Looks up manifest entry, returns `{runId}` | 404 if not seeded |

**Seed script:** `scripts/seed-demo.ts`
- Hardcoded demo IDs: `"before-fix"` and `"after-fix"`
- Hardcoded titles: `"ShopKart checkout (before fix)"` / `"ShopKart checkout (after fix)"`
- Hardcoded URLs: `http://localhost:8989/before` and `http://localhost:8989/after`
- Hardcoded run config: `deepCount: 10`, `maxSteps: 8`, `concurrency: 10`, `useCache: true`
- Uses `"fake"` LLM provider fallback
- Real pipeline execution (`runFullPipeline`), but the stimulus URLs and demo metadata are hardcoded

---

## 4. Baseline Controls Hack (analytics)

**File:** `packages/analytics/src/segments.ts`

Lines 50–51 — hardcoded control persona detection:
```ts
const controlResults = results.filter((r) => r.isControl || r.personaId.includes("c001"));
const nonControlPersonas = personas.filter((p) => p.clusterId !== 9999 && !p.id.includes("c001"));
```

Cluster 9999 is **not from the DB** — it's injected downstream in the run pipeline:

**File:** `packages/engine/src/run-pipeline.ts`, lines 68–70:
```ts
labelByCluster[9999] = "Baseline Controls";
descriptionByCluster[9999] = "Standardized benchmark persona with simplified task execution to verify environment health.";
```

This means baseline control data is fabricated at pipeline runtime with no real personas backing it.

---

## 5. Funnel Computation (hardcoded stages)

**File:** `packages/analytics/src/funnel.ts`

- 5 hardcoded stage definitions: `landing`, `product`, `cart`, `checkout`, `success`
- URL matching heuristics hardcode `/checkout`, `/cart`, `/product`, `/item` substrings
- Stage reached is inferred from `dropOffStep` + URL/note keyword matching — not from real navigation traces
- Scaling logic: `landingCount = Math.max(stageReachedCounts[1], total)` — forces landing to total even if no results

---

## 6. Issue Clustering (hardcoded thresholds)

**File:** `packages/analytics/src/issues.ts`

- `severityFromSize()`: critical >30%, high >15%, medium >5%, low ≤5% — arbitrary thresholds
- `failureRate` by severity: critical=0.95, high=0.85, medium=0.65, low=0.45 — hardcoded, not computed
- Effort classification by keyword matching:
  - `"contrast"`, `"color"`, `"text"`, `"label"`, `"size"` → `"low"`
  - `"redesign"`, `"architecture"`, `"backend"`, `"api"` → `"high"`
  - else → `"medium"`
- `impactScore = affectedShare * failureRate * effortWeight` — formula is real but inputs are synthetic

---

## 7. Route-Level Summary

| Route                                | Data Source                | Fake?                          |
|--------------------------------------|----------------------------|--------------------------------|
| `GET /api/demo/runs`                 | `data/demo-manifest.json`  | File-backed, hardcoded entries |
| `POST /api/demo/runs/:id/load`       | Same manifest              | Fake if unseeded               |
| `GET /api/pools`                     | SQLite DB                  | Real                           |
| `POST /api/pools`                    | DB + `buildPool()`         | Real (but provider defaults to `"fake"`) |
| `GET /api/pools/:poolId`             | SQLite DB                  | Real                           |
| `GET /api/pools/:poolId/stream`      | SSE event bus              | Real                           |
| `GET /api/pools/:poolId/personas`    | SQLite DB                  | Real                           |
| `GET /api/pools/:poolId/personas/:id`| SQLite DB                  | Real                           |
| `GET /api/pools/:poolId/graph`       | SQLite DB + graph repo     | Real                           |
| `GET /api/pools/:poolId/clusters`    | SQLite DB                  | Real                           |
| `POST /api/runs`                     | DB + `runFullPipeline()`   | Real pipeline                  |
| `GET /api/runs`                      | SQLite DB                  | Real                           |
| `GET /api/runs/:runId`               | SQLite DB                  | Real                           |
| `POST /api/runs/:id/cancel`          | In-memory `cancelRun()`    | Real state                     |
| `GET /api/runs/:id/stream`           | SSE event bus              | Real                           |
| `GET /api/runs/:id/node-states`      | SQLite DB                  | Real                           |
| `GET /api/runs/:id/personas`         | SQLite DB + join           | Real                           |
| `GET /api/runs/:id/personas/:id/transcript` | SQLite DB          | Real                           |
| `GET /api/runs/:id/segments`         | `computeSegments()`        | **Real computation, but cluster 9999 baseline is fabricated** |
| `GET /api/runs/:id/issues`           | SQLite DB                  | Real                           |
| `POST /api/runs/:id/spread`          | `simulateSpread()`         | Real simulation                |
| `GET /api/runs/:id/spread`           | SQLite DB                  | Real                           |
| `GET /api/runs/:id/report`           | SQLite DB                  | Real                           |
| `GET /api/runs/:id/report.json`      | SQLite DB                  | Real                           |
| `GET /api/runs/:id/report.md`        | SQLite DB                  | Real                           |

---

## 8. Frontend Pages That Render Fake/Empty States

| Page                                   | What it shows when empty                  |
|----------------------------------------|-------------------------------------------|
| `/demo`                                | "No demo runs cached yet."                |
| `/runs`                                | "No runs yet."                            |
| `/runs/[id]` (overview)                | Loading skeleton                          |
| `/runs/[id]/live`                      | "Waiting for events…"                     |
| `/runs/[id]/results`                   | Empty filters, no issues section          |
| `/runs/[id]/spread`                    | "No spread simulation yet."               |
| `/runs/[id]/report`                    | "Report Not Ready" / loading spinner      |

None of these pages directly inject fake data — they all read from API routes. The fake data enters the system at the API/demo-seed/analytics layer described above.

---

## 9. Environment Variable Defaults

- `LLM_PROVIDER` defaults to `"fake"` (used everywhere as fallback)
- `DEMO_SITE_PORT` defaults to `8989`
- `DEMO_SITE_HOST` defaults to `http://localhost:8989`
- `NEXT_PUBLIC_API_URL` defaults to `""` (relative, proxied through Next.js)
