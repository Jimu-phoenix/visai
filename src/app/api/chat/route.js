import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

/**
 * POST /api/chat
 * Body: {
 *   messages: [{ role, content }],
 *   source_device_id?: string,
 *   source_device_name?: string,
 *   target_device_id?: string,
 *   target_device_name?: string,
 * }
 * The Meta API key stays on the server — the browser never sees it.
 * When a target_device_id is given and it isn't the requester, the reply is
 * persisted so the target device renders it in real time.
 * Returns: { content }
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    messages,
    source_device_id,
    source_device_name,
    target_device_id,
    target_device_name,
  } = body ?? {};

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

  let content = "";
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
      const bodyText = await res.text();
      return NextResponse.json(
        { error: `Meta API error ${res.status}: ${bodyText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    content = data.choices?.[0]?.message?.content ?? "";
  } catch {
    return NextResponse.json({ error: "Meta API request failed" }, { status: 500 });
  }

  // Route the reply: if a target device was selected and it isn't the
  // requester, persist the reply so the target renders it in real time.
  if (target_device_id && target_device_id !== source_device_id) {
    await persistRoutedReply({
      target_device_id,
      target_device_name,
      content,
    });
  }

  return NextResponse.json({ content });
}

/**
 * Best-effort persistence of a routed reply. Creates (or reuses) the target
 * device's conversation and inserts the assistant message. Realtime on the
 * `messages` table streams the insert to the target device's browser.
 */
async function persistRoutedReply({ target_device_id, target_device_name, content }) {
  if (!supabaseAdmin || !content) return;

  try {
    const { data: conversation } = await supabaseAdmin
      .from("conversations")
      .select("id")
      .eq("device_id", target_device_id)
      .limit(1)
      .maybeSingle();

    if (!conversation) {
      const { data: created } = await supabaseAdmin
        .from("conversations")
        .insert({
          device_id: target_device_id,
          title: target_device_name ? `Messages for ${target_device_name}` : "Messages",
        })
        .select("id")
        .single();
      if (!created) return;
      await supabaseAdmin.from("messages").insert({
        conversation_id: created.id,
        role: "assistant",
        content,
        target_device_id,
      });
      return;
    }

    await supabaseAdmin.from("messages").insert({
      conversation_id: conversation.id,
      role: "assistant",
      content,
      target_device_id,
    });
  } catch {
    // Persistence is best-effort; the reply is still returned to the requester.
  }
}
