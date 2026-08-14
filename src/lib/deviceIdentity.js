const STORAGE_KEY = "vision-ai:device-id";
const META_KEY = "vision-ai:device-meta";

function makeDeviceId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isValidUuid(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

function detectDevice() {
  if (typeof window === "undefined") {
    return { name: "Vis-default", kind: "browser" };
  }
  const small = window.matchMedia?.("(max-width: 767px)").matches;
  const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  if (touch && small) return { name: "Vis-mobile", kind: "mobile" };
  if (touch) return { name: "Vis-tablet", kind: "tablet" };
  return { name: "Vis-default", kind: "browser" };
}

let cached = null;

/**
 * Stable identity for this browser/device, persisted in localStorage so the
 * same id is reused across sessions. The name/kind are detected once and
 * stored so e.g. a phone doesn't flip between Vis-mobile and Vis-default
 * across reloads.
 */
export function getDeviceIdentity() {
  if (cached) return cached;

  if (typeof window === "undefined") {
    return { id: makeDeviceId(), name: "Vis-default", kind: "browser" };
  }

  let id = localStorage.getItem(STORAGE_KEY);
  if (!id || !isValidUuid(id)) {
    id = makeDeviceId();
    localStorage.setItem(STORAGE_KEY, id);
  }

  let meta = null;
  try {
    meta = JSON.parse(localStorage.getItem(META_KEY));
  } catch {
    meta = null;
  }
  if (!meta || typeof meta.name !== "string" || typeof meta.kind !== "string") {
    meta = detectDevice();
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  }

  cached = { id, ...meta };
  return cached;
}
