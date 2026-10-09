import { EventEmitter } from "node:events";
import type { SSEEvent } from "@testhive/contracts";

const emitters = new Map<string, EventEmitter>();
const history = new Map<string, SSEEvent[]>();
const HISTORY_LIMIT = 500;

function getEmitter(id: string): EventEmitter {
  if (!emitters.has(id)) {
    const e = new EventEmitter();
    e.setMaxListeners(50);
    emitters.set(id, e);
  }
  return emitters.get(id)!;
}

export function emitEvent(id: string, event: SSEEvent): void {
  const list = history.get(id) ?? [];
  list.push(event);
  if (list.length > HISTORY_LIMIT) list.shift();
  history.set(id, list);
  getEmitter(id).emit("event", event);
}

export function subscribe(id: string, cb: (event: SSEEvent) => void): () => void {
  const emitter = getEmitter(id);
  emitter.on("event", cb);
  return () => emitter.off("event", cb);
}

export function getHistory(id: string): SSEEvent[] {
  return history.get(id) ?? [];
}
