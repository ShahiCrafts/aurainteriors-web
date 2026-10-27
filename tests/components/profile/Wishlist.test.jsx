import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

// FE-14 regression tests for src/components/profile/Wishlist.jsx.
//
// Pre-fix behaviour: `product.rating?.average || 4.5` displayed a hardcoded
// 4.5-star rating for every unrated wishlist product. The honest state is
// "No reviews yet" with no numeric rating; a product WITH a real average
// (and reviews) must keep showing it.

const { wishlistState, cartState } = vi.hoisted(() => ({
  wishlistState: { data: undefined },
  cartState: { mutate: vi.fn(), mutateAsync: vi.fn() },
}));

vi.mock("../../../src/hooks/cart/useWishlistTan", () => ({
  useWishlist: () => ({
    data: wishlistState.data,
    isLoading: false,
    error: null,
  }),
  useRemoveFromWishlist: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../../../src/hooks/cart/useCartTan", () => ({
  useAddToCart: () => ({
    mutate: cartState.mutate,
    mutateAsync: cartState.mutateAsync,
    isPending: false,
  }),
}));

vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

import { toast } from "react-toastify";

import Wishlist from "../../../src/components/profile/Wishlist.jsx";

function wishlistDataWith(product) {
  return {
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
}

const baseProduct = {
  _id: "prod-wishlist-1",
  name: "Wishlist Sofa",
  slug: "wishlist-sofa",
  price: 50000,
  images: [],
  category: { name: "Sofas" },
};

function renderWishlist(product) {
  wishlistState.data = wishlistDataWith(product);
  return render(
    <MemoryRouter>
      <Wishlist />
    </MemoryRouter>
  );
}

describe("Wishlist rating (FE-14)", () => {
  it("shows 'No reviews yet' and no 4.5 for an unrated product", () => {
    const { container } = renderWishlist({
      ...baseProduct,
      rating: { average: 0, count: 0 },
    });

    expect(screen.getByText("Wishlist Sofa")).toBeInTheDocument();
    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
    expect(container.textContent).not.toContain("4.5");
    expect(screen.queryByText("(4.5)")).not.toBeInTheDocument();
  });

  it("shows 'No reviews yet' when the rating object is absent entirely", () => {
    renderWishlist({ ...baseProduct });

    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
    expect(screen.queryByText("(4.5)")).not.toBeInTheDocument();
  });

  it("shows the real average for a product with reviews", () => {
    renderWishlist({ ...baseProduct, rating: { average: 3.8, count: 9 } });

    expect(screen.getByText("(3.8)")).toBeInTheDocument();
    expect(screen.queryByText("No reviews yet")).not.toBeInTheDocument();
  });
});

// FE-27 regression tests: 'Add all to cart' must announce the outcome
// only after the requests resolve (with honest partial-failure
// reporting), and the grid must never strand on an out-of-range page.
describe("Wishlist add-all + pagination (FE-27)", () => {
  function wishlistDataWithItems(products) {
    return {
      data: {
        wishlist: {
          items: products.map((product, i) => ({
            _id: `wishlist-item-${i + 1}`,
            addedAt: `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`,
            product,
          })),
        },
      },
    };
  }

  function makeProduct(n) {
    return {
      ...baseProduct,
      _id: `prod-${n}`,
      name: `Item ${n}`,
      slug: `item-${n}`,
    };
  }

  function renderItems(products) {
    wishlistState.data = wishlistDataWithItems(products);
    return render(
      <MemoryRouter>
        <Wishlist />
      </MemoryRouter>
    );
  }

  beforeEach(() => {
    cartState.mutate = vi.fn();
    cartState.mutateAsync = vi.fn(() => Promise.resolve());
  });

  it("announces success only after every add resolves", async () => {
    const resolvers = [];
    cartState.mutateAsync = vi.fn(
      () => new Promise((resolve) => resolvers.push(resolve))
    );
    renderItems([makeProduct(1), makeProduct(2)]);

    fireEvent.click(screen.getByRole("button", { name: /add all to cart/i }));

    // Nothing has resolved yet — no success claim may exist.
    expect(toast.success).not.toHaveBeenCalled();
    expect(resolvers).toHaveLength(2);

    resolvers.forEach((resolve) => resolve());
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("2 items added to cart")
      )
    );
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("reports a partial failure honestly instead of claiming full success", async () => {
    cartState.mutateAsync = vi.fn(({ productId }) =>
      productId === "prod-2"
        ? Promise.reject(new Error("out of stock"))
        : Promise.resolve()
    );
    renderItems([makeProduct(1), makeProduct(2)]);

    fireEvent.click(screen.getByRole("button", { name: /add all to cart/i }));

    await waitFor(() =>
      expect(toast.warning).toHaveBeenCalledWith(
        expect.stringContaining("1 of 2")
      )
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("reports total failure as an error, never as success", async () => {
    cartState.mutateAsync = vi.fn(() => Promise.reject(new Error("down")));
    renderItems([makeProduct(1), makeProduct(2)]);

    fireEvent.click(screen.getByRole("button", { name: /add all to cart/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("clamps the page when the list shrinks below the current page", () => {
    const nine = Array.from({ length: 9 }, (_, i) => makeProduct(i + 1));
    const utils = renderItems(nine);

    // Default sort is most-recent-first: page 1 holds Items 9–2, so
    // page 2 holds only Item 1 (8 per page).
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.queryByText("Item 9")).not.toBeInTheDocument();

    // The list shrinks to a single page while we sit on page 2.
    wishlistState.data = wishlistDataWithItems(nine.slice(0, 8));
    utils.rerender(
      <MemoryRouter>
        <Wishlist />
      </MemoryRouter>
    );

    // The remaining items are shown — not an empty stranded grid.
    expect(screen.getByText("Item 8")).toBeInTheDocument();
    expect(screen.getByText(/Showing page 1 of 1/)).toBeInTheDocument();
  });
});
