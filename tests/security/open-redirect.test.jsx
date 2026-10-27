// Phase 5 OPEN-REDIRECT SWEEP — permanent tests (Worker B).
//
// Full sink census: audit/fe/remediation/phase5/redirect-census.md.
// Summary of what the sweep established:
//
//  * NO return-to mechanism exists anywhere in src/: no code reads
//    a returnTo / redirect / next / from / url / target / continue
//    query param (or a router-state `from`) and navigates to it.
//    Post-login navigation is always a literal internal route:
//    AuthCallback → "/", VerifyMagicLinkPage → "/", AdminLoginPage
//    → "/dashboard", Google OAuth → the configured API origin's
//    /auth/google (full-page, server completes the flow and the
//    client callback lands on "/"). The structural tests below pin
//    the ABSENCE of a return-to surface so one cannot appear
//    unvalidated.
//  * The one dynamic navigation surface is the stored notification
//    / announcement `actionUrl` (FE-04). Every consumer must route
//    it through safeActionUrl(..., { inAppOnly: true }) before it
//    reaches navigate() or <Link to>.
//  * FINDING (Phase 5, fixed with this test): the customer
//    NotificationsPage passed `n.actionUrl` RAW to <Link to> —
//    the fourth actionUrl consumer, missed by the FE-04 fix that
//    covered NotificationBell, AdminLayout toasts and
//    AnnouncementsPage. A stored `https://evil.com` / `//evil.com`
//    / `javascript:` actionUrl became a clickable redirect/XSS
//    link for any signed-in customer. The component tests below
//    are the reproduction: they failed pre-fix (hostile hrefs
//    rendered verbatim) and pass post-fix.

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { safeActionUrl, validateExternalUrl } from "../../src/utils/safeUrl.js";

vi.mock("../../src/api/index.js", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("mocked: no network"))),
    post: vi.fn(() => Promise.resolve({})),
  },
}));
vi.mock("../../src/api/notificationApi.js", () => ({
  default: {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markMultipleAsRead: vi.fn(),
    archiveNotification: vi.fn(),
  },
}));
vi.mock("../../src/hooks/notification/useNotificationSocket.js", () => ({
  default: () => ({ socket: null }),
}));
vi.mock("../../src/layouts/customer/Navbar.jsx", () => ({ default: () => null }));

import notificationApi from "../../src/api/notificationApi.js";
import useAuthStore from "../../src/store/authStore.js";
import NotificationsPage from "../../src/pages/customer/NotificationsPage.jsx";

// ------------------------------------------------------------------
// A. Hostile battery against the redirect-relevant helper export.
//    safeActionUrl with inAppOnly:true is the gate every stored
//    actionUrl must pass before navigate()/Link. Every hostile
//    value must come back null (rejected) — never the raw value,
//    never an off-site URL.
// ------------------------------------------------------------------
const HOSTILE = [
  "//evil.com",
  "//evil.com/phish",
  "https://evil.com",
  "https://evil.com/phish?x=1",
  "http://evil.com",
  "javascript:alert(1)",
  "JaVaScRiPt:alert(1)",
  "java\tscript:alert(1)", // control char inside the scheme
  "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
  "vbscript:msgbox(1)",
  "/\\evil.com",
  "\\\\evil.com",
  "////evil.com",
  "%2f%2fevil.com",
  "%5c%5cevil.com",
  "https://res.cloudinary.com@evil.com/steal", // userinfo spoof of an allowlisted host
  "https://evil.com#@res.cloudinary.com",
  "https://localhost:3001@evil.com/", // userinfo spoof of the app origin
  "http://127.0.0.1:3001/orders",
  "https:evil.com", // scheme without authority
  "evil.com/orders", // bare host, no leading slash
];

describe("open-redirect battery — safeActionUrl(inAppOnly) rejects every external/dangerous form", () => {
  for (const hostile of HOSTILE) {
    it(`rejects ${JSON.stringify(hostile)}`, () => {
      expect(safeActionUrl(hostile, { inAppOnly: true })).toBeNull();
    });
  }

  it("validateExternalUrl (blog link-out helper) rejects every non-https form", () => {
    for (const hostile of HOSTILE) {
      const out = validateExternalUrl(hostile);
      expect(out === null || out.startsWith("https://")).toBe(true);
      if (out !== null) expect(out).not.toMatch(/^(javascript|data|vbscript):/i);
    }
    expect(validateExternalUrl("javascript:alert(1)")).toBeNull();
    expect(validateExternalUrl("//evil.com")).toBeNull();
  });

  it("encoded-slash site-relative paths are confined to the origin (never protocol-relative)", () => {
    // safeActionUrl returns "/%2fevil.com" unchanged: a site-relative
    // path whose first segment is percent-encoded. Unlike
    // validateMediaUrl it does not reject %-encoded first segments,
    // so pin the property that makes it safe as a NAVIGATION
    // target: resolved against the page origin it stays on the
    // origin — the browser never treats %-encoded slashes as the
    // "//" authority delimiter.
    const out = safeActionUrl("/%2fevil.com", { inAppOnly: true });
    expect(out).not.toBeNull();
    expect(out.startsWith("//")).toBe(false);
    expect(new URL(out, window.location.origin).origin).toBe(window.location.origin);
  });

  it("positive controls: internal targets survive, own-origin absolutes are reduced to paths", () => {
    expect(safeActionUrl("/orders/123", { inAppOnly: true })).toBe("/orders/123");
    expect(safeActionUrl("/admin/orders", { inAppOnly: true })).toBe("/dashboard/orders");
    // Configured API origin (vitest env placeholder http://localhost:3001).
    expect(safeActionUrl("http://localhost:3001/orders/9", { inAppOnly: true })).toBe("/orders/9");
  });
});

// ------------------------------------------------------------------
// B. Component regression — NotificationsPage must not render a
//    stored hostile actionUrl as a link target (the Phase 5
//    finding). Reproduces pre-fix; passes post-fix.
// ------------------------------------------------------------------
function notification(overrides) {
  return {
    _id: overrides._id,
    title: "Order update",
    message: "Your order status changed.",
    createdAt: new Date().toISOString(),
    isRead: false,
    type: "order_status",
    category: "order",
    ...overrides,
  };
}

async function renderNotificationsPage(notifications) {
  notificationApi.getNotifications.mockResolvedValue({
    data: { notifications, totalPages: 1, page: 1 },
  });
  notificationApi.getUnreadCount.mockResolvedValue({ data: { unreadCount: 0 } });
  useAuthStore.setState({ user: { _id: "user-1" }, token: "cookie", loading: false });
  const utils = render(
    <MemoryRouter>
      <NotificationsPage />
    </MemoryRouter>
  );
  // Wait for the notifications themselves to render (a hostile-only
  // fixture correctly renders NO "View details" link, so the link
  // cannot be the readiness signal).
  await waitFor(() => expect(screen.getAllByText("Order update").length).toBeGreaterThan(0));
  return utils;
}

describe("NotificationsPage actionUrl — hostile stored values never become link targets", () => {
  it("https://evil.com actionUrl renders NO view-details link (and no evil href anywhere)", async () => {
    const { container } = await renderNotificationsPage([
      notification({ _id: "n1", actionUrl: "https://evil.com/phish" }),
      notification({ _id: "n2", actionUrl: "/profile" }),
    ]);
    // Only the benign internal one may render a link.
    const links = [...container.querySelectorAll("a")];
    expect(links.some((a) => (a.getAttribute("href") || "").includes("evil.com"))).toBe(false);
    const viewDetails = screen.getAllByText("View details");
    expect(viewDetails).toHaveLength(1);
    expect(viewDetails[0].closest("a").getAttribute("href")).toBe("/profile");
  });

  it.each(["//evil.com", "javascript:alert(1)", "/\\evil.com", "////evil.com", "%2f%2fevil.com"])(
    "hostile actionUrl %s renders no link",
    async (actionUrl) => {
      const { container } = await renderNotificationsPage([notification({ _id: "nx", actionUrl })]);
      expect(container.querySelectorAll("a")).toHaveLength(0);
      expect(screen.queryByText("View details")).toBeNull();
    }
  );

  it("hostile actionUrl WITH an orderId falls back to the internal /profile orders tab", async () => {
    await renderNotificationsPage([
      notification({ _id: "n3", actionUrl: "https://evil.com", data: { orderId: "ord-1" } }),
    ]);
    const link = screen.getByText("View details").closest("a");
    expect(link.getAttribute("href")).toBe("/profile");
  });

  it("benign site-relative actionUrl still renders as an internal link", async () => {
    await renderNotificationsPage([notification({ _id: "n4", actionUrl: "/announcements" })]);
    const link = screen.getByText("View details").closest("a");
    expect(link.getAttribute("href")).toBe("/announcements");
  });
});

// ------------------------------------------------------------------
// C. Structural pins — no return-to surface, and every dynamic
//    navigation sink stays behind the helper.
// ------------------------------------------------------------------
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "src");
function collect(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) collect(full, out);
    else if (/\.(js|jsx)$/.test(entry)) out.push(full);
  }
  return out;
}
const SRC_FILES = collect(SRC);
const srcText = (file) => readFileSync(file, "utf8");
const rel = (file) => path.relative(ROOT, file);

describe("structural — no return-to / open-redirect surface can reappear unguarded", () => {
  it("no src file reads a redirect-ish query param (returnTo/redirect/next/from/url/target/continue)", () => {
    const hits = [];
    for (const file of SRC_FILES) {
      for (const m of srcText(file).matchAll(/\.get\(\s*["'](returnTo|redirect|next|from|url|target|continue)["']\s*\)/g)) {
        hits.push(`${rel(file)}: .get("${m[1]}")`);
      }
      if (/state\?\.from\b|location\.state\?\.from\b/.test(srcText(file))) hits.push(`${rel(file)}: router-state from`);
    }
    expect(hits).toEqual([]);
  });

  it("navigate(variable) occurs only at the two safeActionUrl-guarded sites", () => {
    const sites = [];
    for (const file of SRC_FILES) {
      if (/navigate\(\s*targetUrl\s*\)/.test(srcText(file))) sites.push(rel(file));
    }
    expect(sites.sort()).toEqual([
      "src/components/common/NotificationBell.jsx",
      "src/layouts/admin/AdminLayout.jsx",
    ]);
    for (const site of sites) {
      const text = srcText(path.join(ROOT, site));
      expect(text).toContain("safeActionUrl");
      expect(text).toContain("inAppOnly: true");
    }
  });

  it("no <Link to> / navigate receives a raw .actionUrl value (the Phase 5 finding pattern)", () => {
    const hits = [];
    for (const file of SRC_FILES) {
      srcText(file).split("\n").forEach((line, i) => {
        if (/to=\{[^}]*\.actionUrl/.test(line) || /navigate\([^)]*\.actionUrl/.test(line)) {
          hits.push(`${rel(file)}:${i + 1}`);
        }
      });
    }
    expect(hits).toEqual([]);
  });

  it("window.location.href is assigned only at the three censused sites", () => {
    const sites = [];
    for (const file of SRC_FILES) {
      if (/window\.location\.href\s*=/.test(srcText(file))) sites.push(rel(file));
    }
    expect(sites.sort()).toEqual([
      "src/components/modals/ARViewModal.jsx", // config-origin base + encodeURIComponent slug
      "src/components/modals/AuthModal.jsx", // `${API_V1_URL}/auth/google` — configured origin
      "src/pages/customer/ProfilePage.jsx", // literal "/"
    ]);
  });
});
