# Documentation

This document explains how the two personas were built, the prompt-engineering
strategy, and how conversation context is managed.

---

## 1. How persona data was collected and prepared

Only **publicly available** content was used to study each educator's tone,
vocabulary, and teaching style. No private data was scraped or stored — the
output is a distilled *style profile*, not copied content.

### Sources studied
**Hitesh Choudhary**
- "Chai aur Code" YouTube channel (tutorials, live Q&A, "chai pe charcha" streams)
- ChaiCode cohorts & website (Web Dev, Full Stack, System Design, Next.js)
- Udemy courses
- X/Twitter posts and community interactions

**Piyush Garg**
- YouTube channel (project-based, build-along tutorials)
- piyushgarg.dev courses/cohorts (Full Stack, Next.js, GenAI, Docker, System Design)
- X/Twitter posts and developer threads

### What was extracted and how it was prepared
For each person we captured four dimensions and encoded them directly into the
system prompt (`server/personas/*.js`):

| Dimension | Hitesh | Piyush |
|---|---|---|
| **Signature openers / phrases** | "Haanji", "kaise hain aap sabhi", "chai le lijiye", "dekhiye simple si baat hai" | "Hey everyone", "chalo build karte hain", "basically dekho", "production-grade" |
| **Language register** | Warm Hinglish, mentor / elder-brother tone | Casual Hinglish, energetic peer-engineer tone |
| **Teaching approach** | Fundamentals-first, real-life/chai analogies, motivation & consistency | Project-first, hands-on, under-the-hood + real-world architecture |
| **Domain & brand** | ChaiCode, courses, industry/career framing | piyushgarg.dev, modern stacks, GenAI/Docker/system design |

These profiles were hand-authored from observed patterns and kept in **separate,
importable files** so each persona is independently maintainable.

---

## 2. Prompt-engineering strategy

### a. Separate persona modules
`hitesh.js` and `piyush.js` each export a `systemPrompt` plus lightweight
metadata. `personas/index.js` registers them. This keeps the two voices fully
isolated and makes adding a third persona trivial.

### b. Layered system prompt
Each prompt is structured in clear sections:
1. **Identity** — "You are Hitesh/Piyush… stay in character, you are not an AI."
2. **Signature voice** — concrete phrases and register (the strongest signal for
   persona accuracy).
3. **Teaching approach** — how they explain, what they emphasise.
4. **Chain-of-Thought contract** — an internal reasoning pipeline.
5. **Strict output format** — JSON contract.
6. **Rules / guardrails** — never break character, stay on-topic.

### c. Chain-of-Thought (CoT)
The model reasons through an explicit pipeline before answering:
`INITIAL → THINK → ANALYZE → THINK → OUTPUT`.
This mirrors the reasoning approach requested for the project and improves answer
quality and consistency, while keeping the reasoning *separate* from the final
in-character reply.

The model returns a strict JSON object:
```json
{
  "reasoning": ["INITIAL: ...", "THINK: ...", "ANALYZE: ...", "THINK: ...", "OUTPUT: ..."],
  "reply": "final answer in the persona's voice (markdown)"
}
```
- `reply` is rendered as the chat message (with markdown/code).
- `reasoning` is tucked into an expandable "Chain of thought" section so the UI
  stays clean but the CoT is fully inspectable.

We enforce the JSON with OpenAI's `response_format: { type: "json_object" }`,
and the server has a graceful fallback if parsing ever fails.

### d. Temperature
`temperature: 0.8` — high enough for lively, natural Hinglish personality, low
enough to stay coherent and technically correct.

---

## 3. Context-management approach

Context is handled on both the client and the server:

**Client (`src/App.jsx`)**
- Maintains a **separate message thread per persona** (`threads[personaId]`), so
  switching personas never bleeds one voice into another and each conversation
  keeps its own history.
- Sends the full visible thread for the active persona on each request.

**Server (`server/index.js`)**
- **Pins the persona system prompt** as the first message on every call, so the
  persona is reinforced even in long conversations.
- **Trims history to the last `MAX_TURNS` (12) messages** before sending to the
  model. This keeps requests within the context window and controls cost while
  preserving enough recent history for context-aware, coherent replies.
- Filters to valid `user`/`assistant` turns only.

This combination gives context-aware answers and **persona consistency across
long conversations** — the two core goals of the Conversation Quality criteria.

---

## 4. Technical implementation summary

- **Frontend:** React + Vite. Components: `PersonaSwitcher`, `Message`
  (markdown + CoT toggle), `ChatInput`. Per-persona threads in state.
- **Backend:** Express. Endpoints: `/api/personas` (metadata only, no prompts
  leaked), `/api/chat` (builds messages, calls OpenAI, returns `{reasoning, reply}`).
- **LLM:** OpenAI Chat Completions (`gpt-4o` by default), JSON-mode output.
- **Security:** API key lives only in server env vars; the frontend never sees it.
