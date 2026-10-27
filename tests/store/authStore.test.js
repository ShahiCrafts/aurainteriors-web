import { describe, expect, it, vi } from "vitest";

// Characterization tests for src/store/authStore.js — pinning CURRENT
// behavior, including the "cookie" sentinel token model.
//
// authStore statically imports ../api/index (FE-59: the api layer no
// longer imports the store — it reads the token through the
// src/lib/tokenSource.js leaf) and CALLS initialize() at module import
// time. So the api module is mocked
// here (before any store import), and every scenario runs against a FRESH
// module registry (vi.resetModules + dynamic import) so the import-time
// initialize() executes against that scenario's mock responses.
// initialize() is revision-guarded and will not overwrite an authenticated
// state; scenarios therefore drive state through fresh imports rather
// than fighting the singleton.

vi.mock("../../src/api/index.js", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const user = { _id: "user-1", firstName: "Asha", lastName: "Rai", email: "a@example.com" };

// Imports the (mocked) api module, lets the scenario configure it, then
// imports a fresh authStore whose import-time initialize() sees that
// configuration. Returns handles to all three stores of that registry
// generation (authStore imports checkoutStore and guestCartStore itself,
// so these are the same instances it acts on).
async function importFreshStores(configureApi) {
  vi.resetModules();
  const api = (await import("../../src/api/index.js")).default;
  configureApi(api);
  const authStore = (await import("../../src/store/authStore.js")).default;
  const guestCartStore = (await import("../../src/store/guestCartStore.js")).default;
  const checkoutStore = (await import("../../src/store/checkoutStore.js")).default;
  return { api, authStore, guestCartStore, checkoutStore };
}

const noSession = (api) => {
  api.get.mockRejectedValue(new Error("401 Unauthorized"));
  api.post.mockResolvedValue({});
};

describe("session restore via import-time initialize()", () => {
  it("restores the session: user set, token is the literal 'cookie', loading false", async () => {
    const { api, authStore } = await importFreshStores((mockApi) => {
      mockApi.get.mockResolvedValue({ data: { data: { user } } });
      mockApi.post.mockResolvedValue({});
    });

    await vi.waitFor(() => {
      expect(authStore.getState().loading).toBe(false);
    });

    expect(api.get).toHaveBeenCalledWith("/auth/me");
    const s = authStore.getState();
    expect(s.user).toEqual(user);
    expect(s.token).toBe("cookie");
    expect(s.isAuthenticated).toBe(true);
    expect(s.loading).toBe(false);
  });

  it("restore failure: loading false, not authenticated, token null", async () => {
    const { authStore } = await importFreshStores(noSession);

    await vi.waitFor(() => {
      expect(authStore.getState().loading).toBe(false);
    });

    const s = authStore.getState();
    expect(s.user).toBeNull();
    expect(s.token).toBeNull();
    expect(s.isAuthenticated).toBe(false);
    expect(s.loading).toBe(false);
  });
});

describe("signIn", () => {
  it("with no token argument, token becomes the 'cookie' sentinel and the modal closes", async () => {
    const { authStore } = await importFreshStores(noSession);
    await vi.waitFor(() => expect(authStore.getState().loading).toBe(false));

    authStore.getState().openAuthModal();
    expect(authStore.getState().isAuthModalOpen).toBe(true);

    authStore.getState().signIn(user);

    const s = authStore.getState();
    expect(s.user).toEqual(user);
    expect(s.token).toBe("cookie");
    expect(s.isAuthenticated).toBe(true);
    expect(s.loading).toBe(false);
    expect(s.isAuthModalOpen).toBe(false);
  });

  it("with an explicit token, keeps that token", async () => {
    const { authStore } = await importFreshStores(noSession);
    await vi.waitFor(() => expect(authStore.getState().loading).toBe(false));

    authStore.getState().signIn(user, "real-token");

    expect(authStore.getState().token).toBe("real-token");
    expect(authStore.getState().isAuthenticated).toBe(true);
  });
});

describe("logout", () => {
  it("success: POSTs /auth/logout, clears auth state, legacy keys and the guest cart", async () => {
    const { api, authStore, guestCartStore } = await importFreshStores(noSession);
    await vi.waitFor(() => expect(authStore.getState().loading).toBe(false));

    // Establish an authenticated session and a polluted guest state.
    authStore.getState().signIn(user);
    guestCartStore.getState().addItem({ _id: "prod-1", name: "Sofa", price: 100 }, 1);
    expect(guestCartStore.getState().items).toHaveLength(1);
    localStorage.setItem("token", "legacy-token");
    localStorage.setItem("user", JSON.stringify(user));

    await authStore.getState().logout();

    expect(api.post).toHaveBeenCalledWith("/auth/logout", {});
    const s = authStore.getState();
    expect(s.user).toBeNull();
    expect(s.token).toBeNull();
    expect(s.isAuthenticated).toBe(false);
    expect(s.loading).toBe(false);
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(guestCartStore.getState().items).toEqual([]);
    expect(localStorage.getItem("guest_cart")).toBeNull();
  });

  // FE-18 (Phase 2) — SANCTIONED BEHAVIOUR CHANGE. The Phase 0
  // characterization test pinned the opposite: "the rejection
  // propagates and auth state is left unchanged" (user/token/
  // isAuthenticated untouched, legacy keys and guest cart intact).
  // Logout is now deterministic: local sign-out is immediate and
  // unconditional, the server POST is a bounded best-effort
  // notification, and logout() never rejects to callers.
  it("failure: POST rejection is swallowed — logout resolves and ALL local cleanup runs", async () => {
    const { api, authStore, guestCartStore, checkoutStore } =
      await importFreshStores((mockApi) => {
        mockApi.get.mockRejectedValue(new Error("401 Unauthorized"));
        mockApi.post.mockRejectedValue(new Error("network down"));
      });
    await vi.waitFor(() => expect(authStore.getState().loading).toBe(false));

    authStore.getState().signIn(user, "real-token");
    guestCartStore.getState().addItem({ _id: "prod-1", name: "Sofa", price: 100 }, 1);
    checkoutStore.getState().setDiscountCode("SAVE10");
    localStorage.setItem("token", "legacy-token");
    localStorage.setItem("user", JSON.stringify(user));

    // Must RESOLVE (previously rejected with "network down").
    await authStore.getState().logout();

    expect(api.post).toHaveBeenCalledWith("/auth/logout", {});
    const s = authStore.getState();
    expect(s.user).toBeNull();
    expect(s.token).toBeNull();
    expect(s.isAuthenticated).toBe(false);
    expect(s.loading).toBe(false);
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(guestCartStore.getState().items).toEqual([]);
    expect(localStorage.getItem("guest_cart")).toBeNull();
    expect(checkoutStore.getState().discountCode).toBe("");
  });

  it("hang: a never-resolving POST is bounded — logout still resolves and clears state", async () => {
    const { authStore, guestCartStore } = await importFreshStores((mockApi) => {
      mockApi.get.mockRejectedValue(new Error("401 Unauthorized"));
      mockApi.post.mockReturnValue(new Promise(() => {}));
    });
    await vi.waitFor(() => expect(authStore.getState().loading).toBe(false));

    authStore.getState().signIn(user, "real-token");
    guestCartStore.getState().addItem({ _id: "prod-1", name: "Sofa", price: 100 }, 1);
    localStorage.setItem("token", "legacy-token");

    const started = Date.now();
    await authStore.getState().logout();
    // Bounded best-effort: the implementation races the POST against a
    // ~3 s timeout; allow generous slack for a loaded CI machine.
    expect(Date.now() - started).toBeLessThan(9000);

    const s = authStore.getState();
    expect(s.user).toBeNull();
    expect(s.token).toBeNull();
    expect(s.isAuthenticated).toBe(false);
    expect(localStorage.getItem("token")).toBeNull();
    expect(guestCartStore.getState().items).toEqual([]);
  }, 15000);

  it("disposition: guest session and lastUsedEmail are KEPT on logout", async () => {
    // Audit STATE_INVENTORY §7 ("Cleared by logout?" column): the guest
    // session (aura_guest_session_id / aura_guest_email) is NOT cleared
    // by logout — its lifecycle is owned by ChatWidget's user-change
    // effect — and lastUsedEmail is NOT cleared either: it is the
    // login-form prefill and survives logout and browser restart.
    // FE-18's fix makes the EXISTING cleanup unconditional; it does
    // not add these keys to it.
    const { authStore } = await importFreshStores(noSession);
    await vi.waitFor(() => expect(authStore.getState().loading).toBe(false));

    authStore.getState().signIn(user);
    const guestSessionId = `guest_${"a".repeat(64)}`;
    localStorage.setItem("lastUsedEmail", "a@example.com");
    localStorage.setItem("aura_guest_session_id", guestSessionId);
    localStorage.setItem("aura_guest_email", "guest@example.com");

    await authStore.getState().logout();

    expect(authStore.getState().isAuthenticated).toBe(false);
    expect(localStorage.getItem("lastUsedEmail")).toBe("a@example.com");
    expect(localStorage.getItem("aura_guest_session_id")).toBe(guestSessionId);
    expect(localStorage.getItem("aura_guest_email")).toBe("guest@example.com");
  });
});
