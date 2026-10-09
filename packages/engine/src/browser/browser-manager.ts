import { chromium, type Browser } from "playwright";
import fs from "node:fs";

let sharedBrowser: Browser | null = null;

export async function getSharedBrowser(): Promise<Browser> {
  if (!sharedBrowser) {
    const launchOpts: Record<string, unknown> = {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    };
    if (process.env.CHROMIUM_PATH) {
      launchOpts.executablePath = process.env.CHROMIUM_PATH;
    } else if (fs.existsSync("/usr/bin/chromium")) {
      launchOpts.executablePath = "/usr/bin/chromium";
    }
    sharedBrowser = await chromium.launch(launchOpts);
  }
  return sharedBrowser;
}

export async function closeSharedBrowser(): Promise<void> {
  if (sharedBrowser) {
    await sharedBrowser.close();
    sharedBrowser = null;
  }
}
