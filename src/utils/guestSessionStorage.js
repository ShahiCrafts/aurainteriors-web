/**
 * Guest session ID handling (VULN-009 remediation).
 *
 * The guest session ID is a bearer-equivalent credential for a guest's
 * chats, so it is NEVER persisted by page script:
 *   - NOT in localStorage (readable by any script on this origin), and
 *   - NOT in a script-set cookie (no HttpOnly/Secure/SameSite flags).
 * The server sets the credential itself as an httpOnly cookie on
 * startChat (see server utils/guestSession.js), which is what carries
 * the session across reloads — API calls ride it automatically via
 * withCredentials. This module keeps the public key in MEMORY only,
 * for header use (x-guest-session-id) during the current page session.
 *
 * The guest EMAIL is not a credential and keeps its previous
 * localStorage behaviour (form prefill / lifecycle owned by
 * ChatWidget).
 */

const GUEST_SESSION_KEY = "aura_guest_session_id"; // legacy key — removal only
const GUEST_EMAIL_KEY = "aura_guest_email";

const SESSION_ID_SHAPE = /^guest_[a-f0-9]{64}$/;

let memorySessionId = null;

// Remove any legacy localStorage entry written by older builds. Runs
// on module load and again on every read, so a stale credential never
// survives this code. (The server-owned httpOnly cookie cannot and
// must not be touched from script.)
function removeLegacyStoredSessionId() {
  try {
    localStorage.removeItem(GUEST_SESSION_KEY);
  } catch {
    /* Storage may be unavailable; the in-memory value is authoritative. */
  }
}
removeLegacyStoredSessionId();

/**
 * Get the current guest session ID (page-session memory only).
 * @returns {string|null} The guest session ID or null if not set in this page session
 */
export const getGuestSessionId = () => {
  removeLegacyStoredSessionId();
  return memorySessionId;
};

/**
 * Remember a guest session ID for this page session (memory only).
 * The durable copy is the server-set httpOnly cookie.
 * @param {string} sessionId - The guest session ID returned by the server
 * @param {string} email - Optional guest email (not a credential; stored as before)
 */
export const setGuestSessionId = (sessionId, email = null) => {
  try {
    if (typeof sessionId !== "string" || !SESSION_ID_SHAPE.test(sessionId))
      return;
    memorySessionId = sessionId;
    removeLegacyStoredSessionId();

    // Store email if provided (unchanged legacy behaviour).
    if (email) {
      localStorage.setItem(GUEST_EMAIL_KEY, email);
      const date = new Date();
      date.setTime(date.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      document.cookie = `guestEmail=${encodeURIComponent(email)}; expires=${date.toUTCString()}; path=/`;
    }
  } catch (error) {
    console.error("Error storing guest session:", error);
  }
};

/**
 * Clear guest session (on login or logout).
 * Clears the in-memory ID and the stored email. The server-owned
 * httpOnly guestSessionId cookie is not script-clearable; the server
 * owns its lifecycle.
 */
export const clearGuestSession = () => {
  try {
    memorySessionId = null;
    localStorage.removeItem(GUEST_SESSION_KEY);
    localStorage.removeItem(GUEST_EMAIL_KEY);

    // Clear the (non-credential) email cookie.
    document.cookie =
      "guestEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  } catch (error) {
    console.error("Error clearing guest session:", error);
  }
};

/**
 * Get stored guest email
 */
export const getGuestEmail = () => {
  try {
    return localStorage.getItem(GUEST_EMAIL_KEY);
  } catch (error) {
    console.error("Error reading guest email:", error);
    return null;
  }
};
