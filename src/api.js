const BASE = import.meta.env.VITE_API_BASE || "";

export async function fetchPersonas() {
  const res = await fetch(`${BASE}/api/personas`);
  if (!res.ok) throw new Error("Failed to load personas");
  const data = await res.json();
  return data.personas;
}

/**
 * Send the conversation to the backend.
 * @param {string} personaId
 * @param {Array<{role:'user'|'assistant', content:string}>} messages
 * @returns {Promise<{reply:string, reasoning:string[]}>}
 */
export async function sendChat(personaId, messages) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ personaId, messages }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Chat request failed");
  }
  return res.json();
}
