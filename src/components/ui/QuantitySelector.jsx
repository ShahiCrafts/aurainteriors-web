import { useState } from "react";
import { Minus, Plus } from "lucide-react";

/**
 * @typedef {Object} QuantitySelectorProps
 * @property {number} value Current quantity (controlled).
 * @property {(value: number) => void} onChange Called with the clamped value.
 * @property {number} [min=1]
 * @property {number} [max] Upper bound (e.g. available stock); unbounded
 *   when omitted.
 * @property {boolean} [disabled=false]
 * @property {"sm"|"md"} [size="md"]
 * @property {string} [className]
 */

const SIZE_CLASSES = {
  sm: { button: "w-7 h-7", input: "w-10 text-sm", icon: 13 },
  md: { button: "w-9 h-9", input: "w-12 text-sm", icon: 15 },
};

/**
 * Quantity stepper (REUSE-010). The Minus/value/Plus control was
 * implemented three times (CartSlider, CheckoutPage, PDP) with subtly
 * different clamp rules; here `min`/`max` are the single clamp contract.
 * The middle input accepts typed values but only commits a valid,
 * clamped number on blur or Enter — partial/invalid drafts never reach
 * `onChange`.
 *
 * @param {QuantitySelectorProps} props
 */
export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
  size = "md",
  className = "",
}) {
  const [draft, setDraft] = useState(null);
  const dims = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  const clamp = (n) => {
    let next = Math.max(min, n);
    if (max != null) next = Math.min(max, next);
    return next;
  };

  const commitDraft = () => {
    if (draft === null) return;
    const parsed = Number.parseInt(draft, 10);
    setDraft(null);
    if (Number.isFinite(parsed)) {
      const next = clamp(parsed);
      if (next !== value) onChange(next);
    }
  };

  const stepButton =
    "flex items-center justify-center rounded-lg border border-neutral-300 text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer";

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        aria-label="Decrease quantity"
        className={`${stepButton} ${dims.button}`}
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
      >
        <Minus size={dims.icon} aria-hidden="true" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label="Quantity"
        className={`${dims.input} h-9 text-center font-semibold border border-neutral-200 rounded-lg outline-none focus:border-brand disabled:opacity-50`}
        value={draft ?? String(value)}
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value.replace(/[^0-9]/g, ""))}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitDraft();
          } else if (event.key === "Escape") {
            setDraft(null);
          }
        }}
      />
      <button
        type="button"
        aria-label="Increase quantity"
        className={`${stepButton} ${dims.button}`}
        disabled={disabled || (max != null && value >= max)}
        onClick={() => onChange(clamp(value + 1))}
      >
        <Plus size={dims.icon} aria-hidden="true" />
      </button>
    </div>
  );
}
