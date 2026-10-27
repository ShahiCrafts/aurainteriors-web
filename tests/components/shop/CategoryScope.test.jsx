// Post-delivery fix (catalog), defect 1 — the CATEGORIES filter
// group in the sidebar is scoped to the shopper's current
// department instead of listing every category and subcategory
// in the catalogue flat: roots on the bare shop page, the
// selected category's children inside a department, siblings at
// a leaf. Drill-in toggles subsume ancestors/descendants.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FilterSidebar from "../../../src/components/shop/FilterSidebar.jsx";

const CATEGORY_TREE = [
  {
    _id: "c-living",
    name: "Living Room",
    slug: "living-room",
    productCount: 35,
    subcategories: [
      { _id: "c-sofas", name: "Upholstered Sofas", slug: "upholstered-sofas", productCount: 11, subcategories: [] },
      { _id: "c-accent", name: "Accent Seating", slug: "accent-seating", productCount: 12, subcategories: [] },
      { _id: "c-tables", name: "Living Room Tables", slug: "living-room-tables", productCount: 12, subcategories: [] },
    ],
  },
  {
    _id: "c-bedroom",
    name: "Bedroom",
    slug: "bedroom",
    productCount: 36,
    subcategories: [
      { _id: "c-frames", name: "Bed Frames", slug: "bed-frames", productCount: 12, subcategories: [] },
    ],
  },
];

const renderCategorySidebar = (selectedCategories, onCategoryChange = vi.fn()) =>
  render(
    <FilterSidebar
      categories={CATEGORY_TREE}
      selectedCategories={selectedCategories}
      onCategoryChange={onCategoryChange}
      onPriceChange={vi.fn()}
      onColorChange={vi.fn()}
      onMaterialChange={vi.fn()}
      onRatingChange={vi.fn()}
      onResetFilters={vi.fn()}
    />
  );

describe("Categories group scoping (post-delivery fix)", () => {
  it("with no selection it offers only the root categories", () => {
    renderCategorySidebar([]);
    expect(screen.getByRole("checkbox", { name: /Living Room/ })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Bedroom/ })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /Upholstered Sofas/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /Bed Frames/ })).not.toBeInTheDocument();
  });

  it("inside Living Room it offers only Living Room's children", () => {
    renderCategorySidebar(["living-room"]);
    expect(screen.getByRole("checkbox", { name: /Upholstered Sofas/ })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Accent Seating/ })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Living Room Tables/ })).toBeInTheDocument();
    // Neither the department itself nor the other department appear.
    expect(screen.queryByRole("checkbox", { name: /^Bedroom/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /Bed Frames/ })).not.toBeInTheDocument();
  });

  it("at a leaf it offers the leaf's siblings, the leaf itself checked", () => {
    renderCategorySidebar(["upholstered-sofas"]);
    expect(screen.getByRole("checkbox", { name: /Upholstered Sofas/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Accent Seating/ })).not.toBeChecked();
    expect(screen.queryByRole("checkbox", { name: /Bed Frames/ })).not.toBeInTheDocument();
  });

  it("checking a child replaces the selected department (drill-in narrows)", () => {
    const onCategoryChange = vi.fn();
    renderCategorySidebar(["living-room"], onCategoryChange);
    fireEvent.click(screen.getByRole("checkbox", { name: /Upholstered Sofas/ }));
    expect(onCategoryChange).toHaveBeenCalledWith(["upholstered-sofas"]);
  });

  it("checking a sibling keeps the existing sibling selection", () => {
    const onCategoryChange = vi.fn();
    renderCategorySidebar(["upholstered-sofas"], onCategoryChange);
    fireEvent.click(screen.getByRole("checkbox", { name: /Accent Seating/ }));
    expect(onCategoryChange).toHaveBeenCalledWith(["upholstered-sofas", "accent-seating"]);
  });

  it("unchecking a category removes just it", () => {
    const onCategoryChange = vi.fn();
    renderCategorySidebar(["upholstered-sofas"], onCategoryChange);
    fireEvent.click(screen.getByRole("checkbox", { name: /Upholstered Sofas/ }));
    expect(onCategoryChange).toHaveBeenCalledWith([]);
  });
});
