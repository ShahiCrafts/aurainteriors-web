import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// FE-09 — admin password reset:
//  * src/hooks/admin/useUserTan.js:52-58 (audit lines) — the bare
//    resetPassword mutation retained { id, password } in React Query
//    mutation state indefinitely (current file: useAdminResetPassword
//    at the end of src/hooks/admin/useUserTan.js).
//  * src/pages/admin/Users.jsx — the reset modal checked only
//    length >= 8: no confirm field, no autoComplete="new-password",
//    so a typo silently locked the user into an unknown password.
//
// Fix pinned here: a confirm field + autoComplete on both password
// inputs; a mismatched confirm blocks submit before the API is
// called; after the mutation settles the call site evicts it from
// the mutation cache so no password lingers there; a
// failed reset surfaces exactly ONE error toast (the call-site
// onError formats it like the sibling mutations in Users.jsx, and the
// hook carries meta.suppressGlobalErrorToast so the FE-47 global
// mutation onError in src/lib/queryClient.js does not double-toast).

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
}));
vi.mock("../../../src/lib/toast.js", () => ({ toast: toastMock }));
vi.mock("../../../src/lib/toast.js", () => ({ toast: toastMock }));

vi.mock("../../../src/api/userApi.js", () => ({
  default: {
    getAll: vi.fn(),
    getById: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

import userApi from "../../../src/api/userApi.js";
import { handleGlobalMutationError } from "../../../src/lib/queryClient.js";
import Users from "../../../src/pages/admin/Users.jsx";

const USER = {
  _id: "u1",
  firstName: "Ada",
  lastName: "Admin",
  email: "ada@example.com",
  phone: "123",
  role: "customer",
  isActive: true,
  lastLogin: null,
  loginCount: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const PASSWORD = "brand-new-password-1";

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      // Same global mutation error handler the shared client installs
      // (FE-47) — included so a double-toast would be visible here.
      mutations: { retry: false, onError: handleGlobalMutationError },
    },
  });
}

function renderUsers(client) {
  return render(
    <QueryClientProvider client={client}>
      <Users />
    </QueryClientProvider>
  );
}

async function openResetModal() {
  fireEvent.click(await screen.findByTitle("Reset Password"));
  expect(
    await screen.findByPlaceholderText(/at least 8 characters/i)
  ).toBeInTheDocument();
}

function fillPasswords(newPw, confirmPw) {
  fireEvent.change(screen.getByPlaceholderText(/at least 8 characters/i), {
    target: { value: newPw },
  });
  fireEvent.change(screen.getByPlaceholderText(/confirm/i), {
    target: { value: confirmPw },
  });
}

function clickResetSubmit() {
  const submit = screen
    .getAllByRole("button")
    .find((b) => b.textContent.trim() === "Reset Password");
  fireEvent.click(submit);
}

beforeEach(() => {
  vi.clearAllMocks();
  userApi.getAll.mockResolvedValue({
    data: { users: [USER], pagination: { total: 1, pages: 1 } },
  });
  userApi.updateStatus.mockResolvedValue({});
  userApi.delete.mockResolvedValue({});
  userApi.resetPassword.mockResolvedValue({});
});

describe("FE-09: admin password reset form", () => {
  it("renders a confirm field and autoComplete=new-password on both password inputs", async () => {
    renderUsers(makeClient());
    await openResetModal();
    const newPw = screen.getByPlaceholderText(/at least 8 characters/i);
    const confirm = screen.getByPlaceholderText(/confirm/i);
    expect(newPw).toHaveAttribute("autoComplete", "new-password");
    expect(confirm).toHaveAttribute("autoComplete", "new-password");
    expect(confirm).toHaveAttribute("type", "password");
  });

  it("mismatched confirm blocks submit — the API is never called (pen-test: typo lockout)", async () => {
    renderUsers(makeClient());
    await openResetModal();
    fillPasswords(PASSWORD, "different-password-2");
    clickResetSubmit();
    expect(userApi.resetPassword).not.toHaveBeenCalled();
    expect(toastMock.error).toHaveBeenCalledWith(
      expect.stringMatching(/do not match/i)
    );
  });

  it("after a settled successful reset, the mutation cache holds no password variable", async () => {
    const client = makeClient();
    renderUsers(client);
    await openResetModal();
    fillPasswords(PASSWORD, PASSWORD);
    clickResetSubmit();
    await waitFor(() => expect(userApi.resetPassword).toHaveBeenCalledTimes(1));
    expect(userApi.resetPassword).toHaveBeenCalledWith("u1", PASSWORD);
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith(
        expect.stringMatching(/password updated/i)
      )
    );
    // Pen-test: scan every retained mutation state for the password.
    const states = client
      .getMutationCache()
      .getAll()
      .map((m) => JSON.stringify(m.state ?? {}));
    expect(states.join("\n")).not.toContain(PASSWORD);
    for (const m of client.getMutationCache().getAll()) {
      expect(m.state.variables).toBeUndefined();
    }
  });

  it("a failed reset surfaces exactly one error toast (no FE-47 double-toast)", async () => {
    userApi.resetPassword.mockRejectedValue({
      response: { status: 500, data: { message: "Reset failed on server" } },
    });
    renderUsers(makeClient());
    await openResetModal();
    fillPasswords(PASSWORD, PASSWORD);
    clickResetSubmit();
    await waitFor(() => expect(toastMock.error).toHaveBeenCalled());
    const messages = toastMock.error.mock.calls.map((c) => c[0]);
    expect(messages).toEqual(["Reset failed on server"]);
  });

  it("after a settled FAILED reset, the mutation cache also holds no password variable", async () => {
    userApi.resetPassword.mockRejectedValue({
      response: { status: 500, data: { message: "Reset failed on server" } },
    });
    const client = makeClient();
    renderUsers(client);
    await openResetModal();
    fillPasswords(PASSWORD, PASSWORD);
    clickResetSubmit();
    await waitFor(() => expect(toastMock.error).toHaveBeenCalled());
    const states = client
      .getMutationCache()
      .getAll()
      .map((m) => JSON.stringify(m.state ?? {}));
    expect(states.join("\n")).not.toContain(PASSWORD);
  });
});
