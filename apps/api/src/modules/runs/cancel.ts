const cancelled = new Set<string>();

export function cancelRun(runId: string): void {
  cancelled.add(runId);
}

export function isCancelled(runId: string): boolean {
  return cancelled.has(runId);
}
