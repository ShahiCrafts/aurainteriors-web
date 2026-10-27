import api from './index';

// Phase 6 (catalog) — client for the /api/v1/catalog registry
// surface (Phases 1–2) plus the resolution reads the admin forms
// render from. All writes sit behind the server's admin gate; the
// resolution reads are public. Every method returns the shared
// envelope (response.data), matching the other src/api modules.
//
// NOTE: GET /catalog/attributes is ADMIN-only on the server (the
// full registry incl. inactive definitions); the storefront-facing
// reads are /catalog/product-types, /catalog/rooms,
// /catalog/collections and the two resolution endpoints below.
export const catalogApi = {
    // ── Attribute definitions (admin) ─────────────────────────────
    listAttributeDefinitions: async () => {
        const response = await api.get('/catalog/attributes');
        return response.data;
    },

    getAttributeDefinition: async (key) => {
        const response = await api.get(`/catalog/attributes/${encodeURIComponent(key)}`);
        return response.data;
    },

    createAttributeDefinition: async (data) => {
        const response = await api.post('/catalog/attributes', data);
        return response.data;
    },

    updateAttributeDefinition: async (key, data) => {
        const response = await api.patch(`/catalog/attributes/${encodeURIComponent(key)}`, data);
        return response.data;
    },

    // Default delete is SOFT on the server (active:false). Hard
    // delete (?hard=true) is refused while products carry values
    // or assignments reference the key — the server's message is
    // surfaced to the admin verbatim.
    deleteAttributeDefinition: async (key, { hard = false } = {}) => {
        const response = await api.delete(`/catalog/attributes/${encodeURIComponent(key)}`, {
            params: hard ? { hard: 'true' } : {},
        });
        return response.data;
    },

    // ── Product types ─────────────────────────────────────────────
    listProductTypes: async () => {
        const response = await api.get('/catalog/product-types');
        return response.data;
    },

    getProductType: async (key) => {
        const response = await api.get(`/catalog/product-types/${encodeURIComponent(key)}`);
        return response.data;
    },

    createProductType: async (data) => {
        const response = await api.post('/catalog/product-types', data);
        return response.data;
    },

    updateProductType: async (key, data) => {
        const response = await api.patch(`/catalog/product-types/${encodeURIComponent(key)}`, data);
        return response.data;
    },

    deleteProductType: async (key) => {
        const response = await api.delete(`/catalog/product-types/${encodeURIComponent(key)}`);
        return response.data;
    },

    // ── Rooms ─────────────────────────────────────────────────────
    listRooms: async () => {
        const response = await api.get('/catalog/rooms');
        return response.data;
    },

    getRoom: async (slug, params = {}) => {
        const response = await api.get(`/catalog/rooms/${encodeURIComponent(slug)}`, { params });
        return response.data;
    },

    createRoom: async (data) => {
        const response = await api.post('/catalog/rooms', data);
        return response.data;
    },

    updateRoom: async (slug, data) => {
        const response = await api.patch(`/catalog/rooms/${encodeURIComponent(slug)}`, data);
        return response.data;
    },

    deleteRoom: async (slug) => {
        const response = await api.delete(`/catalog/rooms/${encodeURIComponent(slug)}`);
        return response.data;
    },

    // ── Collections ───────────────────────────────────────────────
    listCollections: async () => {
        const response = await api.get('/catalog/collections');
        return response.data;
    },

    getCollection: async (slug, params = {}) => {
        const response = await api.get(`/catalog/collections/${encodeURIComponent(slug)}`, { params });
        return response.data;
    },

    createCollection: async (data) => {
        const response = await api.post('/catalog/collections', data);
        return response.data;
    },

    updateCollection: async (slug, data) => {
        const response = await api.patch(`/catalog/collections/${encodeURIComponent(slug)}`, data);
        return response.data;
    },

    deleteCollection: async (slug) => {
        const response = await api.delete(`/catalog/collections/${encodeURIComponent(slug)}`);
        return response.data;
    },

    // ── Attribute resolution (public reads) ───────────────────────
    // Resolved applicable attributes for a category (slug or
    // ObjectId): merged global + type + ancestor-chain set, each
    // entry carrying its effective settings + source.
    getCategoryAttributes: async (ref) => {
        const response = await api.get(`/catalog/categories/${encodeURIComponent(ref)}/attributes`);
        return response.data;
    },

    // Resolved applicable attributes for a product type
    // (global + type level only).
    getProductTypeAttributes: async (key) => {
        const response = await api.get(`/catalog/product-types/${encodeURIComponent(key)}/attributes`);
        return response.data;
    },

    // ── Public schema (Phase 7 storefront reads) ─────────────────
    // GET /catalog/schema → { definitions: { key: def },
    // productTypes: { key: [attributeKeys] }, rooms: [slug] }.
    // The storefront uses the definitions for variant option group
    // labels and specification rendering.
    getSchema: async () => {
        const response = await api.get('/catalog/schema');
        return response.data;
    },
};

export default catalogApi;
