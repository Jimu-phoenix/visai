const STORAGE_KEY = "vision-ai:device-id";

function makeDeviceId() {
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

let cached = null;

/**
 * Stable identity for this browser/device, persisted in localStorage so the
 * same presence key is reused across sessions and reloads.
 */
export function getDeviceIdentity() {
  if (cached) return cached;

  if (typeof window === "undefined") {
    return { id: makeDeviceId(), name: "This device", kind: "browser" };
  }

  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = makeDeviceId();
    localStorage.setItem(STORAGE_KEY, id);
  }

  cached = { id, name: "This device", kind: "browser" };
  return cached;
}
