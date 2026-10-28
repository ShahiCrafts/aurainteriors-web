// Post-delivery fix (catalog) — the CATEGORIES filter group is
// scoped to the shopper's current department instead of listing
// every category in the catalogue flat. The resolver decides
// WHICH options the group offers from the selected slugs + tree;
// the toggle keeps drill-in narrowing (selecting a node subsumes
// its selected ancestors and descendants).
import { describe, it, expect } from "vitest";
import {
  categoryScopeOptions,
  categoryToggleSelection,
} from "../../src/utils/categoryScope.js";

// Mirrors the seeded taxonomy's shape: two departments, one of
// them three levels deep.
const TREE = [
  {
    _id: "c-living",
    name: "Living Room",
    slug: "living-room",
    productCount: 35,
    subcategories: [
      {
        _id: "c-sofas",
        name: "Upholstered Sofas",
        slug: "upholstered-sofas",
        productCount: 11,
        subcategories: [],
      },
      {
        _id: "c-accent",
        name: "Accent Seating",
        slug: "accent-seating",
        productCount: 12,
        subcategories: [
          {
            _id: "c-armchairs",
            name: "Armchairs",
            slug: "armchairs",
            productCount: 6,
            subcategories: [],
          },
          {
            _id: "c-benches",
            name: "Benches",
            slug: "benches",
            productCount: 6,
            subcategories: [],
          },
        ],
      },
      {
        _id: "c-tables",
        name: "Living Room Tables",
        slug: "living-room-tables",
        productCount: 12,
        subcategories: [],
      },
    ],
  },
  {
    _id: "c-bedroom",
    name: "Bedroom",
    slug: "bedroom",
    productCount: 36,
    subcategories: [
      {
        _id: "c-frames",
        name: "Bed Frames",
        slug: "bed-frames",
        productCount: 12,
        subcategories: [],
      },
      {
        _id: "c-storage",
        name: "Bedroom Storage",
        slug: "bedroom-storage",
        productCount: 12,
        subcategories: [],
      },
    ],
  },
];

const slugs = (options) => options.map((option) => option.slug);

describe("categoryScopeOptions", () => {
  it("(a) no selection offers the root categories only", () => {
    expect(slugs(categoryScopeOptions(TREE, []))).toEqual([
      "living-room",
      "bedroom",
    ]);
  });

  it("(b) one selected department offers its children, not itself or other departments", () => {
    expect(slugs(categoryScopeOptions(TREE, ["living-room"]))).toEqual([
      "upholstered-sofas",
      "accent-seating",
      "living-room-tables",
    ]);
  });

  it("(b) drilling into a child offers the grandchildren", () => {
    expect(slugs(categoryScopeOptions(TREE, ["accent-seating"]))).toEqual([
      "armchairs",
      "benches",
    ]);
  });

  it("(b) a selected leaf offers its siblings, itself included", () => {
    expect(slugs(categoryScopeOptions(TREE, ["upholstered-sofas"]))).toEqual([
      "upholstered-sofas",
      "accent-seating",
      "living-room-tables",
    ]);
    expect(slugs(categoryScopeOptions(TREE, ["armchairs"]))).toEqual([
      "armchairs",
      "benches",
    ]);
  });

  it("(c) several selected siblings keep the group scoped to their siblings", () => {
    expect(
      slugs(
        categoryScopeOptions(TREE, ["upholstered-sofas", "accent-seating"]),
      ),
    ).toEqual(["upholstered-sofas", "accent-seating", "living-room-tables"]);
  });

  it("(d) selections from different departments fall back to roots", () => {
    expect(
      slugs(categoryScopeOptions(TREE, ["upholstered-sofas", "bed-frames"])),
    ).toEqual(["living-room", "bedroom"]);
  });

  it("(d) an ancestor+descendant pair (mixed parents) falls back to roots", () => {
    expect(
      slugs(categoryScopeOptions(TREE, ["living-room", "upholstered-sofas"])),
    ).toEqual(["living-room", "bedroom"]);
  });

  it("unknown slugs in the selection cannot scope the group (roots)", () => {
    expect(slugs(categoryScopeOptions(TREE, ["no-such-category"]))).toEqual([
      "living-room",
      "bedroom",
    ]);
  });

  it("an empty or missing tree offers nothing", () => {
    expect(categoryScopeOptions([], [])).toEqual([]);
    expect(categoryScopeOptions(undefined, ["living-room"])).toEqual([]);
  });
});

describe("categoryToggleSelection", () => {
  it("toggling ON a child replaces its selected ancestor (drill-in narrows)", () => {
    expect(
      categoryToggleSelection(TREE, ["living-room"], "upholstered-sofas"),
    ).toEqual(["upholstered-sofas"]);
  });

  it("toggling ON a parent drops its selected descendants (subsumed)", () => {
    expect(
      categoryToggleSelection(
        TREE,
        ["upholstered-sofas", "living-room-tables"],
        "living-room",
      ),
    ).toEqual(["living-room"]);
  });

  it("toggling ON a grandparent drops selected grandchildren at any depth", () => {
    expect(categoryToggleSelection(TREE, ["armchairs"], "living-room")).toEqual(
      ["living-room"],
    );
  });

  it("sibling multi-select is stable: adding a sibling keeps the other", () => {
    expect(
      categoryToggleSelection(TREE, ["upholstered-sofas"], "accent-seating"),
    ).toEqual(["upholstered-sofas", "accent-seating"]);
  });

  it("adding an unrelated department keeps the current selection", () => {
    expect(
      categoryToggleSelection(TREE, ["upholstered-sofas"], "bedroom"),
    ).toEqual(["upholstered-sofas", "bedroom"]);
  });

  it("toggling OFF removes just that slug", () => {
    expect(
      categoryToggleSelection(
        TREE,
        ["upholstered-sofas", "accent-seating"],
        "upholstered-sofas",
      ),
    ).toEqual(["accent-seating"]);
    expect(
      categoryToggleSelection(TREE, ["living-room"], "living-room"),
    ).toEqual([]);
  });

  it("toggling an unknown slug is a plain add/remove (no tree knowledge)", () => {
    expect(categoryToggleSelection(TREE, ["living-room"], "mystery")).toEqual([
      "living-room",
      "mystery",
    ]);
    expect(categoryToggleSelection(TREE, ["mystery"], "mystery")).toEqual([]);
  });
});
