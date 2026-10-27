import { describe, it, expect, vi } from "vitest";

// FE-59 — the authStore <-> api/index cycle is broken by a leaf module
// (src/lib/tokenSource.js): api/index imports ONLY the leaf, and the
// auth store registers its token getter into the leaf. These tests pin
// the semantics that must survive the restructure byte-for-byte:
//   - the token is read at REQUEST time, never captured at module load
//     (a token change after both modules loaded is honoured by the
//     very next request);
//   - the "cookie" sentinel produces NO Authorization header;
//   - a missing/null token produces NO Authorization header;
//   - authStore really is the registrant (sign-in/sign-out are visible
//     to requests made through the real shared axios instance).

vi.mock("../../src/lib/toast.js", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() },
  _registerDispatch: vi.fn(),
  ToastContainer: () => null,
  default: { error: vi.fn() },
}));

const user = { _id: "user-1", firstName: "Asha", lastName: "Rai", email: "a@example.com" };

// Fresh module registry per scenario. The axios adapter is stubbed
// BEFORE the auth store is imported (when a scenario imports it), so
// the store's import-time initialize() resolves through the stub —
// no network. Every request the instance makes is recorded in `seen`.
async function importFresh({ withAuthStore = false } = {}) {
  vi.resetModules();
  const api = (await import("../../src/api/index.js")).default;
  const tokenSource = await import("../../src/lib/tokenSource.js");
  const seen = [];
  api.defaults.adapter = (config) => {
    seen.push(config);
    const data = config.url === "/auth/me" ? { data: { user } } : { data: {} };
    return Promise.resolve({ data, status: 200, statusText: "OK", headers: {}, config });
  };
  let authStore = null;
  if (withAuthStore) {
    authStore = (await import("../../src/store/authStore.js")).default;
    await vi.waitFor(() => expect(authStore.getState().loading).toBe(false));
  }
  return { api, tokenSource, seen, authStore };
}

function lastProbeHeader(seen) {
  const probes = seen.filter((c) => c.url === "/probe");
  expect(probes.length).toBeGreaterThan(0);
  const headers = probes[probes.length - 1].headers;
  return typeof headers?.get === "function" ? headers.get("Authorization") : headers?.Authorization;
}

describe("FE-59 tokenSource leaf + request interceptor", () => {
  it("no registered getter: getAuthToken() is null and requests carry no Authorization header", async () => {
    const { api, tokenSource, seen } = await importFresh();
    expect(tokenSource.getAuthToken()).toBeNull();
    await api.get("/probe");
    expect(lastProbeHeader(seen)).toBeFalsy();
  });

  it("request-time read: token changes AFTER module load are honoured by the next request", async () => {
    const { api, tokenSource, seen } = await importFresh();
    let current = "token-A";
    tokenSource.registerTokenGetter(() => current);

    await api.get("/probe");
    expect(lastProbeHeader(seen)).toBe("Bearer token-A");

    current = "token-B";
    await api.get("/probe");
    expect(lastProbeHeader(seen)).toBe("Bearer token-B");
    expect(tokenSource.getAuthToken()).toBe("token-B");
  });

  it("'cookie' sentinel and null token send no Authorization header (unchanged semantics)", async () => {
    const { api, tokenSource, seen } = await importFresh();
    let current = "cookie";
    tokenSource.registerTokenGetter(() => current);

    await api.get("/probe");
    expect(lastProbeHeader(seen)).toBeFalsy();

    current = null;
    await api.get("/probe");
    expect(lastProbeHeader(seen)).toBeFalsy();
  });

  it("clearing the registration restores the no-token behaviour", async () => {
    const { api, tokenSource, seen } = await importFresh();
    tokenSource.registerTokenGetter(() => "token-A");
    await api.get("/probe");
    expect(lastProbeHeader(seen)).toBe("Bearer token-A");

    tokenSource.registerTokenGetter(null);
    expect(tokenSource.getAuthToken()).toBeNull();
    await api.get("/probe");
    expect(lastProbeHeader(seen)).toBeFalsy();
  });
});

describe("FE-59 authStore registers its getter into the leaf", () => {
  it("initialize/signIn/sign-out are reflected in requests through the real api instance", async () => {
    const { api, tokenSource, seen, authStore } = await importFresh({ withAuthStore: true });

    // Import-time initialize() restored the session via the stubbed
    // /auth/me: the registered getter now reports the cookie sentinel.
    expect(authStore.getState().isAuthenticated).toBe(true);
    expect(tokenSource.getAuthToken()).toBe("cookie");
    await api.get("/probe");
    expect(lastProbeHeader(seen)).toBeFalsy();

    authStore.getState().signIn(user, "tok-1");
    expect(tokenSource.getAuthToken()).toBe("tok-1");
    await api.get("/probe");
    expect(lastProbeHeader(seen)).toBe("Bearer tok-1");

    // A later token change is honoured without reloading any module.
    authStore.getState().signIn(user, "tok-2");
    await api.get("/probe");
    expect(lastProbeHeader(seen)).toBe("Bearer tok-2");

    await authStore.getState().logout();
    expect(tokenSource.getAuthToken()).toBeNull();
    await api.get("/probe");
    expect(lastProbeHeader(seen)).toBeFalsy();
  });
});
