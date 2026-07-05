import { useState } from "react";
import ReactMarkdown from "react-markdown";
import PersonaAvatar from "./PersonaAvatar.jsx";

export default function Message({ message, persona, showName = false }) {
  const [showThinking, setShowThinking] = useState(false);
  const isUser = message.role === "user";
  const hasReasoning = message.reasoning && message.reasoning.length > 0;

  return (
    <div className={`msg-row ${isUser ? "user" : "assistant"}`}>
      {!isUser && <PersonaAvatar persona={persona} className="msg-avatar" />}

      <div className="msg-bubble">
        {!isUser && showName && persona && (
          <span className="msg-name" style={{ color: persona.accent }}>
            {persona.name}
          </span>
        )}
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div className="markdown">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {hasReasoning && (
          <div className="thinking">
            <button
              className="thinking-toggle"
              onClick={() => setShowThinking((s) => !s)}
            >
              {showThinking ? "▼" : "▶"} Chain of thought
            </button>
            {showThinking && (
              <ol className="thinking-steps">
                {message.reasoning.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
