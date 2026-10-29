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
    return null;
  }
};
