"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import MessageBubble from "@/components/MessageBubble";
import DeviceChip from "@/components/DeviceChip";
import { useDevices } from "@/lib/useDevices";
import { useRealtimeMessages } from "@/lib/useRealtimeMessages";
import { getDeviceIdentity } from "@/lib/deviceIdentity";
import { sendMessage } from "@/lib/groqClient";

const WELCOME = {
  role: "assistant",
  content:
    "I'm Vision AI. Ask me something, or tell me which device to send the answer to.",
};

export default function ChatPage() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [target, setTarget] = useState(null);
  const [pending, setPending] = useState(false);
  const scrollRef = useRef(null);
  const devices = useDevices();

  useEffect(() => {
    if (target === null && devices.length > 0) {
      setTarget(devices[0].id);
    }
  }, [devices, target]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const onIncomingMessage = useCallback((msg) => {
    if (msg.role === "assistant" && msg.target_device_id === getDeviceIdentity().id) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: msg.content, targetDevice: null },
      ]);
    }
  }, []);

  useRealtimeMessages({ onMessage: onIncomingMessage });

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending) return;

    const identity = getDeviceIdentity();
    const effectiveTarget = target ?? identity.id;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setPending(true);

    try {
      const reply = await sendMessage(
        nextMessages.map(({ role, content }) => ({ role, content })),
        {
          source_device_id: identity.id,
          source_device_name: identity.name,
          target_device_id: effectiveTarget,
          target_device_name: devices.find((d) => d.id === effectiveTarget)?.name ?? null,
        }
      );
      const routedTo =
        effectiveTarget !== identity.id
          ? devices.find((d) => d.id === effectiveTarget)?.name ?? null
          : null;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply.content, targetDevice: routedTo },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Backend isn't wired up yet (this is a UI scaffold) — connect /api/chat to Groq to get real replies.",
          targetDevice: null,
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-hairline px-4 py-3 md:px-6 md:py-4">
        <div>
          <h1 className="font-display text-base font-semibold text-paper">Chat</h1>
          <p className="text-xs text-muted">Ask anything, route replies to any device in view</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} targetDevice={m.targetDevice} />
        ))}
        {pending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl bg-panel2 px-4 py-3">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-hairline px-4 py-3 md:px-6 md:py-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {devices.map((d) => (
            <DeviceChip key={d.id} device={d} active={target === d.id} onClick={() => setTarget(d.id)} />
          ))}
        </div>

        <form onSubmit={handleSend} className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            rows={1}
            placeholder="Message Vision AI…"
            className="max-h-40 flex-1 resize-none rounded-xl border border-hairline bg-panel2 px-4 py-3 text-sm text-paper placeholder:text-muted focus:border-amber"
          />
          <button
            type="submit"
            disabled={!input.trim() || pending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber text-ink transition-opacity disabled:opacity-30"
            aria-label="Send message"
          >
            <ArrowUp size={18} strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </div>
  );
}
