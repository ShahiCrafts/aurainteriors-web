// Batch 4 — checkout totals mirror the server's settings-driven
// math. PARITY: with no commerce (legacy call) and with the shipped
// default commerce, totals are exactly the pre-Batch-4 numbers
// (shipping 0, tax 0, total = subtotal - discount).
import { describe, expect, it } from "vitest";
import {
  computeCheckoutTotals,
  computeMinimumOrderState,
} from "../../src/hooks/useCheckoutTotals.js";

const ITEMS = [
  { product: { price: 1000 }, quantity: 2 },
  { product: { price: 500 }, quantity: 1 },
]; // subtotal 2500

const DEFAULT_COMMERCE = {
  freeShippingThreshold: 5000,
  shipping: {
    enabled: true,
    deliveryEstimateText: "",
    zones: [
      { name: "Kathmandu Valley", rate: 0, enabled: true },
      { name: "Other Nepal", rate: 0, enabled: true },
      { name: "International", rate: 0, enabled: false },
    ],
    defaultZone: "Other Nepal",
  },
  tax: { vatEnabled: false, vatRate: 13 },
  orders: { minimumOrderAmount: 0 },
};

const KTM = { city: "Kathmandu", state: "Bagmati", country: "Nepal" };
const POKHARA = { city: "Pokhara", state: "Gandaki", country: "Nepal" };

describe("computeCheckoutTotals parity", () => {
  it("legacy two-argument call is unchanged", () => {
    expect(computeCheckoutTotals(ITEMS, null)).toEqual({
      subtotal: 2500,
      promoDiscount: 0,
      shippingCost: 0,
      taxAmount: 0,
      total: 2500,
    });
  });

  it("default commerce settings reproduce the same totals", () => {
    const t = computeCheckoutTotals(ITEMS, null, DEFAULT_COMMERCE, KTM);
    expect(t.shippingCost).toBe(0);
    expect(t.taxAmount).toBe(0);
    expect(t.total).toBe(2500);
  });
});

describe("computeCheckoutTotals with configured commerce", () => {
  const commerce = structuredClone(DEFAULT_COMMERCE);
  commerce.shipping.zones[0].rate = 150; // Kathmandu Valley
  commerce.shipping.zones[1].rate = 250; // Other Nepal

  it("charges the valley rate for a Kathmandu address", () => {
    const t = computeCheckoutTotals(ITEMS, null, commerce, KTM);
    expect(t.shippingCost).toBe(150);
    expect(t.total).toBe(2650);
  });

  it("charges the default-zone rate outside the valley", () => {
    const t = computeCheckoutTotals(ITEMS, null, commerce, POKHARA);
    expect(t.shippingCost).toBe(250);
  });

  it("is free at/above the free-shipping threshold", () => {
    const big = [{ product: { price: 5000 }, quantity: 1 }];
    const t = computeCheckoutTotals(big, null, commerce, POKHARA);
    expect(t.shippingCost).toBe(0);
  });

  it("adds VAT on the discounted goods amount when enabled", () => {
    const withVat = structuredClone(commerce);
    withVat.tax.vatEnabled = true;
    const t = computeCheckoutTotals(
      ITEMS,
      { discountPercentage: 10 },
      withVat,
      KTM,
    );
    // goods 2250, VAT 13% = 292.5, fee 150 (below threshold)
    expect(t.taxAmount).toBe(292.5);
    expect(t.total).toBe(2250 + 150 + 292.5);
  });

  it("flags an order below the configured minimum", () => {
    const withMin = structuredClone(DEFAULT_COMMERCE);
    withMin.orders.minimumOrderAmount = 5000;
    const t = computeCheckoutTotals(ITEMS, null, withMin, KTM);
    const state = computeMinimumOrderState(withMin, t.subtotal, t.promoDiscount);
    expect(state.belowMinimum).toBe(true);
    expect(state.minimumOrderAmount).toBe(5000);
    // At the default minimum (0) nothing is ever below it.
    expect(
      computeMinimumOrderState(DEFAULT_COMMERCE, 2500, 0).belowMinimum,
    ).toBe(false);
  });

  it("charges nothing when shipping is disabled", () => {
    const off = structuredClone(commerce);
    off.shipping.enabled = false;
    const t = computeCheckoutTotals(ITEMS, null, off, POKHARA);
    expect(t.shippingCost).toBe(0);
  });
});
