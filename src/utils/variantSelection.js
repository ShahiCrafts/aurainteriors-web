// Phase 7 (catalog) — pure variant-selection + specification
// helpers for the storefront product page and cards. The server's
// Phase 3/4 contracts are the authority (variant shape, option
// stringification, purchasability = enabled && stock - reserved > 0
// — the same rule services/productVariant.service.js exports);
// these helpers only project that data for rendering.

const asObject = (value) => {
  if (!value || typeof value !== "object") return {};
  if (value instanceof Map) return Object.fromEntries(value);
  return { ...value };
};

export const variantOptionsObject = (variant) => {
  const options = asObject(variant?.options);
  const out = {};
  for (const [key, value] of Object.entries(options)) {
    if (value === undefined || value === null) continue;
    out[key] = String(value);
  }
  return out;
};

export const variantAvailableCount = (variant) =>
  Math.max(0, (variant?.stock || 0) - (variant?.reservedStock || 0));

export const isVariantPurchasable = (variant) =>
  !!variant && variant.enabled !== false && variantAvailableCount(variant) > 0;

export const productVariants = (product) =>
  Array.isArray(product?.catalogVariants) ? product.catalogVariants : [];

export const productHasPurchasableVariant = (product) =>
  productVariants(product).some(isVariantPurchasable);

// The variant whose option combination EXACTLY equals the
// selection on every declared axis key (extra stored keys are
// ignored; a missing axis value never matches).
export function findVariantBySelection(product, selection = {}) {
  const keys = product?.variantOptionKeys || [];
  if (keys.length === 0) return null;
  return (
    productVariants(product).find((variant) => {
      const options = variantOptionsObject(variant);
      return keys.every((key) => options[key] === String(selection[key] ?? ""));
    }) || null
  );
}

// Per-axis value states for the selector UI. For every axis key,
// every value any variant carries, judged against the CURRENT
// selection on the OTHER axes:
//   exists      — an enabled variant carries this value together
//                 with the other selected options
//   purchasable — such a variant also has available stock
// A value that does not exist is an impossible combination; one
// that exists but is not purchasable is out of stock. Both render
// disabled, with different reasons.
export function optionValueStates(product, selection = {}) {
  const keys = product?.variantOptionKeys || [];
  const variants = productVariants(product);
  const states = {};
  for (const key of keys) {
    const values = [];
    const seen = new Set();
    for (const variant of variants) {
      const options = variantOptionsObject(variant);
      const value = options[key];
      if (value === undefined || seen.has(value)) continue;
      seen.add(value);
      values.push(value);
    }
    states[key] = values.map((value) => {
      const candidates = variants.filter((variant) => {
        if (variant.enabled === false) return false;
        const options = variantOptionsObject(variant);
        if (options[key] !== value) return false;
        return keys.every(
          (other) =>
            other === key ||
            selection[other] === undefined ||
            options[other] === String(selection[other]),
        );
      });
      return {
        value,
        exists: candidates.length > 0,
        purchasable: candidates.some(isVariantPurchasable),
        selected: String(selection[key] ?? "") === value,
      };
    });
  }
  return states;
}

// The default selection when a variant product first renders: the
// first purchasable variant's combination, else the first enabled
// variant's, else the first variant's — a shopper always lands on
// a real combination, never a partial one.
export function defaultVariantSelection(product) {
  const variants = productVariants(product);
  if (variants.length === 0) return {};
  const chosen =
    variants.find(isVariantPurchasable) ||
    variants.find((variant) => variant.enabled !== false) ||
    variants[0];
  return variantOptionsObject(chosen);
}

// Variant gallery: the variant's own image URLs win when present
// (returned as {url} entries shaped like product images); null
// means "fall back to the product gallery".
export function variantGalleryImages(variant) {
  const images = Array.isArray(variant?.images)
    ? variant.images.filter((url) => typeof url === "string" && url)
    : [];
  return images.length > 0 ? images.map((url) => ({ url })) : null;
}

// The AR model the viewer should load: the selected variant's
// modelUrl overrides the product's own model when set.
export const effectiveModelUrl = (product, variant) =>
  variant?.modelUrl || product?.modelUrl || null;

// One stored attribute value rendered for the specifications tab,
// formatted by definition type. Returns null for "no value" so the
// caller can omit the row entirely (no invented specs).
export function formatSpecValue(definition, value) {
  if (value === undefined || value === null || value === "") return null;
  switch (definition?.type) {
    case "boolean":
      return value === true || value === "true" ? "Yes" : "No";
    case "multi-enum":
      return Array.isArray(value) && value.length > 0 ? value.join(", ") : null;
    case "measurement": {
      if (typeof value !== "object") return String(value);
      const amount = value.value;
      if (amount === undefined || amount === null || amount === "") return null;
      const unit = value.unit || definition?.unit || "";
      return unit ? `${amount} ${unit}` : String(amount);
    }
    case "dimensions": {
      if (typeof value !== "object") return String(value);
      const parts = [
        value.length ? `L ${value.length}` : null,
        value.width ? `W ${value.width}` : null,
        value.height ? `H ${value.height}` : null,
      ].filter(Boolean);
      if (parts.length === 0) return null;
      const unit = value.unit || definition?.unit || "cm";
      return `${parts.join(" × ")} ${unit}`;
    }
    default:
      return String(value);
  }
}

// Stored catalogAttributes grouped by displayGroup, in definition
// order, for the specifications tab. Field-storage definitions
// are skipped — they ARE the product's first-class fields
// (dimensions, weight, …) which the page renders from the fields
// themselves. Attributes with no stored value never appear.
export function groupSpecifications(product, definitions = {}) {
  const stored = asObject(product?.catalogAttributes);
  const groups = new Map();
  for (const [key, rawValue] of Object.entries(stored)) {
    const definition = definitions[key];
    if (!definition) continue;
    if ((definition.storage || "catalogAttributes") !== "catalogAttributes")
      continue;
    const formatted = formatSpecValue(definition, rawValue);
    if (formatted === null) continue;
    const group = definition.displayGroup || "Specifications";
    if (!groups.has(group)) groups.set(group, []);
    groups
      .get(group)
      .push({ key, label: definition.label || key, value: formatted });
  }
  return [...groups.entries()].map(([group, items]) => ({ group, items }));
}
