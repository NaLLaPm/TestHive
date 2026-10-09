import { z } from "zod";
import * as C from "@testhive/contracts";

const HealthSchema = z.object({ status: z.string(), version: z.string().optional() });

function getBaseUrl(): string {
  // Relative by default: the Next.js dev/prod server proxies /api/* to the Fastify
  // backend (see next.config.mjs rewrites), so the browser never needs to know the
  // backend's real host/port. Override only for non-proxied contexts (e.g. scripts).
  if (typeof window !== "undefined") {
    return (window as unknown as { __PF_API_URL__?: string }).__PF_API_URL__ ?? process.env.NEXT_PUBLIC_API_URL ?? "";
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "";
}

async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${path} failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  return schema.parse(json);
}

export const api = {
  health: () => request("/api/health", HealthSchema),

  listPools: () => request("/api/pools", C.ListPoolsResponseSchema),
  createPool: (body: z.infer<typeof C.CreatePoolRequestSchema>) =>
    request("/api/pools", C.CreatePoolResponseSchema, { method: "POST", body: JSON.stringify(body) }),
  getPool: (poolId: string) => request(`/api/pools/${poolId}`, C.GetPoolResponseSchema),
  listPersonas: (poolId: string, query = "") =>
    request(`/api/pools/${poolId}/personas${query}`, C.ListPersonasResponseSchema),
  getPersona: (poolId: string, personaId: string) =>
    request(`/api/pools/${poolId}/personas/${personaId}`, C.GetPersonaResponseSchema),
  updatePersona: (poolId: string, personaId: string, body: z.infer<typeof C.UpdatePersonaRequestSchema>) =>
    request(`/api/pools/${poolId}/personas/${personaId}`, C.UpdatePersonaResponseSchema, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  getGraph: (poolId: string) => request(`/api/pools/${poolId}/graph`, C.GetGraphResponseSchema),
  getClusters: (poolId: string) => request(`/api/pools/${poolId}/clusters`, C.GetClustersResponseSchema),

  createRun: (body: z.infer<typeof C.CreateRunRequestSchema>) =>
    request("/api/runs", C.CreateRunResponseSchema, { method: "POST", body: JSON.stringify(body) }),
  listRuns: () => request("/api/runs", C.ListRunsResponseSchema),
  getRun: (runId: string) => request(`/api/runs/${runId}`, C.GetRunResponseSchema),
  cancelRun: (runId: string) =>
    request(`/api/runs/${runId}/cancel`, C.GetRunResponseSchema, { method: "POST" }),
  getRunPersonas: (runId: string, query = "") =>
    request(`/api/runs/${runId}/personas${query}`, C.ListRunPersonasResponseSchema),
  getNodeStates: (runId: string) => request(`/api/runs/${runId}/node-states`, C.NodeStatesResponseSchema),
  getTranscript: (runId: string, personaId: string) =>
    request(`/api/runs/${runId}/personas/${personaId}/transcript`, C.GetTranscriptResponseSchema),
  getSegments: (runId: string) => request(`/api/runs/${runId}/segments`, C.GetSegmentsResponseSchema),
  getIssues: (runId: string) => request(`/api/runs/${runId}/issues`, C.GetIssuesResponseSchema),
  postSpread: (runId: string, body: z.infer<typeof C.PostSpreadRequestSchema>) =>
    request(`/api/runs/${runId}/spread`, C.GetSpreadResponseSchema, { method: "POST", body: JSON.stringify(body) }),
  getSpread: (runId: string) => request(`/api/runs/${runId}/spread`, C.GetSpreadResponseSchema),
  getReport: (runId: string) => request(`/api/runs/${runId}/report`, C.GetReportResponseSchema),
  getAnalysisGraph: (runId: string) =>
    request(`/api/runs/${runId}/analysis-graph`, C.GetAnalysisGraphResponseSchema),

  listDemoRuns: () => request("/api/demo/runs", C.ListDemoRunsResponseSchema),
  loadDemoRun: (demoId: string) =>
    request(`/api/demo/runs/${demoId}/load`, C.LoadDemoRunResponseSchema, { method: "POST" }),

  streamUrl: (path: string) => `${getBaseUrl()}${path}`,
};
