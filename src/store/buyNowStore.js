import { create } from "zustand";

const BUY_NOW_KEY = "buy_now_item";

// Buy Now is a DIRECT checkout, not a cart shortcut: the item lives
// here — never in the guest cart and never in the server cart — so
// the user's cart is left exactly as it was. The line shape mirrors
// a guest-cart line ({ _id, product, quantity, variant, variantId?,
// sku?, unitPrice?, variantOptions? }) so checkout rendering, totals
// (utils/cartLine) and order payloads work on it unchanged.
//
// sessionStorage (not localStorage): a buy-now intent belongs to
// this browsing session only. It must survive the navigation to
// /checkout (and a refresh there), but must not resurface days later
// the way a persisted cart does. Cleared on successful order, on
// removing the item at checkout, and replaced by the next Buy Now.
const loadBuyNowItem = () => {
  try {
    const stored = sessionStorage.getItem(BUY_NOW_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (
        parsed &&
        typeof parsed._id === "string" &&
        parsed.product &&
        typeof parsed.product._id === "string" &&
        Number.isFinite(parsed.product.price) &&
        parsed.product.price >= 0 &&
        Number.isSafeInteger(parsed.quantity) &&
        parsed.quantity > 0
      ) {
        return parsed;
      }
    }
  } catch {
    try {
      sessionStorage.removeItem(BUY_NOW_KEY);
    } catch {
      /* Storage may be unavailable. */
    }
  }
  return null;
};

const saveBuyNowItem = (item) => {
  try {
    sessionStorage.setItem(BUY_NOW_KEY, JSON.stringify(item));
  } catch (error) {
    console.error("Failed to save buy-now item:", error);
  }
};

const useBuyNowStore = create((set, get) => ({
  item: loadBuyNowItem(),

  // Start (or replace) a direct checkout with a single line.
  setItem: (item) => {
    if (!item?.product?._id) return;
    saveBuyNowItem(item);
    set({ item });
  },

  // Quantity edits at checkout touch only this line.
  updateQuantity: (quantity) => {
    if (!Number.isSafeInteger(quantity)) return;
    const { item } = get();
    if (!item) return;
    if (quantity <= 0) {
      get().clearItem();
      return;
    }
    const next = { ...item, quantity };
    saveBuyNowItem(next);
    set({ item: next });
  },

  // End the direct checkout (order placed, item removed, or the
  // shopper switches back to a normal cart checkout).
  clearItem: () => {
    try {
      sessionStorage.removeItem(BUY_NOW_KEY);
    } catch {
      /* Storage may be unavailable. */
    }
    set({ item: null });
  },
}));

export default useBuyNowStore;
