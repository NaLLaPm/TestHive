import { describe, expect, it } from "vitest";
import { computeFunnel } from "./funnel.js";
import { computeElementFriction } from "./friction.js";
import { clusterIssues } from "./issues.js";
import type { PersonaResult } from "@testhive/contracts";

describe("Funnel and Friction Analytics", () => {
  it("computes 5-stage funnel with drop-off percentages", () => {
    const results: PersonaResult[] = [
      {
        id: "res-1",
        kind: "url_journey",
        personaId: "p1",
        runId: "run-1",
        outcome: "success",
        verdict: {},
        sentiment: 0.8,
        wouldRecommend: true,
        frictionNotes: [],
        dropOffStep: null,
      },
      {
        id: "res-2",
        kind: "url_journey",
        personaId: "p2",
        runId: "run-1",
        outcome: "failure",
        verdict: {},
        sentiment: -0.5,
        wouldRecommend: false,
        frictionNotes: ["Stuck at checkout"],
        dropOffStep: 4,
        dropOffReason: "Payment failed",
      },
      {
        id: "res-3",
        kind: "url_journey",
        personaId: "p3",
        runId: "run-1",
        outcome: "failure",
        verdict: {},
        sentiment: -0.8,
        wouldRecommend: false,
        frictionNotes: ["Could not find cart button"],
        dropOffStep: 2,
        dropOffReason: "Add to cart failed",
      },
    ];

    const funnel = computeFunnel(results, [], 3);
    expect(funnel).toHaveLength(5);
    expect(funnel[0]?.name).toBe("Landing");
    expect(funnel[0]?.reachedCount).toBe(3);
    expect(funnel[1]?.name).toBe("Product Detail");
    expect(funnel[4]?.name).toBe("Success");
    expect(funnel[4]?.reachedCount).toBe(1);
    expect(funnel[4]?.conversionPct).toBeCloseTo(0.333, 2);
  });

  it("computes friction heatmap by page element", () => {
    const results: PersonaResult[] = [
      {
        id: "res-4",
        kind: "url_journey",
        personaId: "p1",
        runId: "run-1",
        outcome: "failure",
        verdict: {},
        sentiment: -0.5,
        wouldRecommend: false,
        frictionNotes: ["Stuck on checkout button"],
        dropOffStep: 4,
        dropOffReason: "Checkout button was unresponsive",
      },
      {
        id: "res-5",
        kind: "url_journey",
        personaId: "p2",
        runId: "run-1",
        outcome: "failure",
        verdict: {},
        sentiment: -0.8,
        wouldRecommend: false,
        frictionNotes: ["Credit card input had cryptic validation"],
        dropOffStep: 4,
        dropOffReason: "Card number format error",
      },
    ];

    const friction = computeElementFriction(results, [], [], 2);
    expect(friction.length).toBeGreaterThanOrEqual(2);
    const checkoutEl = friction.find((f) => f.elementId === "btn-checkout");
    expect(checkoutEl).toBeDefined();
    expect(checkoutEl?.type).toBe("button");
    expect(checkoutEl?.stuckCount).toBe(1);

    const cardEl = friction.find((f) => f.elementId === "field-card-number");
    expect(cardEl).toBeDefined();
    expect(cardEl?.type).toBe("form_field");
  });

  it("ranks issues by impact (affected share * failure rate * effort)", async () => {
    const notes = [
      { personaId: "p1", clusterId: 1, note: "Button contrast is terrible", step: 2, screenshot: "ss1.png" },
      { personaId: "p2", clusterId: 1, note: "Button contrast is hard to read", step: 2, screenshot: null },
      { personaId: "p3", clusterId: 2, note: "Redesign the entire payment backend architecture", step: 4, screenshot: null },
      { personaId: "p4", clusterId: 2, note: "Redesign the entire payment backend architecture", step: 4, screenshot: null },
    ];

    const issues = await clusterIssues("run-1", notes, 4, "fake");
    expect(issues.length).toBeGreaterThan(0);
    for (const issue of issues) {
      expect(issue.affectedShare).toBeGreaterThan(0);
      expect(issue.failureRate).toBeGreaterThan(0);
      expect(issue.effort).toBeDefined();
      expect(issue.impactScore).toBeDefined();
    }
  });
});
