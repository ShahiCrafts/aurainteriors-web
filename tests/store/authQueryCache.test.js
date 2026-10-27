// FE-08 — the auth store owns React Query cache lifetime.
//
// Before the fix only the customer Navbar's logout handler cleared the
// QueryClient; the admin sign-out never did, and authStore.logout()
// cleared nothing, so cached admin data (gcTime 10 min) survived a
// sign-out and could be served to the next account on the machine.
// An A→B sign-in on a live app had the same problem.
//
// These tests run against the REAL shared client from
// src/lib/queryClient.js (the instance both entry points render with)
// and pin:
//  - logout() empties the shared cache;
//  - signIn() as a DIFFERENT user empties it (A's entries are gone and
//    a key built for B does not resolve A's data);
//  - signIn() as the SAME user, or a first sign-in from signed-out,
//    retains the cache.

import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/api/index.js", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

const adminA = { _id: "admin-a", firstName: "Asha", role: "admin" };
const adminB = { _id: "admin-b", firstName: "Bikash", role: "admin" };

async function importFresh() {
  vi.resetModules();
  const api = (await import("../../src/api/index.js")).default;
  api.get.mockRejectedValue(new Error("401 Unauthorized"));
  api.post.mockResolvedValue({});
  const authStore = (await import("../../src/store/authStore.js")).default;
  const queryClient = (await import("../../src/lib/queryClient.js"))
    .queryClient;
  const { USER_KEYS } = await import("../../src/hooks/admin/useUserTan.js");
  await vi.waitFor(() => expect(authStore.getState().loading).toBe(false));
  return { authStore, queryClient, USER_KEYS };
}

describe("FE-08 shared query cache vs auth identity", () => {
  it("logout() empties the shared QueryClient", async () => {
    const { authStore, queryClient, USER_KEYS } = await importFresh();
    authStore.getState().signIn(adminA);
    queryClient.setQueryData(USER_KEYS.list({}), { data: ["a-secret"] });
    queryClient.setQueryData(["analytics", "admin-a", "stats"], { total: 1 });
    expect(queryClient.getQueryCache().getAll().length).toBeGreaterThan(0);

    await authStore.getState().logout();

    expect(authStore.getState().isAuthenticated).toBe(false);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it("signIn as a different user drops the previous user's entries", async () => {
    const { authStore, queryClient, USER_KEYS } = await importFresh();
    authStore.getState().signIn(adminA);
    const keyForA = USER_KEYS.list({});
    queryClient.setQueryData(keyForA, { data: ["a-users"] });

    authStore.getState().signIn(adminB);

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    // A hook keyed for B must not resolve A's data.
    const keyForB = USER_KEYS.list({});
    expect(keyForB).not.toEqual(keyForA);
    expect(queryClient.getQueryData(keyForB)).toBeUndefined();
  });

  it("signIn as the same user again retains the cache", async () => {
    const { authStore, queryClient, USER_KEYS } = await importFresh();
    authStore.getState().signIn(adminA);
    const key = USER_KEYS.list({});
    queryClient.setQueryData(key, { data: ["a-users"] });

    authStore.getState().signIn(adminA);

    expect(queryClient.getQueryData(key)).toEqual({ data: ["a-users"] });
  });

  it("first sign-in from signed-out does not clear (public cache survives)", async () => {
    const { authStore, queryClient } = await importFresh();
    queryClient.setQueryData(["products", "list"], { data: ["public"] });

    authStore.getState().signIn(adminA);

    expect(queryClient.getQueryData(["products", "list"])).toEqual({
      data: ["public"],
    });
  });
});
