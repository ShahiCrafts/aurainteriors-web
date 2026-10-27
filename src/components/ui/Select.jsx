import { ChevronDown } from "lucide-react";

/**
 * @typedef {Object} SelectOption
 * @property {string|number} value
 * @property {string} label
 * @property {boolean} [disabled]
 */

/**
 * @typedef {Object} SelectProps
 * @property {SelectOption[]} [options] Options to render when no children
 *   are given.
 * @property {React.ReactNode} [children] `<option>` elements; take
 *   precedence over `options`.
 * @property {string} [className] Applied to the `<select>`.
 * @property {boolean} [invalid] Red border styling (pair with Field error).
 */

/**
 * Styled native `<select>` (REUSE-004). All other props (`value`,
 * `onChange`, `disabled`, `id`, `aria-*`, …) are forwarded to the select.
 *
 * @param {SelectProps & Record<string, unknown>} props
 */
export default function Select({
  options,
  children,
  className = "",
  invalid = false,
  ...props
}) {
  return (
    <div className="relative">
      <select
        className={`w-full h-[42px] px-3.5 pr-10 appearance-none border rounded-lg bg-white outline-none transition-all text-sm focus:ring-1 focus:ring-brand focus:border-brand disabled:opacity-60 disabled:cursor-not-allowed ${
          invalid ? "border-red-400" : "border-neutral-300"
        } ${className}`}
        {...props}
      >
        {children ||
          (options || []).map((option) => (
            <option
              key={String(option.value)}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
      </select>
      <ChevronDown
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
      />
    </div>
  );
}
