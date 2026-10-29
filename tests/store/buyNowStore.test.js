import { beforeEach, describe, expect, it, vi } from "vitest";

// Unit tests for src/store/buyNowStore.js — the direct-checkout
// store behind Buy Now. This is a money path: the line held here is
// the ONLY line checkout orders in buy-now mode, and it must never
// leak into (or be polluted by) the guest/server cart. The store is
// plain zustand (no React needed); the load-path block at the bottom
// re-imports the module fresh because loadBuyNowItem() runs once at
// module creation against sessionStorage.

import useBuyNowStore from "../../src/store/buyNowStore.js";
import { lineUnitPrice } from "../../src/utils/cartLine.js";

const KEY = "buy_now_item";

const sofaLine = {
  _id: "buynow_prod-1",
  product: {
    _id: "prod-1",
    name: "Aria Sofa",
    slug: "aria-sofa",
    price: 1000,
    images: [{ url: "sofa.jpg" }],
    stock: 5,
  },
  quantity: 2,
  variant: {},
};

const variantLine = {
  _id: "buynow_prod-2_var-9",
  product: {
    _id: "prod-2",
    name: "Catalog Chair",
    slug: "catalog-chair",
    price: 500,
    images: [],
    stock: 3,
  },
  quantity: 1,
  variant: {},
  variantId: "var-9",
  sku: "CHAIR-OAK",
  unitPrice: 450,
  variantOptions: { Finish: "Oak" },
};

const state = () => useBuyNowStore.getState();
const stored = () => JSON.parse(sessionStorage.getItem(KEY));

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  useBuyNowStore.setState({ item: null });
});

describe("buyNowStore — setItem / clearItem", () => {
  it("should hold no item when nothing was set", () => {
    expect(state().item).toBeNull();
  });

  it("should store the line and persist it to sessionStorage when setItem is called", () => {
    // Arrange / Act
    state().setItem(sofaLine);

    // Assert
    expect(state().item).toEqual(sofaLine);
    expect(stored()).toEqual(sofaLine);
  });

  it("should replace the previous line when setItem is called again (one direct checkout at a time)", () => {
    state().setItem(sofaLine);

    state().setItem(variantLine);

    expect(state().item).toEqual(variantLine);
    expect(stored()).toEqual(variantLine);
  });

  it("should ignore an item with no product id and persist nothing", () => {
    state().setItem({ _id: "buynow_x", quantity: 1, variant: {} });
    state().setItem(null);

    expect(state().item).toBeNull();
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it("should clear both state and sessionStorage when clearItem is called", () => {
    state().setItem(sofaLine);

    state().clearItem();

    expect(state().item).toBeNull();
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it("should never write to localStorage (the cart's storage) when a buy-now line is set", () => {
    state().setItem(sofaLine);

    expect(localStorage.getItem("guest_cart")).toBeNull();
    expect(localStorage.length).toBe(0);
  });
});

describe("buyNowStore — updateQuantity", () => {
  it("should update the quantity and persist it when a positive integer is given", () => {
    state().setItem(sofaLine);

    state().updateQuantity(4);

    expect(state().item.quantity).toBe(4);
    expect(stored().quantity).toBe(4);
  });

  it("should clear the line when the quantity is set to zero or below", () => {
    state().setItem(sofaLine);

    state().updateQuantity(0);

    expect(state().item).toBeNull();
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it("should ignore a non-integer quantity", () => {
    state().setItem(sofaLine);

    state().updateQuantity(2.5);
    state().updateQuantity("3");

    expect(state().item.quantity).toBe(2);
  });

  it("should do nothing when there is no item to update", () => {
    state().updateQuantity(3);

    expect(state().item).toBeNull();
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });
});

describe("buyNowStore — line totals via the shared cart-line pricing", () => {
  it("should price a legacy line from the product price", () => {
    state().setItem(sofaLine);

    const item = state().item;
    expect(lineUnitPrice(item)).toBe(1000);
    expect(lineUnitPrice(item) * item.quantity).toBe(2000);
  });

  it("should price a variant line from its stored unitPrice, not the product price", () => {
    state().setItem({ ...variantLine, quantity: 3 });

    const item = state().item;
    expect(lineUnitPrice(item)).toBe(450);
    expect(lineUnitPrice(item) * item.quantity).toBe(1350);
  });
});

describe("buyNowStore — sessionStorage load path (fresh module)", () => {
  async function importFresh() {
    vi.resetModules();
    return (await import("../../src/store/buyNowStore.js")).default;
  }

  it("should restore a valid persisted line on load (checkout refresh)", async () => {
    sessionStorage.setItem(KEY, JSON.stringify(sofaLine));

    const fresh = await importFresh();

    expect(fresh.getState().item).toEqual(sofaLine);
  });

  it("should discard corrupt JSON on load and remove the stored value", async () => {
    sessionStorage.setItem(KEY, "{not json");

    const fresh = await importFresh();

    expect(fresh.getState().item).toBeNull();
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it("should discard a persisted line whose shape is invalid (no product id / non-positive quantity)", async () => {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ _id: "x", product: { price: -5 }, quantity: 0 }),
    );

    const fresh = await importFresh();

    expect(fresh.getState().item).toBeNull();
  });
});
