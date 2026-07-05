import { useEffect, useMemo, useRef, useState } from "react";
import { fetchPersonas, sendChat } from "./api.js";
import PersonaSwitcher from "./components/PersonaSwitcher.jsx";
import PersonaAvatar from "./components/PersonaAvatar.jsx";
import Message from "./components/Message.jsx";
import ChatInput from "./components/ChatInput.jsx";
import "./App.css";

// Synthetic "group" persona: chat with both educators at once. It isn't a real
// backend persona — the frontend fans each message out to its `members`.
const BOTH = {
  id: "both",
  name: "Hitesh & Piyush",
  handle: "Group chat",
  tagline: "Dono se ek saath — do perspectives, ek sawaal 💬",
  accent: "#4f46e5",
  brand: "ChaiCode × piyushgarg.dev",
  greeting:
    "Haanji! Hum dono yahaan hain. Ek sawaal poochho — dono apne-apne andaaz mein jawaab denge. 🙂🚀",
  members: ["hitesh", "piyush"],
};

export default function App() {
  const [personas, setPersonas] = useState([]);
  const [activeId, setActiveId] = useState("hitesh");
  // Separate conversation thread per persona so switching never mixes voices.
  const [threads, setThreads] = useState({}); // { [personaId]: Message[] }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  // Real personas from the server, plus the synthetic group option.
  const switcherPersonas = useMemo(() => [...personas, BOTH], [personas]);

  const active = useMemo(
    () =>
      activeId === BOTH.id ? BOTH : personas.find((p) => p.id === activeId),
    [personas, activeId]
  );
  const messages = threads[activeId] || [];

  // Resolve which persona an assistant message belongs to (for its avatar/name).
  const personaFor = (m) =>
    m.personaId ? personas.find((p) => p.id === m.personaId) : active;

  useEffect(() => {
    fetchPersonas()
      .then((list) => {
        setPersonas(list);
        if (list.length && !list.find((p) => p.id === activeId)) {
          setActiveId(list[0].id);
        }
      })
      .catch(() => setError("Could not reach the server. Is it running?"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function handleSend(text) {
    if (!text.trim() || loading) return;
    setError("");

    const userMsg = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setThreads((t) => ({ ...t, [activeId]: nextMessages }));
    setLoading(true);

    // Which personas should reply to this message.
    const targets = activeId === BOTH.id ? BOTH.members : [activeId];

    try {
      await Promise.all(
        targets.map(async (personaId) => {
          // Each persona only sees the shared user messages plus its OWN prior
          // replies — never the other persona's, so voices stay distinct.
          const payload = nextMessages
            .filter((m) => m.role === "user" || m.personaId === personaId)
            .map(({ role, content }) => ({ role, content }));

          const { reply, reasoning } = await sendChat(personaId, payload);
          setThreads((t) => ({
            ...t,
            [activeId]: [
              ...(t[activeId] || nextMessages),
              { role: "assistant", content: reply, reasoning, personaId },
            ],
          }));
        })
      );
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function clearThread() {
    setThreads((t) => ({ ...t, [activeId]: [] }));
    setError("");
  }

  const accent = active?.accent || "#d97706";

  return (
    <div className="app" style={{ "--accent": accent }}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-logo">💬</span>
          <div>
            <h1>Persona Chat</h1>
            <p>Talk tech with your favourite educators</p>
          </div>
        </div>

        <PersonaSwitcher
          personas={switcherPersonas}
          activeId={activeId}
          onSelect={setActiveId}
        />

        <button className="clear-btn" onClick={clearThread}>
          🧹 Clear this chat
        </button>

        <footer className="sidebar-foot">
          <p>Chain-of-Thought powered · switch anytime</p>
        </footer>
      </aside>

      <main className="chat">
        <header className="chat-header" style={{ borderColor: accent }}>
          <PersonaAvatar persona={active} className="chat-avatar" />
          <div className="chat-title">
            <strong>{active?.name || "…"}</strong>
            <span>{active?.tagline}</span>
          </div>
          <a
            className="chat-brand"
            style={{ color: accent }}
            href="#"
            onClick={(e) => e.preventDefault()}
          >
            {active?.brand}
          </a>
        </header>

        <div className="messages" ref={scrollRef}>
          {messages.length === 0 && active && (
            <div className="greeting-card" style={{ borderColor: accent }}>
              <PersonaAvatar persona={active} className="chat-avatar big" />
              <p>{active.greeting}</p>
            </div>
          )}

          {messages.map((m, i) => (
            <Message
              key={i}
              message={m}
              persona={personaFor(m)}
              showName={activeId === BOTH.id}
            />
          ))}

          {loading && (
            <div className="typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
        </div>

        {error && <div className="error-bar">{error}</div>}

        <ChatInput
          onSend={handleSend}
          disabled={loading}
          placeholder={`Message ${
            activeId === BOTH.id
              ? "Hitesh & Piyush"
              : active?.name?.split(" ")[0] || "…"
          }…`}
        />
      </main>
    </div>
  );
}
