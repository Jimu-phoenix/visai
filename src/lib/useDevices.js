import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { getDeviceIdentity } from "./deviceIdentity";

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
  presence: {},
  listeners: new Set(),
  devices: [],
};

function toDeviceList(presenceState) {
  const seen = new Set([shared.identity.id]);
  const list = [
    {
      id: shared.identity.id,
      name: shared.identity.name,
      kind: shared.identity.kind,
      online: true,
    },
  ];

  Object.values(presenceState)
    .flat()
    .forEach((p) => {
      if (!p || seen.has(p.id)) return;
      seen.add(p.id);
      list.push({
        id: p.id,
        name: p.name ?? "Unknown device",
        kind: p.kind ?? "browser",
        online: true,
      });
    });

  return list;
}

function refreshDevices() {
  shared.devices = toDeviceList(shared.presence);
  shared.listeners.forEach((listener) => listener(shared.devices));
}

/**
 * Upserts this device into the `devices` table so it's registered (and its
 * friendly name persisted) even when no other device is online.
 */
async function registerDevice() {
  if (!supabase) return;
  try {
    await supabase.from("devices").upsert(
      {
        id: shared.identity.id,
        name: shared.identity.name,
        kind: shared.identity.kind,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  } catch {
    // Non-fatal: the presence channel below still announces this device in realtime.
  }
}

function ensureSubscription() {
  if (shared.channel) return;

  shared.identity = getDeviceIdentity();
  refreshDevices();
  registerDevice();

  const channel = supabase.channel(TOPIC, {
    config: { presence: { key: shared.identity.id } },
  });

  channel
    .on("presence", { event: "sync" }, () => {
      shared.presence = channel.presenceState();
      refreshDevices();
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          id: shared.identity.id,
          name: shared.identity.name,
          kind: shared.identity.kind,
          last_seen: Date.now(),
        });
      }
    });

  shared.channel = channel;
}

/**
 * Realtime device list: the current device (always first) plus every other
 * device that joins the presence channel. When Supabase isn't configured, the
 * current device is still reported so it's always recognized.
 */
export function useDevices() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const identity = getDeviceIdentity();
    const self = { id: identity.id, name: identity.name, kind: identity.kind, online: true };

    if (!supabase) {
      setDevices([self]);
      return;
    }

    ensureSubscription();
    shared.listeners.add(setDevices);
    setDevices(shared.devices.length ? shared.devices : [self]);

    return () => {
      shared.listeners.delete(setDevices);
    };
  }, []);

  return devices;
}
