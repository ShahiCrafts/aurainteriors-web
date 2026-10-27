import api from './index';

const cartApi = {
    // Get user's cart
    getCart: async () => {
        const response = await api.get('/cart');
        return response.data;
    },

    // Add item to cart. Phase 7 (catalog): a variant line names the
    // exact catalogVariants subdocument via variantId (+ its sku,
    // which the server revalidates) — the legacy {color,size,
    // material} triple is only for variant-less products, and the
    // server stores {} for the triple on variant lines.
    addToCart: async ({ productId, quantity = 1, variant = {}, variantId, sku }) => {
        const body = { productId, quantity, variant };
        if (variantId) {
            body.variantId = variantId;
            if (sku) body.sku = sku;
        }
        const response = await api.post('/cart', body);
        return response.data;
    },

    // Update cart item quantity
    updateCartItem: async ({ itemId, quantity }) => {
        const response = await api.patch(`/cart/items/${encodeURIComponent(itemId)}`, { quantity });
        return response.data;
    },

    // Remove item from cart
    removeFromCart: async (itemId) => {
        const response = await api.delete(`/cart/items/${encodeURIComponent(itemId)}`);
        return response.data;
    },

    // Clear entire cart
    clearCart: async () => {
        const response = await api.delete('/cart');
        return response.data;
    },
};

export default cartApi;
