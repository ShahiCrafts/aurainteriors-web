import { Tag } from "lucide-react";
import { formatNPR } from "../../utils/formatCurrency";

/**
 * @typedef {Object} OrderSummaryProps
 * @property {number} itemCount Selected-item count shown in the header.
 * @property {number} subtotal
 * @property {number} promoDiscount Rendered (with the Discount row)
 *   only when > 0, exactly as the page did inline.
 * @property {number} shippingCost 0 renders as "Free".
 * @property {number} taxAmount
 * @property {number} total
 * @property {React.ReactNode} [children] Rendered after the totals
 *   block, below the second dashed separator — the checkout page
 *   passes its promo-code block and CTA row here so the DOM order is
 *   unchanged from the pre-extraction inline panel.
 */

/**
 * Phase 6 (REUSE-010) — the checkout order-summary panel, extracted
 * verbatim from CheckoutPage's right rail (the same summary used to
 * be duplicated almost line-for-line in the dead ReviewStep). Pure
 * presentation: the numbers come from hooks/useCheckoutTotals.
 *
 * @param {OrderSummaryProps} props
 */
export default function OrderSummary({
  itemCount,
  subtotal,
  promoDiscount,
  shippingCost,
  taxAmount,
  total,
  children,
}) {
  return (
    <div className="w-full lg:w-[380px] xl:w-[512px] shrink-0 bg-gray-100">
      <div className="lg:sticky lg:top-20 px-4 sm:px-6 lg:px-12 py-12">
        <div className="bg-white rounded-xl overflow-hidden">

          {/* Header */}
          <div className="px-6 py-5">
            <h2 className="text-[20px] font-semibold text-[#1A1714]">
              Order Summary
              <span className="ml-2 text-[15px] font-medium text-neutral-500">
                ({itemCount} {itemCount === 1 ? "item" : "items"})
              </span>
            </h2>
          </div>

          <div className="px-6 pb-6 space-y-5">
            {/* Line items */}
            <div className="space-y-5">
              <div className="flex justify-between items-center text-[16px]">
                <span className="text-neutral-500">Subtotal</span>
                <span className="font-semibold text-[#1A1714]">
                  {formatNPR(subtotal)}
                </span>
              </div>

              {promoDiscount > 0 && (
                <div className="flex justify-between items-center text-[16px]">
                  <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                    <Tag size={13} />
                    Discount
                  </span>
                  <span className="font-semibold text-emerald-600">
                    − {formatNPR(promoDiscount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-[16px]">
                <span className="text-neutral-500">Tax</span>
                <span className="font-semibold text-[#1A1714]">
                  {formatNPR(taxAmount)}
                </span>
              </div>

              <div className="flex justify-between items-center text-[16px]">
                <span className="text-neutral-500">Shipping</span>
                <span className={`font-medium ${shippingCost === 0 ? "text-emerald-600" : "text-[#1A1714]"}`}>
                  {shippingCost === 0 ? "Free" : formatNPR(shippingCost)}
                </span>
              </div>
            </div>

            <div className="h-px w-full bg-[repeating-linear-gradient(to_right,#d4d4d4_0_10px,transparent_10px_18px)]" />
            <div className="flex justify-between items-center">
              <span className="text-[20px] font-semibold text-[#1A1714]">Total</span>
              <div className="text-right">
                <p className="text-[24px] font-semibold text-[#1A1714] leading-none">
                  {formatNPR(total)}
                </p>
                <p className="text-[13px] text-neutral-500 mt-3">VAT included</p>
              </div>
            </div>

            <div className="h-px w-full bg-[repeating-linear-gradient(to_right,#d4d4d4_0_10px,transparent_10px_18px)]" />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
