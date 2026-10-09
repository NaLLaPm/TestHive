"use client";

import { useEffect, useRef, useState } from "react";
import { SSEEventSchema, type SSEEvent } from "@testhive/contracts";

export function useSSE(path: string | null) {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!path) return;
    setEvents([]);
    // Relative URL: proxied to the API by the Next.js server (see next.config.mjs).
    const source = new EventSource(path);
    sourceRef.current = source;
    source.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data);
        const result = SSEEventSchema.safeParse(parsed);
        if (result.success) {
          setEvents((prev) => [...prev.slice(-999), result.data]);
        }
      } catch {
        // ignore malformed payloads
      }
    };
    source.onerror = () => {
      // EventSource auto-reconnects; nothing to do.
    };
    return () => {
      source.close();
    };
  }, [path]);

  return events;
}
