import { create } from "zustand";
import useCheckoutStore from "./checkoutStore";
import useGuestCartStore from "./guestCartStore";
import { queryClient } from "../lib/queryClient";
import api from "../api/index";
import { registerTokenGetter } from "../lib/tokenSource";

let authRevision = 0;

/**
 * FE-18: the current auth revision. It is bumped by signIn() and by
 * logout(), so an async completion that started under an earlier
 * revision (e.g. a profile/avatar mutation still in flight across a
 * sign-out) can detect that the session it belonged to has ended and
 * must not sign the user back in.
 */
export const getAuthRevision = () => authRevision;

const clearLegacyAuth = () => {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch {
    /* Cookie authentication works without browser storage. */
  }
};

const useAuthStore = create((set, get) => {
  clearLegacyAuth();
  const initialUser = null;
  const initialToken = null;
  const initialIsAuthenticated = false;
  return {
    user: initialUser,
    token: initialToken,
    isAuthenticated: initialIsAuthenticated,
    loading: true,
    isAuthModalOpen: false,
    authModalView: "email", // 'email', 'sent', 'onboarding'

    openAuthModal: (view = "email") => {
      const mappedView = view === "login" || view === "signup" ? "email" : view;
      set({ isAuthModalOpen: true, authModalView: mappedView });
    },
    closeAuthModal: () => set({ isAuthModalOpen: false }),
    setAuthModalView: (view) => {
      const mappedView = view === "login" || view === "signup" ? "email" : view;
      set({ authModalView: mappedView });
    },

    signIn: (userData, newToken) => {
      // FE-08: an A→B switch on a live app must not serve A's cached
      // data to B. Clear the shared cache only when the identity
      // actually changes; a same-user sign-in (e.g. profile refresh)
      // and a first sign-in from signed-out keep the cache.
      const previousId = get().user?._id ?? null;
      const nextId = userData?._id ?? null;
      if (previousId !== null && nextId !== null && previousId !== nextId) {
        queryClient.clear();
      }
      authRevision += 1;

      set({
        user: userData,
        token: newToken || "cookie",
        loading: false,
        isAuthenticated: true,
        isAuthModalOpen: false,
      });
    },

    logout: async () => {
      // FE-18: local sign-out is immediate and unconditional; the
      // server POST below is only a bounded best-effort notification
      // (the session cookie expires server-side regardless). Previously
      // the POST was awaited FIRST with no try/catch, so a rejection
      // (offline, 500, expired session) skipped every cleanup step and
      // left the store authenticated — and callers chaining cleanup
      // after logout() skipped theirs too.
      authRevision += 1;
      clearLegacyAuth();
      // FE-08: every sign-out path inherits the cache clear from here
      // (the admin sign-out previously never cleared its QueryClient).
      queryClient.clear();

      // Reset checkout store & guest cart to prevent guest session pollution
      useCheckoutStore.getState().reset();
      useGuestCartStore.getState().clearCart();

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });

      // Best-effort server notification, bounded to ~3 s so a hung
      // request cannot wedge sign-out; failures are swallowed and
      // logout() never rejects to callers. Deliberately NOT cleared
      // here (audit STATE_INVENTORY §7): the guest chat session, whose
      // lifecycle ChatWidget owns, and lastUsedEmail, the login-form
      // prefill that survives logout by design.
      try {
        await Promise.race([
          api.post("/auth/logout", {}),
          new Promise((resolve) => {
            setTimeout(resolve, 3000);
          }),
        ]);
      } catch {
        /* Local sign-out already completed above. */
      }
    },

    initialize: async () => {
      const revision = authRevision;
      try {
        const response = await api.get("/auth/me");
        if (revision === authRevision && !get().isAuthenticated)
          set({
            user: response.data.data.user,
            token: "cookie",
            isAuthenticated: true,
            loading: false,
          });
      } catch {
        if (revision === authRevision) set({ loading: false });
      }
    },
    setUser: (userData) => {
      set({ user: userData });
    },
  };
});

export default useAuthStore;

// FE-59: register this store as the api layer's token source BEFORE
// initialize() fires its first request. The getter closes over
// useAuthStore and is invoked by the interceptor at request time, so
// it always reports the live token (including the "cookie" sentinel);
// registering here, at module scope, keeps that true for every import
// order — the api module itself imports only the leaf and never this
// store, so the old authStore <-> api/index cycle cannot re-form.
registerTokenGetter(() => useAuthStore.getState().token);

useAuthStore.getState().initialize();
