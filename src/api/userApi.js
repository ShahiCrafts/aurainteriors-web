import api from "./index";

export const userApi = {
  // Admin: Get all users
  getAll: async (params = {}) => {
    const response = await api.get("/users", { params });
    return response.data;
  },

  // Admin: Get single user
  getById: async (id) => {
    const response = await api.get(`/users/${encodeURIComponent(id)}`);
    return response.data;
  },

  // Admin: Update user status
  updateStatus: async (id, isActive, reason = "") => {
    const response = await api.patch(
      `/users/${encodeURIComponent(id)}/status`,
      { isActive, reason },
    );
    return response.data;
  },

  // Admin: Delete user
  delete: async (id) => {
    const response = await api.delete(`/users/${encodeURIComponent(id)}`);
    return response.data;
  },

  // Admin: Reset user password
  resetPassword: async (id, password) => {
    const response = await api.patch(
      `/users/${encodeURIComponent(id)}/reset-password`,
      { password },
    );
    return response.data;
  },
};

export default userApi;
