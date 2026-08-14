import { useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import { getDeviceIdentity } from "./deviceIdentity";

/**
 * Subscribes to `messages` inserted for THIS device (via target_device_id) and
 * fires onMessage for each one, so routed replies render in real time. Each
 * hook instance gets its own channel topic so overlapping subscriptions never
 * conflict, and the channel is torn down on unmount.
 */
export function useRealtimeMessages({ onMessage }) {
  const topicRef = useRef(null);

  useEffect(() => {
    if (!supabase) return;
    const identity = getDeviceIdentity();
    if (!identity) return;

    if (!topicRef.current) {
      topicRef.current = `vision-ai-messages:${identity.id}:${Math.random()
        .toString(36)
        .slice(2, 10)}`;
    }

    const channel = supabase
      .channel(topicRef.current)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `target_device_id=eq.${identity.id}`,
        },
        (payload) => {
          onMessage?.(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onMessage]);
}
