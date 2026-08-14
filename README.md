# Vision AI

A voice- and text-driven AI assistant that can answer where you ask it, or
send the answer to *another* device you're looking at — "show that on the
lounge TV" routes the response elsewhere instead of rendering it in front
of you.

## Concept

Two entry points into the same assistant:

- **Chat** — type a prompt, pick which device the reply should land on.
- **Voice** — hold a conversation hands-free using the browser's built-in
  speech recognition and synthesis, no model to install.

A device rail on the left always shows what's "in view" (online and
reachable right now), fed by a realtime presence channel so new devices
appear the moment they connect.

## Design

The signature element is the aperture mark — a set of iris blades used as
the static logo in the sidebar, and as an animated orb on the Voice page
that spins while listening or thinking. It's a deliberate nod to "Vision":
focusing on a prompt the way a lens focuses on a subject.

- **Palette** — near-black ink background (`#0E1013`) with a warm amber
  focus accent (`#FF8A3D`) for active/primary state, and a cool cyan
  (`#4FD8E0`) reserved for device/network status only, so the two accents
  never compete.
- **Type** — Space Grotesk for headings and labels, IBM Plex Sans for
  body/chat text, IBM Plex Mono for device names, timestamps, and status —
  a utility face that visually separates "data" from "conversation."

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) + React 19 + Tailwind CSS 4 | File-based routes, next/font self-hosted type, CSS-first Tailwind theme |
| Routing | Next.js App Router | Real routes at `app/chat` and `app/voice` instead of a tab state hack |
| Icons | lucide-react | Consistent, lightweight icon set |
| LLM | Groq API (Llama 3.x) | Free tier, very fast inference, OpenAI-compatible schema |
| Backend | Node/Express (or a Vercel/Netlify function) | Holds the Groq API key — the browser never calls Groq directly |
| Voice input | Web Speech API (`SpeechRecognition`) | Built into Chrome/Edge, zero hosting, zero cost |
| Voice output | Web Speech API (`SpeechSynthesis`) | Same — no TTS model to run |
| Multi-device sync | Supabase Realtime (Postgres + presence channels) | Each device announces itself on a shared channel; the assistant's reply is published to whichever device was targeted |

## What's wired up vs. stubbed

This is a **working app shell** you can run today (`npm install && npm run
dev`). The two integrations are implemented and only need real credentials
in a local `.env` file (copy `.env.example`):

1. **Chat/Voice LLM** — `src/app/api/chat/route.js` proxies `{ messages }`
   to Groq's `/openai/v1/chat/completions` using the server-only
   `GROQ_API_KEY`. Until that key is set, the UI falls back to a friendly
   "backend not connected yet" message.
2. **Device presence** — `src/lib/useDevices.js` subscribes to a Supabase
   Realtime presence channel and `src/lib/supabaseClient.js` exposes the
   browser-side client (anon key only). Server-side, authoritative Supabase
   access goes through `src/lib/supabaseAdmin.js` using the secret key.
   Until `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are
   set, the device rail shows the mock list instead.

Everything else — routing, voice capture, the message list, device target
selection, layout — is real, functioning code.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL. Voice input needs Chrome or Edge (Safari and
Firefox don't support `SpeechRecognition` yet).
