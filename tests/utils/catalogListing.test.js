// Phase 7 (catalog) — the listing URL grammar: attr.* parsing and
// patching, API param building (facets=1 + verbatim attr pass-
// through + pinned dimensions), sort mapping, and filter chips.
import { describe, it, expect } from "vitest";
import {
  apiSortFor,
  parseAttrSelection,
  attrParamKeys,
  attrValuePatch,
  attrValueRemovePatch,
  attrRangePatch,
  selectedRooms,
  roomTogglePatch,
  buildListingParams,
  clearAllFiltersPatch,
  buildFilterChips,
  facetGroupVisible,
} from "../../src/utils/catalogListing.js";
import { formatNPR } from "../../src/utils/formatCurrency.js";

const params = (qs) => new URLSearchParams(qs);

describe("apiSortFor", () => {
  it("maps the effective-price tokens to the Phase 5 sort values", () => {
    expect(apiSortFor("effective_price_low")).toBe("effectivePriceAsc");
    expect(apiSortFor("effective_price_high")).toBe("effectivePriceDesc");
  });

  it("keeps the legacy mappings", () => {
    expect(apiSortFor("price_low")).toBe("price");
    expect(apiSortFor("price_high")).toBe("-price");
    expect(apiSortFor("newest")).toBe("-createdAt");
    expect(apiSortFor("rating")).toBe("-rating.average");
    expect(apiSortFor("featured")).toBe("-isFeatured,-createdAt");
    expect(apiSortFor(undefined)).toBe("-isFeatured,-createdAt");
  });
});

describe("parseAttrSelection", () => {
  it("parses value lists and range bounds per key", () => {
    const selection = parseAttrSelection(
      params(
        "attr.color=red,blue&attr.seatingCapacity.min=2&attr.seatingCapacity.max=6",
      ),
    );
    expect(selection.color).toEqual({
      values: ["red", "blue"],
      min: null,
      max: null,
    });
    expect(selection.seatingCapacity).toEqual({
      values: [],
      min: "2",
      max: "6",
    });
  });

  it("ignores non-attr params and malformed attr keys", () => {
    const selection = parseAttrSelection(
      params("categories=sofas&attr.=x&attr.color.extra.deep=y"),
    );
    expect(selection).toEqual({});
    expect(attrParamKeys(params("attr.color=red&categories=sofas"))).toEqual([
      "attr.color",
    ]);
  });
});

describe("attr patches", () => {
  const selection = parseAttrSelection(params("attr.color=red,blue"));

  it("toggling adds and removes values, clearing the key when empty", () => {
    expect(attrValuePatch(selection, "color", "green")).toEqual({
      "attr.color": "red,blue,green",
    });
    expect(attrValuePatch(selection, "color", "red")).toEqual({
      "attr.color": "blue",
    });
    expect(
      attrValuePatch(
        parseAttrSelection(params("attr.color=red")),
        "color",
        "red",
      ),
    ).toEqual({ "attr.color": null });
  });

  it("remove patch never re-adds", () => {
    expect(attrValueRemovePatch(selection, "color", "green")).toEqual({
      "attr.color": "red,blue",
    });
  });

  it("range patch sets both bounds and clears with nulls", () => {
    expect(attrRangePatch("seatingCapacity", "2", "6")).toEqual({
      "attr.seatingCapacity.min": "2",
      "attr.seatingCapacity.max": "6",
    });
    expect(attrRangePatch("seatingCapacity", null, null)).toEqual({
      "attr.seatingCapacity.min": null,
      "attr.seatingCapacity.max": null,
    });
  });
});

describe("rooms", () => {
  it("parses the comma list and toggles", () => {
    expect(selectedRooms(params("room=living-room,bedroom"))).toEqual([
      "living-room",
      "bedroom",
    ]);
    expect(roomTogglePatch(["living-room"], "bedroom")).toEqual({
      room: "living-room,bedroom",
    });
    expect(roomTogglePatch(["living-room"], "living-room")).toEqual({
      room: null,
    });
  });
});

describe("buildListingParams", () => {
  it("always asks for facets and passes attr params through verbatim", () => {
    const built = buildListingParams({
      searchParams: params(
        "categories=sofas&attr.color=red&attr.seatingCapacity.min=2&inStock=true&rating=4&sort=effective_price_low",
      ),
      page: 2,
      limit: 12,
    });
    expect(built).toMatchObject({
      page: 2,
      limit: 12,
      status: "active",
      facets: "1",
      categories: "sofas",
      "attr.color": "red",
      "attr.seatingCapacity.min": "2",
      inStock: "true",
      minRating: 4,
      sort: "effectivePriceAsc",
    });
  });

  it("pinned dimensions apply when the URL does not carry them", () => {
    const built = buildListingParams({
      searchParams: params(""),
      pinned: { room: "living-room" },
    });
    expect(built.room).toBe("living-room");
    const overridden = buildListingParams({
      searchParams: params("room=bedroom"),
      pinned: { room: "living-room" },
    });
    expect(overridden.room).toBe("bedroom");
  });

  it("omits empty dimensions entirely", () => {
    const built = buildListingParams({ searchParams: params("") });
    expect(built).not.toHaveProperty("categories");
    expect(built).not.toHaveProperty("room");
    expect(built).not.toHaveProperty("collection");
    expect(built).not.toHaveProperty("inStock");
  });
});

describe("chips + clear-all", () => {
  const qs = params(
    "categories=sofas&room=living-room&inStock=true&rating=4&minPrice=1000&attr.color=red,blue&attr.seatingCapacity.min=2",
  );

  it("builds one chip per selected value with a removal patch", () => {
    const chips = buildFilterChips(qs, {
      categories: new Map([["sofas", "Sofas"]]),
      rooms: new Map([["living-room", "Living Room"]]),
      attributes: new Map([["color", { label: "Color" }]]),
    });
    const byId = Object.fromEntries(chips.map((chip) => [chip.id, chip]));
    expect(byId["category:sofas"].label).toBe("Sofas");
    expect(byId["category:sofas"].patch).toEqual({ categories: null });
    expect(byId["room:living-room"].patch).toEqual({ room: null });
    expect(byId["inStock"].patch).toEqual({ inStock: null });
    expect(byId["rating"].patch).toEqual({ rating: null });
    expect(byId["price"].patch).toEqual({ minPrice: null, maxPrice: null });
    expect(byId["attr:color:red"].label).toBe("Color: red");
    expect(byId["attr:color:red"].patch).toEqual({ "attr.color": "blue" });
    expect(byId["attr-range:seatingCapacity"].patch).toEqual({
      "attr.seatingCapacity.min": null,
      "attr.seatingCapacity.max": null,
    });
  });

  it("formats the price chip, marks the rating chip, swatches color chips", () => {
    const built = buildFilterChips(
      params(
        "minPrice=1000&maxPrice=26843&rating=4&colors=Teal&attr.color=Teal",
      ),
      { attributes: new Map([["color", { label: "Color", type: "color" }]]) },
    );
    const byId = Object.fromEntries(built.map((chip) => [chip.id, chip]));
    expect(byId["price"].label).toBe(
      `Price ${formatNPR(1000)} – ${formatNPR(26843)}`,
    );
    expect(byId["rating"].kind).toBe("rating");
    expect(byId["rating"].label).toBe("4 & up");
    expect(byId["colors:Teal"].kind).toBe("color");
    expect(byId["colors:Teal"].swatch).toBe("#0d9488");
    expect(byId["attr:color:Teal"].label).toBe("Color: Teal");
    expect(byId["attr:color:Teal"].swatch).toBe("#0d9488");
    // Max-only price reads as an "up to" cap (the common slider case).
    const maxOnly = buildFilterChips(params("maxPrice=26843"));
    expect(maxOnly.find((chip) => chip.id === "price").label).toBe(
      `Price up to ${formatNPR(26843)}`,
    );
  });

  it("clear-all nulls every filter key including attr.* and page", () => {
    const patch = clearAllFiltersPatch(qs);
    expect(patch["attr.color"]).toBeNull();
    expect(patch["attr.seatingCapacity.min"]).toBeNull();
    expect(patch.categories).toBeNull();
    expect(patch.room).toBeNull();
    expect(patch.page).toBeNull();
  });
});

// Post-delivery fix (catalog) — an attribute facet group with no
// selectable options must not render at all (the seeded catalogue
// carries no attribute values, so most groups were rendering a
// header over "No matching values."). The one exception: a group
// whose filter is active in the URL stays visible so the shopper
// can see and clear it in place.
describe("facetGroupVisible (post-delivery fix)", () => {
  const noEntry = undefined;
  const emptyEntry = { values: [], min: null, max: null };

  it("value-list facets need at least one option", () => {
    const facet = {
      key: "frameMaterial",
      type: "enum",
      options: [{ value: "oak", count: 2 }],
    };
    expect(facetGroupVisible(facet, noEntry)).toBe(true);
    expect(facetGroupVisible({ ...facet, options: [] }, noEntry)).toBe(false);
    expect(facetGroupVisible({ ...facet, options: [] }, emptyEntry)).toBe(
      false,
    );
    expect(
      facetGroupVisible({ key: "c", type: "color", options: [] }, noEntry),
    ).toBe(false);
    expect(
      facetGroupVisible({ key: "b", type: "boolean", options: [] }, noEntry),
    ).toBe(false);
    expect(
      facetGroupVisible({ key: "s", type: "string", options: [] }, noEntry),
    ).toBe(false);
  });

  it("range facets need a usable numeric bound in the payload", () => {
    const facet = {
      key: "seatingCapacity",
      type: "integer",
      options: [{ value: 2 }, { value: 6 }],
    };
    expect(facetGroupVisible(facet, noEntry)).toBe(true);
    expect(facetGroupVisible({ ...facet, options: [] }, noEntry)).toBe(false);
    expect(
      facetGroupVisible({ ...facet, options: [{ value: "n/a" }] }, noEntry),
    ).toBe(false);
    expect(
      facetGroupVisible(
        { key: "w", type: "measurement", options: [], min: 10, max: 90 },
        noEntry,
      ),
    ).toBe(true);
  });

  it("an active filter keeps its group visible even with no options", () => {
    const facet = { key: "frameMaterial", type: "enum", options: [] };
    expect(
      facetGroupVisible(facet, { values: ["oak"], min: null, max: null }),
    ).toBe(true);
    const range = { key: "seatingCapacity", type: "integer", options: [] };
    expect(facetGroupVisible(range, { values: [], min: "2", max: null })).toBe(
      true,
    );
    expect(facetGroupVisible(range, { values: [], min: null, max: "6" })).toBe(
      true,
    );
  });

  it("a missing facet is never visible", () => {
    expect(facetGroupVisible(null, noEntry)).toBe(false);
    expect(
      facetGroupVisible(undefined, { values: ["x"], min: null, max: null }),
    ).toBe(false);
  });
});
