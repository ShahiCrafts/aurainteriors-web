import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const h = vi.hoisted(() => ({ user: { _id: "u1", role: "admin", firstName: "Ada", lastName: "Admin", email: "ada@example.com" } }));
vi.mock("../../../src/store/authStore.js", () => {
  const store = (sel) => (typeof sel === "function" ? sel({ user: h.user }) : { user: h.user });
  store.getState = () => ({ user: h.user });
  return { default: store };
});
vi.mock("../../../src/lib/toast.js", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock("../../../src/api/userApi.js", () => ({
  default: { getAll: vi.fn(), getById: vi.fn(), updateStatus: vi.fn(), delete: vi.fn(), resetPassword: vi.fn(), updateRole: vi.fn() },
}));

import userApi from "../../../src/api/userApi.js";
import Users from "../../../src/pages/admin/Users.jsx";

const USERS = [
  { _id: "u1", firstName: "Ada", lastName: "Admin", email: "ada@example.com", phone: "1", role: "admin", isActive: true, lastLogin: null, loginCount: 0, createdAt: "2026-01-01T00:00:00.000Z" },
  { _id: "u2", firstName: "Bob", lastName: "Buyer", email: "bob@example.com", phone: "2", role: "customer", isActive: true, lastLogin: null, loginCount: 0, createdAt: "2026-01-01T00:00:00.000Z" },
];

beforeEach(() => {
  vi.clearAllMocks();
  userApi.getAll.mockResolvedValue({ data: { users: USERS, pagination: { total: 2, pages: 1 } } });
  userApi.updateRole.mockResolvedValue({ data: { user: { ...USERS[1], role: "manager" } } });
});

function renderUsers() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><Users /></QueryClientProvider>);
}

describe("Users role control (Batch 5)", () => {
  it("changing another user's role calls updateRole", async () => {
    renderUsers();
    const select = await screen.findByLabelText("Role for bob@example.com");
    fireEvent.change(select, { target: { value: "manager" } });
    await waitFor(() => expect(userApi.updateRole).toHaveBeenCalledWith("u2", "manager"));
  });

  it("own-row role select is disabled", async () => {
    renderUsers();
    const own = await screen.findByLabelText("Role for ada@example.com");
    expect(own.disabled).toBe(true);
    expect(own.title).toBe("You cannot change your own role");
  });
});
