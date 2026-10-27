import { useState } from "react";
import { getAvatarUrl } from "../../utils/imageUrl";
import {
  getDisplayName,
  getInitials,
  colorForName,
} from "../../utils/avatarInitials";

/**
 * FE-06 — local initials avatars. Customer names must never leave
 * for a placeholder/avatar service: the previous getAvatarUrl built
 * an external URL carrying the user's full name for every
 * avatar-less user, and several chat components rebuilt the same
 * URL inline as an <img> onError fallback. These components render
 * initials in a coloured circle instead — the pattern the codebase
 * already used inline in BlogDetailsPage bylines and the admin
 * tables — so no name is ever turned into a network request.
 */

/**
 * Coloured circle with initials. `className` controls size, shape
 * and text size (default "w-10 h-10 text-sm rounded-full"); the
 * background colour is derived deterministically from the name
 * unless `color` is given. A missing name renders "?".
 */
export default function InitialsAvatar({
  name,
  user,
  color,
  className = "w-10 h-10 text-sm rounded-full",
  title,
}) {
  const displayName =
    typeof name === "string" && name.trim()
      ? name.trim()
      : user
        ? getDisplayName(user, "")
        : "";
  return (
    <span
      aria-hidden={title ? undefined : true}
      title={title}
      className={`text-white font-semibold flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ backgroundColor: color || colorForName(displayName) }}
    >
      {getInitials(displayName)}
    </span>
  );
}

/**
 * The one avatar render for user-shaped objects: the real avatar
 * <img> when getAvatarUrl returns a validated URL, the local
 * InitialsAvatar when it returns null (no avatar, or a value the
 * media allowlist rejected) or when the <img> errors. There is no
 * network fallback — an error swaps to initials via local state
 * (the failed URL is remembered, so a changed URL gets a fresh
 * chance without an effect).
 *
 * Props: `user` ({ firstName, lastName, name, avatar }), `name`
 * (explicit display-name override), `alt`, `className` (applied to
 * both the img and the initials circle: size/shape).
 */
export function UserAvatar({ user, name, alt, className = "w-10 h-10 rounded-full", ...rest }) {
  const avatarUrl = getAvatarUrl(user);
  const [erroredUrl, setErroredUrl] = useState(null);
  const errored = avatarUrl !== null && erroredUrl === avatarUrl;

  const explicitName =
    typeof name === "string" && name.trim() ? name.trim() : undefined;
  const displayName = explicitName || getDisplayName(user, "User");

  if (!avatarUrl || errored) {
    return (
      <InitialsAvatar
        user={user}
        name={explicitName}
        className={className.replace(/\bobject-cover\b/g, "").trim()}
      />
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={alt ?? displayName}
      className={`${className} object-cover`}
      onError={() => setErroredUrl(avatarUrl)}
      {...rest}
    />
  );
}
