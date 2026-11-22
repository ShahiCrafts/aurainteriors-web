// Batch 4 — formatCurrency follows the admin's currency settings
// (currency code, symbol, symbol position, number-format locale)
// via formatConfig. At the default config the output must be
// BYTE-IDENTICAL to the pre-Batch-4 formatter (NPR, en-NP, symbol
// before) — the existing formatCurrency.test.js corpus covers the
// defaults too and must pass unmodified.
import { afterEach, describe, expect, it } from "vitest";
import { formatNPR, formatNPRNumber } from "../../src/utils/formatCurrency.js";
import {
  setFormatConfigFromSettings,
  __resetFormatConfig,
} from "../../src/utils/formatConfig.js";

afterEach(() => {
  __resetFormatConfig();
});

describe("formatCurrency at default settings (parity)", () => {
  it("renders exactly as before", () => {
    // NB: Intl separates the code from the amount with a no-break
    // space — exactly what the pre-Batch-4 formatter emitted.
    expect(formatNPR(1234567)).toBe("NPR\u00A01,234,567");
    expect(formatNPR(0)).toBe("NPR\u00A00");
    // The module's long-standing contract: missing price renders "".
    expect(formatNPR(null)).toBe("");
    expect(formatNPRNumber(5000)).toBe("5,000");
  });

  it("a settings payload equal to the defaults changes nothing", () => {
    setFormatConfigFromSettings({
      currency: "NPR",
      currencySymbol: "NPR",
      symbolPosition: "before",
      numberFormat: "en-NP",
    });
    expect(formatNPR(1234567)).toBe("NPR\u00A01,234,567");
  });
});

describe("formatCurrency with admin-changed settings", () => {
  it("moves the symbol after the amount", () => {
    setFormatConfigFromSettings({
      currency: "USD",
      currencySymbol: "$",
      symbolPosition: "after",
      numberFormat: "en-US",
    });
    expect(formatNPR(1234)).toBe("1,234 $");
  });

  it("uses lakh grouping for en-IN", () => {
    setFormatConfigFromSettings({
      currency: "INR",
      currencySymbol: "₹",
      symbolPosition: "before",
      numberFormat: "en-IN",
    });
    expect(formatNPR(1234567)).toBe("₹ 12,34,567");
    expect(formatNPRNumber(1234567)).toBe("12,34,567");
  });

  it("falls back to the Intl symbol when the admin symbol is blank", () => {
    setFormatConfigFromSettings({
      currency: "USD",
      currencySymbol: "",
      symbolPosition: "before",
      numberFormat: "en-US",
    });
    expect(formatNPR(100)).toBe("$ 100");
  });

  it("uses European grouping and separators for de-DE", () => {
    setFormatConfigFromSettings({
      currency: "EUR",
      currencySymbol: "€",
      symbolPosition: "after",
      numberFormat: "de-DE",
    });
    expect(formatNPRNumber(1234567)).toBe("1.234.567");
    expect(formatNPR(1234567)).toBe("1.234.567 €");
  });
});
