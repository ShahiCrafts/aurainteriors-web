import { useMemo } from "react";
import { lineUnitPrice } from "../utils/cartLine";
import { computeDeliveryFee, computeVat } from "../utils/commerceTotals";

// Batch 4: totals take the public commerce settings + the shipping
// address so the summary can mirror the server's math (delivery fee
// by zone, VAT when enabled, minimum-order state). With no commerce
// passed — or at the shipped defaults (all zone rates 0, VAT off,
// minimum 0) — the result is exactly the pre-Batch-4 totals:
// shippingCost 0, taxAmount 0, total = subtotal - promoDiscount.
export function computeCheckoutTotals(
  items,
  appliedDiscount,
  commerce = null,
  shippingAddress = null,
) {
  const subtotal = items.reduce(
    (sum, item) => sum + lineUnitPrice(item) * item.quantity,
    0,
  );
  const promoDiscount = appliedDiscount
    ? Math.round((subtotal * appliedDiscount.discountPercentage) / 100)
    : 0;
  const goodsAmount = subtotal - promoDiscount;
  const shippingCost = commerce
    ? computeDeliveryFee(commerce, shippingAddress, goodsAmount)
    : 0;
  const taxAmount = commerce ? computeVat(commerce, goodsAmount) : 0;
  const total = goodsAmount + shippingCost + taxAmount;
  // NOTE: the return shape stays exactly the five characterized
  // keys (tests/hooks/useCheckoutTotals.test.jsx pins it with
  // toEqual). The minimum-order state lives in the separate helper
  // below so this shape never grows.
  return {
    subtotal,
    promoDiscount,
    shippingCost,
    taxAmount,
    total,
  };
}

// Batch 4: minimum-order state for the checkout notice. The server
// rejects below-minimum orders with the same comparison (goods
// amount = subtotal - promoDiscount).
export function computeMinimumOrderState(commerce, subtotal, promoDiscount) {
  const minimumOrderAmount = commerce?.orders?.minimumOrderAmount || 0;
  const goodsAmount = subtotal - promoDiscount;
  return {
    minimumOrderAmount,
    belowMinimum: minimumOrderAmount > 0 && goodsAmount < minimumOrderAmount,
  };
}

export function useCheckoutTotals(
  items,
  appliedDiscount,
  commerce = null,
  shippingAddress = null,
) {
  return useMemo(
    () => computeCheckoutTotals(items, appliedDiscount, commerce, shippingAddress),
    [items, appliedDiscount, commerce, shippingAddress],
  );
}

export default useCheckoutTotals;
