// Phase 6 (catalog) — client mirror of the server's attribute
// engine (aurainteriors-server/services/attributeValidation.service.js).
// The client validates to give per-field errors before submit; the
// server remains the authority and its 400s are surfaced as-is.
import { describe, it, expect } from "vitest";
import {
  isEmptyAttributeValue,
  validateAttributeValue,
  buildAttributesPayload,
  missingRequiredAttributes,
  mergeResolutions,
  isVariantOptionType,
  optionValueFromStored,
} from "../../src/utils/catalogAttributes.js";

const def = (over = {}) => ({
  key: "attr",
  label: "Attr",
  type: "string",
  storage: "catalogAttributes",
  allowedValues: [],
  acceptedUnits: [],
  ...over,
});

describe("isEmptyAttributeValue", () => {
  it("treats blanks as empty per type, but boolean false is a real value", () => {
    expect(isEmptyAttributeValue(def({ type: "string" }), "  ")).toBe(true);
    expect(isEmptyAttributeValue(def({ type: "boolean" }), false)).toBe(false);
    expect(isEmptyAttributeValue(def({ type: "boolean" }), null)).toBe(true);
    expect(isEmptyAttributeValue(def({ type: "integer" }), "")).toBe(true);
    expect(isEmptyAttributeValue(def({ type: "integer" }), 0)).toBe(false);
    expect(isEmptyAttributeValue(def({ type: "multi-enum" }), [])).toBe(true);
    expect(isEmptyAttributeValue(def({ type: "measurement" }), { value: "", unit: "cm" })).toBe(true);
    expect(isEmptyAttributeValue(def({ type: "measurement" }), { value: 0, unit: "cm" })).toBe(false);
    expect(
      isEmptyAttributeValue(def({ type: "dimensions" }), { length: "", width: "", height: "", unit: "cm" })
    ).toBe(true);
    expect(
      isEmptyAttributeValue(def({ type: "dimensions" }), { length: 10, width: "", height: "", unit: "cm" })
    ).toBe(false);
  });
});

describe("validateAttributeValue — mirrors the server rules", () => {
  it("string: trims and enforces the length cap", () => {
    expect(validateAttributeValue(def({ maxLength: 5 }), "  hello world ")).toEqual({
      ok: false,
      error: "must be at most 5 characters",
    });
    expect(validateAttributeValue(def(), "  hi ")).toEqual({ ok: true, value: "hi" });
  });

  it("enum: closed vocabularies enforce membership, open ones accept any string", () => {
    const closed = def({ type: "enum", allowedValues: ["S", "M"] });
    expect(validateAttributeValue(closed, "XL")).toEqual({ ok: false, error: "must be one of: S, M" });
    expect(validateAttributeValue(closed, "M")).toEqual({ ok: true, value: "M" });
    expect(validateAttributeValue(def({ type: "enum" }), "Anything")).toEqual({ ok: true, value: "Anything" });
  });

  it("multi-enum: dedupes in order and enforces membership", () => {
    const d = def({ type: "multi-enum", allowedValues: ["Oak", "Pine"] });
    expect(validateAttributeValue(d, ["Oak", "Oak", "Pine"])).toEqual({ ok: true, value: ["Oak", "Pine"] });
    expect(validateAttributeValue(d, ["Teak"]).ok).toBe(false);
    expect(validateAttributeValue(d, []).ok).toBe(false);
  });

  it("integer/decimal: whole-number, bounds and step checks", () => {
    const seats = def({ type: "integer", min: 1, max: 8 });
    expect(validateAttributeValue(seats, 2.5)).toEqual({ ok: false, error: "must be a whole number" });
    expect(validateAttributeValue(seats, 0)).toEqual({ ok: false, error: "must be at least 1" });
    expect(validateAttributeValue(seats, 9)).toEqual({ ok: false, error: "must be at most 8" });
    expect(validateAttributeValue(seats, "3")).toEqual({ ok: true, value: 3 }); // numeric strings coerce
    const stepped = def({ type: "decimal", min: 0, step: 0.5 });
    expect(validateAttributeValue(stepped, 1.25)).toEqual({ ok: false, error: "must be a multiple of 0.5" });
    expect(validateAttributeValue(stepped, 1.5)).toEqual({ ok: true, value: 1.5 });
  });

  it("money: never below zero (or the definition floor)", () => {
    expect(validateAttributeValue(def({ type: "money" }), -5)).toEqual({ ok: false, error: "must be at least 0" });
    expect(validateAttributeValue(def({ type: "money" }), 100)).toEqual({ ok: true, value: 100 });
  });

  it("boolean: strict, no string coercion", () => {
    expect(validateAttributeValue(def({ type: "boolean" }), "true")).toEqual({ ok: false, error: "must be a boolean" });
    expect(validateAttributeValue(def({ type: "boolean" }), false)).toEqual({ ok: true, value: false });
  });

  it("measurement: value + unit, unit must be accepted", () => {
    const d = def({ type: "measurement", unit: "cm", acceptedUnits: ["cm", "m", "in"] });
    expect(validateAttributeValue(d, { value: 120, unit: "cm" })).toEqual({ ok: true, value: { value: 120, unit: "cm" } });
    expect(validateAttributeValue(d, { value: 120, unit: "ft" })).toEqual({
      ok: false,
      error: "unit must be one of: cm, m, in",
    });
    expect(validateAttributeValue(d, { value: -1, unit: "cm" }).ok).toBe(false);
    expect(validateAttributeValue(d, { value: "120", unit: "m" })).toEqual({ ok: true, value: { value: 120, unit: "m" } });
  });

  it("color: hex normalizes to lowercase #rrggbb; closed vocabularies match by name", () => {
    expect(validateAttributeValue(def({ type: "color" }), "#F0A")).toEqual({ ok: true, value: "#ff00aa" });
    expect(validateAttributeValue(def({ type: "color" }), "red")).toEqual({
      ok: false,
      error: "must be a hex color (#RGB or #RRGGBB)",
    });
    const named = def({ type: "color", allowedValues: ["Walnut", "Oak"] });
    expect(validateAttributeValue(named, "walnut")).toEqual({ ok: true, value: "Walnut" });
    expect(validateAttributeValue(named, "Teak").ok).toBe(false);
  });

  it("dimensions: all three parts positive numbers, unit defaults and validates", () => {
    const d = def({ type: "dimensions" });
    expect(validateAttributeValue(d, { length: 10, width: 20, height: 30 })).toEqual({
      ok: true,
      value: { length: 10, width: 20, height: 30, unit: "cm" },
    });
    expect(validateAttributeValue(d, { length: 0, width: 20, height: 30 })).toEqual({
      ok: false,
      error: "length must be a positive number",
    });
    expect(validateAttributeValue(d, { length: 1, width: 2, height: 3, unit: "ft" }).ok).toBe(false);
  });
});

describe("buildAttributesPayload", () => {
  const resolved = [
    { ...def({ key: "seatingCapacity", type: "integer", min: 1 }), source: "type" },
    { ...def({ key: "extendable", type: "boolean" }), source: "global" },
    { ...def({ key: "finish", type: "enum" }), source: "global" },
    { ...def({ key: "dimensions", type: "dimensions", storage: "field", fieldPath: "dimensions" }), source: "global" },
  ];

  it("includes normalized values, skips empties, ignores field-storage entries, keeps passthrough keys", () => {
    const { payload, errors } = buildAttributesPayload(
      resolved,
      { seatingCapacity: "3", extendable: false, finish: "" },
      { legacyKey: "kept" }
    );
    expect(errors).toEqual({});
    expect(payload).toEqual({ legacyKey: "kept", seatingCapacity: 3, extendable: false });
  });

  it("reports per-key errors and excludes invalid values from the payload", () => {
    const { payload, errors } = buildAttributesPayload(resolved, { seatingCapacity: 0 }, {});
    expect(payload).toEqual({});
    expect(errors).toEqual({ seatingCapacity: "must be at least 1" });
  });
});

describe("missingRequiredAttributes", () => {
  it("lists required catalogAttributes entries with empty values (field-storage excluded)", () => {
    const resolved = [
      { ...def({ key: "seatingCapacity", type: "integer", required: true }), source: "type" },
      { ...def({ key: "finish", type: "enum", required: true }), source: "global" },
      { ...def({ key: "price", type: "money", required: true, storage: "field", fieldPath: "price" }), source: "global" },
    ];
    expect(missingRequiredAttributes(resolved, { seatingCapacity: 2 }).map((e) => e.key)).toEqual(["finish"]);
    expect(missingRequiredAttributes(resolved, { seatingCapacity: 2, finish: "Oak" })).toEqual([]);
  });
});

describe("mergeResolutions — the product's own type replaces the category's type level", () => {
  const categoryResolution = [
    { ...def({ key: "material", type: "enum" }), source: "global", required: false },
    { ...def({ key: "chaiseOrientation", type: "enum" }), source: "type", required: false },
    { ...def({ key: "firmness", type: "enum", required: true }), source: "category", required: true },
  ];
  const typeResolution = [
    { ...def({ key: "material", type: "enum", required: true }), source: "type", required: true },
    { ...def({ key: "lumbarSupport", type: "boolean" }), source: "type", required: false },
  ];

  it("drops the category-type entries, overlays the selected type, keeps global/category claims", () => {
    const merged = mergeResolutions(categoryResolution, typeResolution);
    const byKey = Object.fromEntries(merged.map((e) => [e.key, e]));
    expect(byKey.chaiseOrientation).toBeUndefined(); // came from the category's type only
    expect(byKey.lumbarSupport.source).toBe("type"); // from the selected type
    expect(byKey.material.required).toBe(true); // type overlay beat the global default
    expect(byKey.material.source).toBe("type");
    expect(byKey.firmness.source).toBe("category"); // category claims stay on top
    expect(byKey.firmness.required).toBe(true);
  });

  it("returns the category resolution untouched when no type override is given", () => {
    expect(mergeResolutions(categoryResolution, null)).toBe(categoryResolution);
  });
});

describe("variant option helpers", () => {
  it("knows the scalar axis types", () => {
    expect(isVariantOptionType("enum")).toBe(true);
    expect(isVariantOptionType("integer")).toBe(true);
    expect(isVariantOptionType("color")).toBe(true);
    expect(isVariantOptionType("multi-enum")).toBe(false);
    expect(isVariantOptionType("measurement")).toBe(false);
    expect(isVariantOptionType("dimensions")).toBe(false);
  });

  it("converts stored option strings back to typed form values", () => {
    expect(optionValueFromStored(def({ type: "integer" }), "3")).toBe(3);
    expect(optionValueFromStored(def({ type: "boolean" }), "true")).toBe(true);
    expect(optionValueFromStored(def({ type: "boolean" }), "false")).toBe(false);
    expect(optionValueFromStored(def({ type: "enum" }), "Oak")).toBe("Oak");
    expect(optionValueFromStored(def({ type: "decimal" }), "2.5")).toBe(2.5);
  });
});
