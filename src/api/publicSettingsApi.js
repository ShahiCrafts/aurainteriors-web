import api from "./index";

// Public site settings (Batch 3b) — the anonymous storefront feed for
// the Batch 1/3a settings system.
// GET /settings/public → { status, data: { settings } }
// Thin wrapper over the shared axios instance, same pattern as the
// other api modules; returns the settings object or null.
const publicSettingsApi = {
  getPublicSettings: async () => {
    const response = await api.get("/settings/public");
    return response.data?.data?.settings ?? null;
  },
};

export default publicSettingsApi;
