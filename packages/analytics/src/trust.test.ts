import { describe, it, expect } from "vitest";
import { computeConfidenceInterval, computeSegments } from "./segments.js";
import { resultsToFrictionNotes, clusterIssues } from "./issues.js";

import type { Persona, PersonaResult } from "@testhive/contracts";

describe("trustworthy analytics", () => {
  it("computes Wilson confidence intervals and margin of error correctly", () => {
    // 21% with n=100
    const ci = computeConfidenceInterval(0.21, 100);
    expect(ci.marginOfError).toBeGreaterThan(0.05);
    expect(ci.marginOfError).toBeLessThan(0.12);
    expect(ci.ciLower).toBeLessThan(0.21);
    expect(ci.ciUpper).toBeGreaterThan(0.21);
  });

  it("greys out and flags clusters with n < 10 as isLowSample", () => {
    const mockPersona: Persona = {
      id: "p-1",
      poolId: "pool-1",
      traits: {
        ageGroup: "18-24",
        occupation: "student",
        region: "metro",
        languageLevel: "native",
        techComfort: 4,
        patience: 3,
        attentionSpan: "short",
        device: "laptop",
        connection: "broadband",
        accessibility: "none",
        budgetSens: 2,
        paymentTrust: 4,
        goalStyle: "goal_driven",
      },
      traitVector: [1, 0, 0, 0, 4, 3, 0, 3, 2, 0, 2, 4, 1],
      traitsHash: "hash-1",
      backstory: "Student testing checkout",
      voice: "Direct",
      quirks: [],
      deviceProfileKey: "laptop-broadband",
      clusterId: 1,
      schemaVersion: 1,
    };

    const mockResult: PersonaResult = {
      id: "r-1",
      runId: "run-1",
      personaId: "p-1",
      kind: "url_journey",
      outcome: "success",
      verdict: {},
      sentiment: 0.8,
      wouldRecommend: true,
      frictionNotes: [],
      dropOffStep: null,
      dropOffReason: null,
      screenshotPath: null,
    };

    const res = computeSegments([mockPersona], [mockResult], { 1: "Small Cluster" }, 10);
    expect(res.byCluster[0]?.isLowSample).toBe(true);
    expect(res.byCluster[0]?.n).toBe(1);
  });

  it("grounds friction notes in real traces and drop-off reasons", () => {
    const mockResult: PersonaResult = {
      id: "r-drop",
      runId: "run-1",
      personaId: "p-abandoned",
      kind: "url_journey",
      outcome: "failure",
      verdict: {},
      sentiment: -0.6,
      wouldRecommend: false,
      frictionNotes: ["Could not find button"],
      dropOffStep: 4,
      dropOffReason: "Checkout button was not visible on 360px viewport",
      screenshotPath: "run-1/p-abandoned-step4.png",
    };

    const clusterMap = new Map([["p-abandoned", 2]]);
    const notes = resultsToFrictionNotes([mockResult], clusterMap);
    expect(notes.length).toBeGreaterThan(0);
    expect(notes[0]?.step).toBe(4);
    expect(notes[0]?.screenshot).toBe("run-1/p-abandoned-step4.png");
    expect(notes[0]?.note).toContain("Checkout button was not visible");
  });

  it("checks baseline control personas and reports suspect site outage if controls fail", () => {
    const controlResult: PersonaResult = {
      id: "r-ctrl",
      runId: "run-1",
      personaId: "00000000-0000-0000-c001-000000000001",
      kind: "url_journey",
      outcome: "failure",
      verdict: {},
      sentiment: -0.9,
      wouldRecommend: false,
      frictionNotes: ["Server 500 error"],
      dropOffStep: 1,
      dropOffReason: "Server 500 error",
      screenshotPath: null,
      isControl: true,
    };

    const res = computeSegments([], [controlResult], {});
    expect(res.baselineControl).toBeDefined();
    expect(res.baselineControl?.allPassed).toBe(false);
    expect(res.baselineControl?.status).toBe("suspect_site_outage");
  });
});
