import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/chat
 * Body: { messages: [{ role, content }] }
 * The Meta API key stays on the server — the browser never sees it.
 * Returns: { content }
 */
export async function POST(request) {
  let messages;
  try {
    ({ messages } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages array required" }, { status: 400 });
  }

  const apiKey = process.env.META_MUSE_GLIMMER_30b;
  if (!apiKey) {
    return NextResponse.json(
      { error: "META_MUSE_GLIMMER_30b is not configured on the server" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta/muse-glimmer-30b",
        messages,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        { error: `Meta API error ${res.status}: ${body}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ content: data.choices?.[0]?.message?.content ?? "" });
  } catch {
    return NextResponse.json({ error: "Meta API request failed" }, { status: 500 });
  }
}
