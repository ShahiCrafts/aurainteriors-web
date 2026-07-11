import api from "./index";

// Magic Link Authentication
export const sendMagicLink = (data) => api.post("/auth/send-magic-link", data);
export const verifyMagicLink = (token) =>
  api.post("/auth/verify-magic-link", { token });

// Admin Authentication
export const adminLogin = (email, password) =>
  api.post("/auth/admin/login", { email, password });

export const adminVerifyOtp = (email, otp) =>
  api.post("/auth/admin/verify-otp", { email, otp });


