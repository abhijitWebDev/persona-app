import hiteshImg from "../assets/images/hitesh.png";
import piyushImg from "../assets/images/piyush.png";

/** Real photos for personas; falls back to the emoji avatar when absent. */
const IMAGES = {
  hitesh: hiteshImg,
  piyush: piyushImg,
};

/**
 * Round avatar for a persona. Renders the photo when we have one, otherwise
 * the persona's emoji on the accent-coloured background.
 */
export default function PersonaAvatar({ persona, className = "", style }) {
  const classes = `avatar ${className}`.trim();

  // Group persona: split the circle between its members' photos.
  if (persona?.members) {
    return (
      <span className={`${classes} dual`} style={style}>
        {persona.members.map((id) =>
          IMAGES[id] ? <img key={id} src={IMAGES[id]} alt={id} /> : null
        )}
      </span>
    );
  }

  const img = persona && IMAGES[persona.id];

  if (img) {
    return (
      <span className={classes} style={style}>
        <img src={img} alt={persona?.name || "persona"} />
      </span>
    );
  }

  return (
    <span
      className={classes}
      style={{ background: persona?.accent || "#d97706", ...style }}
    >
      {persona?.avatar || "☕"}
    </span>
  );
}
