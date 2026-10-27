/**
 * FE-06 — pure helpers for the local initials avatar
 * (src/components/common/InitialsAvatar.jsx). Customer names are
 * rendered as initials locally; they are never turned into a URL
 * or sent to a placeholder/avatar service.
 */

// Deterministic palette (bg colours with white text), in the
// codebase's warm/teal/indigo visual language.
const PALETTE = [
  "#109383", // brand teal (the old generated-avatar background)
  "#F27318", // brand orange (blog byline / profile fallback)
  "#4338CA", // indigo (admin chat fallback)
  "#0F766E",
  "#B45309",
  "#7C3AED",
  "#BE185D",
  "#1D4ED8",
];

/** Display name for a user-shaped object (or an explicit fallback). */
export function getDisplayName(user, fallback = "User") {
  if (!user) return fallback;
  const fromParts = [user.firstName, user.lastName]
    .filter((part) => typeof part === "string" && part.trim())
    .join(" ")
    .trim();
  if (fromParts) return fromParts;
  if (typeof user.name === "string" && user.name.trim()) {
    return user.name.trim();
  }
  return fallback;
}

/**
 * Grapheme-safe initials: first character of the first and last
 * name parts; a single part gives one letter; an empty/missing name
 * gives "?". Array.from iterates code points, so a surrogate pair
 * (emoji) or a multi-code-point letter is never cut in half the way
 * part[0] / charAt(0) would cut it.
 */
export function getInitials(name) {
  if (typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = Array.from(parts[0])[0] || "";
  if (parts.length === 1) return first.toUpperCase() || "?";
  const last = Array.from(parts[parts.length - 1])[0] || "";
  return `${first}${last}`.toUpperCase() || "?";
}

/** Stable colour for a name (same name → same colour, every render). */
export function colorForName(name) {
  const value = typeof name === "string" ? name : "";
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
