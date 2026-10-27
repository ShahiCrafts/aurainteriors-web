// FE-16 regression net — dead navigation targets.
//
// Derives each app's route patterns by parsing src/App.jsx and
// src/AdminApp.jsx at test time (path="..." attributes; ":param" segments
// become [^/]+; the "*" catch-all is deliberately EXCLUDED — a target that
// only matches the catch-all is a dead target, i.e. the 404 page).
//
// Collects live navigation targets by rendering the components that emit
// them (Footer, MobileMenu, QuickActions, NotificationDropdown, AuthModal,
// AuthRequiredModal) and by probing the route guards under guest /
// customer / admin auth states, then asserts every collected target
// resolves against the route table of the app that renders it.
//
// Harness conventions follow tests/routing/guards.test.jsx: the API layer
// is mocked BEFORE the auth store is imported (the store auto-runs
// initialize() at import time), and auth state is driven via
// useAuthStore.setState(...).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import fs from "node:fs";

vi.mock("../../src/api/index.js", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
    post: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
    patch: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
    delete: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
  },
}));

// MobileMenu reads categories via useCategoryTree; give it slug-bearing
// categories exactly as the API tree returns them (see CategoryBar.jsx,
// which maps c.slug the same way).
vi.mock("../../src/hooks/product/useCategoryTan.js", () => ({
  useCategoryTree: () => ({
    data: {
      data: {
        categories: [
          { _id: "cat-1", name: "Sofas", slug: "sofas" },
          { _id: "cat-2", name: "King Beds", slug: "beds" },
        ],
      },
    },
    isLoading: false,
  }),
}));

// Phase 7: MobileMenu also reads the room/collection registries
// for its Rooms/Collections sections — inert stubs (no sections
// render, exactly the pre-Phase-7 link set plus category links).
vi.mock("../../src/hooks/catalog/useCatalogTan.js", () => ({
  useRooms: () => ({ data: undefined, isLoading: false }),
  useCollections: () => ({ data: undefined, isLoading: false }),
}));

// AuthModal's mutation hooks — inert stubs so the real modal can render.
vi.mock("../../src/hooks/auth/useMagicLinkTan.js", () => ({
  useSendMagicLink: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("../../src/hooks/profile/useProfileTan.js", () => ({
  useUpdateProfile: () => ({ mutate: vi.fn(), isPending: false }),
}));

// Footer's BrandMarquee is a pure logo strip with no navigation; stub it
// so the footer test is about links, not remote logo images.
vi.mock("../../src/components/sections/BrandMarquee.jsx", () => ({
  default: () => null,
}));

import useAuthStore from "../../src/store/authStore";
import Footer from "../../src/layouts/customer/Footer";
import MobileMenu from "../../src/components/navigation/MobileMenu";
import QuickActions from "../../src/components/admin/dashboard/QuickActions";
import NotificationDropdown from "../../src/components/common/NotificationDropdown";
import AuthModal from "../../src/components/modals/AuthModal";
import AuthRequiredModal from "../../src/components/chat/AuthRequiredModal";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";
import CustomerRoute from "../../src/components/auth/CustomerRoute";
import AdminRoute from "../../src/components/auth/AdminRoute";

// ─── Route-pattern derivation from the real route tables ─────────────────

function readSrc(rel) {
  return fs.readFileSync(new URL(rel, import.meta.url), "utf8");
}

function patternToRegex(pattern) {
  const escaped = pattern
    .split("/")
    .map((seg) => (seg.startsWith(":") ? "[^/]+" : seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
    .join("/");
  return new RegExp(`^${escaped}/?$`);
}

function derivePatterns(relFile, parentForRelative) {
  const source = readSrc(relFile);
  const raw = [...source.matchAll(/path="([^"]+)"/g)].map((m) => m[1]);
  const patterns = [];
  for (const p of raw) {
    if (p === "*") continue; // catch-all == dead target, never a valid one
    patterns.push(p.startsWith("/") ? p : `${parentForRelative}/${p}`);
  }
  // AdminApp also has an index route under /dashboard (the parent itself).
  return [...new Set(patterns)].map(patternToRegex);
}

const CUSTOMER_PATTERNS = derivePatterns("../../src/App.jsx", "");
const ADMIN_PATTERNS = derivePatterns("../../src/AdminApp.jsx", "/dashboard");

function matchesAny(patterns, target) {
  const clean = target.split(/[?#]/)[0] || "/";
  return patterns.some((re) => re.test(clean));
}

function internalHrefs(container) {
  return [...container.querySelectorAll("a[href]")]
    .map((a) => a.getAttribute("href"))
    .filter((h) => h !== null);
}

function deadTargets(patterns, targets) {
  // Internal targets start with "/"; "#" is a placeholder dead end.
  return targets.filter(
    (t) => (t.startsWith("/") || t === "#") && !matchesAny(patterns, t)
  );
}

// ─── Guard probing ────────────────────────────────────────────────────────

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-probe">{location.pathname}</div>;
}

function probeGuard(Guard, auth) {
  useAuthStore.setState(auth);
  const GuardComponent = Guard;
  const utils = render(
    <MemoryRouter initialEntries={["/guarded"]}>
      <LocationProbe />
      <Routes>
        <Route path="/" element={<div>AT-ROOT</div>} />
        <Route path="/login" element={<div>AT-LOGIN</div>} />
        <Route
          path="/guarded"
          element={
            <GuardComponent>
              <div>CHILD-SENTINEL</div>
            </GuardComponent>
          }
        />
        <Route path="*" element={<div>AT-CATCHALL</div>} />
      </Routes>
    </MemoryRouter>
  );
  const redirected = !screen.queryByText("CHILD-SENTINEL");
  const target = redirected
    ? utils.getByTestId("location-probe").textContent
    : null;
  utils.unmount();
  return target;
}

const GUEST = { loading: false, isAuthenticated: false, user: null };
const CUSTOMER = {
  loading: false,
  isAuthenticated: true,
  user: { _id: "u-customer", role: "customer" },
};
const ADMIN = {
  loading: false,
  isAuthenticated: true,
  user: { _id: "u-admin", role: "admin" },
};

beforeEach(() => {
  useAuthStore.setState({
    ...GUEST,
    isAuthModalOpen: false,
    authModalView: "email",
  });
});

// ─── Footer (customer app) ────────────────────────────────────────────────

describe("FE-16 link integrity — Footer (customer app)", () => {
  it("every internal footer href resolves to a customer route", () => {
    const { container } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    const hrefs = internalHrefs(container);
    expect(hrefs.length).toBeGreaterThan(0);
    expect(deadTargets(CUSTOMER_PATTERNS, hrefs)).toEqual([]);
  });

  it("no footer href is a '#' placeholder", () => {
    const { container } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    expect(internalHrefs(container)).not.toContain("#");
  });
});

// ─── MobileMenu (customer app) ────────────────────────────────────────────

describe("FE-16 link integrity — MobileMenu (customer app)", () => {
  it("every mobile-menu href resolves to a customer route (slug-based shop links)", () => {
    const { container } = render(
      <MemoryRouter>
        <MobileMenu isOpen onClose={() => {}} />
      </MemoryRouter>
    );
    const hrefs = internalHrefs(container);
    // All Categories + one link per mocked category.
    expect(hrefs.length).toBe(3);
    expect(deadTargets(CUSTOMER_PATTERNS, hrefs)).toEqual([]);
    expect(hrefs).toContain("/shop");
    expect(hrefs).toContain("/shop?categories=sofas");
    expect(hrefs).toContain("/shop?categories=beds");
  });
});

// ─── Guards ───────────────────────────────────────────────────────────────

describe("FE-16 link integrity — guards", () => {
  it("CustomerRoute never redirects to a dead customer target (guest/customer/admin)", () => {
    for (const auth of [GUEST, CUSTOMER, ADMIN]) {
      const target = probeGuard(CustomerRoute, auth);
      if (target !== null) {
        expect(matchesAny(CUSTOMER_PATTERNS, target)).toBe(true);
      }
    }
    // FE-16 intended behavior: admins render the children, no bounce.
    expect(probeGuard(CustomerRoute, ADMIN)).toBeNull();
  });

  it("ProtectedRoute never redirects to a dead customer target (guest/customer/admin)", () => {
    for (const auth of [GUEST, CUSTOMER, ADMIN]) {
      const target = probeGuard(ProtectedRoute, auth);
      if (target !== null) {
        expect(matchesAny(CUSTOMER_PATTERNS, target)).toBe(true);
      }
    }
    expect(probeGuard(ProtectedRoute, ADMIN)).toBeNull();
    expect(probeGuard(ProtectedRoute, GUEST)).toBe("/");
  });

  it("AdminRoute redirects only to a real admin target", () => {
    expect(probeGuard(AdminRoute, GUEST)).toBe("/login");
    expect(matchesAny(ADMIN_PATTERNS, "/login")).toBe(true);
    expect(probeGuard(AdminRoute, CUSTOMER)).toBe("/login");
    expect(probeGuard(AdminRoute, ADMIN)).toBeNull();
  });

  it("HomePage and AuthCallback contain no '/admin' navigation literal", () => {
    const home = readSrc("../../src/pages/HomePage.jsx");
    const callback = readSrc("../../src/components/auth/AuthCallback.jsx");
    expect(home).not.toMatch(/["'`]\/admin["'`]/);
    expect(callback).not.toMatch(/["'`]\/admin["'`]/);
  });
});

// ─── AuthRequiredModal (customer chat) ────────────────────────────────────

describe("FE-16 link integrity — AuthRequiredModal opens the global AuthModal", () => {
  it("Sign In opens the AuthModal (email view) without changing location", () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter initialEntries={["/track-order"]}>
        <LocationProbe />
        <AuthRequiredModal isOpen onClose={onClose} message="Login required" />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(onClose).toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthModalOpen).toBe(true);
    expect(useAuthStore.getState().authModalView).toBe("email");
    expect(screen.getByTestId("location-probe").textContent).toBe("/track-order");
  });

  it("Sign Up opens the AuthModal (email view) without changing location", () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter initialEntries={["/track-order"]}>
        <LocationProbe />
        <AuthRequiredModal isOpen onClose={onClose} message="Login required" />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
    expect(onClose).toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthModalOpen).toBe(true);
    expect(useAuthStore.getState().authModalView).toBe("email");
    expect(screen.getByTestId("location-probe").textContent).toBe("/track-order");
  });
});

// ─── AuthModal legal links (customer app) ─────────────────────────────────

describe("FE-16 link integrity — AuthModal (customer app)", () => {
  it("the open AuthModal emits no dead internal hrefs", () => {
    useAuthStore.setState({ isAuthModalOpen: true, authModalView: "email" });
    const { container } = render(<AuthModal />);
    const hrefs = internalHrefs(container);
    expect(deadTargets(CUSTOMER_PATTERNS, hrefs)).toEqual([]);
  });
});

// ─── Admin-app siblings ───────────────────────────────────────────────────

describe("FE-16 link integrity — admin-app components", () => {
  it("every QuickActions href resolves to an admin route", () => {
    const { container } = render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>
    );
    const hrefs = internalHrefs(container);
    expect(hrefs.length).toBeGreaterThan(0);
    expect(deadTargets(ADMIN_PATTERNS, hrefs)).toEqual([]);
  });

  it("NotificationDropdown (rendered only in the admin app) emits no dead internal hrefs", () => {
    const { container } = render(
      <NotificationDropdown
        notifications={[]}
        loading={false}
        unreadCount={0}
        onNotificationClick={() => {}}
      />
    );
    const hrefs = internalHrefs(container);
    expect(deadTargets(ADMIN_PATTERNS, hrefs)).toEqual([]);
  });
});

// ─── Forbidden customer-app targets (the FE-16 dead ends) ────────────────

describe("FE-16 link integrity — forbidden customer targets", () => {
  it("none of '/admin', '/products', '/login', '/signup' is emitted as a customer-app target", () => {
    const collected = [];

    const footer = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    collected.push(...internalHrefs(footer.container));
    footer.unmount();

    const menu = render(
      <MemoryRouter>
        <MobileMenu isOpen onClose={() => {}} />
      </MemoryRouter>
    );
    collected.push(...internalHrefs(menu.container));
    menu.unmount();

    for (const Guard of [CustomerRoute, ProtectedRoute]) {
      for (const auth of [GUEST, CUSTOMER, ADMIN]) {
        const target = probeGuard(Guard, auth);
        if (target !== null) collected.push(target);
      }
    }

    for (const forbidden of ["/admin", "/products", "/login", "/signup"]) {
      const hit = collected.find(
        (t) => t === forbidden || t.startsWith(`${forbidden}?`) || t.startsWith(`${forbidden}/`)
      );
      expect(hit, `forbidden target ${forbidden} was emitted`).toBeUndefined();
    }
  });
});
