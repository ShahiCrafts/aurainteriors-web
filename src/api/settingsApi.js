import api from "./index";

// Admin Store Settings API (Batch 3a).
// Same pattern as integrationsApi: thin wrappers over the shared axios
// instance (base URL = API_V1_URL, Bearer auth via interceptor, errors
// carry `displayMessage` from the response interceptor). Section saves
// share the Batch 1 endpoint used by the Integrations page.

const settingsApi = {
  // GET /admin/settings → { status, data: { settings } }
  getSettings: async () => {
    const response = await api.get("/admin/settings");
    return response.data;
  },

  // PUT /admin/settings/:section with a JSON patch → updated section
  updateSettingsSection: async (section, patch) => {
    const response = await api.put(
      `/admin/settings/${encodeURIComponent(section)}`,
      patch,
    );
    return response.data;
  },

  // POST /admin/settings/image (multipart, field "image") — reuses the
  // server's existing category-image → Cloudinary pipeline.
  // → { status, data: { url } }
  uploadSettingsImage: async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await api.post("/admin/settings/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // POST /admin/knowledge/reindex → { status, data: { queued } }
  reindexKnowledge: async () => {
    const response = await api.post("/admin/knowledge/reindex");
    return response.data;
  },

  // POST /admin/settings/test-email { template, to } → { sent }
  // (Batch 4). Renders the chosen notifications template with sample
  // data and sends it via the server's Brevo path.
  sendTestEmail: async (template, to) => {
    const response = await api.post("/admin/settings/test-email", {
      template,
      to,
    });
    return response.data;
  },

  // POST /admin/settings/reset { section? } → full settings after
  // the reset (Batch 3d). Omit `section` to reset every section.
  resetSettings: async (section) => {
    const response = await api.post(
      "/admin/settings/reset",
      section ? { section } : {},
    );
    return response.data;
  },
};

export default settingsApi;
