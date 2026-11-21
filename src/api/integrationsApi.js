import api from "./index";

// Admin Integrations + Settings API (Batch 2).
// Mirrors the announcementApi/documentApi pattern: thin wrappers over the
// shared axios instance (base URL = API_V1_URL, Bearer auth via interceptor,
// errors carry `displayMessage` from the response interceptor).

const integrationsApi = {
  // GET /admin/integrations → { status, data: { config, secrets } }
  getIntegrations: async () => {
    const response = await api.get("/admin/integrations");
    return response.data;
  },

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

  // PUT /admin/integrations/:service/secret { value } → { data: { secret } }
  saveSecret: async (service, value) => {
    const response = await api.put(
      `/admin/integrations/${encodeURIComponent(service)}/secret`,
      { value },
    );
    return response.data;
  },

  // DELETE /admin/integrations/:service/secret → { data: { secret } }
  deleteSecret: async (service) => {
    const response = await api.delete(
      `/admin/integrations/${encodeURIComponent(service)}/secret`,
    );
    return response.data;
  },

  // POST /admin/integrations/:service/test — body {} tests the stored key,
  // { value } tests an unsaved key. → { data: { test: { ok, status, message, latencyMs } } }
  testSecret: async (service, value) => {
    const body = value ? { value } : {};
    const response = await api.post(
      `/admin/integrations/${encodeURIComponent(service)}/test`,
      body,
    );
    return response.data;
  },
};

export default integrationsApi;
