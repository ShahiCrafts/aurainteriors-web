import { useMemo } from "react";
import { lineUnitPrice } from "../utils/cartLine";

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
