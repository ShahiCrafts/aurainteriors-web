import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

// REUSE-001 (Phase 5) — ProductCard variant coverage. The canonical
// card now serves grid / list / compact / ar-thumb from
// one component (the wishlist variant was later removed; the
// profile Wishlist renders its own rows); these tests pin the structural markers and the
// interaction contract of each variant (price + rating text, cart
// action kind, remove/select callbacks). Behavioural history
// (FE-12/14/54/62/63) stays covered by ProductCard.test.jsx and
// ProductCard.variants.test.jsx, which pass unmodified.

const mocks = vi.hoisted(() => ({
  addToCartMutate: vi.fn(),
  guestAddItem: vi.fn(),
  auth: { isAuthenticated: false },
}));

vi.mock("../../../src/hooks/cart/useWishlistTan", () => ({
  useWishlist: () => ({ data: undefined }),
  useAddToWishlist: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveFromWishlist: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../../../src/hooks/cart/useCartTan", () => ({
  useAddToCart: () => ({ mutate: mocks.addToCartMutate, isPending: false }),
}));

vi.mock("../../../src/store/authStore", () => ({
  default: () => ({ isAuthenticated: mocks.auth.isAuthenticated }),
}));

vi.mock("../../../src/store/guestCartStore", () => ({
  default: () => ({ addItem: mocks.guestAddItem }),
}));

vi.mock("../../../src/lib/toast.js", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import ProductCard from "../../../src/components/shop/ProductCard.jsx";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.isAuthenticated = false;
});

const simpleProduct = {
  _id: "p-simple",
  name: "Simple Chair",
  slug: "simple-chair",
  price: 12000,
  originalPrice: 15000,
  discountPercentage: 20,
  images: [],
  category: { name: "Chairs" },
  rating: { average: 4.5, count: 12 },
};

const variantProduct = {
  _id: "p-variant",
  name: "Variant Sofa",
  slug: "variant-sofa",
  price: 20000,
  hasVariants: true,
  priceFrom: 18000,
  images: [],
  category: { name: "Sofas" },
  rating: { average: 4.0, count: 3 },
  catalogVariants: [
    {
      _id: "v1",
      sku: "SOFA-A",
      price: 18000,
      stock: 2,
      reservedStock: 0,
      enabled: true,
    },
  ],
};

function renderCard(product, props = {}) {
  return render(
    <MemoryRouter>
      <ProductCard product={product} {...props} />
    </MemoryRouter>,
  );
}

describe("ProductCard variant: grid (default)", () => {
  it("renders price + strike-through, rating average + count, discount badge and the add button", () => {
    renderCard(simpleProduct);
    expect(screen.getByText(/NPR\s12,000/)).toBeInTheDocument();
    expect(screen.getByText(/NPR\s15,000/)).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("(12)")).toBeInTheDocument();
    expect(screen.getByText("20% OFF")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Simple Chair to cart" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Simple Chair to wishlist" }),
    ).toBeInTheDocument();
  });

  it("showRatingCount=false hides the count but keeps the average", () => {
    renderCard(simpleProduct, { showRatingCount: false });
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.queryByText("(12)")).not.toBeInTheDocument();
  });

  it("showAddToCart=false and showWishlist=false remove both actions", () => {
    renderCard(simpleProduct, { showAddToCart: false, showWishlist: false });
    expect(
      screen.queryByRole("button", { name: /to cart/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /wishlist/ }),
    ).not.toBeInTheDocument();
  });

  it("renders exactly one AR pill when the product is AR-available", () => {
    renderCard({ ...simpleProduct, arAvailable: true });
    expect(screen.getAllByText("✦ AR View")).toHaveLength(1);
  });
});

describe("ProductCard variant: list", () => {
  it("renders category, one-star rating, price and no add-to-cart button", () => {
    renderCard(simpleProduct, { variant: "list" });
    expect(screen.getByText("Chairs")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("(12)")).toBeInTheDocument();
    expect(screen.getByText(/NPR\s12,000/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /add to cart/i }),
    ).not.toBeInTheDocument();
  });

  it("viewMode='list' still selects the list variant (legacy consumer prop)", () => {
    renderCard(simpleProduct, { viewMode: "list" });
    expect(screen.getByText("Chairs")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /add to cart/i }),
    ).not.toBeInTheDocument();
  });

  it("renders exactly one AR pill when the product is AR-available", () => {
    renderCard({ ...simpleProduct, arAvailable: true }, { variant: "list" });
    expect(screen.getAllByText("✦ AR View")).toHaveLength(1);
  });
});

describe("ProductCard variant: wishlist", () => {
  // DELETED (testing Phase 4, obsolete): "renders price, rating and
  // a remove button wired to onRemove(productId)" — the wishlist
  // variant and the onRemove prop no longer exist in ProductCard.jsx
  // (repo-wide grep: no src caller passes either), its price/rating
  // assertions duplicated the grid/list cases above, and the
  // remove-from-wishlist behaviour itself is covered where it now
  // lives, in tests/components/profile/Wishlist.canonicalAdd.test.jsx
  // ("remove still routes through the page's own remove handler").
  // The two cases below keep the "wishlist" render prop because they
  // pin live behaviour (guest add path / select-options guard) that
  // passes through the card's default rendering.
  it("simple product: the cart button adds through the canonical guest path", () => {
    renderCard(simpleProduct, { variant: "wishlist", onRemove: vi.fn() });
    fireEvent.click(
      screen.getByRole("button", { name: "Add Simple Chair to cart" }),
    );
    expect(mocks.guestAddItem).toHaveBeenCalledTimes(1);
    expect(mocks.guestAddItem).toHaveBeenCalledWith(simpleProduct, 1, {});
    expect(mocks.addToCartMutate).not.toHaveBeenCalled();
  });

  it("variant product: renders a Select-options link and NO direct add (the Phase 5 guard)", () => {
    renderCard(variantProduct, { variant: "wishlist", onRemove: vi.fn() });
    const cta = screen.getByRole("link", {
      name: "Select options for Variant Sofa",
    });
    expect(cta).toHaveAttribute("href", "/product/variant-sofa");
    expect(screen.getByText(/From\s+NPR\s18,000/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /add .* to cart/i }),
    ).not.toBeInTheDocument();
    expect(mocks.guestAddItem).not.toHaveBeenCalled();
    expect(mocks.addToCartMutate).not.toHaveBeenCalled();
  });
});

describe("ProductCard variant: compact", () => {
  it("renders a navigation row with thumb, name, category and price", () => {
    renderCard(simpleProduct, { variant: "compact" });
    const link = screen.getByRole("link", { name: /Simple Chair/ });
    expect(link).toHaveAttribute("href", "/product/simple-chair");
    expect(screen.getByText("Chairs")).toBeInTheDocument();
    expect(screen.getByText(/NPR\s12,000/)).toBeInTheDocument();
  });

  it("with onSelect it renders a button and selects instead of navigating", () => {
    const onSelect = vi.fn();
    renderCard(simpleProduct, { variant: "compact", onSelect });
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Simple Chair/ }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(simpleProduct);
  });
});

describe("ProductCard variant: ar-thumb", () => {
  it("renders a selection button with name + price; click selects the product", () => {
    const onSelect = vi.fn();
    // No MemoryRouter needed: ar-thumb never renders a Link, and it
    // must stay hooks-free (AR hosts render it without the
    // storefront's providers) — this render has no providers at all.
    render(
      <ProductCard
        product={simpleProduct}
        variant="ar-thumb"
        onSelect={onSelect}
      />,
    );
    const button = screen.getByRole("button", { name: /Simple Chair/ });
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(/NPR\s12,000/)).toBeInTheDocument();
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(simpleProduct);
  });

  it("selected state is exposed via aria-pressed", () => {
    render(
      <ProductCard
        product={simpleProduct}
        variant="ar-thumb"
        selected
        onSelect={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Simple Chair/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
