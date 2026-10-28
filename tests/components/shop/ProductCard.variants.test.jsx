// Phase 7 (catalog) — ProductCard variant presentation: a
// variant product shows the priceFrom floor with a "From"
// prefix (never a single price as if it were the only price,
// never the product-level strike-through), and its availability
// is any-purchasable-variant when the payload carries variants.
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../src/hooks/cart/useWishlistTan", () => ({
  useWishlist: () => ({ data: undefined }),
  useAddToWishlist: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveFromWishlist: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../../../src/hooks/cart/useCartTan", () => ({
  useAddToCart: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../../../src/store/guestCartStore", () => ({
  default: () => ({ addItem: vi.fn() }),
}));

vi.mock("../../../src/store/authStore", () => ({
  default: () => ({ isAuthenticated: false }),
}));

vi.mock("../../../src/lib/toast.js", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import ProductCard from "../../../src/components/shop/ProductCard.jsx";
import { formatNPR } from "../../../src/utils/formatCurrency.js";

// formatNPR separates the currency code with a NBSP (U+00A0);
// text queries normalize it to a plain space.
const npr = (value) => formatNPR(value).replace(/\u00a0/g, " ");

const variantProduct = {
  _id: "prod-variant-1",
  name: "Variant Sofa",
  slug: "variant-sofa",
  price: 60000,
  originalPrice: 75000,
  hasVariants: true,
  priceFrom: 45000,
  images: [],
  category: { name: "Sofas" },
  catalogVariants: [
    {
      _id: "v1",
      sku: "SOFA-A",
      price: 45000,
      stock: 2,
      reservedStock: 0,
      enabled: true,
    },
    {
      _id: "v2",
      sku: "SOFA-B",
      price: 60000,
      stock: 0,
      reservedStock: 0,
      enabled: true,
    },
  ],
};

const renderCard = (product) =>
  render(
    <MemoryRouter>
      <ProductCard product={product} />
    </MemoryRouter>,
  );

describe("ProductCard variant presentation (Phase 7)", () => {
  it("shows the From floor and not the product-level strike-through", () => {
    renderCard(variantProduct);
    expect(screen.getByText(`From ${npr(45000)}`)).toBeInTheDocument();
    expect(screen.queryByText(npr(75000))).not.toBeInTheDocument();
    expect(screen.queryByText("Out of stock")).not.toBeInTheDocument();
  });

  it("shows Out of stock when no variant is purchasable", () => {
    renderCard({
      ...variantProduct,
      catalogVariants: [
        {
          _id: "v1",
          sku: "SOFA-A",
          price: 45000,
          stock: 1,
          reservedStock: 1,
          enabled: true,
        },
        {
          _id: "v2",
          sku: "SOFA-B",
          price: 60000,
          stock: 3,
          reservedStock: 0,
          enabled: false,
        },
      ],
    });
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
  });

  it("claims nothing about stock when the payload carries no variants", () => {
    const { catalogVariants, ...withoutVariants } = variantProduct;
    renderCard(withoutVariants);
    expect(screen.getByText(`From ${npr(45000)}`)).toBeInTheDocument();
    expect(screen.queryByText("Out of stock")).not.toBeInTheDocument();
  });

  it("the cart button stays a link for variant products — a variant must be chosen on the product page first", () => {
    renderCard(variantProduct);
    const cta = screen.getByRole("link", {
      name: "Select options for Variant Sofa",
    });
    expect(cta).toHaveAttribute("href", "/product/variant-sofa");
    expect(cta.querySelector("svg.lucide-shopping-cart")).not.toBeNull();
    expect(
      screen.queryByRole("button", { name: /add .* to cart/i }),
    ).not.toBeInTheDocument();
  });

  it("legacy products keep the plain price + strike-through", () => {
    renderCard({
      _id: "prod-legacy-1",
      name: "Legacy Chair",
      slug: "legacy-chair",
      price: 10000,
      originalPrice: 12000,
      images: [],
      category: { name: "Chairs" },
    });
    expect(screen.getByText(npr(10000))).toBeInTheDocument();
    expect(screen.getByText(npr(12000))).toBeInTheDocument();
    expect(screen.queryByText(/From/)).not.toBeInTheDocument();
  });
});
