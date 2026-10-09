import { describe, it, expect } from "vitest";
import { createFakeAnalysisGraph } from "./fake-analysis-graph.js";
import { AnalysisGraphSchema, mocks } from "@testhive/contracts";
const { mockPersona, mockIssue } = mocks;

describe("createFakeAnalysisGraph", () => {
  it("creates a schema-valid analysis graph after a test run", () => {
    const runId = "7d9e1f2a-3b4c-4d5e-8f9a-0b1c2d3e4f5a";
    const poolId = "4f8b2c1a-8e3d-4c5b-9a7e-1f2e3d4c5b6a";

    const graph = createFakeAnalysisGraph({
      runId,
      poolId,
      personas: [mockPersona],
      results: [
        {
          runId,
          personaId: mockPersona.id,
          outcome: "failure",
          sentiment: -0.4,
          stepsCount: 3,
          durationMs: 1200,
          notes: "Blocked at checkout",
          recordedAt: new Date().toISOString(),
        },
      ],
      clusters: [
        {
          poolId,
          clusterId: 3,
          label: "Impatient mobile users",
          description: "Shoppers on slow connections",
          size: 112,
          topTraits: {},
        },
      ],
      issues: [mockIssue],
    });

    expect(graph.runId).toBe(runId);
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.metrics.clustersCount).toBeGreaterThan(0);
    expect(graph.metrics.funnelStagesCount).toBe(5);

    // Schema validation passes
    const validated = AnalysisGraphSchema.parse(graph);
    expect(validated).toBeTruthy();
  });
});
