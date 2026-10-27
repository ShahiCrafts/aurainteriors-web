/**
 * FE-63 — the ONE currency formatter for the storefront.
 *
 * Before this helper, the same price rendered with the INR symbol in
 * the hero and filter sidebar, with two different ad-hoc "rupees"
 * prefixes in ProductCard / ProductCatalog / CustomizeSheet (one of
 * them with en-IN lakh grouping), and with a locale-less grouping
 * call almost everywhere else —
 * so digit grouping followed each visitor's browser locale and
 * fractional values rendered unrounded.
 *
 * The formatter is constructed ONCE with the FIXED "en-NP" locale, so
 * output is deterministic regardless of the visitor's ambient locale.
 * Whole-rupee display (minimum/maximum fraction digits 0): the
 * catalog prices are whole rupees, and a fractional input is rounded
 * by Intl instead of rendering a stray ".5".
 *
 * Null / undefined / NaN / non-finite input returns "" — callers
 * render nothing extra for a missing price (call sites that need an
 * explicit zero pass `value ?? 0`).
 */
const nprFormatter = new Intl.NumberFormat("en-NP", {
  style: "currency",
  currency: "NPR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const nprNumberFormatter = new Intl.NumberFormat("en-NP", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function formatNPR(value) {
  const n = toFiniteNumber(value);
  return n === null ? "" : nprFormatter.format(n);
}

/**
 * The same fixed-locale grouping without the currency code — for
 * places that render the currency label separately (e.g. the price
 * filter inputs, which carry an "NPR" prefix element).
 */
export function formatNPRNumber(value) {
  const n = toFiniteNumber(value);
  return n === null ? "" : nprNumberFormatter.format(n);
}

export default formatNPR;
