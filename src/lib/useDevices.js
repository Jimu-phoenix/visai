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
 */
const shared = {
  channel: null,
  init: null,
  identity: null,
  presence: {},
  dbDevices: [],
  listeners: new Set(),
  devices: [],
};

function onlineIds() {
  return new Set(Object.values(shared.presence).flat().map((p) => p?.id));
}

/**
 * Merges three sources:
 *   - the current device (always first, always online)
 *   - every registered device from the DB (offline unless currently present)
 *   - any presence entries that aren't in the DB yet (e.g. raced the select)
 */
function toDeviceList() {
  const online = onlineIds();
  const seen = new Set([shared.identity.id]);

  const list = [
    {
      id: shared.identity.id,
      name: shared.identity.name,
      kind: shared.identity.kind,
      online: true,
    },
  ];

  shared.dbDevices.forEach((d) => {
    if (seen.has(d.id)) return;
    seen.add(d.id);
    list.push({
      id: d.id,
      name: d.name ?? "Unknown device",
      kind: d.kind ?? "browser",
      online: online.has(d.id),
    });
  });

  Object.values(shared.presence)
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
  shared.devices = toDeviceList();
  shared.listeners.forEach((listener) => listener(shared.devices));
}

/** Persists this device in the `devices` table so it's kept across sessions. */
async function registerDevice() {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("devices").upsert(
      {
        id: shared.identity.id,
        name: shared.identity.name,
        kind: shared.identity.kind,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (error) throw error;
  } catch {
    // Non-fatal: presence below still announces this device in realtime.
  }
}

/** Pulls every registered device so all devices are visible to each other. */
async function loadRegisteredDevices() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase
      .from("devices")
      .select("id, name, kind, last_seen_at");
    if (!error && data) {
      shared.dbDevices = data;
      refreshDevices();
    }
  } catch {
    // Non-fatal.
  }
}

function ensureSubscription() {
  if (shared.channel || shared.init) return;

  shared.init = (async () => {
    shared.identity = getDeviceIdentity();
    refreshDevices();

    // Check existing devices first, register this one, then announce itself.
    await registerDevice();
    await loadRegisteredDevices();

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
  })();
}

/**
 * Realtime device list: the current device (always first) plus every device in
 * the `devices` table, with online/offline state driven by the presence
 * channel. When Supabase isn't configured, the current device is still
 * reported so it's always recognized.
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
