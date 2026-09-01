/**
 * Guest session storage utility
 * Manages guest session ID persistence in localStorage and cookies
 */

const GUEST_SESSION_KEY = 'aura_guest_session_id';
const GUEST_EMAIL_KEY = 'aura_guest_email';

/**
 * Get the current guest session ID from storage
 * @returns {string|null} The guest session ID or null if not found
 */
export const getGuestSessionId = () => {
  try {
    // Try localStorage first
    const sessionId = localStorage.getItem(GUEST_SESSION_KEY);
    if (sessionId) return sessionId;

    // Try cookie as fallback
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'guestSessionId' && value) {
        return decodeURIComponent(value);
      }
    }

    return null;
  } catch (error) {
    console.error('Error reading guest session ID:', error);
    return null;
  }
};

/**
 * Store guest session ID
 * @param {string} sessionId - The guest session ID
 * @param {string} email - Optional guest email
 */
export const setGuestSessionId = (sessionId, email = null) => {
  try {
    // Store in localStorage
    localStorage.setItem(GUEST_SESSION_KEY, sessionId);

    // Also set as cookie for backend request headers (with 24h expiry)
    const date = new Date();
    date.setTime(date.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    document.cookie = `guestSessionId=${encodeURIComponent(sessionId)}; expires=${date.toUTCString()}; path=/`;

    // Store email if provided
    if (email) {
      localStorage.setItem(GUEST_EMAIL_KEY, email);
      document.cookie = `guestEmail=${encodeURIComponent(email)}; expires=${date.toUTCString()}; path=/`;
    }
  } catch (error) {
    console.error('Error storing guest session ID:', error);
  }
};

/**
 * Clear guest session (on login or logout)
 */
export const clearGuestSession = () => {
  try {
    localStorage.removeItem(GUEST_SESSION_KEY);
    localStorage.removeItem(GUEST_EMAIL_KEY);

    // Clear cookies
    document.cookie = 'guestSessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'guestEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  } catch (error) {
    console.error('Error clearing guest session:', error);
  }
};

/**
 * Get stored guest email
 */
export const getGuestEmail = () => {
  try {
    return localStorage.getItem(GUEST_EMAIL_KEY);
  } catch (error) {
    console.error('Error reading guest email:', error);
    return null;
  }
};
