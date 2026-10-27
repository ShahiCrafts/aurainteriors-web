// FE-63 — one currency formatter for the storefront.
//
// Pre-fix: the same price rendered as ₹ (Hero, FilterSidebar),
// "NRs." (ProductCard, ProductCatalog), "Nrs." + en-IN grouping
// (CustomizeSheet), or "NRs. {x?.toLocaleString()}" with NO locale —
// so digit grouping followed each visitor's browser locale and
// fractional values rendered unrounded. The fix is a single helper,
// src/utils/formatCurrency.js, built on
// Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR" })
// with whole-rupee display (catalog prices are whole rupees).

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatNPR, formatNPRNumber } from "../../src/utils/formatCurrency.js";

const NBSP = " ";

describe("formatNPR (FE-63)", () => {
  it("formats with the NPR code and en-NP (western) grouping", () => {
    expect(formatNPR(1234567)).toBe(`NPR${NBSP}1,234,567`);
    expect(formatNPR(7499)).toBe(`NPR${NBSP}7,499`);
    expect(formatNPR(0)).toBe(`NPR${NBSP}0`);
  });

  it("is deterministic regardless of the ambient locale (lakh grouping never appears)", () => {
    // The same value under an en-IN formatter groups 3-2-2 (lakh
    // style); the helper is constructed with the FIXED en-NP locale,
    // so its output is identical to the en-NP formatter and never
    // matches the en-IN rendering — wherever the visitor browses from.
    const enIN = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "NPR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    const enNP = new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    expect(enIN.format(1234567)).toContain("12,34,567"); // sanity: locales differ
    expect(formatNPR(1234567)).toBe(enNP.format(1234567));
    expect(formatNPR(1234567)).not.toContain("12,34,567");
  });

  it("rounds to whole rupees (no fraction digits)", () => {
    expect(formatNPR(1234.5)).toBe(`NPR${NBSP}1,235`);
    expect(formatNPR(1234.4)).toBe(`NPR${NBSP}1,234`);
    expect(formatNPR(1234.5)).not.toContain(".");
  });

  it("returns '' for null / undefined / NaN / non-finite input", () => {
    expect(formatNPR(null)).toBe("");
    expect(formatNPR(undefined)).toBe("");
    expect(formatNPR(NaN)).toBe("");
    expect(formatNPR(Infinity)).toBe("");
    expect(formatNPR("not-a-price")).toBe("");
  });

  it("formats negatives with a leading minus", () => {
    expect(formatNPR(-5000)).toBe(`-NPR${NBSP}5,000`);
  });

  it("formatNPRNumber groups digits with the same fixed locale, without the currency code", () => {
    expect(formatNPRNumber(500000)).toBe("500,000");
    expect(formatNPRNumber(1234567)).toBe("1,234,567");
    expect(formatNPRNumber(null)).toBe("");
  });
});

// Grep-proof for the files this wave owns: no ₹, no NRs./Nrs.
// literals, and no bare money toLocaleString() may remain in them.
// Exception (2026-10-26): Hero.jsx is no longer in this list — the
// owner directed the hero's original editorial copy (₹ prices
// included, exactly as on the live site) be restored after the
// FE-63 cleanup had removed it. The hero's strings are static
// marketing copy, not data-driven prices; FE-63's single-formatter
// rule still governs every price rendered from data.
const OWNED_FILES = [
  "src/components/shop/FilterSidebar.jsx",
  "src/components/shop/ProductCard.jsx",
  "src/components/profile/OrderCard.jsx",
  "src/components/ar/components/CustomizeSheet.jsx",
  "src/components/ar/components/ProductCatalog.jsx",
  "src/layouts/customer/TopBar.jsx",
];

describe("FE-63 owned-file sweep", () => {
  const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../.."
  );
  for (const rel of OWNED_FILES) {
    it(`${rel}: no ₹ / NRs. / Nrs. / toLocaleString money formatting`, () => {
      const source = readFileSync(path.join(root, rel), "utf8");
      expect(source).not.toContain("₹");
      expect(source).not.toMatch(/NRs\./);
      expect(source).not.toMatch(/Nrs\./);
      expect(source).not.toContain("toLocaleString");
    });
  }
});
