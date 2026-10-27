import { act, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";

// FE-14 regression tests for the sold-count line in
// src/pages/shop/ProductDetailsPage.jsx.
//
// Pre-fix behaviour: `{product.soldCount || "200+"} bought in last month`
// rendered the literal "200+ bought in last month" for every product,
// because the product API provides no soldCount field at all (verified
// against the server product model: no soldCount field exists). The honest
// state is to render NOTHING for that element when the field is absent, and
// the real number when the data does supply one.
//
// FE-22 regression tests (purchase defects) live in the second describe
// block below.

const { productState, cartState, guestState, authState, navState } =
  vi.hoisted(() => ({
    productState: { product: null, error: null, refetch: vi.fn() },
    cartState: { mutate: vi.fn() },
    guestState: { addItem: vi.fn() },
    authState: { isAuthenticated: false },
    navState: { navigate: null },
  }));

vi.mock("../../../src/hooks/product/useProductTan", () => ({
  useProduct: () => ({
    data: { data: { product: productState.product } },
    isLoading: false,
    error: productState.error,
    refetch: productState.refetch,
  }),
  useRelatedProducts: () => ({ data: undefined }),
}));

// Phase 7: the page also reads the category tree (breadcrumb
// ancestors) and the catalog schema (variant/spec labels) —
// inert stubs; this file's assertions are unchanged.
vi.mock("../../../src/hooks/product/useCategoryTan", () => ({
  useCategoryTree: () => ({ data: undefined, isLoading: false }),
}));

vi.mock("../../../src/hooks/catalog/useCatalogTan", () => ({
  useCatalogSchema: () => ({ data: undefined, isLoading: false }),
}));

vi.mock("../../../src/hooks/cart/useWishlistTan", () => ({
  useCheckWishlist: () => ({ data: undefined }),
  useAddToWishlist: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveFromWishlist: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../../../src/hooks/cart/useCartTan", () => ({
  useAddToCart: () => ({ mutate: cartState.mutate, isPending: false }),
}));

vi.mock("../../../src/hooks/review/useReviewTan", () => ({
  useCanReview: () => ({ data: undefined }),
  useUserReview: () => ({ data: undefined }),
}));

vi.mock("../../../src/store/authStore", () => {
  const store = () => ({ isAuthenticated: authState.isAuthenticated });
  store.getState = () => ({ openAuthModal: vi.fn() });
  return { default: store };
});

vi.mock("../../../src/store/guestCartStore", () => ({
  default: () => ({ addItem: guestState.addItem }),
}));

vi.mock("../../../src/lib/toast.js", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("../../../src/layouts/customer/Navbar", () => ({
  default: () => <div>NAVBAR</div>,
}));
vi.mock("../../../src/layouts/customer/Footer", () => ({
  default: () => <div>FOOTER</div>,
}));
vi.mock("../../../src/components/navigation/CategoryBar", () => ({
  default: () => <div>CATEGORYBAR</div>,
}));
vi.mock("../../../src/components/shop/ProductCard", () => ({
  default: () => <div>PRODUCTCARD</div>,
}));
vi.mock("../../../src/components/shop/ImageMagnifier", () => ({
  default: () => <div>IMAGE</div>,
}));
vi.mock("../../../src/components/modals/ARViewModal", () => ({
  default: () => null,
}));
vi.mock("../../../src/components/modals/ReviewModal", () => ({
  default: () => null,
}));
vi.mock("../../../src/components/shop/ReviewSection", () => ({
  default: () => <div>REVIEWS</div>,
}));

import ProductDetailsPage from "../../../src/pages/shop/ProductDetailsPage.jsx";

const baseProduct = {
  _id: "prod-details-1",
  name: "Details Sofa",
  slug: "details-sofa",
  price: 100000,
  images: [{ url: "https://example.com/sofa.jpg" }],
  category: { name: "Sofas", slug: "sofas" },
  rating: { average: 4.5, count: 12 },
  description: "A comfortable sofa.",
  stock: 5,
  colors: [],
  materials: [],
};

function NavProbe() {
  const navigate = useNavigate();
  useEffect(() => {
    navState.navigate = navigate;
  }, [navigate]);
  return null;
}

function renderPage(product, slug = "details-sofa") {
  productState.product = product;
  return render(
    <MemoryRouter initialEntries={[`/product/${slug}`]}>
      <NavProbe />
      <Routes>
        <Route path="/product/:productSlug" element={<ProductDetailsPage />} />
        <Route path="/checkout" element={<div>CHECKOUT PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  productState.error = null;
  productState.refetch.mockClear();
  authState.isAuthenticated = false;
  cartState.mutate = vi.fn();
  guestState.addItem = vi.fn();
});

describe("ProductDetailsPage sold count (FE-14)", () => {
  it("renders no 'bought in last month' line when soldCount is absent", () => {
    const { container } = renderPage({ ...baseProduct });

    expect(screen.getByRole("heading", { name: "Details Sofa", level: 1 })).toBeInTheDocument();
    expect(screen.queryByText(/bought in last month/)).not.toBeInTheDocument();
    expect(container.textContent).not.toContain("200+");
  });

  it("renders the real sold count when the data supplies one", () => {
    renderPage({ ...baseProduct, soldCount: 87 });

    expect(screen.getByText(/87 bought in last month/)).toBeInTheDocument();
  });
});

describe("ProductDetailsPage purchase defects (FE-22)", () => {
  it("Buy Now adds the item and navigates to /checkout for a guest", () => {
    renderPage({ ...baseProduct });

    fireEvent.click(screen.getByRole("button", { name: "Buy Now" }));

    expect(guestState.addItem).toHaveBeenCalledTimes(1);
    expect(screen.getByText("CHECKOUT PAGE")).toBeInTheDocument();
  });

  it("Buy Now navigates to /checkout only after the cart mutation succeeds (signed-in)", () => {
    authState.isAuthenticated = true;
    cartState.mutate = vi.fn((vars, opts) => opts?.onSuccess?.());
    renderPage({ ...baseProduct });

    fireEvent.click(screen.getByRole("button", { name: "Buy Now" }));

    expect(cartState.mutate).toHaveBeenCalledTimes(1);
    expect(screen.getByText("CHECKOUT PAGE")).toBeInTheDocument();
  });

  it("Buy Now does not navigate when the cart mutation fails (signed-in)", () => {
    authState.isAuthenticated = true;
    cartState.mutate = vi.fn((vars, opts) =>
      opts?.onError?.(new Error("boom"))
    );
    renderPage({ ...baseProduct });

    fireEvent.click(screen.getByRole("button", { name: "Buy Now" }));

    expect(screen.queryByText("CHECKOUT PAGE")).not.toBeInTheDocument();
  });

  it("locks quantity and disables purchase for an out-of-stock product", () => {
    renderPage({ ...baseProduct, stock: 0 });

    expect(
      screen.getByRole("button", { name: /out of stock/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buy Now" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Increase quantity" })
    ).toBeDisabled();

    fireEvent.click(
      screen.getByRole("button", { name: "Increase quantity" })
    );
    // Quantity can never be stepped up from 1 and nothing can be added.
    expect(guestState.addItem).not.toHaveBeenCalled();
  });

  it("caps quantity at the real stock level", () => {
    renderPage({ ...baseProduct, stock: 2 });

    const increase = screen.getByRole("button", { name: "Increase quantity" });
    fireEvent.click(increase);
    fireEvent.click(increase);
    fireEvent.click(increase);

    fireEvent.click(screen.getByRole("button", { name: "Add to Cart" }));
    expect(guestState.addItem).toHaveBeenCalledWith(
      expect.objectContaining({ _id: baseProduct._id }),
      2,
      expect.anything()
    );
  });

  it("resets colour, image and quantity when navigating to another product", () => {
    const productA = {
      ...baseProduct,
      _id: "prod-a",
      slug: "sofa-a",
      name: "Sofa A",
      stock: 9,
      colors: [
        { name: "Red", hex: "#ff0000" },
        { name: "Blue", hex: "#0000ff" },
      ],
      images: [
        { url: "https://example.com/a1.jpg" },
        { url: "https://example.com/a2.jpg" },
      ],
    };
    const productB = {
      ...baseProduct,
      _id: "prod-b",
      slug: "sofa-b",
      name: "Sofa B",
      stock: 9,
      colors: [
        { name: "Green", hex: "#00ff00" },
        { name: "Yellow", hex: "#ffff00" },
      ],
      images: [{ url: "https://example.com/b1.jpg" }],
    };
    renderPage(productA, "sofa-a");

    // Pick A's second colour and raise the quantity.
    fireEvent.click(screen.getByTitle("Blue"));
    const increase = screen.getByRole("button", { name: "Increase quantity" });
    fireEvent.click(increase);
    fireEvent.click(increase);

    // Navigate (same route component, new param) to product B.
    productState.product = productB;
    act(() => {
      navState.navigate("/product/sofa-b");
    });

    expect(screen.getByRole("heading", { name: "Sofa B", level: 1 })).toBeInTheDocument();
    // B's own first colour is selected — never A's "Blue".
    expect(screen.queryByText("Blue")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add to Cart" }));
    expect(guestState.addItem).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "prod-b" }),
      1,
      { color: "Green" }
    );
  });
});


describe("Product detail error states", () => {
  it("shows retry for a server error instead of claiming the product is missing", () => {
    productState.error = { response: { status: 500 } };
    renderPage(null);
    expect(screen.getByText("Unable to load product")).toBeInTheDocument();
    expect(screen.queryByText("Product Not Found")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(productState.refetch).toHaveBeenCalledOnce();
  });
  it("uses not-found for an actual 404", () => {
    productState.error = { response: { status: 404 } };
    renderPage(null);
    expect(screen.getByText("Product Not Found")).toBeInTheDocument();
  });
  it("shows retry for offline errors", () => {
    productState.error = new Error("offline");
    renderPage(null);
    expect(screen.getByText("Unable to load product")).toBeInTheDocument();
  });
});
