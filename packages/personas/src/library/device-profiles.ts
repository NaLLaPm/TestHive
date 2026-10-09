import type { Device, DeviceProfileKey } from "@testhive/contracts";

export interface DeviceProfile {
  key: DeviceProfileKey;
  viewport: { width: number; height: number };
  userAgent: string;
  isMobile: boolean;
  throttle: { downloadKbps: number; uploadKbps: number; latencyMs: number } | null;
}

const PROFILES: Record<DeviceProfileKey, DeviceProfile> = {
  "low-end-android-3g": {
    key: "low-end-android-3g",
    viewport: { width: 360, height: 640 },
    userAgent:
      "Mozilla/5.0 (Linux; Android 9; SM-J260F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0 Mobile Safari/537.36",
    isMobile: true,
    throttle: { downloadKbps: 400, uploadKbps: 150, latencyMs: 400 },
  },
  "mid-android-4g": {
    key: "mid-android-4g",
    viewport: { width: 393, height: 851 },
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36",
    isMobile: true,
    throttle: { downloadKbps: 4000, uploadKbps: 1000, latencyMs: 100 },
  },
  "iphone-wifi": {
    key: "iphone-wifi",
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    isMobile: true,
    throttle: null,
  },
  "laptop-broadband": {
    key: "laptop-broadband",
    viewport: { width: 1366, height: 768 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    isMobile: false,
    throttle: null,
  },
  "tablet-wifi": {
    key: "tablet-wifi",
    viewport: { width: 810, height: 1080 },
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    isMobile: true,
    throttle: null,
  },
};

export function deviceProfileKeyFor(device: Device, connection: string): DeviceProfileKey {
  if (device === "low-end android") return "low-end-android-3g";
  if (device === "mid android") return "mid-android-4g";
  if (device === "iphone") return "iphone-wifi";
  if (device === "tablet") return "tablet-wifi";
  return "laptop-broadband";
}

export function getDeviceProfile(key: DeviceProfileKey): DeviceProfile {
  return PROFILES[key];
}
