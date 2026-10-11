import { create } from "zustand";
import useCheckoutStore from "./checkoutStore";
import useGuestCartStore from "./guestCartStore";

let authRevision = 0;
const clearLegacyAuth = () => {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch { /* Cookie authentication works without browser storage. */ }
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
      const mappedView = (view === "login" || view === "signup") ? "email" : view;
      set({ isAuthModalOpen: true, authModalView: mappedView });
    },
    closeAuthModal: () => set({ isAuthModalOpen: false }),
    setAuthModalView: (view) => {
      const mappedView = (view === "login" || view === "signup") ? "email" : view;
      set({ authModalView: mappedView });
    },

    signIn: (userData, newToken) => {
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
      authRevision += 1;
      const { default: api } = await import("../api/index");
      await api.post("/auth/logout", {});
      clearLegacyAuth();

      // Reset checkout store & guest cart to prevent guest session pollution
      useCheckoutStore.getState().reset();
      useGuestCartStore.getState().clearCart();

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
    },

    initialize: async () => {
      const revision = authRevision;
      try {
        const { default: api } = await import("../api/index");
        const response = await api.get("/auth/me");
        if (revision === authRevision && !get().isAuthenticated) set({ user: response.data.data.user, token: "cookie", isAuthenticated: true, loading: false });
      } catch { if (revision === authRevision) set({ loading: false }); }
    },
    setUser: (userData) => {

      set({ user: userData });
    },
  };
});

export default useAuthStore;

useAuthStore.getState().initialize();
