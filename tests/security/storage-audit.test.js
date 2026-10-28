// Phase 5 STORAGE AUDIT — permanent test (Worker B).
//
// Ground truth: audit/fe/STATE_INVENTORY.md §7 + the remediation
// dispositions recorded there and in tests/store/authStore.test.js
// (FE-18). The allowed localStorage key set is EXACTLY:
//
//   guest_cart                 guestCartStore (cleared on logout)
//   aura_guest_email           guestSessionStorage (kept on logout —
//                              lifecycle owned by ChatWidget)
//   aura_guest_session_id      NO LONGER PERSISTED (VULN-009): the guest
//                              session credential lives in page-session
//                              memory only; the durable copy is the
//                              server-set httpOnly cookie. The key may
//                              appear in src/ ONLY in removeItem calls
//                              (legacy cleanup) — see REMOVAL_ONLY_KEYS.
//   lastUsedEmail              login-form prefill (kept on logout)
//   aura_chat_greeted          ChatWidget greeting dismissal
//   admin_sidebar_collapsed    AdminLayout UI preference
//   aura-ar-tutorial-dismissed NativeARView UI preference
//
// sessionStorage: NOTHING in src/ uses it — the allowed set is empty.
//
// Inventory verification (done for this test, and re-done
// permanently by the source-census test below): every
// localStorage/sessionStorage getItem/setItem/removeItem call in
// src/ was grepped; the only keys are the seven above (three via
// constants — GUEST_CART_KEY="guest_cart",
// GUEST_SESSION_KEY="aura_guest_session_id",
// GUEST_EMAIL_KEY="aura_guest_email") plus removeItem("token") /
// removeItem("user") legacy cleanup in authStore/AuthCallback.
// No dynamic/computed storage keys exist in src/. No discrepancy
// vs the §7 inventory was found. (Post-VULN-009, guestSessionStorage
// mirrors only the guest EMAIL into a cookie; the guestSessionId
// cookie is set by the server as httpOnly — cookies are outside this
// test's web-storage scope.)
//
// The runtime tests exercise the real paths: authStore import-time
// boot (legacy cleanup) → signIn → guest cart add → guest session
// creation → logout, asserting after each phase that
//   (1) every key present belongs to the allowed set,
//   (2) no value matches a JWT shape or carries a
//       token/password/secret field, and the only email-bearing
//       values live under the two sanctioned email keys,
//   (3) the legacy keys `token` and `user` are absent after boot
//       and after logout,
//   (4) sessionStorage holds nothing at all.

import { describe, expect, it, vi } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

vi.mock("../../src/api/index.js", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

const ALLOWED_LOCAL_KEYS = new Set([
  "guest_cart",
  "aura_guest_email",
  "lastUsedEmail",
  "aura_chat_greeted",
  "admin_sidebar_collapsed",
  "aura-ar-tutorial-dismissed",
]);
// Keys that may be REFERENCED in src/ only to be removed, never to be
// persisted: the legacy auth keys (authStore/AuthCallback cleanup) and,
// since VULN-009, the legacy guest-session key (guestSessionStorage
// legacy cleanup — the credential itself is memory-only now).
const REMOVAL_ONLY_KEYS = new Set(["token", "user", "aura_guest_session_id"]);
// Keys whose VALUES are email addresses by design (§7 dispositions).
const SANCTIONED_EMAIL_KEYS = new Set(["aura_guest_email", "lastUsedEmail"]);

const JWT_SHAPE = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/;
const FORBIDDEN_FIELD =
  /^(token|access_?token|refresh_?token|id_?token|password|passwd|secret|api_?key|authorization|ssn|credit_?card|card_?number|cvv)$/i;
const EMAIL_SHAPE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

function storageEntries(storage) {
  const out = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    out.push([key, storage.getItem(key)]);
  }
  return out;
}

function collectJsonKeys(value, acc = []) {
  if (Array.isArray(value)) value.forEach((v) => collectJsonKeys(v, acc));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      acc.push(k);
      collectJsonKeys(v, acc);
    }
  }
  return acc;
}

/** The audit assertions, reusable after every phase of a flow. */
function expectStorageClean() {
  for (const [key, value] of storageEntries(localStorage)) {
    expect(
      ALLOWED_LOCAL_KEYS.has(key),
      `unexpected localStorage key "${key}"`,
    ).toBe(true);
    expect(value, `value under "${key}" looks like a JWT`).not.toMatch(
      JWT_SHAPE,
    );
    expect(value, `value under "${key}" carries a Bearer token`).not.toMatch(
      /Bearer\s+\S+/i,
    );
    // PII discipline: an email address may only live under the two
    // sanctioned email keys — anywhere else is a leak.
    if (!SANCTIONED_EMAIL_KEYS.has(key)) {
      expect(
        value,
        `value under "${key}" contains an email address`,
      ).not.toMatch(EMAIL_SHAPE);
    }
    try {
      const parsed = JSON.parse(value);
      for (const field of collectJsonKeys(parsed)) {
        expect(
          FORBIDDEN_FIELD.test(field),
          `forbidden field "${field}" under "${key}"`,
        ).toBe(false);
      }
    } catch {
      /* not JSON — the shape checks above already ran */
    }
  }
  // (4) sessionStorage: allowed set is empty.
  expect(storageEntries(sessionStorage)).toEqual([]);
  // (3) legacy keys absent.
  expect(localStorage.getItem("token")).toBeNull();
  expect(localStorage.getItem("user")).toBeNull();
}

const user = {
  _id: "user-1",
  firstName: "Asha",
  lastName: "Rai",
  email: "a@example.com",
};
const GUEST_SESSION_ID = `guest_${"a1".repeat(32)}`; // guest_ + 64 hex

async function importFresh(configureApi) {
  vi.resetModules();
  const api = (await import("../../src/api/index.js")).default;
  configureApi(api);
  const authStore = (await import("../../src/store/authStore.js")).default;
  const guestCartStore = (await import("../../src/store/guestCartStore.js"))
    .default;
  const guestSession = await import("../../src/utils/guestSessionStorage.js");
  return { api, authStore, guestCartStore, guestSession };
}

const noSession = (api) => {
  api.get.mockRejectedValue(new Error("401 Unauthorized"));
  api.post.mockResolvedValue({});
};

describe("storage audit — source census (inventory verification)", () => {
  const ROOT = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  );
  const SRC = path.join(ROOT, "src");
  const CONSTANTS = {
    GUEST_CART_KEY: "guest_cart",
    GUEST_SESSION_KEY: "aura_guest_session_id",
    GUEST_EMAIL_KEY: "aura_guest_email",
  };

  function collect(dir, out = []) {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) collect(full, out);
      else if (/\.(js|jsx)$/.test(entry)) out.push(full);
    }
    return out;
  }

  it("every storage key used in src/ is on the allowed list (or a legacy removal)", () => {
    const used = new Set();
    const sessionUsed = new Set();
    for (const file of collect(SRC)) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(
        /(localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*(?:"([^"]+)"|'([^']+)'|([A-Z_]+))/g,
      )) {
        const key = m[2] ?? m[3] ?? CONSTANTS[m[4]] ?? `<unresolved:${m[4]}>`;
        (m[1] === "sessionStorage" ? sessionUsed : used).add(key);
      }
    }
    // Removal-only keys are only ever REMOVED (legacy cleanup); they
    // are not part of the allowed-to-persist set.
    expect([...used].sort()).toEqual(
      [...ALLOWED_LOCAL_KEYS, ...REMOVAL_ONLY_KEYS].sort(),
    );
    expect([...sessionUsed]).toEqual([]);
  });
});

describe("storage audit — auth login → logout flow", () => {
  it("boot clears legacy keys; signIn writes nothing to storage", async () => {
    // Pollute storage the way a legacy build would have.
    localStorage.setItem("token", "legacy-jwt-value");
    localStorage.setItem("user", JSON.stringify(user));

    const { authStore } = await importFresh(noSession);
    await vi.waitFor(() => expect(authStore.getState().loading).toBe(false));

    // (3) absent after boot (import-time clearLegacyAuth).
    expectStorageClean();

    authStore.getState().signIn(user);
    expect(authStore.getState().isAuthenticated).toBe(true);
    // The token lives only in memory as the "cookie" sentinel —
    // signIn must not persist anything.
    expect(storageEntries(localStorage)).toEqual([]);
    expectStorageClean();
  });

  it("guest cart + guest session creation stay inside the allowed set, then logout", async () => {
    const { authStore, guestCartStore, guestSession } =
      await importFresh(noSession);
    await vi.waitFor(() => expect(authStore.getState().loading).toBe(false));

    // Guest paths (pre-login, as a real guest would hit them).
    guestCartStore
      .getState()
      .addItem({ _id: "prod-1", name: "Sofa", price: 100 }, 1);
    guestSession.setGuestSessionId(GUEST_SESSION_ID, "guest@example.com");
    expect(localStorage.getItem("guest_cart")).not.toBeNull();
    // VULN-009: the session credential is NOT persisted to
    // localStorage; it is available from page-session memory for
    // header use, and the durable copy is the server httpOnly cookie.
    expect(localStorage.getItem("aura_guest_session_id")).toBeNull();
    expect(guestSession.getGuestSessionId()).toBe(GUEST_SESSION_ID);
    expectStorageClean();

    // Login, then the sanctioned email prefill write (AuthModal's
    // path), then logout.
    authStore.getState().signIn(user);
    localStorage.setItem("lastUsedEmail", user.email);
    expectStorageClean();

    await authStore.getState().logout();
    expect(authStore.getState().isAuthenticated).toBe(false);

    // After logout: guest cart gone; guest email + lastUsedEmail KEPT
    // by disposition (§7 / FE-18); the guest session credential was
    // never in localStorage (VULN-009) and its in-memory value is
    // kept (ChatWidget owns clearing it); legacy keys absent;
    // nothing outside the allowed set; sessionStorage empty.
    expect(localStorage.getItem("guest_cart")).toBeNull();
    expect(localStorage.getItem("aura_guest_session_id")).toBeNull();
    expect(guestSession.getGuestSessionId()).toBe(GUEST_SESSION_ID);
    expect(localStorage.getItem("aura_guest_email")).toBe("guest@example.com");
    expect(localStorage.getItem("lastUsedEmail")).toBe(user.email);
    expectStorageClean();
  });

  it("VULN-009: a legacy persisted guest session id is removed on load and never re-persisted", async () => {
    // A credential written by an older build must not survive the
    // new module: importing it removes the legacy entry, the getter
    // does not resurrect it from storage, and set/clear keep it out.
    localStorage.setItem("aura_guest_session_id", GUEST_SESSION_ID);
    const { guestSession } = await importFresh(noSession);
    expect(localStorage.getItem("aura_guest_session_id")).toBeNull();
    expect(guestSession.getGuestSessionId()).toBeNull();

    guestSession.setGuestSessionId(GUEST_SESSION_ID);
    expect(localStorage.getItem("aura_guest_session_id")).toBeNull();
    expect(guestSession.getGuestSessionId()).toBe(GUEST_SESSION_ID);
    // No script-set guestSessionId cookie either (server owns it).
    expect(document.cookie).not.toContain("guestSessionId=");

    guestSession.clearGuestSession();
    expect(guestSession.getGuestSessionId()).toBeNull();
    expect(localStorage.getItem("aura_guest_session_id")).toBeNull();
    expectStorageClean();
  });

  it("a session restored from the cookie (/auth/me) writes nothing to storage", async () => {
    const { authStore } = await importFresh((api) => {
      api.get.mockResolvedValue({ data: { data: { user } } });
      api.post.mockResolvedValue({});
    });
    await vi.waitFor(() => expect(authStore.getState().loading).toBe(false));
    expect(authStore.getState().isAuthenticated).toBe(true);
    expect(authStore.getState().token).toBe("cookie");
    expect(storageEntries(localStorage)).toEqual([]);
    expectStorageClean();
  });
});
