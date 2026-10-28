import { useState } from "react";
import { Star } from "lucide-react";

/**
 * @typedef {Object} RatingProps
 * @property {number} value Average rating (display) or chosen value (input).
 * @property {number} [count] Review count, rendered as "(count)" in display mode.
 * @property {boolean} [interactive=false] Renders 5 selectable star buttons.
 * @property {(value: number) => void} [onChange] Required in interactive mode.
 * @property {"sm"|"md"|"lg"} [size="md"]
 * @property {string} [className]
 */

const STAR_PX = { sm: 14, md: 16, lg: 20 };
const TEXT_SIZE = { sm: "text-xs", md: "text-sm", lg: "text-base" };

/**
 * Star rating (REUSE-006). One storefront convention for display mode:
 * a single filled star + the average at one decimal + the review count —
 * the ProductCard grid convention. (The codebase previously had 19 inline
 * star implementations, including 5-star rows and a second convention
 * inside ProductCard itself.) Interactive mode renders five real buttons
 * with aria-labels, so it is keyboard operable.
 *
 * @param {RatingProps} props
 */
export default function Rating({
  value = 0,
  count,
  interactive = false,
  onChange,
  size = "md",
  className = "",
}) {
  const [hoverValue, setHoverValue] = useState(0);
  const px = STAR_PX[size] || STAR_PX.md;

  if (!interactive) {
    const average = Number.isFinite(Number(value)) ? Number(value) : 0;
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <Star size={px} className="fill-brand text-brand" aria-hidden="true" />
        <span
          className={`font-semibold text-neutral-800 ${TEXT_SIZE[size] || TEXT_SIZE.md}`}
        >
          {average.toFixed(1)}
        </span>
        {count != null && (
          <span
            className={`text-neutral-400 ${TEXT_SIZE[size] || TEXT_SIZE.md}`}
          >
            ({count})
          </span>
        )}
      </span>
    );
  }

  const activeValue = hoverValue || value;
  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className}`}
      role="group"
      aria-label="Choose a rating"
      onMouseLeave={() => setHoverValue(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
          aria-pressed={value === star}
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => setHoverValue(star)}
          onFocus={() => setHoverValue(star)}
          onBlur={() => setHoverValue(0)}
          className="p-0.5 cursor-pointer bg-transparent border-none"
        >
          <Star
            size={px}
            aria-hidden="true"
            className={
              star <= activeValue
                ? "fill-brand text-brand"
                : "fill-neutral-200 text-neutral-200"
            }
          />
        </button>
      ))}
    </span>
  );
}
