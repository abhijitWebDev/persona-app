import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import fs from "node:fs";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

import { getPersona, personaList } from "./personas/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env") });

// Lazily construct the client so the server can still boot (health, personas)
// even when OPENAI_API_KEY is not set. The key is only required for /api/chat.
let _openai;
function getClient() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";
const PORT = process.env.PORT || 8787;

/**
 * Not every model supports JSON mode (response_format: json_object). The
 * original "gpt-4" / "gpt-4-0314" / "gpt-4-0613" snapshots reject it with a
 * 400. Enable it only for models known to support it; other models still
 * return JSON thanks to the persona prompt contract + the parse fallback.
 */
function supportsJsonMode(model) {
  const m = String(model).toLowerCase();
  if (m === "gpt-4" || m === "gpt-4-32k" || /^gpt-4-(0314|0613)$/.test(m)) {
    return false;
  }
  return /gpt-4o|gpt-4\.1|gpt-4-turbo|gpt-4-\d{4}-preview|gpt-3\.5-turbo-(1106|0125)|o1|o3|gpt-5/.test(
    m
  );
}
const USE_JSON_MODE = supportsJsonMode(MODEL);

/**
 * Context management:
 *  - The persona system prompt is ALWAYS pinned as the first message.
 *  - The client sends the recent conversation history; we keep only the last
 *    MAX_TURNS exchanges to stay within the context window and control cost,
 *    while preserving enough history for coherent, context-aware replies.
 */
const MAX_TURNS = 12; // number of most-recent messages (user+assistant) to retain

function buildMessages(persona, history) {
  const trimmed = Array.isArray(history) ? history.slice(-MAX_TURNS) : [];
  const cleaned = trimmed
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
    .map((m) => ({ role: m.role, content: String(m.content) }));

  return [{ role: "system", content: persona.systemPrompt }, ...cleaned];
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: MODEL });
});

// List available personas (metadata only, no prompts leaked)
app.get("/api/personas", (_req, res) => {
  res.json({ personas: personaList });
});

// Main chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { personaId, messages } = req.body ?? {};
    const persona = getPersona(personaId);

    if (!persona) {
      return res.status(400).json({ error: `Unknown persona: ${personaId}` });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res
        .status(500)
        .json({ error: "OPENAI_API_KEY is not set on the server." });
    }

    const chatMessages = buildMessages(persona, messages);

    const completion = await getClient().chat.completions.create({
      model: MODEL,
      messages: chatMessages,
      temperature: 0.8,
      ...(USE_JSON_MODE ? { response_format: { type: "json_object" } } : {}),
    });

    const raw = completion.choices?.[0]?.message?.content ?? "{}";

    // The persona prompt enforces a JSON contract: { reasoning: [...], reply: "..." }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Graceful fallback: if the model didn't return valid JSON, treat the
      // whole thing as the reply so the user still gets an answer.
      parsed = { reasoning: [], reply: raw };
    }

    res.json({
      personaId,
      reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning : [],
      reply: parsed.reply || parsed.text || "Sorry, kuch gadbad ho gayi. Dobara try karein.",
    });
  } catch (err) {
    console.error("[/api/chat] error:", err?.message || err);
    res.status(500).json({ error: "Failed to generate a response." });
  }
});

// In production, serve the built React app from dist/ so the whole thing can
// run on a single host. In dev, Vite serves the frontend and proxies /api.
const distDir = join(__dirname, "..", "dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (_req, res) => res.sendFile(join(distDir, "index.html")));
}

app.listen(PORT, () => {
  console.log(`🚀 Persona-chat server running on http://localhost:${PORT}`);
  console.log(`   Model: ${MODEL}`);
});
