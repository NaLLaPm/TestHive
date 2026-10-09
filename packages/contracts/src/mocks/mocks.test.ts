import { describe, it, expect } from "vitest";
import { PersonaPoolSchema } from "../domain/pool.js";
import { PersonaSchema } from "../domain/persona.js";
import { GraphPayloadSchema } from "../domain/graph.js";
import { RunSchema } from "../domain/run.js";
import { SegmentsResponseSchema } from "../domain/segment.js";
import { IssueSchema } from "../domain/issue.js";
import { SpreadResultSchema } from "../domain/spread.js";
import { ReportSchema } from "../domain/report.js";
import * as mocks from "./index.js";

describe("mocks are schema-valid", () => {
  it("pool", () => expect(PersonaPoolSchema.parse(mocks.mockPool)).toBeTruthy());
  it("persona", () => expect(PersonaSchema.parse(mocks.mockPersona)).toBeTruthy());
  it("graph", () => expect(GraphPayloadSchema.parse(mocks.mockGraph)).toBeTruthy());
  it("run", () => expect(RunSchema.parse(mocks.mockRun)).toBeTruthy());
  it("segments", () => expect(SegmentsResponseSchema.parse(mocks.mockSegments)).toBeTruthy());
  it("issue", () => expect(IssueSchema.parse(mocks.mockIssue)).toBeTruthy());
  it("spread", () => expect(SpreadResultSchema.parse(mocks.mockSpread)).toBeTruthy());
  it("report", () => expect(ReportSchema.parse(mocks.mockReport)).toBeTruthy());
});
