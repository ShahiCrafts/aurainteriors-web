// Characterization tests for the three REAL route guards:
//   src/components/auth/ProtectedRoute.jsx
//   src/components/auth/CustomerRoute.jsx
//   src/components/auth/AdminRoute.jsx
//
// The API layer is mocked BEFORE the auth store is imported, because
// useAuthStore auto-runs initialize() at import time
// (src/store/authStore.js, last line). initialize() dynamically imports
// src/api/index.js and calls api.get("/auth/me"); the mock rejects, so
// initialization settles without any network. Per-test auth state is then
// controlled directly via useAuthStore.setState(...).
//
// Each guard is rendered inside a MemoryRouter with sentinel routes so
// <Navigate> redirects are observable as rendered sentinel text.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("../../src/api/index.js", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
    post: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
  },
}));

import useAuthStore from "../../src/store/authStore";
import ProtectedRoute from "../../src/components/auth/ProtectedRoute";
import CustomerRoute from "../../src/components/auth/CustomerRoute";
import AdminRoute from "../../src/components/auth/AdminRoute";

function renderGuard(Guard) {
  // Aliased so the guard component is referenced as a plain variable:
  // this repo's ESLint setup (no eslint-plugin-react) does not count JSX
  // tag usage as a use for function parameters.
  const GuardComponent = Guard;
  return render(
    <MemoryRouter initialEntries={["/guarded"]}>
      <Routes>
        <Route path="/" element={<div>HOME-SENTINEL</div>} />
        <Route path="/admin" element={<div>ADMIN-SENTINEL</div>} />
        <Route path="/login" element={<div>LOGIN-SENTINEL</div>} />
        <Route
          path="/guarded"
          element={
            <GuardComponent>
              <div>CHILD-SENTINEL</div>
            </GuardComponent>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

function setAuth(state) {
  useAuthStore.setState(state);
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
const LOADING = { loading: true, isAuthenticated: false, user: null };

beforeEach(() => {
  setAuth({ ...GUEST });
});

describe("ProtectedRoute (src/components/auth/ProtectedRoute.jsx)", () => {
  it("loading -> renders nothing", () => {
    setAuth({ ...LOADING });
    const { container } = renderGuard(ProtectedRoute);
    expect(screen.queryByText("CHILD-SENTINEL")).not.toBeInTheDocument();
    expect(screen.queryByText("HOME-SENTINEL")).not.toBeInTheDocument();
    expect(screen.queryByText("ADMIN-SENTINEL")).not.toBeInTheDocument();
    expect(container.textContent).toBe("");
  });

  it('unauthenticated -> redirects to "/"', () => {
    setAuth({ ...GUEST });
    renderGuard(ProtectedRoute);
    expect(screen.getByText("HOME-SENTINEL")).toBeInTheDocument();
    expect(screen.queryByText("CHILD-SENTINEL")).not.toBeInTheDocument();
  });

  // FE-16 (Phase 1): previously pinned the admin bounce to "/admin", a
  // route that does not exist in the customer app (404 catch-all). The
  // bounce was removed; admins now render the children.
  it("authenticated admin -> renders children (FE-16: /admin bounce removed)", () => {
    setAuth({ ...ADMIN });
    renderGuard(ProtectedRoute);
    expect(screen.getByText("CHILD-SENTINEL")).toBeInTheDocument();
    expect(screen.queryByText("ADMIN-SENTINEL")).not.toBeInTheDocument();
  });

  it("authenticated non-admin -> renders children", () => {
    setAuth({ ...CUSTOMER });
    renderGuard(ProtectedRoute);
    expect(screen.getByText("CHILD-SENTINEL")).toBeInTheDocument();
  });
});

describe("CustomerRoute (src/components/auth/CustomerRoute.jsx)", () => {
  it("loading -> renders nothing", () => {
    setAuth({ ...LOADING });
    const { container } = renderGuard(CustomerRoute);
    expect(screen.queryByText("CHILD-SENTINEL")).not.toBeInTheDocument();
    expect(screen.queryByText("ADMIN-SENTINEL")).not.toBeInTheDocument();
    expect(container.textContent).toBe("");
  });

  // FE-16 (Phase 1): previously pinned the admin bounce to "/admin", a
  // route that does not exist in the customer app (404 catch-all). The
  // bounce was removed; admins now render the children.
  it("admin -> renders children (FE-16: /admin bounce removed)", () => {
    setAuth({ ...ADMIN });
    renderGuard(CustomerRoute);
    expect(screen.getByText("CHILD-SENTINEL")).toBeInTheDocument();
    expect(screen.queryByText("ADMIN-SENTINEL")).not.toBeInTheDocument();
  });

  it("guest -> renders children", () => {
    setAuth({ ...GUEST });
    renderGuard(CustomerRoute);
    expect(screen.getByText("CHILD-SENTINEL")).toBeInTheDocument();
  });

  it("authenticated customer -> renders children", () => {
    setAuth({ ...CUSTOMER });
    renderGuard(CustomerRoute);
    expect(screen.getByText("CHILD-SENTINEL")).toBeInTheDocument();
  });
});

describe("AdminRoute (src/components/auth/AdminRoute.jsx)", () => {
  it("loading -> renders nothing", () => {
    setAuth({ ...LOADING });
    const { container } = renderGuard(AdminRoute);
    expect(screen.queryByText("CHILD-SENTINEL")).not.toBeInTheDocument();
    expect(screen.queryByText("LOGIN-SENTINEL")).not.toBeInTheDocument();
    expect(container.textContent).toBe("");
  });

  it('unauthenticated -> redirects to "/login"', () => {
    setAuth({ ...GUEST });
    renderGuard(AdminRoute);
    expect(screen.getByText("LOGIN-SENTINEL")).toBeInTheDocument();
    expect(screen.queryByText("CHILD-SENTINEL")).not.toBeInTheDocument();
  });

  it('authenticated non-admin -> redirects to "/login"', () => {
    setAuth({ ...CUSTOMER });
    renderGuard(AdminRoute);
    expect(screen.getByText("LOGIN-SENTINEL")).toBeInTheDocument();
    expect(screen.queryByText("CHILD-SENTINEL")).not.toBeInTheDocument();
  });

  it("admin -> renders children", () => {
    setAuth({ ...ADMIN });
    renderGuard(AdminRoute);
    expect(screen.getByText("CHILD-SENTINEL")).toBeInTheDocument();
  });
});
