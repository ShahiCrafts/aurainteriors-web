// FE-62 — ShopByCategory must make EVERY category reachable.
//
// Before the fix the component carried a complete carousel
// implementation (currentIndex state, prev/next buttons) but its
// render ignored the carousel state and showed a static
// slice(0, 6) grid: the buttons changed state nothing consumed and
// categories 7+ could not be reached from the section at all.
// The fix renders all categories in the grid and deletes the dead
// carousel machinery; this suite pins the reachability property with
// 8 categories (two beyond the old slice).

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../src/hooks/product/useCategoryTan.js", () => ({
  useCategoryTree: vi.fn(),
}));
vi.mock("../../../src/hooks/useInView.js", () => ({
  default: () => [() => {}, true],
}));

import { useCategoryTree } from "../../../src/hooks/product/useCategoryTan.js";
import ShopByCategory from "../../../src/components/sections/ShopByCategory.jsx";

const CATEGORIES = Array.from({ length: 8 }, (_, i) => ({
  _id: `cat-${i + 1}`,
  name: `Category ${i + 1}`,
  slug: `category-${i + 1}`,
  productCount: i + 1,
  image: null,
}));

describe("FE-62: ShopByCategory renders every category", () => {
  it("renders all 8 categories as links, including those beyond the old slice(0, 6)", () => {
    useCategoryTree.mockReturnValue({
      data: { data: { categories: CATEGORIES } },
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <ShopByCategory />
      </MemoryRouter>
    );

    for (const category of CATEGORIES) {
      expect(screen.getByText(category.name)).toBeInTheDocument();
      const link = screen.getByRole("link", { name: new RegExp(category.name) });
      // Phase 0.5: category links use the owner's canonical unified
      // scheme — shopCategoryUrl(slug) -> /shop?categories=<slug>
      // (src/utils/shopFilters.js), the same form the link-integrity
      // suite asserts. The FE-62-era /shop/<slug> expectation was
      // left stale by the storefront unification pass.
      expect(link).toHaveAttribute("href", `/shop?categories=${category.slug}`);
    }

    // Exactly one link per category — no hidden/duplicated carousel
    // track rendering a second copy.
    expect(screen.getAllByRole("link")).toHaveLength(
      CATEGORIES.length + 2 // + "View All Categories" header link + the New Arrivals PromoCard link
    );
  });

  it("uploaded variant: header, real item counts, 8-across square grid, New Arrivals PromoCard", () => {
    useCategoryTree.mockReturnValue({
      data: { data: { categories: CATEGORIES } },
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <ShopByCategory />
      </MemoryRouter>
    );

    expect(screen.getByText("Shop by Category", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("Explore Our Categories")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View All Categories/ })).toHaveAttribute("href", "/shop");
    // Uploaded variant's grid: 2 -> 5 -> 8 across, square cards.
    const firstCard = screen.getByRole("link", { name: /Category 1/ });
    expect(firstCard.parentElement.className).toContain("lg:grid-cols-8");
    expect(firstCard.parentElement.className).toContain("md:grid-cols-5");
    expect(firstCard.className).toContain("aspect-square");
    // Real counts from the tree payload, pluralized.
    expect(screen.getByText("1 item")).toBeInTheDocument();
    expect(screen.getByText("3 items")).toBeInTheDocument();
    // PromoCard: the shop's newest sort is the live route to new stock.
    expect(
      screen.getByRole("heading", { name: /Fresh Pieces for a Better Home/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Shop New Arrivals/ })).toHaveAttribute(
      "href",
      "/shop?sort=newest"
    );
  });
});
