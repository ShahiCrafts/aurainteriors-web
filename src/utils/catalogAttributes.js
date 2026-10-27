// Phase 6 (catalog) — client-side mirror of the server's attribute
// engine (aurainteriors-server/services/attributeValidation.service.js
// + attributeResolution.service.js).
//
// The mirror exists so admin forms can validate per-field and
// build normalized payloads before submit. It is NOT the
// authority: the server re-validates every write and its error
// messages are surfaced verbatim in the UI.
//
// Value model (what form state holds):
//   string/enum/color  → string ("" = unset)
//   multi-enum         → array of strings
//   boolean            → true | false | null (null = unset)
//   integer/decimal/money → number | "" ("" = unset; numeric
//                        strings from inputs are coerced)
//   measurement        → { value: number | "", unit: string }
//   dimensions         → { length, width, height, unit }

const LENGTH_UNITS = ["cm", "m", "in"];
const MAX_MULTI_VALUES = 50;
const DEFAULT_STRING_MAX = 500;

// Types the server allows as variant option axes (scalar only —
// multi-enum/measurement/dimensions have no canonical string form).
export const VARIANT_OPTION_TYPES = ["string", "enum", "boolean", "integer", "decimal", "money", "color"];

export const isVariantOptionType = (type) => VARIANT_OPTION_TYPES.includes(type);

const fail = (error) => ({ ok: false, error });
const pass = (value) => ({ ok: true, value });

const isBlank = (value) => value === undefined || value === null || value === "";

export function isEmptyAttributeValue(definition, value) {
  if (value === undefined || value === null) return true;
  switch (definition?.type) {
    case "string":
    case "enum":
    case "color":
      return typeof value !== "string" || value.trim() === "";
    case "multi-enum":
      return !Array.isArray(value) || value.length === 0;
    case "boolean":
      return false; // a boolean in hand (true OR false) is a value
    case "integer":
    case "decimal":
    case "money":
      return isBlank(value);
    case "measurement":
      return typeof value !== "object" || isBlank(value.value);
    case "dimensions": {
      if (typeof value !== "object") return true;
      return isBlank(value.length) && isBlank(value.width) && isBlank(value.height);
    }
    default:
      return isBlank(value);
  }
}

function checkBounds(definition, value) {
  if (definition.min !== undefined && definition.min !== null && value < definition.min) {
    return `must be at least ${definition.min}`;
  }
  if (definition.max !== undefined && definition.max !== null && value > definition.max) {
    return `must be at most ${definition.max}`;
  }
  if (definition.step) {
    const base = definition.min ?? 0;
    const quotient = (value - base) / definition.step;
    if (Math.abs(quotient - Math.round(quotient)) > 1e-9) {
      return `must be a multiple of ${definition.step}`;
    }
  }
  return null;
}

function membershipError(definition, value) {
  const allowed = definition.allowedValues || [];
  if (allowed.length > 0 && !allowed.includes(value)) {
    return `must be one of: ${allowed.join(", ")}`;
  }
  return null;
}

// Validates + normalizes ONE typed value against its definition,
// mirroring the server's validateValue message-for-message where
// the messages are user-facing. Numeric strings are coerced first
// (form inputs produce them); the server receives real numbers.
export function validateAttributeValue(definition, rawValue) {
  if (!definition || !definition.type) return fail("Unknown attribute definition");
  switch (definition.type) {
    case "string": {
      if (typeof rawValue !== "string") return fail("must be a string");
      const trimmed = rawValue.trim();
      const cap = definition.maxLength || DEFAULT_STRING_MAX;
      if (trimmed.length > cap) return fail(`must be at most ${cap} characters`);
      return pass(trimmed);
    }
    case "enum": {
      if (typeof rawValue !== "string") return fail("must be a string");
      const trimmed = rawValue.trim();
      if (!trimmed) return fail("must not be empty");
      const membership = membershipError(definition, trimmed);
      if (membership) return fail(membership);
      return pass(trimmed);
    }
    case "multi-enum": {
      if (!Array.isArray(rawValue)) return fail("must be an array of strings");
      if (rawValue.length === 0) return fail("must contain at least one value");
      if (rawValue.length > MAX_MULTI_VALUES) return fail(`must contain at most ${MAX_MULTI_VALUES} values`);
      const seen = new Set();
      const out = [];
      for (const item of rawValue) {
        if (typeof item !== "string") return fail("must be an array of strings");
        const trimmed = item.trim();
        if (!trimmed) return fail("must not contain empty values");
        const membership = membershipError(definition, trimmed);
        if (membership) return fail(membership);
        if (!seen.has(trimmed)) {
          seen.add(trimmed);
          out.push(trimmed);
        }
      }
      return pass(out);
    }
    case "boolean": {
      if (typeof rawValue !== "boolean") return fail("must be a boolean");
      return pass(rawValue);
    }
    case "integer": {
      const value = typeof rawValue === "string" && rawValue.trim() !== "" ? Number(rawValue) : rawValue;
      if (typeof value !== "number" || !Number.isFinite(value)) return fail("must be a number");
      if (!Number.isInteger(value)) return fail("must be a whole number");
      const bounds = checkBounds(definition, value);
      if (bounds) return fail(bounds);
      return pass(value);
    }
    case "decimal": {
      const value = typeof rawValue === "string" && rawValue.trim() !== "" ? Number(rawValue) : rawValue;
      if (typeof value !== "number" || !Number.isFinite(value)) return fail("must be a number");
      const bounds = checkBounds(definition, value);
      if (bounds) return fail(bounds);
      return pass(value);
    }
    case "money": {
      const value = typeof rawValue === "string" && rawValue.trim() !== "" ? Number(rawValue) : rawValue;
      if (typeof value !== "number" || !Number.isFinite(value)) return fail("must be a number");
      const floor = Math.max(0, definition.min ?? 0);
      if (value < floor) return fail(`must be at least ${floor}`);
      if (definition.max !== undefined && definition.max !== null && value > definition.max) {
        return fail(`must be at most ${definition.max}`);
      }
      return pass(value);
    }
    case "measurement": {
      if (typeof rawValue !== "object" || rawValue === null || Array.isArray(rawValue)) {
        return fail("must be an object { value, unit }");
      }
      const numeric = typeof rawValue.value === "string" && rawValue.value.trim() !== "" ? Number(rawValue.value) : rawValue.value;
      if (typeof numeric !== "number" || !Number.isFinite(numeric)) {
        return fail("measurement value must be a number");
      }
      const floor = definition.min ?? null;
      if (floor !== null ? numeric < floor : numeric <= 0) {
        return fail(floor !== null ? `measurement value must be at least ${floor}` : "measurement value must be positive");
      }
      if (typeof rawValue.unit !== "string" || !rawValue.unit.trim()) {
        return fail("measurement unit is required");
      }
      const unit = rawValue.unit.trim();
      const accepted = definition.unit
        ? [...new Set([definition.unit, ...(definition.acceptedUnits || [])])]
        : definition.acceptedUnits || [];
      if (accepted.length > 0 && !accepted.includes(unit)) {
        return fail(`unit must be one of: ${accepted.join(", ")}`);
      }
      if (unit.length > 20) return fail("unit is too long");
      return pass({ value: numeric, unit });
    }
    case "color": {
      if (typeof rawValue !== "string") return fail("must be a color string");
      const trimmed = rawValue.trim();
      const allowed = definition.allowedValues || [];
      if (allowed.length > 0) {
        const match = allowed.find((name) => name.toLowerCase() === trimmed.toLowerCase());
        if (!match) return fail(`must be one of: ${allowed.join(", ")}`);
        return pass(match);
      }
      if (!/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) {
        return fail("must be a hex color (#RGB or #RRGGBB)");
      }
      let digits = trimmed.slice(1).toLowerCase();
      if (digits.length === 3) digits = digits.split("").map((c) => c + c).join("");
      return pass(`#${digits}`);
    }
    case "dimensions": {
      if (typeof rawValue !== "object" || rawValue === null || Array.isArray(rawValue)) {
        return fail("must be an object { length, width, height, unit }");
      }
      const out = {};
      for (const part of ["length", "width", "height"]) {
        const partRaw = rawValue[part];
        const partValue = typeof partRaw === "string" && partRaw.trim() !== "" ? Number(partRaw) : partRaw;
        if (typeof partValue !== "number" || !Number.isFinite(partValue) || partValue <= 0) {
          return fail(`${part} must be a positive number`);
        }
        out[part] = partValue;
      }
      const accepted = definition.acceptedUnits && definition.acceptedUnits.length > 0
        ? definition.acceptedUnits
        : definition.unit
          ? [definition.unit]
          : LENGTH_UNITS;
      const unit = rawValue.unit === undefined || rawValue.unit === "" ? definition.unit || "cm" : rawValue.unit;
      if (typeof unit !== "string" || !accepted.includes(unit)) {
        return fail(`unit must be one of: ${accepted.join(", ")}`);
      }
      out.unit = unit;
      return pass(out);
    }
    default:
      return fail(`Unsupported attribute type: ${definition.type}`);
  }
}

// Builds the catalogAttributes payload for a product save from the
// resolved attribute set + form values. Field-storage entries are
// skipped (their values live in the product's first-class fields,
// edited elsewhere in the form). `passthrough` carries stored
// values for keys the current resolution does not render (e.g. an
// attribute deactivated for this category after the product was
// created) so a save never silently drops them — a provided map
// REPLACES the stored map on the server.
export function buildAttributesPayload(resolvedAttributes = [], values = {}, passthrough = {}) {
  const payload = { ...passthrough };
  const errors = {};
  for (const entry of resolvedAttributes) {
    if ((entry.storage || "catalogAttributes") !== "catalogAttributes") continue;
    const raw = values[entry.key];
    if (isEmptyAttributeValue(entry, raw)) continue;
    const result = validateAttributeValue(entry, raw);
    if (!result.ok) {
      errors[entry.key] = result.error;
      continue;
    }
    payload[entry.key] = result.value;
  }
  return { payload, errors };
}

// Resolved entries that are required, live in catalogAttributes,
// and currently hold an empty value — the product form blocks the
// submit on these (the server enforces the same set on create).
export function missingRequiredAttributes(resolvedAttributes = [], values = {}) {
  return resolvedAttributes.filter(
    (entry) =>
      entry.required &&
      (entry.storage || "catalogAttributes") === "catalogAttributes" &&
      isEmptyAttributeValue(entry, values[entry.key])
  );
}

// Merges a product-type resolution over a category resolution the
// way the server resolves a product (resolveForProduct passes the
// product's own productType as the type-level override): the
// category resolution's TYPE-level entries are replaced wholesale
// by the selected type's set; global entries are overlaid by the
// type's claims; category-level claims always stay on top.
export function mergeResolutions(categoryAttributes, typeAttributes) {
  if (!typeAttributes) return categoryAttributes;
  const kept = (categoryAttributes || []).filter((entry) => entry.source !== "type");
  const byKey = new Map(kept.map((entry) => [entry.key, entry]));
  for (const typeEntry of typeAttributes) {
    const existing = byKey.get(typeEntry.key);
    if (!existing) {
      byKey.set(typeEntry.key, typeEntry);
    } else if (existing.source === "global") {
      byKey.set(typeEntry.key, { ...typeEntry });
    }
    // source === "category" stays untouched: category beats type.
  }
  return [...byKey.values()].sort(
    (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)
  );
}

// Variant options are stored server-side as STRINGS (the options
// Map of String); the edit form works with typed values. This
// converts a stored string back for the input controls.
export function optionValueFromStored(definition, stored) {
  if (stored === undefined || stored === null) return "";
  switch (definition?.type) {
    case "integer":
    case "decimal":
    case "money": {
      const numeric = Number(stored);
      return Number.isFinite(numeric) ? numeric : stored;
    }
    case "boolean":
      return stored === "true" ? true : stored === "false" ? false : "";
    default:
      return stored;
  }
}
