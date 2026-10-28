// Phase 6 (REUSE-010) — CHARACTERIZATION tests for the checkout
// totals arithmetic, written BEFORE the extraction. The expected
// values are derived from the arithmetic that used to live inline
// in CheckoutPage:
//
//   subtotal      = Σ lineUnitPrice(item) * item.quantity   (selected items)
//   promoDiscount = appliedDiscount
//                     ? Math.round(subtotal * discountPercentage / 100)
//                     : 0
//   shippingCost  = 0        (constant — no threshold logic exists)
//   taxAmount     = 0        (constant — VAT included)
//   total         = subtotal - promoDiscount + shippingCost + taxAmount
//
// lineUnitPrice (utils/cartLine) precedence, also pinned here via
// the totals: variantDetails.price ?? unitPrice ?? product.salePrice
// ?? product.price ?? 0.
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  computeCheckoutTotals,
  useCheckoutTotals,
} from "../../src/hooks/useCheckoutTotals.js";

describe("computeCheckoutTotals — characterization", () => {
  it("(a) logged-in simple items: product prices, salePrice beats price", () => {
    const items = [
      { _id: "i1", product: { price: 1000 }, quantity: 2 },
      { _id: "i2", product: { price: 500, salePrice: 450 }, quantity: 1 },
    ];
    expect(computeCheckoutTotals(items, null)).toEqual({
      subtotal: 2450,
      promoDiscount: 0,
      shippingCost: 0,
      taxAmount: 0,
      total: 2450,
    });
  });

  it("(b) guest items: a line's stored unitPrice beats the product price", () => {
    const items = [
      { _id: "g1", product: { price: 800 }, unitPrice: 750, quantity: 3 },
      { _id: "g2", product: { price: 300 }, quantity: 2 },
    ];
    const totals = computeCheckoutTotals(items, null);
    expect(totals.subtotal).toBe(2850);
    expect(totals.total).toBe(2850);
  });

  it("(c) promo: percentage discount rounds via Math.round (half up)", () => {
    const items = [{ _id: "i1", product: { price: 999 }, quantity: 1 }];
    // 999 * 15 / 100 = 149.85 -> 150
    expect(
      computeCheckoutTotals(items, { code: "X", discountPercentage: 15 }),
    ).toEqual({
      subtotal: 999,
      promoDiscount: 150,
      shippingCost: 0,
      taxAmount: 0,
      total: 849,
    });

    const items2 = [{ _id: "i1", product: { price: 1050 }, quantity: 1 }];
    // 1050 * 5 / 100 = 52.5 -> Math.round -> 53 (JS rounds half up)
    const t2 = computeCheckoutTotals(items2, { discountPercentage: 5 });
    expect(t2.promoDiscount).toBe(53);
    expect(t2.total).toBe(997);
  });

  it("(c) promo: fractional prices keep float arithmetic until the round", () => {
    const items = [{ _id: "i1", product: { price: 199.5 }, quantity: 2 }];
    const totals = computeCheckoutTotals(items, { discountPercentage: 10 });
    expect(totals.subtotal).toBe(399);
    expect(totals.promoDiscount).toBe(40); // Math.round(39.9)
    expect(totals.total).toBe(359);
  });

  it("(c) promo: 100% discount zeroes the total; 0% changes nothing", () => {
    const items = [{ _id: "i1", product: { price: 500 }, quantity: 2 }];
    expect(
      computeCheckoutTotals(items, { discountPercentage: 100 }).total,
    ).toBe(0);
    expect(
      computeCheckoutTotals(items, { discountPercentage: 0 }).promoDiscount,
    ).toBe(0);
  });

  it("(d) variant-priced items: variantDetails.price is the authority", () => {
    const items = [
      {
        _id: "v1",
        variantDetails: { price: 1299, sku: "SKU-1" },
        unitPrice: 999,
        product: { price: 2000, salePrice: 1500 },
        quantity: 2,
      },
    ];
    const totals = computeCheckoutTotals(items, null);
    expect(totals.subtotal).toBe(2598);
    expect(totals.total).toBe(2598);
  });

  it("(e) shipping/tax: constants at any subtotal — no free-shipping threshold exists", () => {
    const items = [{ _id: "i1", product: { price: 100000 }, quantity: 3 }];
    const totals = computeCheckoutTotals(items, { discountPercentage: 10 });
    expect(totals.shippingCost).toBe(0);
    expect(totals.taxAmount).toBe(0);
    expect(totals.total).toBe(270000);
  });

  it("empty selection: all zeros, even with a discount applied", () => {
    expect(computeCheckoutTotals([], { discountPercentage: 25 })).toEqual({
      subtotal: 0,
      promoDiscount: 0,
      shippingCost: 0,
      taxAmount: 0,
      total: 0,
    });
  });

  it("priceless lines contribute 0 (no product / no price fields)", () => {
    const items = [
      { _id: "i1", product: {}, quantity: 5 },
      { _id: "i2", quantity: 3 },
    ];
    expect(computeCheckoutTotals(items, null).subtotal).toBe(0);
  });
});

describe("useCheckoutTotals hook", () => {
  it("returns the same totals as the pure function", () => {
    const items = [{ _id: "i1", product: { price: 250 }, quantity: 4 }];
    const discount = { discountPercentage: 20 };
    const { result } = renderHook(() => useCheckoutTotals(items, discount));
    expect(result.current).toEqual(computeCheckoutTotals(items, discount));
    expect(result.current.total).toBe(800);
  });

  it("is memo-stable across rerenders with unchanged inputs", () => {
    const items = [{ _id: "i1", product: { price: 250 }, quantity: 4 }];
    const { result, rerender } = renderHook(() =>
      useCheckoutTotals(items, null),
    );
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
