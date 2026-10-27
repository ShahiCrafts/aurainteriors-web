import { create } from "zustand";

const GUEST_CART_KEY = "guest_cart";
const variantKey = (variant = {}) => JSON.stringify(
  Object.entries(variant || {}).sort(([a], [b]) => a.localeCompare(b))
);

// Helper to load cart from localStorage
const loadGuestCart = () => {
  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(item => item && typeof item._id === "string" &&
        item.product && typeof item.product._id === "string" &&
        Number.isFinite(item.product.price) && item.product.price >= 0 &&
        Number.isSafeInteger(item.quantity) && item.quantity > 0);
    }
  } catch {
    try { localStorage.removeItem(GUEST_CART_KEY); } catch { /* Storage may be unavailable. */ }
  }
  return [];
};

// Helper to save cart to localStorage
const saveGuestCart = (items) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save guest cart:", error);
  }
};

const useGuestCartStore = create((set, get) => ({
  items: loadGuestCart(),

  // Add item to guest cart
  // Phase 7 (catalog): `meta` carries a catalog variant identity
  // ({ variantId, sku, unitPrice, options }) for variant products.
  // Line identity then includes the variantId — two variants of
  // one product are two lines; the same variant merges.
  addItem: (product, quantity = 1, variant = {}, meta = null) => {
    if (!product?._id || !Number.isSafeInteger(quantity) || quantity <= 0) return;
    const { items } = get();

    // Check if item already exists with same variant
    const existingIndex = items.findIndex(
      (item) =>
        item.product._id === product._id &&
        (item.variantId || null) === (meta?.variantId || null) &&
        variantKey(item.variant) === variantKey(variant)
    );

    let newItems;
    if (existingIndex >= 0) {
      if (!Number.isSafeInteger(items[existingIndex].quantity + quantity)) return;
      // Update quantity if item exists
      newItems = items.map((item, index) =>
        index === existingIndex
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      // Add new item
      const newItem = {
        _id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        product: {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          images: product.images,
          stock: product.stock,
        },
        quantity,
        variant,
        ...(meta?.variantId
          ? {
              variantId: meta.variantId,
              sku: meta.sku,
              unitPrice: meta.unitPrice,
              variantOptions: meta.options,
            }
          : {}),
      };
      newItems = [...items, newItem];
    }

    saveGuestCart(newItems);
    set({ items: newItems });
  },

  // Update item quantity
  updateItemQuantity: (itemId, quantity) => {
    if (!Number.isSafeInteger(quantity)) return;
    const { items } = get();

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      const newItems = items.filter((item) => item._id !== itemId);
      saveGuestCart(newItems);
      set({ items: newItems });
      return;
    }

    const newItems = items.map((item) =>
      item._id === itemId ? { ...item, quantity } : item
    );
    saveGuestCart(newItems);
    set({ items: newItems });
  },

  // Remove item from cart
  removeItem: (itemId) => {
    const { items } = get();
    const newItems = items.filter((item) => item._id !== itemId);
    saveGuestCart(newItems);
    set({ items: newItems });
  },

  // Clear entire cart
  clearCart: () => {
    try { localStorage.removeItem(GUEST_CART_KEY); } catch { /* Storage may be unavailable. */ }
    set({ items: [] });
  },

  // Get cart totals
  getCartTotals: () => {
    const { items } = get();
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + (item.unitPrice ?? item.product.price) * item.quantity,
      0
    );
    return { itemCount, subtotal };
  },

  // Get items formatted for checkout
  getCheckoutItems: () => {
    const { items } = get();
    return items.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      variant: item.variant,
      price: item.product.price,
    }));
  },
}));

export default useGuestCartStore;
