import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const h = vi.hoisted(() => ({ state: { loading: false, isAuthenticated: true, user: { _id: "m1", role: "manager" } } }));
vi.mock("../../../src/store/authStore.js", () => {
  const store = (sel) => (typeof sel === "function" ? sel(h.state) : h.state);
  store.getState = () => h.state;
  return { default: store };
});
import AdminRoute from "../../../src/components/auth/AdminRoute.jsx";

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/dashboard" element={<AdminRoute><div>Admin area</div></AdminRoute>} />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => { h.state = { loading: false, isAuthenticated: true, user: { _id: "m1", role: "manager" } }; });

describe("AdminRoute (Batch 5 roles)", () => {
  it("allows manager", () => { renderRoute(); expect(screen.getByText("Admin area")).toBeTruthy(); });
  it("allows staff", () => { h.state.user = { _id: "s1", role: "staff" }; renderRoute(); expect(screen.getByText("Admin area")).toBeTruthy(); });
  it("redirects customer to login", () => { h.state.user = { _id: "c1", role: "customer" }; renderRoute(); expect(screen.getByText("Login page")).toBeTruthy(); expect(screen.queryByText("Admin area")).toBeNull(); });
  it("redirects anonymous to login", () => { h.state = { loading: false, isAuthenticated: false, user: null }; renderRoute(); expect(screen.getByText("Login page")).toBeTruthy(); });
});
