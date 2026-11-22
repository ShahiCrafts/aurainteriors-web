import api from "./index";

// Admin Handover / Audit / Media / Backup API (Batch 5).
// Thin wrappers over the shared axios instance, following the
// settingsApi / integrationsApi pattern.

const handoverApi = {
  // GET /admin/handover/status → data { keys, demoProducts, ... }
  getStatus: async () => {
    const response = await api.get("/admin/handover/status");
    return response.data;
  },

  // GET /admin/handover/demo-status → data { demoProducts, totalProducts }
  getDemoStatus: async () => {
    const response = await api.get("/admin/handover/demo-status");
    return response.data;
  },

  // POST /admin/handover/wipe-demo { confirm: "WIPE" } → data { deleted }
  wipeDemo: async (confirm = "WIPE") => {
    const response = await api.post("/admin/handover/wipe-demo", {
      confirm,
    });
    return response.data;
  },

  // GET /admin/audit-logs?page&limit&action → data { logs, pagination }
  getAuditLogs: async (params = {}) => {
    const response = await api.get("/admin/audit-logs", { params });
    return response.data;
  },

  // GET /admin/export/:kind → CSV blob
  exportCsv: async (kind) => {
    const response = await api.get(`/admin/export/${encodeURIComponent(kind)}`, {
      responseType: "blob",
    });
    return response.data;
  },

  // GET /admin/settings/backup → data { backup }
  getBackup: async () => {
    const response = await api.get("/admin/settings/backup");
    return response.data;
  },

  // POST /admin/settings/restore { backup } → data { appliedSections, skippedSections }
  restoreBackup: async (backup) => {
    const response = await api.post("/admin/settings/restore", { backup });
    return response.data;
  },

  // GET /admin/media?cursor&search → data { resources, nextCursor }
  getMedia: async (params = {}) => {
    const response = await api.get("/admin/media", { params });
    return response.data;
  },

  // DELETE /admin/media { publicId }
  deleteMedia: async (publicId) => {
    const response = await api.delete("/admin/media", {
      data: { publicId },
    });
    return response.data;
  },
};

export default handoverApi;
