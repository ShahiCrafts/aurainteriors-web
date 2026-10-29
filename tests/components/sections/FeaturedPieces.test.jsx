// Landing product section (owner's uploaded variant, adopted
// 2026-10-26): header, two static rows of products (five per row
// on desktop — no category tabs, no paging), and the two promo
// cards (sofa collection PromoCard + lighting card).
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

const products = Array.from({ length: 12 }, (_, i) => ({
  _id: `p${i + 1}`,
  name: `Product ${i + 1}`,
  slug: `product-${i + 1}`,
}));

let lastParams = null;
vi.mock("../../../src/hooks/product/useProductTan", () => ({
  useProducts: (params) => {
    lastParams = params;
    return { data: { data: { products } }, isLoading: false };
  },
}));

vi.mock("../../../src/hooks/product/useCategoryTan", () => ({
  useCategoryTree: () => ({
    data: {
      data: {
        categories: [
          {
            _id: "c-lr",
            name: "Living Room",
            slug: "living-room",
            image: null,
          },
          { _id: "c-li", name: "Lighting", slug: "lighting", image: null },
        ],
      },
    },
    isLoading: false,
  }),
}));

vi.mock("../../../src/hooks/useInView", () => ({
  default: () => [{ current: null }, true],
}));

vi.mock("../../../src/components/shop/ProductCard", () => ({
  default: ({ product }) => (
    <div data-testid="product-card">{product.name}</div>
  ),
}));

import FeaturedPieces from "../../../src/components/sections/FeaturedPieces.jsx";

function renderSection() {
  return render(
    <MemoryRouter>
      <FeaturedPieces />
    </MemoryRouter>,
  );
}

describe("FeaturedPieces (uploaded variant)", () => {
  beforeEach(() => {
    lastParams = null;
    Object.defineProperty(window, "innerWidth", {
      value: 1440,
      configurable: true,
      writable: true,
    });
  });

  it("renders the header and View All Products link", () => {
    renderSection();
    expect(screen.getByText("Featured Products")).toBeInTheDocument();
    expect(screen.getByText("Handpicked for Your Home")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /View All Products/ }),
    ).toHaveAttribute("href", "/shop");
  });

  it("has no category tabs and no paging arrows", () => {
    renderSection();
    expect(screen.queryByRole("button", { name: "All Products" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Next products" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Previous products" }),
    ).toBeNull();
  });

  it("fetches a fixed two-row batch with no category filter", () => {
    renderSection();
    expect(lastParams).toEqual({
      limit: 10,
      sort: "-isFeatured,-createdAt",
      status: "active",
    });
  });

  it("shows two rows of five on desktop — ten products, no paging", () => {
    renderSection();
    expect(screen.getAllByTestId("product-card")).toHaveLength(10);
    expect(screen.getByText("Product 10")).toBeInTheDocument();
    expect(screen.queryByText("Product 11")).not.toBeInTheDocument();
  });

  it("renders the two promo cards with shop links", () => {
    renderSection();
    // Current promo content (the tables-edit card was replaced):
    // the wide primary slot is the sofa collection, the secondary
    // slot is lighting. Each CTA filters the shop to its category.
    expect(screen.getByRole("link", { name: /Shop Sofas/ })).toHaveAttribute(
      "href",
      "/shop?categories=living-room",
    );
    expect(screen.getByText(/Discover Comfort/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Shop Lighting/ })).toHaveAttribute(
      "href",
      "/shop?categories=lighting",
    );
    expect(screen.getByText(/Lighting Collection/)).toBeInTheDocument();
  });
});
