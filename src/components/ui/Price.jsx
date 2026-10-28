import { formatNPR } from "../../utils/formatCurrency";

/**
 * @typedef {Object} PriceProps
 * @property {number|string} amount Current price; formatted via formatNPR.
 * @property {number|string} [compareAt] Original price; rendered struck
 *   through only when it is greater than `amount`.
 * @property {"sm"|"md"|"lg"} [size="md"]
 * @property {string} [className]
 */

const SIZE_CLASSES = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
};

/**
 * Price composition (REUSE-007): formatted price + optional struck-through
 * compare-at price. The price + strikethrough composition was previously
 * re-typed in ProductCard (twice), Wishlist and the PDP. Formatting itself
 * stays single-sourced in utils/formatCurrency (fixed en-NP / NPR).
 *
 * @param {PriceProps} props
 */
export default function Price({
  amount,
  compareAt,
  size = "md",
  className = "",
}) {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const showCompare =
    compareAt != null &&
    Number.isFinite(Number(compareAt)) &&
    Number(compareAt) > Number(amount);

  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className={`font-bold text-neutral-900 ${sizeClass}`}>
        {formatNPR(amount)}
      </span>
      {showCompare && (
        <span className={`line-through text-neutral-400 ${sizeClass}`}>
          {formatNPR(compareAt)}
        </span>
      )}
    </span>
  );
}
