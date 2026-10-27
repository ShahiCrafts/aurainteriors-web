// FE-45 (admin inline forms) — Discounts.jsx parseInt'd the percentage
// with no 1..100 / NaN guard (NaN was sent to the server), and
// Products.jsx sent price/stock as raw strings.
//
// Server evidence (read-only, ~/workspace/aura-audit/work):
//   validators/discount.validator.js — discountPercentage number
//     1..100 required; minimumOrderAmount number min 0;
//     maxUsageLimit integer min 1 (nullable).
//   validators/product.validator.js — price number positive required;
//     stock integer min 0.
//
// The pages now parse through these shared helpers and refuse to
// submit an invalid form.
import { describe, it, expect } from "vitest";
import {
  parseDiscountFormValues,
  parseProductPriceStock,
} from "../../src/utils/adminForms.js";

describe("FE-45 parseDiscountFormValues", () => {
  const base = { discountPercentage: "25", minimumOrderAmount: "0", maxUsageLimit: "" };

  it("valid input parses to numbers", () => {
    const r = parseDiscountFormValues({ ...base, maxUsageLimit: "10" });
    expect(r.ok).toBe(true);
    expect(r.values).toEqual({ discountPercentage: 25, minimumOrderAmount: 0, maxUsageLimit: 10 });
  });

  it("empty usage limit parses to null (server allow(null))", () => {
    const r = parseDiscountFormValues(base);
    expect(r.ok).toBe(true);
    expect(r.values.maxUsageLimit).toBeNull();
  });

  it("NaN percentage is refused, never sent", () => {
    expect(parseDiscountFormValues({ ...base, discountPercentage: "abc" }).ok).toBe(false);
    expect(parseDiscountFormValues({ ...base, discountPercentage: "" }).ok).toBe(false);
  });

  it("percentage outside 1..100 is refused (server bounds)", () => {
    expect(parseDiscountFormValues({ ...base, discountPercentage: "0" }).ok).toBe(false);
    expect(parseDiscountFormValues({ ...base, discountPercentage: "101" }).ok).toBe(false);
    expect(parseDiscountFormValues({ ...base, discountPercentage: "100" }).ok).toBe(true);
    expect(parseDiscountFormValues({ ...base, discountPercentage: "1" }).ok).toBe(true);
  });

  it("negative minimum order amount and non-positive usage limit are refused", () => {
    expect(parseDiscountFormValues({ ...base, minimumOrderAmount: "-5" }).ok).toBe(false);
    expect(parseDiscountFormValues({ ...base, maxUsageLimit: "0" }).ok).toBe(false);
    expect(parseDiscountFormValues({ ...base, maxUsageLimit: "2.5" }).ok).toBe(false);
  });
});

describe("FE-45 parseProductPriceStock", () => {
  it("valid input parses to numbers (no raw strings sent)", () => {
    const r = parseProductPriceStock({ price: "499.99", stock: "12", originalPrice: "" });
    expect(r.ok).toBe(true);
    expect(r.values).toEqual({ price: 499.99, stock: 12 });
  });

  it("empty stock defaults to 0 (server default)", () => {
    const r = parseProductPriceStock({ price: "10", stock: "" });
    expect(r.ok).toBe(true);
    expect(r.values.stock).toBe(0);
  });

  it("non-numeric / non-positive price is refused (server: positive)", () => {
    expect(parseProductPriceStock({ price: "abc", stock: "1" }).ok).toBe(false);
    expect(parseProductPriceStock({ price: "0", stock: "1" }).ok).toBe(false);
    expect(parseProductPriceStock({ price: "-5", stock: "1" }).ok).toBe(false);
  });

  it("fractional or negative stock is refused (server: integer min 0)", () => {
    expect(parseProductPriceStock({ price: "10", stock: "3.5" }).ok).toBe(false);
    expect(parseProductPriceStock({ price: "10", stock: "-2" }).ok).toBe(false);
  });

  it("a present originalPrice must also be a positive number", () => {
    expect(parseProductPriceStock({ price: "10", stock: "1", originalPrice: "xyz" }).ok).toBe(false);
    const r = parseProductPriceStock({ price: "10", stock: "1", originalPrice: "20" });
    expect(r.ok).toBe(true);
    expect(r.values.originalPrice).toBe(20);
  });
});
