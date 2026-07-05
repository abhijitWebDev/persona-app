# ☕ Persona Chat — Hitesh Choudhary & Piyush Garg

**🌐 Live:** [persona.abhijitmone.com](https://persona.abhijitmone.com)

An AI-powered chat app that simulates conversations with two well-known Indian
tech educators — **Hitesh Choudhary** (Chai aur Code / ChaiCode) and
**Piyush Garg** (piyushgarg.dev). Each persona replies in its own voice,
vocabulary, and teaching style, using a **Chain-of-Thought** prompting strategy.

- 🔁 Switch between personas instantly (separate chat thread per persona)
- 🧠 Chain-of-Thought reasoning (expandable "Chain of thought" under each reply)
- 🎨 Clean, responsive chat UI with markdown + code formatting
- 🔒 API key stays on the server — safe to deploy publicly

---

## 🏗️ Architecture

```
persona-chat/
├── server/
│   ├── index.js              # Express API — holds the OpenAI key, /api/chat
│   └── personas/
│       ├── hitesh.js         # Hitesh persona (voice + CoT prompt)
│       ├── piyush.js         # Piyush persona (voice + CoT prompt)
│       └── index.js          # Persona registry + safe metadata for the UI
├── src/                      # React (Vite) frontend
│   ├── App.jsx               # State, per-persona threads, context handling
│   ├── api.js                # Calls to the backend
│   └── components/           # PersonaSwitcher, Message, ChatInput
├── docs/
│   ├── DOCUMENTATION.md      # Data collection, prompt eng., context mgmt
│   └── SAMPLE_CONVERSATIONS.md
├── .env.example
└── package.json
```

**Why a backend?** Calling OpenAI from the browser would expose the API key in
the frontend bundle. The Express layer keeps the key in server-side env vars and
imports the persona files, so the deployed site is safe.

---

## 🚀 Setup & Run

### 1. Prerequisites
- Node.js 18+
- An OpenAI API key

### 2. Install
```bash
cd persona-chat
npm install
```

### 3. Configure
```bash
cp .env.example .env
# edit .env and set OPENAI_API_KEY=sk-...
```

### 4. Run (dev — frontend + backend together)
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend:  http://localhost:8787

Vite proxies `/api/*` to the backend automatically, so just open the frontend URL.

### 5. Production build
```bash
npm run build      # builds the React app into dist/
npm start          # runs the API server
```
Serve `dist/` from any static host and point it at the API (see Deployment).

---

## ☁️ Deployment

**Recommended split:**
- **Backend** (`server/`) → Render / Railway / Fly.io as a Node web service.
  Set env var `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`, `PORT`).
- **Frontend** (`dist/`) → Vercel / Netlify. Set `VITE_API_BASE` to your
  deployed backend URL so the app calls the right API.

Or deploy both together on a single Node host (serve `dist/` via Express).

---

## 📚 Documentation

- [`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md) — persona data collection &
  preparation, prompt-engineering strategy, and context-management approach.
- [`docs/SAMPLE_CONVERSATIONS.md`](docs/SAMPLE_CONVERSATIONS.md) — example chats
  demonstrating both personas.

---

## 🧩 How personas work

Each persona is a plain JS module (`server/personas/hitesh.js`,
`server/personas/piyush.js`) exporting metadata + a `systemPrompt`. The prompt:

1. Fixes **identity** (who they are, their brand, courses).
2. Encodes **signature voice** ("Haanji, kaise hain aap sabhi" for Hitesh;
   "Hey everyone, chalo build karte hain" for Piyush).
3. Describes **teaching approach** and boundaries.
4. Enforces a **Chain-of-Thought JSON contract**:
   `{ "reasoning": [...steps], "reply": "..." }`.

Adding a new persona = drop a new file in `server/personas/` and register it in
`server/personas/index.js`. No frontend changes needed.

---

## 🔐 Notes
- `.env` is gitignored — never commit your key.
- The reasoning steps are shown only in an expandable section so the chat stays
  clean while still demonstrating the CoT process.
