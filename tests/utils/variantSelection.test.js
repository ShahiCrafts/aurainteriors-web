// Phase 7 (catalog) — variant selection math: exact-combination
// matching, per-value exists/purchasable states (the impossible
// combination rule), default selection, AR/gallery resolution, and
// specification grouping (stored values only).
import { describe, it, expect } from "vitest";
import {
  variantOptionsObject,
  variantAvailableCount,
  isVariantPurchasable,
  findVariantBySelection,
  optionValueStates,
  defaultVariantSelection,
  variantGalleryImages,
  effectiveModelUrl,
  formatSpecValue,
  groupSpecifications,
} from "../../src/utils/variantSelection.js";

const product = {
  _id: "p1",
  variantOptionKeys: ["color", "size"],
  catalogVariants: [
    { _id: "v1", sku: "SOFA-RED-KING", options: { color: "red", size: "King" }, price: 1000, stock: 3, reservedStock: 1, enabled: true, images: ["https://cdn.example/red.jpg"], modelUrl: "https://cdn.example/red.glb" },
    { _id: "v2", sku: "SOFA-BLUE-SINGLE", options: { color: "blue", size: "Single" }, price: 700, stock: 0, reservedStock: 0, enabled: true },
    { _id: "v3", sku: "SOFA-RED-SINGLE", options: { color: "red", size: "Single" }, price: 800, stock: 2, reservedStock: 0, enabled: false },
  ],
};

describe("variant basics", () => {
  it("normalizes options (Map or object) to strings", () => {
    expect(variantOptionsObject({ options: new Map([["seats", 3]]) })).toEqual({ seats: "3" });
    expect(variantOptionsObject(product.catalogVariants[0])).toEqual({ color: "red", size: "King" });
  });

  it("purchasability is enabled && stock - reserved > 0", () => {
    expect(variantAvailableCount(product.catalogVariants[0])).toBe(2);
    expect(isVariantPurchasable(product.catalogVariants[0])).toBe(true);
    expect(isVariantPurchasable(product.catalogVariants[1])).toBe(false); // no stock
    expect(isVariantPurchasable(product.catalogVariants[2])).toBe(false); // disabled
  });

  it("finds the exact combination only", () => {
    expect(findVariantBySelection(product, { color: "red", size: "King" })?._id).toBe("v1");
    expect(findVariantBySelection(product, { color: "red", size: "Single" })?._id).toBe("v3");
    expect(findVariantBySelection(product, { color: "red" })).toBeNull();
    expect(findVariantBySelection(product, { color: "green", size: "King" })).toBeNull();
  });
});

describe("optionValueStates — the same-variant rule in UI form", () => {
  it("red + Single exists only on a disabled variant, so Single is not selectable with red", () => {
    const states = optionValueStates(product, { color: "red" });
    const single = states.size.find((entry) => entry.value === "Single");
    expect(single.exists).toBe(false);
    expect(single.purchasable).toBe(false);
    const king = states.size.find((entry) => entry.value === "King");
    expect(king).toMatchObject({ exists: true, purchasable: true });
  });

  it("blue exists but is out of stock", () => {
    const states = optionValueStates(product, { size: "Single" });
    const blue = states.color.find((entry) => entry.value === "blue");
    expect(blue).toMatchObject({ exists: true, purchasable: false });
  });

  it("default selection lands on the first purchasable combination", () => {
    expect(defaultVariantSelection(product)).toEqual({ color: "red", size: "King" });
  });
});

describe("gallery + AR resolution", () => {
  it("variant images win; variant modelUrl overrides the product model", () => {
    expect(variantGalleryImages(product.catalogVariants[0])).toEqual([{ url: "https://cdn.example/red.jpg" }]);
    expect(variantGalleryImages(product.catalogVariants[1])).toBeNull();
    expect(effectiveModelUrl({ modelUrl: "https://cdn.example/base.glb" }, product.catalogVariants[0])).toBe("https://cdn.example/red.glb");
    expect(effectiveModelUrl({ modelUrl: "https://cdn.example/base.glb" }, product.catalogVariants[1])).toBe("https://cdn.example/base.glb");
  });
});

describe("specifications", () => {
  const definitions = {
    material: { label: "Material", type: "string", displayGroup: "Build", storage: "catalogAttributes" },
    assemblyRequired: { label: "Assembly required", type: "boolean", displayGroup: "Build", storage: "catalogAttributes" },
    seatHeight: { label: "Seat height", type: "measurement", unit: "cm", displayGroup: "Size", storage: "catalogAttributes" },
    dimensions: { label: "Dimensions", type: "dimensions", displayGroup: "Size", storage: "field", fieldPath: "dimensions" },
    notStored: { label: "Not stored", type: "string", displayGroup: "Build", storage: "catalogAttributes" },
  };

  it("formats values per type", () => {
    expect(formatSpecValue(definitions.assemblyRequired, true)).toBe("Yes");
    expect(formatSpecValue(definitions.assemblyRequired, false)).toBe("No");
    expect(formatSpecValue(definitions.seatHeight, { value: 45, unit: "cm" })).toBe("45 cm");
    expect(formatSpecValue(definitions.material, "")).toBeNull();
    expect(formatSpecValue({ type: "multi-enum" }, ["oak", "walnut"])).toBe("oak, walnut");
  });

  it("groups stored catalogAttributes only — field defs and blanks omitted", () => {
    const groups = groupSpecifications(
      {
        catalogAttributes: {
          material: "Kiln-dried hardwood",
          assemblyRequired: true,
          seatHeight: { value: 45, unit: "cm" },
          dimensions: { length: 10 },
        },
      },
      definitions
    );
    expect(groups.map((group) => group.group)).toEqual(["Build", "Size"]);
    const build = groups.find((group) => group.group === "Build");
    expect(build.items.map((item) => item.key)).toEqual(["material", "assemblyRequired"]);
    const size = groups.find((group) => group.group === "Size");
    expect(size.items).toEqual([{ key: "seatHeight", label: "Seat height", value: "45 cm" }]);
  });
});
