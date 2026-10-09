"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@testhive/api-client";
import type { CreateRunRequestSchema, CreatePoolRequestSchema, UpdatePersonaRequestSchema } from "@testhive/contracts";
import type { z } from "zod";

export function usePools() {
  return useQuery({ queryKey: ["pools"], queryFn: api.listPools, refetchInterval: 4000 });
}

export function usePool(poolId: string | undefined) {
  return useQuery({
    queryKey: ["pool", poolId],
    queryFn: () => api.getPool(poolId!),
    enabled: !!poolId,
    refetchInterval: 4000,
  });
}

export function usePersonas(poolId: string | undefined, query = "") {
  return useQuery({
    queryKey: ["personas", poolId, query],
    queryFn: () => api.listPersonas(poolId!, query),
    enabled: !!poolId,
  });
}

export function usePersona(poolId: string | undefined, personaId: string | undefined) {
  return useQuery({
    queryKey: ["persona", poolId, personaId],
    queryFn: () => api.getPersona(poolId!, personaId!),
    enabled: !!poolId && !!personaId,
  });
}

export function useUpdatePersona(poolId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ personaId, body }: { personaId: string; body: z.infer<typeof UpdatePersonaRequestSchema> }) =>
      api.updatePersona(poolId!, personaId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["personas", poolId] });
      qc.invalidateQueries({ queryKey: ["pool", poolId] });
    },
  });
}

export function useGraph(poolId: string | undefined) {
  return useQuery({ queryKey: ["graph", poolId], queryFn: () => api.getGraph(poolId!), enabled: !!poolId });
}

export function useClusters(poolId: string | undefined) {
  return useQuery({ queryKey: ["clusters", poolId], queryFn: () => api.getClusters(poolId!), enabled: !!poolId });
}

export function useCreatePool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: z.infer<typeof CreatePoolRequestSchema>) => api.createPool(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pools"] }),
  });
}

export function useRuns() {
  return useQuery({ queryKey: ["runs"], queryFn: api.listRuns, refetchInterval: 4000 });
}

export function useRun(runId: string | undefined) {
  return useQuery({
    queryKey: ["run", runId],
    queryFn: () => api.getRun(runId!),
    enabled: !!runId,
    refetchInterval: (q) => (q.state.data && ["completed", "failed", "cancelled"].includes(q.state.data.state) ? false : 2000),
  });
}

export function useRunPersonas(runId: string | undefined) {
  return useQuery({
    queryKey: ["run-personas", runId],
    queryFn: () => api.getRunPersonas(runId!),
    enabled: !!runId,
    refetchInterval: 3000,
  });
}

export function useSegments(runId: string | undefined) {
  return useQuery({
    queryKey: ["segments", runId],
    queryFn: () => api.getSegments(runId!),
    enabled: !!runId,
  });
}

export function useIssues(runId: string | undefined) {
  return useQuery({ queryKey: ["issues", runId], queryFn: () => api.getIssues(runId!), enabled: !!runId });
}

export function useSpread(runId: string | undefined) {
  return useQuery({
    queryKey: ["spread", runId],
    queryFn: () => api.getSpread(runId!),
    enabled: !!runId,
    retry: false,
  });
}

export function useReport(runId: string | undefined) {
  return useQuery({
    queryKey: ["report", runId],
    queryFn: () => api.getReport(runId!),
    enabled: !!runId,
    retry: false,
  });
}

export function useCreateRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: z.infer<typeof CreateRunRequestSchema>) => api.createRun(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["runs"] }),
  });
}

export function useTranscript(runId: string | undefined, personaId: string | undefined) {
  return useQuery({
    queryKey: ["transcript", runId, personaId],
    queryFn: () => api.getTranscript(runId!, personaId!),
    enabled: !!runId && !!personaId,
  });
}

export function useDemoRuns() {
  return useQuery({ queryKey: ["demo-runs"], queryFn: api.listDemoRuns });
}
