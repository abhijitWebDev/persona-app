import { hitesh } from "./hitesh.js";
import { piyush } from "./piyush.js";

/** Central registry of all available personas, keyed by id. */
export const personas = {
  hitesh,
  piyush,
};

/** Lightweight, safe-to-expose metadata for the frontend (no prompts). */
export const personaList = Object.values(personas).map(
  ({ id, name, handle, tagline, avatar, accent, brand, greeting }) => ({
    id,
    name,
    handle,
    tagline,
    avatar,
    accent,
    brand,
    greeting,
  })
);

export function getPersona(id) {
  return personas[id];
}
