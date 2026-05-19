import api from "./index";

// Magic Link Authentication
export const sendMagicLink = (data) => api.post("/auth/send-magic-link", data);
export const verifyMagicLink = (token) =>
  api.post("/auth/verify-magic-link", { token });

// Password-based authentication
export const setPassword = (data) => api.patch("/auth/set-password", data);
export const login = (data) => api.post("/auth/login", data);

export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email });

export const resetPassword = (token, password) =>
  api.patch(`/auth/reset-password/${token}`, { password });

export const updatePassword = (currentPassword, newPassword) =>
  api.patch("/auth/update-password", { currentPassword, newPassword });
