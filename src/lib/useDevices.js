import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { getDeviceIdentity } from "./deviceIdentity";

const THIS_DEVICE = { id: "this", name: "This device", kind: "browser", online: true };

// Fallback list used only when Supabase isn't configured yet.
const MOCK_DEVICES = [
  THIS_DEVICE,
  { id: "tv-lounge", name: "Lounge TV", kind: "display", online: true },
  { id: "desk-monitor", name: "Desk monitor", kind: "display", online: false },
];

const TOPIC = "vision-ai-devices";

/**
 * supabase.channel() returns the SAME channel instance once a topic exists, and
 * calling .on("presence", ...) on an already-joined channel throws
 * `cannot add `presence` callbacks ... after subscribe()`. Several components
 * (Sidebar, Chat, Voice) mount useDevices() at once, so share a single realtime
 * subscription at module level and fan updates out to every live listener.
 * The channel is kept for the page's lifetime so StrictMode remounts never race
 * an in-flight unsubscribe.
 */
const shared = {
  channel: null,
  identity: null,
  listeners: new Set(),
  devices: MOCK_DEVICES,
};

function toDeviceList(presenceState) {
  const others = Object.values(presenceState)
    .flat()
    .filter((p) => p.id !== shared.identity.id)
    .map((p) => ({
      id: p.id,
      name: p.name,
      kind: p.kind ?? "browser",
      online: true,
    }));
  return [THIS_DEVICE, ...others];
}

function ensureSubscription() {
  if (shared.channel) return;

  const identity = getDeviceIdentity();
  shared.identity = identity;

  const channel = supabase.channel(TOPIC, {
    config: { presence: { key: identity.id } },
  });

  channel
    .on("presence", { event: "sync" }, () => {
      shared.devices = toDeviceList(channel.presenceState());
      shared.listeners.forEach((listener) => listener(shared.devices));
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          id: identity.id,
          name: identity.name,
          kind: identity.kind,
          last_seen: Date.now(),
        });
      }
    });

  shared.channel = channel;
}

/**
 * Reads the realtime presence channel so devices appear/disappear as they
 * connect. Falls back to the mock list when NEXT_PUBLIC_SUPABASE_* aren't set.
 */
export function useDevices() {
  const [devices, setDevices] = useState(MOCK_DEVICES);

  useEffect(() => {
    if (!supabase) return;

    ensureSubscription();
    shared.listeners.add(setDevices);
    setDevices(shared.devices);

    return () => {
      shared.listeners.delete(setDevices);
    };
  }, []);

  return devices;
}
