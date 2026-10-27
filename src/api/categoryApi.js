import api from './index';

export const categoryApi = {
    // Get all categories
    getAll: async (params = {}) => {
        const response = await api.get('/categories', { params });
        return response.data;
    },

    // Get category tree
    getTree: async () => {
        const response = await api.get('/categories', { params: { tree: 'true' } });
        return response.data;
    },

    // Get single category by ID or slug
    getById: async (id) => {
        const response = await api.get(`/categories/${encodeURIComponent(id)}`);
        return response.data;
    },

    // Get category products
    getProducts: async (id, params = {}) => {
        const response = await api.get(`/categories/${encodeURIComponent(id)}/products`, { params });
        return response.data;
    },

    // Create category (Admin)
    create: async (data) => {
        const formData = new FormData();

        Object.keys(data).forEach(key => {
            if (key === 'image' && data[key] instanceof File) {
                formData.append('image', data[key]);
            } else if (key === 'roomSlugs' && Array.isArray(data[key])) {
                // Phase 6 (catalog): the server accepts roomSlugs as
                // an array or a JSON-string array from form-data; a
                // raw array append would coerce to "a,b" and fail.
                formData.append(key, JSON.stringify(data[key]));
            } else if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
                formData.append(key, data[key]);
            }
        });

        const response = await api.post('/categories', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // Update category (Admin)
    update: async (id, data) => {
        const formData = new FormData();

        Object.keys(data).forEach(key => {
            if (key === 'image' && data[key] instanceof File) {
                formData.append('image', data[key]);
            } else if (key === 'roomSlugs' && Array.isArray(data[key])) {
                // See create(): roomSlugs travels as a JSON string.
                formData.append(key, JSON.stringify(data[key]));
            } else if (data[key] !== undefined && data[key] !== null) {
                formData.append(key, data[key]);
            }
        });

        const response = await api.patch(`/categories/${encodeURIComponent(id)}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // Reorder siblings (Admin) — Phase 1: POST /categories/reorder
    // takes the full sibling id list in its new order (same-parent
    // only; the server 400s a mixed-parent list).
    reorder: async (ids) => {
        const response = await api.post('/categories/reorder', { ids });
        return response.data;
    },

    // A category's OWN attribute assignments (Admin) — Phase 2.
    // The resolved/inherited view is catalogApi.getCategoryAttributes.
    getAttributeAssignments: async (id) => {
        const response = await api.get(`/categories/${encodeURIComponent(id)}/attributes`);
        return response.data;
    },

    // Atomically replace the category's own assignment list.
    setAttributeAssignments: async (id, assignments) => {
        const response = await api.put(`/categories/${encodeURIComponent(id)}/attributes`, { assignments });
        return response.data;
    },

    // Delete category (Admin)
    delete: async (id) => {
        const response = await api.delete(`/categories/${encodeURIComponent(id)}`);
        return response.data;
    },
};

export default categoryApi;
