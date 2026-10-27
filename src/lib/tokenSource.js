/**
 * Token source — a tiny leaf module that breaks the FE-59 cycle.
 *
 * Before FE-59, src/api/index.js imported the auth store for its token
 * and src/store/authStore.js dynamically imported src/api/index.js to
 * dodge the resulting cycle (madge reported exactly that one cycle).
 * Now the direction is one-way:
 *   - this module imports NOTHING and holds a registered getter;
 *   - src/api/index.js imports ONLY this module and calls
 *     getAuthToken() inside its request interceptor;
 *   - src/store/authStore.js registers its getter here at module scope
 *     and can therefore import the api module statically.
 *
 * Semantics (pinned by tests/api/tokenInterceptor.fe59.test.js):
 * the getter is invoked on EVERY getAuthToken() call — i.e. at request
 * time, never captured at module load — so a token set, changed or
 * cleared after both modules loaded is honoured by the next request.
 * With no getter registered, the token is null (no Authorization
 * header), exactly as a signed-out store reported before.
 */

let tokenGetter = null;

/** Register (or, with null/not-a-function, clear) the token getter. */
export const registerTokenGetter = (getter) => {
  tokenGetter = typeof getter === "function" ? getter : null;
};

/** The current token, read live through the registered getter. */
export const getAuthToken = () => {
  if (!tokenGetter) return null;
  try {
    return tokenGetter() ?? null;
  } catch {
    // A throwing getter must never break a request: treat it as
    // "no token" (the cookie session, if any, still rides along via
    // withCredentials, exactly as the "cookie" sentinel path does).
    return null;
  }
};
