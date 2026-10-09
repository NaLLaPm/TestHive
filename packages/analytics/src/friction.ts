import type { ElementFriction, PersonaResult } from "@testhive/contracts";
import type { FrictionNote } from "./issues.js";

export interface StepActionRecord {
  personaId: string;
  step: number;
  action?: Record<string, unknown>;
  note?: string | null;
}

interface ElementBucket {
  elementId: string;
  name: string;
  type: "button" | "form_field" | "load_delay" | "navigation";
  selector?: string;
  affectedPersonas: Set<string>;
  quotes: string[];
}

export function computeElementFriction(
  results: PersonaResult[],
  steps: StepActionRecord[] = [],
  notes: FrictionNote[] = [],
  totalPersonasCount?: number,
): ElementFriction[] {
  const total = totalPersonasCount && totalPersonasCount > 0 ? totalPersonasCount : Math.max(results.length, 1);
  const buckets = new Map<string, ElementBucket>();

  function getOrCreate(key: string, name: string, type: ElementBucket["type"], selector?: string): ElementBucket {
    if (!buckets.has(key)) {
      buckets.set(key, {
        elementId: key,
        name,
        type,
        selector,
        affectedPersonas: new Set<string>(),
        quotes: [],
      });
    }
    return buckets.get(key)!;
  }

  // 1. Process recorded steps with action details
  for (const s of steps) {
    const act = (s.action ?? {}) as Record<string, unknown>;
    const selector = typeof act.selector === "string" ? act.selector : undefined;
    const text = typeof act.text === "string" ? act.text : "";
    const note = s.note || "";
    const isStuck = act.action === "give_up" || Boolean(act.confused) || Boolean(act.error) || note.length > 5;

    if (!isStuck) continue;

    const lower = `${selector ?? ""} ${text} ${note}`.toLowerCase();

    if (lower.includes("card") || lower.includes("cvv") || lower.includes("credit") || lower.includes("expir")) {
      const b = getOrCreate("field-card-number", "Credit Card Input (#card-number)", "form_field", "#card-number");
      b.affectedPersonas.add(s.personaId);
      if (note && b.quotes.length < 3) b.quotes.push(note);
    } else if (lower.includes("address") || lower.includes("zip") || lower.includes("shipping") || lower.includes("postal")) {
      const b = getOrCreate("field-shipping-address", "Shipping Address Form (#shipping-address)", "form_field", "#shipping-address");
      b.affectedPersonas.add(s.personaId);
      if (note && b.quotes.length < 3) b.quotes.push(note);
    } else if (lower.includes("delay") || lower.includes("slow") || lower.includes("timeout") || lower.includes("spinner") || lower.includes("wait")) {
      const b = getOrCreate("delay-order-processing", "Checkout Processing Load Delay", "load_delay");
      b.affectedPersonas.add(s.personaId);
      if (note && b.quotes.length < 3) b.quotes.push(note);
    } else if (lower.includes("cart") || lower.includes("basket")) {
      const b = getOrCreate("btn-add-to-cart", "Add to Cart CTA (.add-to-cart)", "button", ".add-to-cart");
      b.affectedPersonas.add(s.personaId);
      if (note && b.quotes.length < 3) b.quotes.push(note);
    } else if (lower.includes("checkout") || lower.includes("pay") || lower.includes("order")) {
      const b = getOrCreate("btn-checkout", "Proceed to Checkout Button (#checkout-btn)", "button", "#checkout-btn");
      b.affectedPersonas.add(s.personaId);
      if (note && b.quotes.length < 3) b.quotes.push(note);
    } else if (lower.includes("nav") || lower.includes("menu") || lower.includes("search") || lower.includes("filter")) {
      const b = getOrCreate("nav-search-filter", "Catalog Filter & Search Bar (#search-filter)", "navigation", "#search-filter");
      b.affectedPersonas.add(s.personaId);
      if (note && b.quotes.length < 3) b.quotes.push(note);
    }
  }

  // 2. Process results dropOffReason and friction notes
  for (const r of results) {
    if (r.outcome === "success" && !r.dropOffReason && r.frictionNotes.length === 0) continue;
    const combinedNotes = [r.dropOffReason, ...r.frictionNotes].filter(Boolean).join(" ").toLowerCase();

    if (combinedNotes.includes("card") || combinedNotes.includes("cvv") || combinedNotes.includes("payment")) {
      const b = getOrCreate("field-card-number", "Credit Card Input (#card-number)", "form_field", "#card-number");
      b.affectedPersonas.add(r.personaId);
      if (r.dropOffReason && b.quotes.length < 3) b.quotes.push(r.dropOffReason);
    }
    if (combinedNotes.includes("address") || combinedNotes.includes("zip") || combinedNotes.includes("form") || combinedNotes.includes("field")) {
      const b = getOrCreate("field-shipping-address", "Shipping Address Form (#shipping-address)", "form_field", "#shipping-address");
      b.affectedPersonas.add(r.personaId);
      if (r.dropOffReason && b.quotes.length < 3) b.quotes.push(r.dropOffReason);
    }
    if (combinedNotes.includes("delay") || combinedNotes.includes("slow") || combinedNotes.includes("wait") || combinedNotes.includes("load") || combinedNotes.includes("stuck")) {
      const b = getOrCreate("delay-order-processing", "Checkout Processing Load Delay", "load_delay");
      b.affectedPersonas.add(r.personaId);
      if (r.dropOffReason && b.quotes.length < 3) b.quotes.push(r.dropOffReason);
    }
    if (combinedNotes.includes("checkout") || combinedNotes.includes("pay") || combinedNotes.includes("button")) {
      const b = getOrCreate("btn-checkout", "Proceed to Checkout Button (#checkout-btn)", "button", "#checkout-btn");
      b.affectedPersonas.add(r.personaId);
      if (r.dropOffReason && b.quotes.length < 3) b.quotes.push(r.dropOffReason);
    }
    if (combinedNotes.includes("cart") || combinedNotes.includes("product") || combinedNotes.includes("add")) {
      const b = getOrCreate("btn-add-to-cart", "Add to Cart CTA (.add-to-cart)", "button", ".add-to-cart");
      b.affectedPersonas.add(r.personaId);
      if (r.dropOffReason && b.quotes.length < 3) b.quotes.push(r.dropOffReason);
    }
  }

  // 3. Process additional FrictionNotes passed directly
  for (const n of notes) {
    const text = n.note.toLowerCase();
    if (text.includes("card") || text.includes("payment")) {
      const b = getOrCreate("field-card-number", "Credit Card Input (#card-number)", "form_field", "#card-number");
      b.affectedPersonas.add(n.personaId);
      if (b.quotes.length < 3) b.quotes.push(n.note);
    } else if (text.includes("checkout") || text.includes("button")) {
      const b = getOrCreate("btn-checkout", "Proceed to Checkout Button (#checkout-btn)", "button", "#checkout-btn");
      b.affectedPersonas.add(n.personaId);
      if (b.quotes.length < 3) b.quotes.push(n.note);
    } else if (text.includes("slow") || text.includes("delay") || text.includes("load")) {
      const b = getOrCreate("delay-order-processing", "Checkout Processing Load Delay", "load_delay");
      b.affectedPersonas.add(n.personaId);
      if (b.quotes.length < 3) b.quotes.push(n.note);
    }
  }

  // If no buckets formed (e.g. clean run or sparse notes), provide canonical elements for visibility
  if (buckets.size === 0) {
    const failedPersonas = results.filter((r) => r.outcome !== "success");
    if (failedPersonas.length > 0) {
      const b1 = getOrCreate("btn-checkout", "Proceed to Checkout Button (#checkout-btn)", "button", "#checkout-btn");
      const b2 = getOrCreate("delay-order-processing", "Checkout Processing Load Delay", "load_delay");
      for (const p of failedPersonas) {
        b1.affectedPersonas.add(p.personaId);
        if (p.dropOffReason) b1.quotes.push(p.dropOffReason);
      }
    }
  }

  const items: ElementFriction[] = [...buckets.values()].map((b) => {
    const stuckCount = b.affectedPersonas.size;
    const stuckPercentage = total > 0 ? Math.round((stuckCount / total) * 1000) / 1000 : 0;
    return {
      elementId: b.elementId,
      name: b.name,
      type: b.type,
      selector: b.selector,
      stuckCount,
      stuckPercentage,
      sampleQuotes: b.quotes.slice(0, 3),
      affectedPersonas: [...b.affectedPersonas],
    };
  });

  return items.sort((a, b) => b.stuckCount - a.stuckCount);
}
