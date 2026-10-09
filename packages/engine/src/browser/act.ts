import type { Page } from "playwright";
import type { DeepAction } from "@testhive/contracts";

const SELECTOR = 'a, button, input, select, textarea, [role="button"], [onclick]';

export async function executeAction(page: Page, action: DeepAction): Promise<void> {
  if (action.action === "click" && action.targetIdx !== null) {
    await page
      .evaluate(
        ({ sel, idx }) => {
          const nodes = Array.from(document.querySelectorAll(sel)).slice(0, 40);
          const el = nodes[idx] as HTMLElement | undefined;
          el?.scrollIntoView({ block: "center" });
          el?.click();
        },
        { sel: SELECTOR, idx: action.targetIdx },
      )
      .catch(() => undefined);
    await page.waitForLoadState("domcontentloaded", { timeout: 4000 }).catch(() => undefined);
    await page.waitForTimeout(300);
  } else if (action.action === "type" && action.targetIdx !== null) {
    await page
      .evaluate(
        ({ sel, idx, text }) => {
          const nodes = Array.from(document.querySelectorAll(sel)).slice(0, 40);
          const el = nodes[idx] as HTMLInputElement | undefined;
          if (el) {
            el.focus();
            el.value = text ?? "";
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
          }
        },
        { sel: SELECTOR, idx: action.targetIdx, text: action.text ?? "" },
      )
      .catch(() => undefined);
    await page.waitForTimeout(150);
  } else if (action.action === "scroll") {
    await page.mouse.wheel(0, 600).catch(() => undefined);
    await page.waitForTimeout(150);
  }
  // 'give_up' and 'done' have no page effect; the loop stops on them.
}
