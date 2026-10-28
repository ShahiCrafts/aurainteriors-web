import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// FE-14 regression tests for src/components/shop/ProductCard.jsx.
//
// Pre-fix behaviour: when a product had no rating, ProductCard invented one
// by hashing the product id into 4.0–4.9 and rendered it next to the real
// review count ("4.7 (0)"). The honest state is "No reviews yet" with no
// stars and no numeric rating; a product WITH reviews must keep showing its
// real average and count exactly.

vi.mock("../../../src/hooks/cart/useWishlistTan", () => ({
  useWishlist: () => ({ data: undefined }),
  useAddToWishlist: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveFromWishlist: () => ({ mutate: vi.fn(), isPending: false }),
}));

const cartMocks = vi.hoisted(() => ({
  addToCartMutate: vi.fn(),
  guestAddItem: vi.fn(),
  auth: { isAuthenticated: false },
}));

vi.mock("../../../src/hooks/cart/useCartTan", () => ({
  useAddToCart: () => ({ mutate: cartMocks.addToCartMutate, isPending: false }),
}));

vi.mock("../../../src/store/authStore", () => ({
  default: () => ({ isAuthenticated: cartMocks.auth.isAuthenticated }),
}));

vi.mock("../../../src/store/guestCartStore", () => ({
  default: () => ({ addItem: cartMocks.guestAddItem }),
}));

vi.mock("../../../src/lib/toast.js", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import ProductCard from "../../../src/components/shop/ProductCard.jsx";
import { toast } from "../../../src/lib/toast.js";

beforeEach(() => {
  vi.clearAllMocks();
  cartMocks.auth.isAuthenticated = false;
});

const baseProduct = {
  _id: "prod-unrated-1",
  name: "Unrated Chair",
  slug: "unrated-chair",
  price: 10000,
  images: [],
  category: { name: "Chairs" },
};

function renderCard(product, viewMode) {
  return render(
    <MemoryRouter>
      <ProductCard product={product} viewMode={viewMode} />
    </MemoryRouter>,
  );
}

describe("ProductCard rating (FE-14)", () => {
  it("shows 'No reviews yet' and no numeric rating for a zero-review product (grid)", () => {
    const { container } = renderCard({
      ...baseProduct,
      rating: { average: 0, count: 0 },
    });

    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
    // No invented one-decimal rating (4.0–4.9 pre-fix) anywhere.
    expect(screen.queryByText(/^[0-9]\.[0-9]$/)).not.toBeInTheDocument();
    expect(container.textContent).not.toContain("(0)");
  });

  it("shows 'No reviews yet' in list view for a zero-review product", () => {
    renderCard({ ...baseProduct, rating: { average: 0, count: 0 } }, "list");

    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
    expect(screen.queryByText(/^[0-9]\.[0-9]$/)).not.toBeInTheDocument();
  });

  it("shows 'No reviews yet' when the rating object is absent entirely", () => {
    renderCard({ ...baseProduct });

    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
    expect(screen.queryByText(/^[0-9]\.[0-9]$/)).not.toBeInTheDocument();
  });

  it("FE-12: a hostile slug 'a/b?x=1#y' is encoded into ONE route segment (grid)", () => {
    const { container } = renderCard({
      ...baseProduct,
      slug: "a/b?x=1#y",
    });

    const links = [...container.querySelectorAll("a")];
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute("href")).toBe("/product/a%2Fb%3Fx%3D1%23y");
    }
  });

  it("FE-12: a hostile slug is encoded in list view too, and an ordinary slug is byte-identical", () => {
    const hostile = renderCard({ ...baseProduct, slug: "a/b?x=1#y" }, "list");
    expect(hostile.container.querySelector("a").getAttribute("href")).toBe(
      "/product/a%2Fb%3Fx%3D1%23y",
    );
    hostile.unmount();

    const ordinary = renderCard({ ...baseProduct, slug: "oak-chair" });
    expect(ordinary.container.querySelector("a").getAttribute("href")).toBe(
      "/product/oak-chair",
    );
  });

  it("FE-12: when there is no slug, the _id segment is encoded the same way", () => {
    const { container } = renderCard({
      ...baseProduct,
      slug: undefined,
      _id: "id/with?chars",
    });
    expect(container.querySelector("a").getAttribute("href")).toBe(
      "/product/id%2Fwith%3Fchars",
    );
  });

  it("FE-54: card image carries responsive srcSet/sizes and stays lazy", () => {
    const { container } = renderCard({
      ...baseProduct,
      images: [
        {
          url: "https://res.cloudinary.com/demo/image/upload/v1/chair.jpg",
          isPrimary: true,
        },
      ],
    });

    const img = container.querySelector("img");
    expect(img.getAttribute("srcSet")).toContain("w_600,q_auto,f_webp");
    expect(img.getAttribute("srcSet")).toContain("600w");
    expect(img.getAttribute("srcSet")).toContain("1920w");
    expect(img.getAttribute("sizes")).toBeTruthy();
    expect(img.getAttribute("loading")).toBe("lazy");
  });

  it("FE-63: price renders through formatNPR (fixed en-NP grouping, whole rupees)", () => {
    renderCard({ ...baseProduct, price: 1234567, originalPrice: 2000000 });

    expect(screen.getByText(/NPR\s1,234,567/)).toBeInTheDocument();
    expect(screen.getByText(/NPR\s2,000,000/)).toBeInTheDocument();
    expect(screen.queryByText(/NRs\.|Nrs\.|₹/)).not.toBeInTheDocument();
  });

  it("FE-62 reversed by the owner (2026-10-26): the grid card has a real, rendered add-to-cart handler", () => {
    const source = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../src/components/shop/ProductCard.jsx",
      ),
      "utf8",
    );
    // FE-62 removed the original handler because no JSX referenced
    // it. The owner reversed that call: the handler and its hooks
    // are back AND rendered — as the grid card's cart button (the
    // list layout stays navigation-only).
    expect(source).toContain("handleAddToCart");
    expect(source).toContain("useAddToCart");
    expect(source).toContain("useGuestCartStore");
    expect(source).not.toContain("ShoppingBag");
    const { unmount } = renderCard({ ...baseProduct });
    expect(
      screen.getByRole("button", { name: "Add Unrated Chair to cart" }),
    ).toBeInTheDocument();
    unmount();
    renderCard({ ...baseProduct }, "list");
    expect(screen.queryByRole("button", { name: /add to cart/i })).toBeNull();
  });

  it("clicking the grid cart button adds a guest item (legacy 3-argument call) and toasts", () => {
    const product = {
      ...baseProduct,
      name: "Luna Modular Sofa",
      slug: "luna-modular-sofa",
    };
    renderCard(product);
    fireEvent.click(
      screen.getByRole("button", { name: "Add Luna Modular Sofa to cart" }),
    );
    expect(cartMocks.guestAddItem).toHaveBeenCalledTimes(1);
    expect(cartMocks.guestAddItem).toHaveBeenCalledWith(product, 1, {});
    expect(cartMocks.addToCartMutate).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Added to cart");
  });

  it("clicking the grid cart button as a signed-in user fires the cart mutation with the PDP payload", () => {
    cartMocks.auth.isAuthenticated = true;
    renderCard({
      ...baseProduct,
      name: "Luna Modular Sofa",
      slug: "luna-modular-sofa",
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add Luna Modular Sofa to cart" }),
    );
    expect(cartMocks.guestAddItem).not.toHaveBeenCalled();
    expect(cartMocks.addToCartMutate).toHaveBeenCalledTimes(1);
    const [payload, options] = cartMocks.addToCartMutate.mock.calls[0];
    expect(payload).toEqual({
      productId: baseProduct._id,
      quantity: 1,
      variant: {},
    });
    // Success is toasted by the card; errors belong to the cart
    // hook (FE-47), so no per-call onError is passed.
    expect(options.onError).toBeUndefined();
    options.onSuccess();
    expect(toast.success).toHaveBeenCalledWith("Added to cart");
  });

  it("shows the real average and count for a product with reviews", () => {
    renderCard({ ...baseProduct, rating: { average: 4.2, count: 17 } });

    expect(screen.getByText("4.2")).toBeInTheDocument();
    expect(screen.getByText("(17)")).toBeInTheDocument();
    expect(screen.queryByText("No reviews yet")).not.toBeInTheDocument();
  });
});

// Landing reference redesign: badge pill (real fields only), short
// description line, color dots with a +N overflow, and the orange
// cart button (a real add for simple products since the owner's
// FE-62 reversal; a link to the product page for variant ones).
describe("ProductCard reference design (grid)", () => {
  it("shows the discount badge from the real discount fields", () => {
    renderCard({
      ...baseProduct,
      price: 8000,
      originalPrice: 10000,
      discountPercentage: 20,
      isNewArrival: true,
    });
    expect(screen.getByText("20% OFF")).toBeInTheDocument();
    expect(screen.queryByText("New Arrival")).not.toBeInTheDocument();
  });

  it("shows New Arrival, then Featured, when there is no discount", () => {
    const { unmount } = renderCard({
      ...baseProduct,
      isNewArrival: true,
      isFeatured: true,
    });
    expect(screen.getByText("New Arrival")).toBeInTheDocument();
    unmount();
    renderCard({ ...baseProduct, isFeatured: true });
    expect(screen.getByText("Featured")).toBeInTheDocument();
  });

  it("renders the short description line in grid view", () => {
    renderCard({
      ...baseProduct,
      shortDescription: "Premium fabric sectional sofa",
    });
    expect(
      screen.getByText("Premium fabric sectional sofa"),
    ).toBeInTheDocument();
  });

  it("renders up to four color dots with a +N overflow", () => {
    const { container } = renderCard({
      ...baseProduct,
      colors: ["Sand", "Teal", "Navy", "Green", "Black"],
    });
    const dots = container.querySelectorAll("[data-card-color]");
    expect(dots).toHaveLength(4);
    expect(dots[0].style.backgroundColor).toBe("rgb(214, 207, 194)");
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("the orange cart button is a real button for a simple product", () => {
    renderCard({
      ...baseProduct,
      name: "Luna Modular Sofa",
      slug: "luna-modular-sofa",
    });
    const cta = screen.getByRole("button", {
      name: "Add Luna Modular Sofa to cart",
    });
    expect(cta.querySelector("svg.lucide-shopping-cart")).not.toBeNull();
  });
});
