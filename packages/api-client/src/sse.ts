import { SSEEventSchema, type SSEEvent } from "@testhive/contracts";

export function subscribeSSE(url: string, onEvent: (event: SSEEvent) => void): () => void {
  const source = new EventSource(url);
  source.onmessage = (ev) => {
    try {
      const parsed = JSON.parse(ev.data);
      const result = SSEEventSchema.safeParse(parsed);
      if (result.success) onEvent(result.data);
    } catch {
      // ignore malformed events
    }
  };
  return () => source.close();
}
