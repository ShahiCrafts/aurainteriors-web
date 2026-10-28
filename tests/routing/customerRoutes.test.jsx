// Route-tree characterization for the REAL src/App.jsx (customer portal).
//
// Every lazy page module imported by App.jsx is vi.mock'ed to a tiny marker
// component ("PAGE:<Name>"), as are AuthModal and ChatWidget (stubbed per
// brief) and AuthCallback (non-lazy import in App.jsx; stubbed so its
// profile-fetch effect/token toast logic cannot leak into route tests).
// The guards (ProtectedRoute / CustomerRoute) and the route configuration in
// App.jsx itself stay REAL. Auth state is controlled via
// useAuthStore.setState(...) with src/api/index.js mocked before the store
// is imported (the store auto-runs initialize() at import).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../src/api/index.js", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
    post: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
    patch: vi.fn(() =>
      Promise.reject(new Error("mocked: no network in tests")),
    ),
    delete: vi.fn(() =>
      Promise.reject(new Error("mocked: no network in tests")),
    ),
  },
}));

// --- Lazy page/layout markers (imports enumerated from src/App.jsx) ---
// vi.mock calls are hoisted above top-level code, so the factory helper
// itself must be created via vi.hoisted.
const { marker } = vi.hoisted(() => {
  const markerFn = (label) => async () => {
    const React = await import("react");
    return { default: () => React.createElement("div", null, label) };
  };
  return { marker: markerFn };
});

vi.mock(
  "../../src/pages/NewsletterActionPage.jsx",
  marker("PAGE:NewsletterActionPage"),
);
vi.mock("../../src/pages/HomePage.jsx", marker("PAGE:HomePage"));
vi.mock("../../src/components/modals/AuthModal.jsx", marker("PAGE:AuthModal"));
vi.mock("../../src/components/chat/ChatWidget.jsx", marker("PAGE:ChatWidget"));
vi.mock(
  "../../src/pages/auth/VerifyMagicLinkPage.jsx",
  marker("PAGE:VerifyMagicLinkPage"),
);
vi.mock("../../src/pages/customer/ProfilePage.jsx", marker("PAGE:ProfilePage"));
vi.mock(
  "../../src/pages/customer/NotificationsPage.jsx",
  marker("PAGE:NotificationsPage"),
);
vi.mock("../../src/pages/shop/ShopPage.jsx", marker("PAGE:ShopPage"));
vi.mock("../../src/pages/blog/BlogsPage.jsx", marker("PAGE:BlogsPage"));
vi.mock(
  "../../src/pages/blog/BlogDetailsPage.jsx",
  marker("PAGE:BlogDetailsPage"),
);
vi.mock(
  "../../src/pages/shop/ProductDetailsPage.jsx",
  marker("PAGE:ProductDetailsPage"),
);
vi.mock("../../src/pages/shop/ARViewPage.jsx", marker("PAGE:ARViewPage"));
vi.mock("../../src/pages/shop/NativeARPage.jsx", marker("PAGE:NativeARPage"));
vi.mock(
  "../../src/pages/checkout/CheckoutPage.jsx",
  marker("PAGE:CheckoutPage"),
);
vi.mock(
  "../../src/pages/customer/OrderConfirmationPage.jsx",
  marker("PAGE:OrderConfirmationPage"),
);
vi.mock(
  "../../src/pages/checkout/PaymentFailedPage.jsx",
  marker("PAGE:PaymentFailedPage"),
);
vi.mock(
  "../../src/pages/customer/TrackOrderPage.jsx",
  marker("PAGE:TrackOrderPage"),
);
vi.mock("../../src/pages/info/ContactPage.jsx", marker("PAGE:ContactPage"));
vi.mock("../../src/pages/info/FAQPage.jsx", marker("PAGE:FAQPage"));
vi.mock("../../src/pages/info/NotFoundPage.jsx", marker("PAGE:NotFoundPage"));
vi.mock(
  "../../src/pages/info/AnnouncementsPage.jsx",
  marker("PAGE:AnnouncementsPage"),
);
vi.mock(
  "../../src/components/auth/AuthCallback.jsx",
  marker("PAGE:AuthCallback"),
);

import useAuthStore from "../../src/store/authStore";
import App from "../../src/App.jsx";

const GUEST = { loading: false, isAuthenticated: false, user: null };
const ADMIN = {
  loading: false,
  isAuthenticated: true,
  user: { _id: "u-admin", role: "admin" },
};

function renderApp(path, auth) {
  useAuthStore.setState(auth);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ ...GUEST });
});

describe("customer route tree (src/App.jsx)", () => {
  it('"/" renders the HomePage marker', async () => {
    renderApp("/", { ...GUEST });
    expect(await screen.findByText("PAGE:HomePage")).toBeInTheDocument();
  });

  it("an unknown path renders the NotFoundPage marker", async () => {
    renderApp("/definitely-not-a-real-route", { ...GUEST });
    expect(await screen.findByText("PAGE:NotFoundPage")).toBeInTheDocument();
  });

  it('"/profile" while unauthenticated lands on the HomePage marker (ProtectedRoute -> "/")', async () => {
    renderApp("/profile", { ...GUEST });
    expect(await screen.findByText("PAGE:HomePage")).toBeInTheDocument();
    expect(screen.queryByText("PAGE:ProfilePage")).not.toBeInTheDocument();
  });

  // FE-16 (Phase 1): this test previously pinned the AS-IS admin bounce —
  // CustomerRoute navigated an authenticated admin visiting "/shop" to
  // "/admin", which landed on the customer catch-all (NotFoundPage)
  // because the customer route tree has no "/admin" route. The bounce was
  // removed; admins now render the customer page.
  it('FE-16: authenticated admin visiting "/shop" renders the ShopPage marker (bounce removed)', async () => {
    renderApp("/shop", { ...ADMIN });
    expect(await screen.findByText("PAGE:ShopPage")).toBeInTheDocument();
    expect(screen.queryByText("PAGE:NotFoundPage")).not.toBeInTheDocument();
  });
});
