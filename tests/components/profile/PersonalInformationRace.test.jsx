// FE-18 — a profile/avatar mutation resolving AFTER logout must not
// resurrect the session.
//
// Before the fix, PersonalInformation's mutation onSuccess handlers
// called signIn(user, token) unconditionally: start a profile save,
// sign out mid-flight, and the save's completion signed the user back
// in. The handlers now capture getAuthRevision() when the mutation
// starts and only call signIn if the revision is unchanged.
//
// The profile hooks are mocked so each test can fire the captured
// onSuccess by hand, after a real logout() on the real auth store.
// A second describe pins the initialize() revision guard: a session
// restore that started before logout must not resurrect either.

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";

vi.mock("../../../src/api/index.js", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

const h = vi.hoisted(() => ({
  updateProfile: null,
  updateAvatar: null,
  removeAvatar: null,
  profileData: undefined,
}));

vi.mock("../../../src/hooks/profile/useProfileTan", () => ({
  useProfile: () => ({ data: h.profileData, isLoading: false }),
  useUpdateProfile: () => ({
    mutate: (vars, opts) => {
      h.updateProfile = { vars, opts };
    },
    isPending: false,
  }),
  useUpdateAvatar: () => ({
    mutate: (file, opts) => {
      h.updateAvatar = { file, opts };
    },
    isPending: false,
  }),
  useRemoveAvatar: () => ({
    mutate: (vars, opts) => {
      h.removeAvatar = { vars, opts };
    },
    isPending: false,
  }),
}));

vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import api from "../../../src/api/index.js";
import useAuthStore from "../../../src/store/authStore.js";
import PersonalInformation from "../../../src/components/profile/PersonalInformation.jsx";

const user = {
  _id: "user-1",
  firstName: "Asha",
  lastName: "Rai",
  email: "a@example.com",
  phone: "9812345678",
  // Gender/DOB must be valid values: the form resets from the profile
  // and the yup schema rejects an empty-string gender, so a profile
  // that can actually be saved carries real ones.
  gender: "female",
  dateOfBirth: "1995-01-15T00:00:00.000Z",
  avatar: "https://cdn.example.com/avatar.png",
};

async function renderSignedIn() {
  api.post.mockResolvedValue({});
  h.profileData = { data: { user } };
  useAuthStore.getState().signIn(user, "real-token");
  const utils = render(<PersonalInformation />);
  // The form resets from the loaded profile in an effect.
  await waitFor(() =>
    expect(screen.getByDisplayValue("Asha")).toBeInTheDocument(),
  );
  return utils;
}

async function logout() {
  await act(async () => {
    await useAuthStore.getState().logout();
  });
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
}

describe("FE-18 PersonalInformation mutation race", () => {
  it("profile save resolving after logout does not resurrect the session", async () => {
    await renderSignedIn();

    const firstName = screen.getByDisplayValue("Asha");
    fireEvent.change(firstName, { target: { value: "Asha2" } });
    fireEvent.click(screen.getByRole("button", { name: /Save Changes/ }));
    await waitFor(() => expect(h.updateProfile).not.toBeNull());

    await logout();

    act(() => {
      h.updateProfile.opts.onSuccess({
        data: { user: { ...user, firstName: "Asha2" } },
      });
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("avatar upload resolving after logout does not resurrect the session", async () => {
    const { container } = await renderSignedIn();

    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input, {
      target: {
        files: [new File(["x"], "a.png", { type: "image/png" })],
      },
    });
    await waitFor(() => expect(h.updateAvatar).not.toBeNull());

    await logout();

    act(() => {
      h.updateAvatar.opts.onSuccess({ data: { user } });
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("avatar removal resolving after logout does not resurrect the session", async () => {
    await renderSignedIn();

    fireEvent.click(screen.getByRole("button", { name: /Remove/ }));
    await waitFor(() => expect(h.removeAvatar).not.toBeNull());

    await logout();

    act(() => {
      h.removeAvatar.opts.onSuccess({ data: { user } });
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("profile save resolving WITHOUT an intervening logout still refreshes the session", async () => {
    await renderSignedIn();

    const firstName = screen.getByDisplayValue("Asha");
    fireEvent.change(firstName, { target: { value: "Asha2" } });
    fireEvent.click(screen.getByRole("button", { name: /Save Changes/ }));
    await waitFor(() => expect(h.updateProfile).not.toBeNull());

    act(() => {
      h.updateProfile.opts.onSuccess({
        data: { user: { ...user, firstName: "Asha2" } },
      });
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user.firstName).toBe("Asha2");
  });
});

describe("FE-18 initialize() restore landing after logout", () => {
  it("does not resurrect the session (existing revision guard, pinned)", async () => {
    vi.resetModules();
    const freshApi = (await import("../../../src/api/index.js")).default;
    let resolveMe;
    freshApi.get.mockImplementation(
      () => new Promise((resolve) => {
        resolveMe = resolve;
      }),
    );
    freshApi.post.mockResolvedValue({});
    // Import-time initialize() starts now and stays in flight.
    const freshStore = (await import("../../../src/store/authStore.js"))
      .default;

    freshStore.getState().signIn(user);
    await freshStore.getState().logout();
    expect(freshStore.getState().isAuthenticated).toBe(false);

    // The pre-logout restore finally lands with a valid session payload.
    resolveMe({ data: { data: { user } } });
    await new Promise((r) => setTimeout(r, 20));

    expect(freshStore.getState().isAuthenticated).toBe(false);
    expect(freshStore.getState().user).toBeNull();
  });
});
