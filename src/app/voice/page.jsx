"use client";

import { useCallback, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import ApertureMark from "@/components/ApertureMark";
import DeviceChip from "@/components/DeviceChip";
import { useDevices } from "@/lib/useDevices";
import { useSpeech } from "@/lib/useSpeech";
import { sendMessage } from "@/lib/groqClient";

export default function VoicePage() {
  const [target, setTarget] = useState("this");
  const [lastReply, setLastReply] = useState("");
  const [thinking, setThinking] = useState(false);
  const devices = useDevices();

  const handleFinalResult = useCallback(async (transcript) => {
    if (!transcript) return;
    setThinking(true);
    try {
      const reply = await sendMessage([{ role: "user", content: transcript }]);
      setLastReply(reply.content);
      speak(reply.content);
    } catch {
      setLastReply("Backend isn't wired up yet — connect /api/chat to Groq for real replies.");
    } finally {
      setThinking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { supported, listening, interimTranscript, error, start, stop, speak } = useSpeech({
    onFinalResult: handleFinalResult,
  });

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-hairline px-6 py-4">
        <h1 className="font-display text-base font-semibold text-paper">Voice</h1>
        <p className="text-xs text-muted">Speak a prompt, hear the answer back</p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
        <button
          onClick={listening ? stop : start}
          disabled={!supported}
          className="relative flex h-40 w-40 items-center justify-center rounded-full transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={listening ? "Stop listening" : "Start listening"}
        >
          {listening && (
            <span className="absolute inset-0 animate-iris-pulse rounded-full bg-amber/20" />
          )}
          <span className="absolute inset-3 rounded-full border border-hairline" />
          <ApertureMark
            size={96}
            spin={listening || thinking}
            className={listening ? "text-amber" : "text-muted"}
          />
          <span className="sr-only">Toggle microphone</span>
          <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-panel2">
            {listening ? <Mic size={14} className="text-amber" /> : <MicOff size={14} className="text-muted" />}
          </span>
        </button>

        <div className="min-h-[3rem] max-w-md text-center">
          {!supported && (
            <p className="font-mono text-xs text-muted">
              This browser doesn't support the Web Speech API — try Chrome or Edge.
            </p>
          )}
          {supported && (interimTranscript || listening) && (
            <p className="text-sm text-muted">{interimTranscript || "Listening…"}</p>
          )}
          {supported && !listening && !interimTranscript && error && (
            <p className="text-sm text-amber">{error}</p>
          )}
          {supported && !listening && !interimTranscript && !error && lastReply && (
            <p className="text-sm text-paper">{lastReply}</p>
          )}
        </div>
      </div>

      <div className="border-t border-hairline px-6 py-4">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted">
          Speak, route reply to
        </p>
        <div className="flex flex-wrap gap-2">
          {devices.map((d) => (
            <DeviceChip key={d.id} device={d} active={target === d.id} onClick={() => setTarget(d.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
