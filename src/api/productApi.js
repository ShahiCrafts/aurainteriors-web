import api from './index';

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const SLUG_LOOKUP_PAGE_LIMIT = 20;

export const productApi = {
    // Get all products with filtering
    getAll: async (params = {}) => {
        const response = await api.get('/products', { params });
        return response.data;
    },

    // Keep canonical slug links working with both slug-aware and ID-only APIs.
    // Always fetch full detail data; a listing record is only an ID hint.
    getById: async (id, { knownId, signal } = {}) => {
        const value = String(id);
        const detail = (identifier) => api.get(
            `/products/${encodeURIComponent(identifier)}`, { signal }
        );
        if (!OBJECT_ID.test(value) && OBJECT_ID.test(knownId || "")) {
            return (await detail(knownId)).data;
        }
        try {
            return (await detail(value)).data;
        } catch (error) {
            if (OBJECT_ID.test(value) || ![400, 404].includes(error.response?.status)) throw error;
            const seen = new Set();
            for (let page = 1; page <= SLUG_LOOKUP_PAGE_LIMIT; page += 1) {
                const response = await api.get('/products', {
                    params: { page, limit: 100, status: "active" }, signal,
                });
                const body = response.data?.data;
                const products = body?.products;
                if (!Array.isArray(products)) throw new Error("Invalid product lookup response");
                const match = products.find((product) => product?.slug === value && OBJECT_ID.test(product?._id || ""));
                if (match) return (await detail(match._id)).data;
                const pagination = body.pagination;
                const pages = Number(pagination?.pages ?? pagination?.totalPages);
                if (!products.length || (Number.isFinite(pages) && pages > 0 && page >= pages) ||
                    (!pagination && products.length < 100)) {
                    const missing = new Error("Product not found");
                    missing.response = { status: 404 };
                    throw missing;
                }
                const signature = JSON.stringify(products.map((product) => product?._id));
                if (seen.has(signature)) break;
                seen.add(signature);
            }
            const unavailable = new Error("Product lookup is temporarily unavailable. Please try again.");
            unavailable.response = { status: 503 };
            throw unavailable;
        }
    },

    // Get featured products
    getFeatured: async (limit = 8) => {
        const response = await api.get('/products/featured', { params: { limit } });
        return response.data;
    },

    // Get new arrivals
    getNewArrivals: async (limit = 8) => {
        const response = await api.get('/products/new-arrivals', { params: { limit } });
        return response.data;
    },

    // Get related products
    getRelated: async (id, limit = 4) => {
        const response = await api.get(`/products/${encodeURIComponent(id)}/related`, { params: { limit } });
        return response.data;
    },

    // Create product (Admin)
    create: async (data) => {
        const formData = new FormData();

        Object.keys(data).forEach(key => {
            if (key === 'images' && Array.isArray(data[key])) {
                data[key].forEach(file => {
                    if (file instanceof File) {
                        formData.append('images', file);
                    }
                });
            } else if (key === 'modelFiles' && Array.isArray(data[key])) {
                data[key].forEach(file => {
                    if (file instanceof File) {
                        formData.append('modelFiles', file);
                    }
                });
            } else if (key === 'modelUrls' && Array.isArray(data[key])) {
                formData.append(key, JSON.stringify(data[key]));
            } else if (key === 'dimensions' || key === 'weight' || key === 'colors' || key === 'materials' || key === 'tags' || key === 'catalogAttributes' || key === 'roomSlugs' || key === 'variantOptionKeys') {
                // Phase 6 (catalog): catalogAttributes (object),
                // roomSlugs and variantOptionKeys (arrays) all have
                // JSON-string forms in the server validators; a raw
                // append would coerce objects to "[object Object]".
                if (data[key] !== undefined && data[key] !== null) {
                    formData.append(key, JSON.stringify(data[key]));
                }
            } else if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
                formData.append(key, data[key]);
            }
        });

        const response = await api.post('/products', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // Update product (Admin)
    update: async (id, data) => {
        const formData = new FormData();

        Object.keys(data).forEach(key => {
            if (key === 'images' && Array.isArray(data[key])) {
                data[key].forEach(file => {
                    if (file instanceof File) {
                        formData.append('images', file);
                    }
                });
            } else if (key === 'modelFiles' && Array.isArray(data[key])) {
                data[key].forEach(file => {
                    if (file instanceof File) {
                        formData.append('modelFiles', file);
                    }
                });
            } else if (key === 'modelUrls' && Array.isArray(data[key])) {
                formData.append(key, JSON.stringify(data[key]));
            } else if ((key === 'removeImages' || key === 'removeModelFiles') && Array.isArray(data[key])) {
                formData.append(key, JSON.stringify(data[key]));
            } else if (key === 'dimensions' || key === 'weight' || key === 'colors' || key === 'materials' || key === 'tags' || key === 'catalogAttributes' || key === 'roomSlugs' || key === 'variantOptionKeys') {
                // See create(): catalog fields travel as JSON strings.
                if (data[key] !== undefined && data[key] !== null) {
                    formData.append(key, JSON.stringify(data[key]));
                }
            } else if (data[key] !== undefined && data[key] !== null) {
                formData.append(key, data[key]);
            }
        });

        const response = await api.patch(`/products/${encodeURIComponent(id)}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // Delete product - soft delete (Admin)
    delete: async (id) => {
        const response = await api.delete(`/products/${encodeURIComponent(id)}`);
        return response.data;
    },

    // Hard delete product (Admin)
    hardDelete: async (id) => {
        const response = await api.delete(`/products/${encodeURIComponent(id)}/permanent`);
        return response.data;
    },

    // Set primary image (Admin)
    setPrimaryImage: async (id, imageId) => {
        const response = await api.patch(`/products/${encodeURIComponent(id)}/primary-image`, { imageId });
        return response.data;
    },

    // Update stock (Admin)
    updateStock: async (id, stock) => {
        const response = await api.patch(`/products/${encodeURIComponent(id)}/stock`, { stock });
        return response.data;
    },

    // ── Variants (Admin) — Phase 3/6 ──────────────────────────────
    // JSON payloads (variant images are URL strings; no upload
    // middleware on these routes). Server errors are specific:
    // 409 for duplicate combinations / SKU conflicts, 400 naming
    // the offending key for invalid option values.
    getVariants: async (id) => {
        const response = await api.get(`/products/${encodeURIComponent(id)}/variants`);
        return response.data;
    },

    createVariant: async (id, data) => {
        const response = await api.post(`/products/${encodeURIComponent(id)}/variants`, data);
        return response.data;
    },

    updateVariant: async (id, variantId, data) => {
        const response = await api.patch(`/products/${encodeURIComponent(id)}/variants/${encodeURIComponent(variantId)}`, data);
        return response.data;
    },

    deleteVariant: async (id, variantId) => {
        const response = await api.delete(`/products/${encodeURIComponent(id)}/variants/${encodeURIComponent(variantId)}`);
        return response.data;
    },
};

export default productApi;
