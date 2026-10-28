import { beforeEach, describe, expect, it, vi } from "vitest";

// Characterization tests for src/store/guestCartStore.js — these pin the
// store's CURRENT behavior. The store is a plain zustand store (no React
// needed); state is reset between tests by clearing items + storage.
//
// The load-path describe block at the bottom re-imports the module fresh
// (vi.resetModules + dynamic import) because loadGuestCart() runs once, at
// module creation, against whatever localStorage holds at that moment.

import useGuestCartStore from "../../src/store/guestCartStore.js";

const KEY = "guest_cart";

const sofa = {
  _id: "prod-1",
  name: "Sofa",
  slug: "sofa",
  price: 100,
  images: [{ url: "sofa.jpg" }],
  stock: 5,
};
const lamp = {
  _id: "prod-2",
  name: "Lamp",
  slug: "lamp",
  price: 25,
  images: [],
  stock: 10,
};

const state = () => useGuestCartStore.getState();
const storedItems = () => JSON.parse(localStorage.getItem(KEY));

beforeEach(() => {
  localStorage.clear();
  useGuestCartStore.setState({ items: [] });
});

describe("addItem", () => {
  it("adds a new item with a guest_-prefixed id and persists it", () => {
    state().addItem(sofa, 2);

    const { items } = state();
    expect(items).toHaveLength(1);
    expect(items[0]._id).toMatch(/^guest_/);
    expect(items[0].quantity).toBe(2);
    expect(items[0].variant).toEqual({});
    // Only the whitelisted product fields are copied onto the line.
    expect(items[0].product).toEqual({
      _id: "prod-1",
      name: "Sofa",
      slug: "sofa",
      price: 100,
      images: [{ url: "sofa.jpg" }],
      stock: 5,
    });
    expect(storedItems()).toEqual(items);
  });

  it("defaults quantity to 1", () => {
    state().addItem(sofa);
    expect(state().items[0].quantity).toBe(1);
  });

  it("merges quantity when the same product and variant are added again", () => {
    state().addItem(sofa, 1, { color: "red" });
    const firstId = state().items[0]._id;
    state().addItem(sofa, 3, { color: "red" });

    expect(state().items).toHaveLength(1);
    expect(state().items[0]._id).toBe(firstId);
    expect(state().items[0].quantity).toBe(4);
    expect(storedItems()[0].quantity).toBe(4);
  });

  it("treats variant key order as irrelevant when merging", () => {
    state().addItem(sofa, 1, { color: "red", size: "L" });
    state().addItem(sofa, 2, { size: "L", color: "red" });

    expect(state().items).toHaveLength(1);
    expect(state().items[0].quantity).toBe(3);
  });

  it("keeps a different variant as a separate line", () => {
    state().addItem(sofa, 1, { color: "red" });
    state().addItem(sofa, 1, { color: "blue" });

    expect(state().items).toHaveLength(2);
    expect(state().items.map((i) => i.variant.color)).toEqual(["red", "blue"]);
  });

  it("rejects a product with no id", () => {
    state().addItem({ name: "No id" }, 1);
    state().addItem(null, 1);
    state().addItem(undefined, 1);
    expect(state().items).toEqual([]);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("rejects non-positive quantities", () => {
    state().addItem(sofa, 0);
    state().addItem(sofa, -2);
    expect(state().items).toEqual([]);
  });

  it("rejects non-integer quantities", () => {
    state().addItem(sofa, 1.5);
    state().addItem(sofa, Number.NaN);
    state().addItem(sofa, "2");
    expect(state().items).toEqual([]);
  });
});

describe("updateItemQuantity", () => {
  it("sets the quantity and persists it", () => {
    state().addItem(sofa, 1);
    const id = state().items[0]._id;

    state().updateItemQuantity(id, 5);

    expect(state().items[0].quantity).toBe(5);
    expect(storedItems()[0].quantity).toBe(5);
  });

  it("removes the line when quantity drops to 0 or below", () => {
    state().addItem(sofa, 1);
    state().addItem(lamp, 1);
    const sofaId = state().items[0]._id;
    const lampId = state().items[1]._id;

    state().updateItemQuantity(sofaId, 0);
    expect(state().items.map((i) => i._id)).toEqual([lampId]);

    state().updateItemQuantity(lampId, -3);
    expect(state().items).toEqual([]);
    expect(storedItems()).toEqual([]);
  });

  it("ignores non-integer quantities", () => {
    state().addItem(sofa, 2);
    const id = state().items[0]._id;

    state().updateItemQuantity(id, 2.5);
    state().updateItemQuantity(id, Number.NaN);
    state().updateItemQuantity(id, "4");

    expect(state().items[0].quantity).toBe(2);
  });
});

describe("removeItem and clearCart", () => {
  it("removeItem drops only the matching line and persists", () => {
    state().addItem(sofa, 1);
    state().addItem(lamp, 1);
    const lampId = state().items[1]._id;

    state().removeItem(state().items[0]._id);

    expect(state().items.map((i) => i._id)).toEqual([lampId]);
    expect(storedItems().map((i) => i._id)).toEqual([lampId]);
  });

  it("clearCart empties state AND removes the storage key", () => {
    state().addItem(sofa, 1);
    expect(localStorage.getItem(KEY)).not.toBeNull();

    state().clearCart();

    expect(state().items).toEqual([]);
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});

describe("getCartTotals and getCheckoutItems", () => {
  it("totals an empty cart as zero", () => {
    expect(state().getCartTotals()).toEqual({ itemCount: 0, subtotal: 0 });
    expect(state().getCheckoutItems()).toEqual([]);
  });

  it("sums quantities and price * quantity across lines", () => {
    state().addItem(sofa, 2); // 2 * 100
    state().addItem(lamp, 3); // 3 * 25
    state().addItem(sofa, 1, { color: "red" }); // separate line, 1 * 100

    expect(state().getCartTotals()).toEqual({ itemCount: 6, subtotal: 375 });
  });

  it("formats checkout items as { product: id, quantity, variant, price }", () => {
    state().addItem(sofa, 2, { color: "red" });
    state().addItem(lamp, 1);

    expect(state().getCheckoutItems()).toEqual([
      { product: "prod-1", quantity: 2, variant: { color: "red" }, price: 100 },
      { product: "prod-2", quantity: 1, variant: {}, price: 25 },
    ]);
  });
});

describe("load path (module creation reads localStorage)", () => {
  const validLine = {
    _id: "guest_saved_1",
    product: { _id: "prod-1", name: "Sofa", price: 100 },
    quantity: 2,
    variant: {},
  };

  const importFreshStore = async () => {
    vi.resetModules();
    const mod = await import("../../src/store/guestCartStore.js");
    return mod.default;
  };

  it("hydrates items from a valid stored cart", async () => {
    localStorage.setItem(KEY, JSON.stringify([validLine]));

    const store = await importFreshStore();

    expect(store.getState().items).toEqual([validLine]);
  });

  it("starts empty when nothing is stored", async () => {
    const store = await importFreshStore();
    expect(store.getState().items).toEqual([]);
  });

  it("filters out malformed entries and keeps the valid ones", async () => {
    const malformed = [
      { ...validLine, _id: 42 }, // non-string line id
      {
        ...validLine,
        _id: "guest_x",
        product: { name: "No product id", price: 10 },
      }, // missing product._id
      { ...validLine, _id: "guest_x", product: { _id: "p", price: -1 } }, // negative price
      {
        ...validLine,
        _id: "guest_x",
        product: { _id: "p", price: Number.NaN },
      }, // NaN price (serializes to null)
      { ...validLine, _id: "guest_x", quantity: 0 }, // non-positive quantity
      { ...validLine, _id: "guest_x", quantity: -1 },
      { ...validLine, _id: "guest_x", quantity: 1.5 }, // non-integer quantity
      null,
      "not-an-object",
      { ...validLine, _id: "guest_x", product: null }, // missing product
    ];
    localStorage.setItem(KEY, JSON.stringify([...malformed, validLine]));

    const store = await importFreshStore();

    expect(store.getState().items).toEqual([validLine]);
  });

  it("accepts a zero price (free item) — only negative / non-finite prices are filtered", async () => {
    const free = { ...validLine, product: { _id: "prod-free", price: 0 } };
    localStorage.setItem(KEY, JSON.stringify([free]));

    const store = await importFreshStore();

    expect(store.getState().items).toEqual([free]);
  });

  it("survives corrupt JSON: returns [] and removes the key", async () => {
    localStorage.setItem(KEY, "{not valid json");

    const store = await importFreshStore();

    expect(store.getState().items).toEqual([]);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("returns [] for valid JSON that is not an array", async () => {
    localStorage.setItem(KEY, JSON.stringify({ items: [validLine] }));

    const store = await importFreshStore();

    expect(store.getState().items).toEqual([]);
  });
});
