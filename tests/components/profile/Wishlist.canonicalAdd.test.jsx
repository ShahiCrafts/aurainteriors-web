import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

// REUSE-001 (Phase 5) — the wishlist page's INTENTIONAL behaviour
// change. The page used to render an inline card whose add-to-cart
// called the cart mutation directly for EVERY product: no variant
// guard (a variant product was added without a variant ever being
// chosen) and no guest path. The page now renders ProductCard's
// wishlist variant, so per-item adds follow the canonical card
// rules pinned here:
//   simple + signed-in → cart mutation { productId, quantity: 1, variant: {} }
//   simple + guest     → guest cart store (legacy 3-argument call)
//   variant (anyone)   → "Select options" link to the PDP, no add
// Page-level behaviour (toolbar, Add All, pagination, remove) is
// covered by Wishlist.test.jsx and is unchanged.

const state = vi.hoisted(() => ({
  data: undefined,
  addToCartMutate: vi.fn(),
  removeMutate: vi.fn(),
  guestAddItem: vi.fn(),
  auth: { isAuthenticated: true },
}));

vi.mock("../../../src/hooks/cart/useWishlistTan", () => ({
  useWishlist: () => ({ data: state.data, isLoading: false, error: null }),
  useRemoveFromWishlist: () => ({ mutate: state.removeMutate, isPending: false }),
  useAddToWishlist: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../../../src/hooks/cart/useCartTan", () => ({
  useAddToCart: () => ({
    mutate: state.addToCartMutate,
    mutateAsync: vi.fn(() => Promise.resolve()),
    isPending: false,
  }),
}));

vi.mock("../../../src/store/authStore", () => ({
  default: () => ({ isAuthenticated: state.auth.isAuthenticated }),
}));

vi.mock("../../../src/store/guestCartStore", () => ({
  default: () => ({ addItem: state.guestAddItem }),
}));

vi.mock("../../../src/lib/toast.js", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

import Wishlist from "../../../src/components/profile/Wishlist.jsx";

const simpleProduct = {
  _id: "prod-simple",
  name: "Simple Chair",
  slug: "simple-chair",
  price: 12000,
  images: [],
  category: { name: "Chairs" },
};

const variantProduct = {
  _id: "prod-variant",
  name: "Variant Sofa",
  slug: "variant-sofa",
  price: 20000,
  hasVariants: true,
  priceFrom: 18000,
  images: [],
  category: { name: "Sofas" },
  catalogVariants: [
    { _id: "v1", sku: "SOFA-A", price: 18000, stock: 2, reservedStock: 0, enabled: true },
  ],
};

function renderWishlistWith(product) {
  state.data = {
    data: {
      wishlist: {
        items: [
          {
            _id: "wishlist-item-1",
            addedAt: "2026-01-01T00:00:00.000Z",
            product,
          },
        ],
      },
    },
  };
  return render(
    <MemoryRouter>
      <Wishlist />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  state.auth.isAuthenticated = true;
});

describe("Wishlist canonical add-to-cart (Phase 5)", () => {
  it("variant product: 'Select options' links to the PDP and nothing is added directly", () => {
    renderWishlistWith(variantProduct);

    const cta = screen.getByRole("link", { name: "Select options for Variant Sofa" });
    expect(cta).toHaveAttribute("href", "/product/variant-sofa");
    // No per-item add button for this product (the page's separate
    // "Add All to Cart" bulk button is page chrome, not the card).
    expect(
      screen.queryByRole("button", { name: "Add Variant Sofa to cart" })
    ).not.toBeInTheDocument();
    expect(state.addToCartMutate).not.toHaveBeenCalled();
    expect(state.guestAddItem).not.toHaveBeenCalled();
  });

  it("simple product, signed in: adds via the cart mutation with the canonical payload", () => {
    renderWishlistWith(simpleProduct);

    fireEvent.click(
      screen.getByRole("button", { name: "Add Simple Chair to cart" })
    );
    expect(state.guestAddItem).not.toHaveBeenCalled();
    expect(state.addToCartMutate).toHaveBeenCalledTimes(1);
    const [payload, options] = state.addToCartMutate.mock.calls[0];
    expect(payload).toEqual({
      productId: "prod-simple",
      quantity: 1,
      variant: {},
    });
    expect(options.onSuccess).toBeTypeOf("function");
  });

  it("simple product, guest: adds through the guest cart store (the path the old card lacked)", () => {
    state.auth.isAuthenticated = false;
    renderWishlistWith(simpleProduct);

    fireEvent.click(
      screen.getByRole("button", { name: "Add Simple Chair to cart" })
    );
    expect(state.addToCartMutate).not.toHaveBeenCalled();
    expect(state.guestAddItem).toHaveBeenCalledTimes(1);
    expect(state.guestAddItem).toHaveBeenCalledWith(simpleProduct, 1, {});
  });

  it("remove still routes through the page's own remove handler", () => {
    renderWishlistWith(simpleProduct);

    fireEvent.click(
      screen.getByRole("button", { name: "Remove Simple Chair from wishlist" })
    );
    expect(state.removeMutate).toHaveBeenCalledTimes(1);
    expect(state.removeMutate.mock.calls[0][0]).toBe("prod-simple");
  });
});
