import { useMemo } from "react";
import { lineUnitPrice } from "../utils/cartLine";

/**
 * Phase 6 (REUSE-010) — the checkout totals arithmetic, extracted
 * from CheckoutPage so the numbers have exactly one home. The pure
 * function is pinned bit-for-bit by characterization tests
 * (tests/hooks/useCheckoutTotals.test.jsx) whose fixtures were
 * derived from the page's original inline arithmetic:
 *
 *   subtotal      = Σ lineUnitPrice(item) * item.quantity
 *   promoDiscount = appliedDiscount
 *                     ? Math.round(subtotal * discountPercentage / 100)
 *                     : 0
 *   shippingCost  = 0   (constant today — no threshold logic exists)
 *   taxAmount     = 0   (constant today — prices are VAT-included)
 *   total         = subtotal - promoDiscount + shippingCost + taxAmount
 *
 * A variant line prices at its variant (lineUnitPrice — the Phase 4
 * price authority), never the product scalar.
 *
 * CartSlider does NOT use this: the drawer displays the server
 * cart's subtotal (authenticated) or the guest store's totals,
 * which are different data sources, not this arithmetic.
 */
export function computeCheckoutTotals(items, appliedDiscount) {
  const subtotal = items.reduce(
    (sum, item) => sum + lineUnitPrice(item) * item.quantity,
    0,
  );
  const promoDiscount = appliedDiscount
    ? Math.round((subtotal * appliedDiscount.discountPercentage) / 100)
    : 0;
  const shippingCost = 0;
  const taxAmount = 0;
  const total = subtotal - promoDiscount + shippingCost + taxAmount;
  return { subtotal, promoDiscount, shippingCost, taxAmount, total };
}

export function useCheckoutTotals(items, appliedDiscount) {
  return useMemo(
    () => computeCheckoutTotals(items, appliedDiscount),
    [items, appliedDiscount],
  );
}

export default useCheckoutTotals;
