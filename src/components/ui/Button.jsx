import { Loader2 } from "lucide-react";

/**
 * @typedef {Object} ButtonProps
 * @property {"primary"|"secondary"|"ghost"|"danger"} [variant="primary"]
 * @property {"sm"|"md"|"lg"} [size="md"]
 * @property {boolean} [loading=false] Shows a spinner and disables the control.
 * @property {"button"|"a"} [as="button"] Element to render. Use "a" for
 *   link-styled buttons (pass `href`); there is no Slot/asChild pattern in
 *   this codebase, so polymorphism is intentionally limited to these two.
 * @property {boolean} [disabled]
 * @property {string} [className]
 * @property {React.ReactNode} children
 */

const VARIANT_CLASSES = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  secondary:
    "bg-white text-neutral-800 border border-neutral-300 hover:bg-neutral-50",
  ghost: "bg-transparent text-neutral-700 hover:bg-neutral-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const SIZE_CLASSES = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

/**
 * Shared button primitive (REUSE-003). Previously the same primary CTA was
 * re-typed per file — including two different hover hexes; the canonical
 * hover now lives in the `brand-hover` theme token (#D9620E).
 *
 * @param {ButtonProps & Record<string, unknown>} props Remaining props are
 *   forwarded to the rendered element (`onClick`, `href`, `type`, …).
 */
export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  as = "button",
  disabled = false,
  className = "",
  children,
  type,
  ...props
}) {
  const classes = `inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary} ${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${className}`;
  const content = (
    <>
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
      {children}
    </>
  );

  if (as === "a") {
    return (
      <a
        className={classes}
        aria-disabled={disabled || loading || undefined}
        {...props}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={type || "button"}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {content}
    </button>
  );
}
