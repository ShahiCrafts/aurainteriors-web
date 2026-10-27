import useAuthStore from "../store/authStore";

/**
 * FE-08 — identity segment for admin React Query keys.
 *
 * Follows the in-repo wishlist precedent (useWishlistTan reads
 * `useAuthStore.getState().user?._id || 'guest'` inside its key
 * factories): the id is read at factory-call time, so keys built while
 * admin A is signed in differ from keys built under admin B, and
 * invalidations issued under the same identity construct the same key.
 * Signed-out callers get the stable "guest" fallback segment.
 */
export const adminScope = () => useAuthStore.getState().user?._id || "guest";

/** Base key for an admin resource: [resource, currentUserId]. */
export const scopedAdminKey = (resource) => [resource, adminScope()];
