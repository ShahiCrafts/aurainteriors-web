/**
 * Phase 6 — shared React Query key factory (Report 1 §3.4: every
 * *Tan.js hook used to re-declare its key arrays; this factory is
 * adopted as hooks are touched, not mass-migrated).
 *
 * The factories return EXACTLY the arrays the hooks built inline
 * before — cache identity is part of the contract (FE-55's narrow
 * invalidation and the FE-47 cart error policy key off these
 * shapes), so a factory must never change a key's shape, only its
 * construction site.
 *
 * User scoping: list/detail keys carry the owner id ("guest" when
 * signed out) so one user's cache never leaks into another's.
 */
export const cartKeys = {
  all: ["cart"],
  list: (userId) => ["cart", "list", userId || "guest"],
};

export const addressKeys = {
  all: ["addresses"],
  list: (userId) => ["addresses", userId || "guest"],
  detail: (id, userId) => ["address", id, userId || "guest"],
};
