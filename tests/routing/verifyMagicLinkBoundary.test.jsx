// FE-56 — /auth/verify is the one lazy route with NO Suspense wrapper and
// the customer LoadingSpinner returns null. Rendering the real App at
// /auth/verify with the verify page (a) suspending must show a non-empty
// spinner fallback, and (b) throwing must show the ErrorBoundary fallback
// instead of a blank screen / uncaught crash.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../src/api/index.js", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("mocked: no network"))),
    post: vi.fn(() => Promise.reject(new Error("mocked: no network"))),
    patch: vi.fn(() => Promise.reject(new Error("mocked: no network"))),
    delete: vi.fn(() => Promise.reject(new Error("mocked: no network"))),
  },
}));

const hoisted = vi.hoisted(() => ({ mode: "suspend" }));
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

vi.mock("../../src/pages/auth/VerifyMagicLinkPage.jsx", async () => {
  const React = await import("react");
  return {
    default: () => {
      if (hoisted.mode === "suspend") {
        // Suspend forever: React must show the Suspense fallback.
        throw new Promise(() => {});
      }
      throw new Error("VERIFY_CHUNK_SECRET_FAILURE");
    },
  };
});

import useAuthStore from "../../src/store/authStore";
import App from "../../src/App.jsx";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  useAuthStore.setState({ loading: false, isAuthenticated: false, user: null });
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("/auth/verify boundary + fallback (FE-56)", () => {
  it("suspending verify page shows a non-empty skeleton fallback", async () => {
    hoisted.mode = "suspend";
    render(
      <MemoryRouter initialEntries={["/auth/verify"]}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });

  it("throwing verify page renders the ErrorBoundary fallback with Reload, not a blank screen", async () => {
    hoisted.mode = "throw";
    const { container } = render(
      <MemoryRouter initialEntries={["/auth/verify"]}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/Something went wrong/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reload/i })).toBeInTheDocument();
    expect(container.textContent).not.toContain("VERIFY_CHUNK_SECRET_FAILURE");
  });
});
