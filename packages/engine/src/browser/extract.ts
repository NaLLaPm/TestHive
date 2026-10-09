import type { Page } from "playwright";

export interface InteractiveElement {
  idx: number;
  tag: string;
  text: string;
  role: string;
}

export interface PageState {
  url: string;
  title: string;
  text: string;
  elements: InteractiveElement[];
}

const EXTRACT_SCRIPT = `
(() => {
  const sel = 'a, button, input, select, textarea, [role="button"], [onclick]';
  const nodes = Array.from(document.querySelectorAll(sel)).slice(0, 40);
  return nodes.map((el, idx) => {
    const text = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('value') || '').trim().slice(0, 80);
    const role = el.getAttribute('role') || el.tagName.toLowerCase();
    return { idx, tag: el.tagName.toLowerCase(), text, role };
  });
})();
`;

export async function extractPageState(page: Page): Promise<PageState> {
  const [url, title, text, elements] = await Promise.all([
    page.url(),
    page.title().catch(() => ""),
    page
      .evaluate(() => document.body?.innerText?.slice(0, 4000) ?? "")
      .catch(() => ""),
    page.evaluate(EXTRACT_SCRIPT).catch(() => [] as InteractiveElement[]),
  ]);
  return { url, title, text, elements: elements as InteractiveElement[] };
}
