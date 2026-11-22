// Leaf bridge between the site-settings store and the central
// formatters (formatCurrency.js / formatDate.js), mirroring
// src/seo/settingsBridge.js: this module has zero imports, the
// settings store pushes the commerce section in after a successful
// load, and the formatters read it at call time. Until a load
// happens (or if it fails) the config stays at the shipped defaults
// — NPR / en-NP grouping / symbol before / M/D/YYYY — which are
// exactly what the formatters hard-coded before Batch 4, so output
// is unchanged.

export const DEFAULT_CURRENCY_CONFIG = {
  code: "NPR",
  numberLocale: "en-NP",
  symbolPosition: "before",
  symbol: "",
};

export const DEFAULT_DATE_CONFIG = {
  dateFormat: "M/D/YYYY",
  timezone: "Asia/Kathmandu",
};

let currencyConfig = { ...DEFAULT_CURRENCY_CONFIG };
let dateConfig = { ...DEFAULT_DATE_CONFIG };

export const setFormatConfigFromSettings = (commerce) => {
  if (!commerce || typeof commerce !== "object") {
    currencyConfig = { ...DEFAULT_CURRENCY_CONFIG };
    dateConfig = { ...DEFAULT_DATE_CONFIG };
    return;
  }
  currencyConfig = {
    code: commerce.currency || DEFAULT_CURRENCY_CONFIG.code,
    numberLocale: commerce.numberFormat || DEFAULT_CURRENCY_CONFIG.numberLocale,
    symbolPosition:
      commerce.symbolPosition || DEFAULT_CURRENCY_CONFIG.symbolPosition,
    // The stored symbol passes through; "" (the leaf default) means
    // the formatter uses the symbol Intl derives for the currency.
    // The stored default "NPR" IS the Intl-derived symbol for
    // NPR + en-NP, so the formatter's fast path still applies.
    symbol: commerce.currencySymbol || "",
  };
  dateConfig = {
    dateFormat: commerce.dateFormat || DEFAULT_DATE_CONFIG.dateFormat,
    timezone: commerce.timezone || DEFAULT_DATE_CONFIG.timezone,
  };
};

export const getCurrencyConfig = () => currencyConfig;
export const getDateConfig = () => dateConfig;

// Test-only reset so suites can isolate the module-level holders.
export const __resetFormatConfig = () => {
  currencyConfig = { ...DEFAULT_CURRENCY_CONFIG };
  dateConfig = { ...DEFAULT_DATE_CONFIG };
};
