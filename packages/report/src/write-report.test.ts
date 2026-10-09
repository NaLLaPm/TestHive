import { describe, expect, it } from "vitest";
import { writeReport } from "./write-report.js";
import { mocks } from "@testhive/contracts";

describe("Report Writer", () => {
  it("renders markdown report containing funnel and friction heatmap", async () => {
    const report = await writeReport({
      runId: mocks.mockRun.id,
      stimulus: mocks.mockRun.stimulus,
      segments: mocks.mockSegments,
      issues: [mocks.mockIssue],
      funnel: mocks.mockReport.funnel,
      frictionHeatmap: mocks.mockReport.frictionHeatmap,
      provider: "fake",
    });

    expect(report.title).toBeDefined();
    expect(report.summary).toBeDefined();
    expect(report.funnel).toBeDefined();
    expect(report.frictionHeatmap).toBeDefined();
    expect(report.markdown).toContain("User Journey Funnel");
    expect(report.markdown).toContain("Friction Heatmap by Page Element");
    expect(report.markdown).toContain("Impact-Ranked Fixes");
  });
});
