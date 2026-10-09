import type { Persona } from "../domain/persona.js";
import type { PersonaPool } from "../domain/pool.js";
import type { GraphPayload } from "../domain/graph.js";
import type { Run } from "../domain/run.js";
import type { SegmentsResponse } from "../domain/segment.js";
import type { Issue } from "../domain/issue.js";
import type { SpreadResult } from "../domain/spread.js";
import type { Report } from "../domain/report.js";

const MOCK_POOL_ID = "4f8b2c1a-8e3d-4c5b-9a7e-1f2e3d4c5b6a";
const MOCK_RUN_ID = "7d9e1f2a-3b4c-4d5e-8f9a-0b1c2d3e4f5a";
const MOCK_PERSONA_ID = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";
const MOCK_ISSUE_ID = "c1b2a3f4-d5e6-4a7b-8c9d-0e1f2a3b4c5d";

export const mockPool: PersonaPool = {
  id: MOCK_POOL_ID,
  slug: "default-v1",
  version: 1,
  size: 1000,
  seed: 42,
  status: "ready",
  generatorConfig: {},
  diversityReport: {
    size: 1000,
    byTrait: { ageGroup: { "18-24": 220, "25-34": 300 } },
    clusterCount: 8,
    duplicatesRejected: 3,
  },
  isDefault: true,
  createdAt: new Date().toISOString(),
} satisfies PersonaPool;

export const mockPersona: Persona = {
  id: MOCK_PERSONA_ID,
  poolId: MOCK_POOL_ID,
  traits: {
    ageGroup: "18-24",
    occupation: "student",
    region: "tier-2",
    languageLevel: "conversational",
    techComfort: 2,
    patience: 2,
    attentionSpan: "short",
    device: "low-end android",
    connection: "3g",
    accessibility: "none",
    budgetSens: 5,
    paymentTrust: 2,
    goalStyle: "bargain_hunter",
  },
  traitVector: [1, 0, 2, 2, 3],
  traitsHash: "mockhash",
  backstory: "A second-year college student in a tier-2 city, careful with money.",
  voice: "Casual, a bit skeptical, types in short sentences.",
  quirks: ["double-checks prices", "distrusts pop-ups"],
  deviceProfileKey: "low-end-android-3g",
  clusterId: 3,
  schemaVersion: 1,
} satisfies Persona;

export const mockGraph: GraphPayload = {
  poolId: MOCK_POOL_ID,
  nodes: [{ id: MOCK_PERSONA_ID, clusterId: 3, ageGroup: "18-24", device: "low-end android", region: "tier-2" }],
  edges: [],
  clusters: [
    {
      poolId: MOCK_POOL_ID,
      clusterId: 3,
      label: "Impatient low-end mobile users",
      description: "Young, budget-sensitive, slow connections.",
      size: 112,
      topTraits: { device: "low-end android", connection: "3g" },
    },
  ],
} satisfies GraphPayload;

export const mockRun: Run = {
  id: MOCK_RUN_ID,
  kind: "url_journey",
  poolId: MOCK_POOL_ID,
  stimulus: { type: "url", url: "https://example.com", goal: "Find a product and reach checkout" },
  config: {},
  state: "completed",
  totalPersonas: 1000,
  donePersonas: 1000,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} satisfies Run;

export const mockSegments: SegmentsResponse = {
  overall: { successRate: 0.58, n: 1000 },
  byCluster: [{
    clusterId: 3,
    label: "Impatient low-end mobile users",
    description: "Budget smartphone shoppers on throttled connections who abandon quickly on delays.",
    n: 112,
    successRate: 0.31,
  }],
  byTrait: { techComfort: [{ value: 1, successRate: 0.22, n: 140 }] },
} satisfies SegmentsResponse;

export const mockIssue: Issue = {
  issueId: MOCK_ISSUE_ID,
  runId: MOCK_RUN_ID,
  title: "Checkout button not noticed on small screens",
  severity: "high",
  affectedPersonas: 87,
  affectedClusters: [3, 5],
  evidence: [{ personaId: MOCK_PERSONA_ID, quote: "I never saw a checkout button", step: 5, screenshot: null }],
  suggestedFix: "Increase contrast and size of the checkout CTA on mobile.",
  affectedShare: 0.087,
  failureRate: 0.69,
  effort: "low",
  impactScore: 0.06,
  screenshot: null,
} satisfies Issue;

export const mockSpread: SpreadResult = {
  runId: MOCK_RUN_ID,
  params: { rounds: 6, seedStrategy: "positive_verdict", seed: 42 },
  rounds: [{ round: 1, newAdopters: [MOCK_PERSONA_ID], cumulativeAdopters: 1 }],
  totalReached: 420,
  poolSize: 1000,
} satisfies SpreadResult;

export const mockReport: Report = {
  runId: MOCK_RUN_ID,
  title: "TestHive Report: example.com",
  summary: "58% of personas completed the checkout journey successfully.",
  segments: mockSegments,
  topIssues: [mockIssue],
  recommendations: ["Increase CTA contrast", "Simplify checkout for low-end devices"],
  funnel: [
    { id: "landing", name: "Landing", order: 1, reachedCount: 1000, dropOffCount: 80, conversionPct: 1, dropOffPct: 0.08 },
    { id: "product", name: "Product Detail", order: 2, reachedCount: 920, dropOffCount: 140, conversionPct: 0.92, dropOffPct: 0.15 },
    { id: "cart", name: "Cart", order: 3, reachedCount: 780, dropOffCount: 110, conversionPct: 0.78, dropOffPct: 0.14 },
    { id: "checkout", name: "Checkout", order: 4, reachedCount: 670, dropOffCount: 90, conversionPct: 0.67, dropOffPct: 0.13 },
    { id: "success", name: "Success", order: 5, reachedCount: 580, dropOffCount: 0, conversionPct: 0.58, dropOffPct: 0 },
  ],
  frictionHeatmap: [
    {
      elementId: "btn-checkout",
      name: "Checkout Button",
      type: "button",
      selector: "#checkout-btn",
      stuckCount: 87,
      stuckPercentage: 0.087,
      sampleQuotes: ["I never saw a checkout button", "Button hidden beneath banner"],
      affectedPersonas: [MOCK_PERSONA_ID],
    },
  ],
  markdown: "# TestHive Report\n\n58% success rate overall.",
  generatedAt: new Date().toISOString(),
} satisfies Report;
