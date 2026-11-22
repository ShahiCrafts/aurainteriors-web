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
 *
 * Batch 4 — the formatter now reads the commerce settings pushed
 * into utils/formatConfig.js by the site-settings store (currency
 * code, grouping locale, symbol + symbol position). The DEFAULT
 * config (NPR, en-NP, symbol before, derived symbol "NPR") takes the
 * exact original code path below, so output at default settings is
 * byte-identical to the pre-Batch-4 formatter; a changed currency /
 * grouping / position takes the parts-reassembly path.
 */
import { getCurrencyConfig } from "./formatConfig";

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

const isDefaultConfig = (cfg) =>
  cfg.code === "NPR" &&
  cfg.numberLocale === "en-NP" &&
  cfg.symbolPosition === "before" &&
  (cfg.symbol === "" || cfg.symbol === "NPR");

const formatterCache = new Map();

function getConfiguredFormatters(cfg) {
  const key = `${cfg.code}|${cfg.numberLocale}|${cfg.symbolPosition}|${cfg.symbol}`;
  let entry = formatterCache.get(key);
  if (entry) return entry;
  const currency = new Intl.NumberFormat(cfg.numberLocale, {
    style: "currency",
    currency: cfg.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const number = new Intl.NumberFormat(cfg.numberLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  entry = { currency, number };
  formatterCache.set(key, entry);
  return entry;
}

// Reassemble an Intl currency rendering with an optional custom
// symbol and an explicit symbol position (Intl's natural position
// for the locale wins unless the setting overrides it).
function formatWithConfig(currencyFormatter, cfg, n) {
  const parts = currencyFormatter.formatToParts(n);
  const currencyIndex = parts.findIndex((p) => p.type === "currency");
  if (currencyIndex === -1) return currencyFormatter.format(n);
  const symbol = cfg.symbol || parts[currencyIndex].value;

  // Reassemble in the module's house style — "SYMBOL 1,234" or
  // "1,234 SYMBOL" with a regular space — whatever separator the
  // locale's own format used (ICU emits a no-break space, or none
  // at all for e.g. en-IN ₹), and wherever it naturally sits.
  const numberParts = parts.filter((_, i) => i !== currencyIndex);
  while (
    numberParts.length &&
    numberParts[0].type === "literal" &&
    numberParts[0].value.trim() === ""
  ) {
    numberParts.shift();
  }
  while (
    numberParts.length &&
    numberParts[numberParts.length - 1].type === "literal" &&
    numberParts[numberParts.length - 1].value.trim() === ""
  ) {
    numberParts.pop();
  }
  const numberText = numberParts.map((p) => p.value).join("");
  return cfg.symbolPosition === "after"
    ? `${numberText} ${symbol}`
    : `${symbol} ${numberText}`;
}

export function formatNPR(value) {
  const n = toFiniteNumber(value);
  if (n === null) return "";
  const cfg = getCurrencyConfig();
  if (isDefaultConfig(cfg)) return nprFormatter.format(n);
  const { currency } = getConfiguredFormatters(cfg);
  return formatWithConfig(currency, cfg, n);
}

/**
 * The same fixed-locale grouping without the currency code — for
 * places that render the currency label separately (e.g. the price
 * filter inputs, which carry an "NPR" prefix element).
 */
export function formatNPRNumber(value) {
  const n = toFiniteNumber(value);
  if (n === null) return "";
  const cfg = getCurrencyConfig();
  if (isDefaultConfig(cfg)) return nprNumberFormatter.format(n);
  const { number } = getConfiguredFormatters(cfg);
  return number.format(n);
}

export default formatNPR;
