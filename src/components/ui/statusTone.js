/**
 * Shared status → tone mapping for Badge (REUSE-008).
 *
 * Status pills were previously re-typed per table (OrderCard, admin list
 * pages each kept their own map). A "tone" is a semantic colour family;
 * Badge owns the actual classes per tone, this module owns which tone a
 * domain status gets. Keys are normalised (lowercase, spaces → "_").
 */

/** @type {Record<string, string>} Tailwind classes per tone. */
export const TONE_CLASSES = {
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-rose-50 text-rose-700",
  info: "bg-blue-50 text-blue-700",
  neutral: "bg-neutral-100 text-neutral-600",
  brand: "bg-orange-50 text-orange-700",
};

export const ORDER_STATUS_TONES = {
  pending: "warning",
  confirmed: "info",
  processing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
  canceled: "danger",
  refunded: "neutral",
  returned: "neutral",
};

export const PAYMENT_STATUS_TONES = {
  pending: "warning",
  unpaid: "warning",
  paid: "success",
  completed: "success",
  failed: "danger",
  refunded: "neutral",
  partially_refunded: "warning",
  cod: "info",
  cash_on_delivery: "info",
};

export const STOCK_STATUS_TONES = {
  in: "success",
  in_stock: "success",
  available: "success",
  low: "warning",
  low_stock: "warning",
  out: "danger",
  out_of_stock: "danger",
  unavailable: "danger",
};

const MAPS = {
  order: ORDER_STATUS_TONES,
  payment: PAYMENT_STATUS_TONES,
  stock: STOCK_STATUS_TONES,
};

/**
 * Resolve a domain status string to a tone name.
 *
 * @param {string} status e.g. "delivered", "Partially Refunded", "low stock"
 * @param {"order"|"payment"|"stock"} [category="order"]
 * @returns {string} A key of TONE_CLASSES ("neutral" for anything unknown).
 */
export function toneForStatus(status, category = "order") {
  if (!status) return "neutral";
  const key = String(status).trim().toLowerCase().replace(/\s+/g, "_");
  const map = MAPS[category] || ORDER_STATUS_TONES;
  return map[key] || "neutral";
}
