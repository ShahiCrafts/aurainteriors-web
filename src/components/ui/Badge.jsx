import { TONE_CLASSES, toneForStatus } from "./statusTone";

/**
 * @typedef {Object} BadgeProps
 * @property {"success"|"warning"|"danger"|"info"|"neutral"|"brand"} [tone]
 *   Explicit tone; wins over `status`.
 * @property {string} [status] Domain status (e.g. an order status) to
 *   resolve through statusTone when `tone` is not given.
 * @property {"order"|"payment"|"stock"} [category="order"] Which status map
 *   to resolve `status` against.
 * @property {string} [className]
 * @property {React.ReactNode} children Badge label; defaults to the
 *   `status` string when no children are given.
 */

/**
 * Status pill / tag (REUSE-008). Replaces the per-table status maps and
 * the inline discount/new/featured pills re-typed across cards and lists.
 *
 * @param {BadgeProps} props
 */
export default function Badge({
  tone,
  status,
  category = "order",
  className = "",
  children,
}) {
  const resolvedTone =
    tone || (status ? toneForStatus(status, category) : "neutral");
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASSES[resolvedTone] || TONE_CLASSES.neutral} ${className}`}
    >
      {children ?? status}
    </span>
  );
}
