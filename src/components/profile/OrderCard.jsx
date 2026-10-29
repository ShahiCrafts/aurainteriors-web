import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Copy,
  Check,
  ChevronDown,
  ShoppingCart,
  RotateCcw,
  Star,
  Clock,
  CheckCircle2,
  Box,
  Truck,
  XCircle,
} from "lucide-react";
import { getImageUrl as getImageUrlUtil } from "../../utils/imageUrl";
import ImageWithFallback from "../fallbacks/ImageWithFallback";
import { toast } from "../../lib/toast";
import useAuthStore from "../../store/authStore";
import { useShallow } from "zustand/react/shallow";
import { useAddToCart } from "../../hooks/cart/useCartTan";
import useGuestCartStore from "../../store/guestCartStore";
import { useRequestReturn } from "../../hooks/order/useOrderTan";
import { formatNPR } from "../../utils/formatCurrency";
import { formatDate as formatDateShared } from "../../utils/formatDate";
import OrderTrackingTimeline from "./OrderTrackingTimeline";

const STATUS_STYLE = {
  pending: {
    label: "Pending",
    icon: Clock,
    bg: "bg-amber-50",
    text: "text-amber-600",
    dot: "bg-amber-400",
    step: 0,
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    dot: "bg-emerald-400",
    step: 1,
  },
  processing: {
    label: "Processing",
    icon: Box,
    bg: "bg-blue-50",
    text: "text-blue-600",
    dot: "bg-blue-400",
    step: 2,
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    dot: "bg-indigo-400",
    step: 3,
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    dot: "bg-emerald-400",
    step: 4,
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    bg: "bg-red-50",
    text: "text-red-500",
    dot: "bg-red-400",
    step: -1,
  },
};

const TRACK_STEPS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

// Shared style for secondary action buttons — consistent border + hover across the row
const ACTION_BTN_CLASS =
  "flex items-center gap-2 px-6 py-2.5 rounded-lg border border-neutral-200 text-[13px] font-bold text-neutral-600 bg-white hover:bg-neutral-50 hover:text-[#1A1714] transition-colors";

const DESTRUCTIVE_ACTION_BTN_CLASS =
  "flex items-center gap-2 px-6 py-2.5 rounded-lg border border-neutral-200 text-[13px] font-bold text-neutral-600 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors";

export default function OrderCard({ order, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);
  const getImageUrl = (item) => getImageUrlUtil(item.image, "products");

  const formatDate = (date) =>
    formatDateShared(date, { month: "short", day: "numeric", year: "numeric" });

  const status = STATUS_STYLE[order.orderStatus] || STATUS_STYLE.pending;
  const StatusIcon = status.icon;
  const isCancelled = order.orderStatus === "cancelled";
  const isDelivered = order.orderStatus === "delivered";
  const isTrackable = !isCancelled && !isDelivered;
  const items = order.items || [];

  const trackingDates = {
    pending: order.pendingAt || order.orderedAt,
    confirmed: order.confirmedAt,
    processing: order.processingAt,
    shipped: order.shippedAt,
    delivered: order.deliveredAt,
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(order.orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const { isAuthenticated } = useAuthStore(
    useShallow((state) => ({ isAuthenticated: state.isAuthenticated })),
  );
  const { mutate: addToCart } = useAddToCart();
  const { addItem: addToGuestCart } = useGuestCartStore(
    useShallow((state) => ({ addItem: state.addItem })),
  );
  const { mutate: requestReturnMutate, isPending: isRequestingReturn } =
    useRequestReturn();
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState("");

  const productIdOf = (item) =>
    item?.product?._id ||
    (typeof item?.product === "string" ? item.product : null) ||
    item?.productId ||
    null;
  const readdableItems = items
    .map((item) => ({ item, productId: productIdOf(item) }))
    .filter(({ productId }) => !!productId);
  const firstItem = items[0];
  const reviewSegment =
    firstItem?.product?.slug || firstItem?.slug || productIdOf(firstItem || {});
  const canRequestReturn =
    isDelivered &&
    !!order._id &&
    (!order.returnRequest?.status || order.returnRequest.status === "none");

  const handleBuyAgain = () => {
    if (!isAuthenticated) {
      readdableItems.forEach(({ item, productId }) =>
        addToGuestCart(
          {
            _id: productId,
            name: item.name,
            price: item.price || 0,
            images: item.image ? [{ url: item.image }] : item.images || [],
          },
          item.quantity || 1,
          item.variant || {},
        ),
      );
      toast.success("Added to cart");
      return;
    }
    let remaining = readdableItems.length;
    readdableItems.forEach(({ item, productId }) =>
      addToCart(
        {
          productId,
          quantity: item.quantity || 1,
          variant: item.variant || {},
        },
        {
          onSuccess: () => {
            remaining -= 1;
            if (remaining === 0) toast.success("Added to cart");
          },
        },
      ),
    );
  };

  const handleRequestReturn = (e) => {
    e.preventDefault();
    const reason = returnReason.trim();
    if (!reason || !order._id) return;
    requestReturnMutate(
      { id: order._id, data: { reason } },
      {
        onSuccess: () => {
          toast.success("Return request submitted");
          setShowReturnForm(false);
          setReturnReason("");
        },
      },
    );
  };

  // Thumbnail stack for the collapsed row
  const previewItems = items.slice(0, 3);
  const extraCount = items.length - previewItems.length;

  // Item names summary to fill the middle of the row
  const itemNamesSummary = items.map((i) => i.name).join(", ");

  return (
    <div>
      {/* Row header — click anywhere to expand/collapse */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="w-full grid grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] items-center gap-5 px-6 py-6 text-left hover:bg-gray-50 transition-colors"
      >
        {/* Thumbnails */}
        <div className="hidden sm:flex items-center -space-x-3 shrink-0">
          {previewItems.map((item, idx) => (
            <div
              key={idx}
              className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white bg-white"
              style={{ zIndex: previewItems.length - idx }}
            >
              <ImageWithFallback
                src={getImageUrl(item)}
                alt=""
                loading="lazy"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {extraCount > 0 && (
            <div className="w-12 h-12 rounded-lg border-2 border-white bg-neutral-100 flex items-center justify-center text-[11px] font-bold text-neutral-500 shrink-0">
              +{extraCount}
            </div>
          )}
        </div>

        {/* Order ID + date */}
        <div className="min-w-0 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[17px] font-semibold text-neutral-900 tracking-tight whitespace-nowrap">
              #{order.orderId}
            </h3>
            <span
              role="button"
              onClick={handleCopy}
              title="Copy order ID"
              className="shrink-0 text-neutral-300 hover:text-neutral-600 transition-colors"
            >
              {copied ? (
                <Check size={14} className="text-emerald-500" />
              ) : (
                <Copy size={14} />
              )}
            </span>
          </div>
          <p className="text-[14px] text-neutral-400 font-medium mt-0.5 whitespace-nowrap">
            {formatDate(order.orderedAt)} · {items.length} item
            {items.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Middle: item names + inline progress — fills the empty space */}
        <div className="hidden md:flex flex-col justify-center min-w-0 pl-6 border-l border-neutral-100 gap-4">
          <p
            className="text-[15px] text-neutral-500 font-medium truncate"
            title={itemNamesSummary}
          >
            {itemNamesSummary}
          </p>
          {isTrackable ? (
            <div className="flex items-center gap-2 max-w-58">
              {TRACK_STEPS.map((step, idx) => {
                const stepIdx = TRACK_STEPS.indexOf(order.orderStatus);
                const filled = idx <= stepIdx;
                return (
                  <span
                    key={step}
                    className={`h-2 flex-1 rounded-full ${filled ? "bg-brand" : "bg-neutral-150 bg-neutral-200"}`}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wide">
              {isCancelled ? "Order cancelled" : "Order complete"}
            </p>
          )}
        </div>

        {/* Total */}
        <div className="text-right shrink-0">
          <p className="text-[14px] font-medium text-neutral-400">Total</p>
          <p className="text-[20px] font-bold text-neutral-900 leading-tight mt-0.5 whitespace-nowrap">
            {formatNPR(order.total)}
          </p>
          <span
            className={`lg:hidden inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.bg} ${status.text}`}
          >
            <span className={`w-1 h-1 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        {/* Chevron */}
        <div className="flex items-center justify-center text-neutral-400 shrink-0">
          <ChevronDown
            size={17}
            className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-neutral-100">
          {/* Tracking timeline — full width, on top */}
          {items.length > 0 && (
            <div className="px-6 py-10">
              <OrderTrackingTimeline
                status={order.orderStatus}
                dates={trackingDates}
                compact
              />
            </div>
          )}

          {/* Items — horizontally scrollable if they overflow */}
          <div className="px-6 pb-8">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 min-w-112.5 max-w-95 shrink-0 bg-white border border-neutral-200 rounded-xl p-4"
                >
                  <div className="w-24 h-24 bg-white rounded-lg overflow-hidden shrink-0 border border-neutral-100">
                    <ImageWithFallback
                      src={getImageUrl(item)}
                      alt={item.name}
                      loading="lazy"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-[16px] font-semibold text-neutral-900 leading-snug">
                      {item.name}
                    </h5>
                    {item.variant && (
                      <div className="flex flex-col gap-0.5 mt-1.5">
                        {Object.entries(item.variant).map(([k, v]) => (
                          <span
                            key={k}
                            className="text-[14px] text-neutral-400 font-medium"
                          >
                            {k}:{" "}
                            <span className="text-neutral-700 font-semibold">
                              {v}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-[16px] font-bold text-brand mt-1.5">
                      {formatNPR(item.price || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions — FE-38 dispositions:
              Buy Again: a real re-add through the cart surfaces when
                any item carries a product id; otherwise the previous
                /shop link (there is nothing identifiable to re-add).
              Invoice: REMOVED — no invoice endpoint exists in the
                client API surface (checked src/api/*) or the server
                routes, so the button could only ever be dead.
              Write Review: a link to the first item's product page,
                where the (purchase-gated) review form lives.
              Request Return: delivered orders only — the server
                rejects returns for any other status — opening the
                inline reason form below (a reason is required). */}
          <div className="px-6 py-4 bg-gray-50 border-t border-neutral-100 flex flex-wrap justify-end gap-3">
            {readdableItems.length > 0 ? (
              <button
                type="button"
                onClick={handleBuyAgain}
                className={ACTION_BTN_CLASS}
              >
                <ShoppingCart size={14} />
                Buy Again
              </button>
            ) : (
              <Link to="/shop" className={ACTION_BTN_CLASS}>
                <ShoppingCart size={14} />
                Buy Again
              </Link>
            )}
            {isDelivered && reviewSegment && (
              <Link
                to={`/product/${encodeURIComponent(reviewSegment)}`}
                className={ACTION_BTN_CLASS}
              >
                <Star size={14} />
                Write Review
              </Link>
            )}
            {canRequestReturn && (
              <button
                type="button"
                onClick={() => setShowReturnForm((v) => !v)}
                aria-expanded={showReturnForm}
                className={DESTRUCTIVE_ACTION_BTN_CLASS}
              >
                <RotateCcw size={14} />
                Request Return
              </button>
            )}
          </div>

          {showReturnForm && canRequestReturn && (
            <form
              onSubmit={handleRequestReturn}
              className="px-6 py-4 bg-red-50/60 border-t border-neutral-100"
            >
              <label
                htmlFor={`return-reason-${order.orderId}`}
                className="block text-[13px] font-bold text-neutral-700 mb-2"
              >
                Reason for return
              </label>
              <textarea
                id={`return-reason-${order.orderId}`}
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-1 focus:ring-red-300"
                placeholder="Tell us why you are returning this order"
              />
              <div className="flex justify-end gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setShowReturnForm(false)}
                  className={ACTION_BTN_CLASS}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!returnReason.trim() || isRequestingReturn}
                  className={DESTRUCTIVE_ACTION_BTN_CLASS}
                >
                  Submit Return Request
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
