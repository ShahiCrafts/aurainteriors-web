// Phase 6 (catalog) — pure helpers behind the admin category tree.
import { describe, it, expect } from "vitest";
import {
  buildCategoryTree,
  subtreeProductCount,
  descendantIdSet,
  flattenVisibleTree,
  moveIdWithinSiblings,
} from "../../src/utils/categoryTree.js";

const cat = (id, name, parent, extra = {}) => ({
  _id: id,
  name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
  parent,
  sortOrder: 0,
  productCount: 0,
  status: "active",
  ...extra,
});

// root A (2 direct) ─┬─ A1 (3) ─── A1a (5)
//                   └─ A2 (0)
// root B (1)
const CATEGORIES = [
  cat("b", "Beds", null, { productCount: 1 }),
  cat("a", "Furniture", null, { productCount: 2 }),
  cat("a2", "Chairs", "a", { productCount: 0 }),
  cat("a1", "Sofas", "a", { productCount: 3, sortOrder: -1 }),
  cat("a1a", "Recliners", "a1", { productCount: 5 }),
];

describe("buildCategoryTree", () => {
  it("nests children under parents to arbitrary depth, sorted by sortOrder then name", () => {
    const roots = buildCategoryTree(CATEGORIES);
    expect(roots.map((r) => r._id)).toEqual(["b", "a"]); // sortOrder tie → name ascending (Beds < Furniture)
    const furniture = roots.find((r) => r._id === "a");
    expect(furniture.children.map((c) => c._id)).toEqual(["a1", "a2"]); // a1 sortOrder -1 first
    expect(furniture.children[0].children.map((c) => c._id)).toEqual(["a1a"]);
  });

  it("accepts populated parent objects as well as raw ids", () => {
    const roots = buildCategoryTree([
      cat("a", "Furniture", null),
      { ...cat("a1", "Sofas", null), parent: { _id: "a", name: "Furniture" } },
    ]);
    expect(roots).toHaveLength(1);
    expect(roots[0].children.map((c) => c._id)).toEqual(["a1"]);
  });

  it("surfaces orphans (parent missing from the list) at root level instead of dropping them", () => {
    const roots = buildCategoryTree([cat("x", "X", "missing-parent")]);
    expect(roots.map((r) => r._id)).toEqual(["x"]);
  });
});

describe("subtreeProductCount", () => {
  it("rolls direct counts up the subtree", () => {
    const roots = buildCategoryTree(CATEGORIES);
    const furniture = roots.find((r) => r._id === "a");
    expect(subtreeProductCount(furniture)).toBe(2 + 3 + 5 + 0);
    expect(subtreeProductCount(roots.find((r) => r._id === "b"))).toBe(1);
  });
});

describe("descendantIdSet", () => {
  it("returns every id strictly below the given category", () => {
    expect([...descendantIdSet(CATEGORIES, "a")].sort()).toEqual([
      "a1",
      "a1a",
      "a2",
    ]);
    expect(descendantIdSet(CATEGORIES, "a1a").size).toBe(0);
  });
});

describe("flattenVisibleTree", () => {
  it("flattens with depth, hiding children of collapsed nodes", () => {
    const roots = buildCategoryTree(CATEGORIES);
    const all = flattenVisibleTree(
      roots,
      new Set(["a", "b", "a1", "a2", "a1a"]),
    );
    expect(all.map((r) => [r.category._id, r.depth])).toEqual([
      ["b", 0],
      ["a", 0],
      ["a1", 1],
      ["a1a", 2],
      ["a2", 1],
    ]);
    const collapsed = flattenVisibleTree(roots, new Set(["b"]));
    expect(collapsed.map((r) => r.category._id)).toEqual(["b", "a"]);
    expect(collapsed[1].hasChildren).toBe(true);
    expect(collapsed[1].isExpanded).toBe(false);
  });
});

describe("moveIdWithinSiblings", () => {
  it("swaps with the neighbour in the given direction", () => {
    expect(moveIdWithinSiblings(["a1", "a2", "a3"], "a2", -1)).toEqual([
      "a2",
      "a1",
      "a3",
    ]);
    expect(moveIdWithinSiblings(["a1", "a2", "a3"], "a2", 1)).toEqual([
      "a1",
      "a3",
      "a2",
    ]);
  });

  it("is a no-op at the edges or for unknown ids", () => {
    expect(moveIdWithinSiblings(["a1", "a2"], "a1", -1)).toEqual(["a1", "a2"]);
    expect(moveIdWithinSiblings(["a1", "a2"], "zz", 1)).toEqual(["a1", "a2"]);
  });
});
