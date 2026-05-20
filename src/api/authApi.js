import api from "./index";

// Magic Link Authentication
export const sendMagicLink = (data) => api.post("/auth/send-magic-link", data);
export const verifyMagicLink = (token) =>
  api.post("/auth/verify-magic-link", { token });


