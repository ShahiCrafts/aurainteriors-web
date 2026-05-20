import { create } from "zustand";

const useAuthStore = create((set) => {
  const storedToken = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  let initialUser = null;
  let initialToken = null;
  let initialIsAuthenticated = false;

  if (storedToken && storedUser) {
    try {
      initialUser = JSON.parse(storedUser);
      initialToken = storedToken;
      initialIsAuthenticated = true;
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }

  return {
    user: initialUser,
    token: initialToken,
    isAuthenticated: initialIsAuthenticated,
    loading: false,
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
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", newToken);
      set({
        user: userData,
        token: newToken,
        isAuthenticated: true,
        isAuthModalOpen: false,
      });
    },

    logout: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    },

    setUser: (userData) => {
      localStorage.setItem("user", JSON.stringify(userData));
      set({ user: userData });
    },
  };
});

export default useAuthStore;
