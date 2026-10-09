import type { RunKind } from "@testhive/contracts";
import type { Tester } from "../types.js";
import { urlLightTester } from "./url-light.js";
import { urlDeepTester } from "./url-deep.js";
import { surveyLightTester } from "./survey-light.js";

const REGISTRY: Record<string, { light?: Tester; deep?: Tester }> = {
  url_journey: { light: urlLightTester, deep: urlDeepTester },
  survey: { light: surveyLightTester },
};

export function getTester(kind: RunKind, mode: "deep" | "light"): Tester | undefined {
  return REGISTRY[kind]?.[mode];
}
