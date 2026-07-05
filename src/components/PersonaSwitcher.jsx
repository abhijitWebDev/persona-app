import PersonaAvatar from "./PersonaAvatar.jsx";

export default function PersonaSwitcher({ personas, activeId, onSelect }) {
  return (
    <div className="switcher">
      <span className="switcher-label">Choose a persona</span>
      {personas.map((p) => {
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            className={`persona-card ${active ? "active" : ""}`}
            style={active ? { borderColor: p.accent, background: `${p.accent}14` } : undefined}
            onClick={() => onSelect(p.id)}
          >
            <PersonaAvatar persona={p} className="persona-avatar" />
            <span className="persona-meta">
              <strong>{p.name}</strong>
              <small>{p.handle}</small>
            </span>
            {active && <span className="persona-dot" style={{ background: p.accent }} />}
          </button>
        );
      })}
    </div>
  );
}
