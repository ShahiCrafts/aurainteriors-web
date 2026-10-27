// Route-tree characterization for the REAL src/AdminApp.jsx (admin portal).
//
// Every lazy page/layout module imported by AdminApp.jsx is vi.mock'ed to a
// tiny marker component ("PAGE:<Name>" / "LAYOUT:AdminLayout").
// AdminLoginPage is a NON-lazy direct import in AdminApp.jsx; it is also
// stubbed to a marker ("PAGE:AdminLoginPage") so the login route is
// observable without pulling in the real login form and its auth hooks.
// The guard (AdminRoute) and the route configuration in AdminApp.jsx itself
// stay REAL. Auth state is controlled via useAuthStore.setState(...) with
// src/api/index.js mocked before the store is imported (the store auto-runs
// initialize() at import).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../src/api/index.js", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
    post: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
    patch: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
    delete: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
  },
}));

// --- Lazy page/layout markers (imports enumerated from src/AdminApp.jsx) ---
// vi.mock calls are hoisted above top-level code, so the factory helper
// itself must be created via vi.hoisted.
const { marker } = vi.hoisted(() => {
  const markerFn = (label) => async () => {
    const React = await import("react");
    return { default: () => React.createElement("div", null, label) };
  };
  return { marker: markerFn };
});

vi.mock("../../src/pages/admin/AdminLoginPage.jsx", marker("PAGE:AdminLoginPage"));
vi.mock("../../src/layouts/admin/AdminLayout.jsx", marker("LAYOUT:AdminLayout"));
vi.mock("../../src/pages/admin/Dashboard.jsx", marker("PAGE:AdminDashboard"));
vi.mock("../../src/pages/admin/Categories.jsx", marker("PAGE:AdminCategories"));
vi.mock("../../src/pages/admin/Products.jsx", marker("PAGE:AdminProducts"));
vi.mock("../../src/pages/admin/Orders.jsx", marker("PAGE:AdminOrders"));
vi.mock("../../src/pages/admin/Discounts.jsx", marker("PAGE:AdminDiscounts"));
vi.mock("../../src/pages/admin/Reviews.jsx", marker("PAGE:AdminReviews"));
vi.mock("../../src/pages/admin/Promotions.jsx", marker("PAGE:AdminPromotions"));
vi.mock("../../src/pages/admin/Announcements.jsx", marker("PAGE:AdminAnnouncements"));
vi.mock("../../src/pages/admin/SupportChats.jsx", marker("PAGE:AdminSupportChats"));
vi.mock("../../src/pages/admin/KnowledgeBase.jsx", marker("PAGE:AdminKnowledgeBase"));
vi.mock("../../src/pages/admin/Contacts.jsx", marker("PAGE:AdminContacts"));
vi.mock("../../src/pages/admin/Users.jsx", marker("PAGE:AdminUsers"));
vi.mock("../../src/pages/info/NotFoundPage.jsx", marker("PAGE:NotFoundPage"));

import useAuthStore from "../../src/store/authStore";
import AdminApp from "../../src/AdminApp.jsx";

const GUEST = { loading: false, isAuthenticated: false, user: null };
const ADMIN = {
  loading: false,
  isAuthenticated: true,
  user: { _id: "u-admin", role: "admin" },
};

function renderAdminApp(path, auth) {
  useAuthStore.setState(auth);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AdminApp />
    </MemoryRouter>
  );
}

beforeEach(() => {
  useAuthStore.setState({ ...GUEST });
});

describe("admin route tree (src/AdminApp.jsx)", () => {
  it('"/" redirects to the AdminLoginPage marker (route /login)', async () => {
    renderAdminApp("/", { ...GUEST });
    expect(await screen.findByText("PAGE:AdminLoginPage")).toBeInTheDocument();
  });

  it('"/dashboard" while unauthenticated lands on the login marker', async () => {
    renderAdminApp("/dashboard", { ...GUEST });
    expect(await screen.findByText("PAGE:AdminLoginPage")).toBeInTheDocument();
    expect(screen.queryByText("LAYOUT:AdminLayout")).not.toBeInTheDocument();
  });

  it('"/dashboard" as admin renders the AdminLayout marker', async () => {
    renderAdminApp("/dashboard", { ...ADMIN });
    expect(await screen.findByText("LAYOUT:AdminLayout")).toBeInTheDocument();
  });

  it("an unknown admin path renders the NotFoundPage marker", async () => {
    renderAdminApp("/definitely-not-a-real-admin-route", { ...ADMIN });
    expect(await screen.findByText("PAGE:NotFoundPage")).toBeInTheDocument();
  });
});
