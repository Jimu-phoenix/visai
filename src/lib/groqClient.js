// The browser never talks to Groq directly (that would expose the API key).
// Instead this hits your own backend, which holds the key and proxies to
// https://api.groq.com/openai/v1/chat/completions.
//
// TODO: point BACKEND_URL at your Express/serverless endpoint once it exists.
const BACKEND_URL = "/api/chat";

/**
 * @param {{role: "user"|"assistant"|"system", content: string}[]} messages
 * @returns {Promise<{content: string, target_device?: string, action?: string}>}
 */
export async function sendMessage(messages, extra = {}) {
  const res = await fetch(BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, ...extra }),
  });

  if (!res.ok) {
    throw new Error(`Backend error: ${res.status}`);
  }

  return res.json();
}
