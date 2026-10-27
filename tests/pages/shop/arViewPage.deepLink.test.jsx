// FE-30 — ARViewPage (/ar/:productSlug) blocked the AR experience on
// ALL of: the selected product, a limit:100 catalog fetch, and the
// full category tree (`isLoading = productLoading || productsLoading
// || categoriesLoading`). The selected product is the only hard
// dependency; the catalog and categories may stream in behind it.
// Guests were silently bounced to /shop on add-to-cart and the
// synthetic intro product could reach the cart API.
// API layer is mocked only; NativeARView is stubbed and captures props.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const hoisted = vi.hoisted(() => ({ arProps: null }));

vi.mock("../../../src/api/productApi.js", () => ({
  default: { getAll: vi.fn(), getById: vi.fn(), getFeatured: vi.fn(), getNewArrivals: vi.fn(), getRelated: vi.fn() },
}));
vi.mock("../../../src/api/categoryApi.js", () => ({
  default: { getAll: vi.fn(), getTree: vi.fn(), getById: vi.fn(), getProducts: vi.fn() },
}));
vi.mock("../../../src/api/cartApi.js", () => ({
  default: { addToCart: vi.fn(), getCart: vi.fn(), updateCartItem: vi.fn(), removeFromCart: vi.fn(), clearCart: vi.fn() },
}));
vi.mock("../../../src/components/ar/NativeARView.jsx", () => ({
  default: (props) => {
    hoisted.arProps = props;
    return <div data-testid="ar-view">{props.selectedProduct?.slug || "none"}</div>;
  },
}));

import productApi from "../../../src/api/productApi.js";
import categoryApi from "../../../src/api/categoryApi.js";
import cartApi from "../../../src/api/cartApi.js";
import ARViewPage from "../../../src/pages/shop/ARViewPage.jsx";
import useAuthStore from "../../../src/store/authStore.js";
import useGuestCartStore from "../../../src/store/guestCartStore.js";

const linked = {
  _id: "p-linked",
  slug: "linked-chair",
  name: "Linked Chair",
  price: 5000,
  modelUrl: "/models/linked.glb",
  images: [],
};
const other = {
  _id: "p-other",
  slug: "other-table",
  name: "Other Table",
  price: 7000,
  modelUrl: "/models/other.glb",
  images: [],
};

function renderPage(entry) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/ar/:productSlug" element={<ARViewPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  hoisted.arProps = null;
  useAuthStore.setState({ isAuthenticated: false, user: null });
  useGuestCartStore.setState({ items: [] });
  categoryApi.getAll.mockResolvedValue({ data: { categories: [] } });
  productApi.getAll.mockResolvedValue({
    data: { products: [other], pagination: { page: 1, limit: 100, total: 1, pages: 1 } },
  });
  productApi.getById.mockResolvedValue({ data: { product: linked } });
  cartApi.addToCart.mockResolvedValue({ data: {} });
});

describe("ARViewPage entry (FE-30)", () => {
  it("renders AR as soon as the linked product loads — catalog and categories may still be pending", async () => {
    productApi.getAll.mockReturnValue(new Promise(() => {}));
    categoryApi.getAll.mockReturnValue(new Promise(() => {}));
    renderPage("/ar/linked-chair");
    await waitFor(() => expect(screen.getByTestId("ar-view")).toHaveTextContent("linked-chair"));
    expect(hoisted.arProps.isLoading).toBe(false);
    expect(hoisted.arProps.selectedProduct._id).toBe("p-linked");
  });

  it("the selected product leads the catalog list once the catalog arrives", async () => {
    renderPage("/ar/linked-chair");
    await waitFor(() => expect(hoisted.arProps.products).toHaveLength(2));
    expect(hoisted.arProps.products[0]._id).toBe("p-linked");
    expect(hoisted.arProps.products[1]._id).toBe("p-other");
  });

  it("a missing product still shows the honest Not Found state", async () => {
    productApi.getById.mockRejectedValue(new Error("404"));
    renderPage("/ar/does-not-exist");
    await waitFor(() => expect(screen.getByText("Product Not Found")).toBeInTheDocument());
    expect(screen.queryByTestId("ar-view")).not.toBeInTheDocument();
  });
});

describe("ARViewPage add-to-cart (FE-30)", () => {
  it("a guest adds via the guest cart instead of being silently bounced to /shop", async () => {
    renderPage("/ar/linked-chair");
    await waitFor(() => expect(hoisted.arProps.selectedProduct?._id).toBe("p-linked"));
    act(() => {
      hoisted.arProps.onAddToCart(linked);
    });
    expect(useGuestCartStore.getState().items).toHaveLength(1);
    expect(useGuestCartStore.getState().items[0].product._id).toBe("p-linked");
    expect(cartApi.addToCart).not.toHaveBeenCalled();
  });

  it("pen: the synthetic intro product can never be submitted to either cart", async () => {
    useAuthStore.setState({ isAuthenticated: true, user: { _id: "u-1" } });
    renderPage("/ar/intro");
    await waitFor(() => expect(screen.getByTestId("ar-view")).toHaveTextContent("intro"));
    const intro = hoisted.arProps.products.find((p) => p._id === "intro");
    act(() => {
      hoisted.arProps.onAddToCart(intro);
    });
    expect(useGuestCartStore.getState().items).toHaveLength(0);
    expect(cartApi.addToCart).not.toHaveBeenCalled();
  });

  it("pen: an authenticated double-tap submits exactly one cart mutation", async () => {
    useAuthStore.setState({ isAuthenticated: true, user: { _id: "u-1" } });
    cartApi.addToCart.mockReturnValue(new Promise(() => {}));
    renderPage("/ar/linked-chair");
    await waitFor(() => expect(hoisted.arProps.selectedProduct?._id).toBe("p-linked"));
    act(() => {
      hoisted.arProps.onAddToCart(linked);
      hoisted.arProps.onAddToCart(linked);
      hoisted.arProps.onAddToCart(linked);
    });
    await waitFor(() => expect(cartApi.addToCart).toHaveBeenCalled());
    // Let any duplicate mutations dispatch, then assert exactly one went out.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(cartApi.addToCart).toHaveBeenCalledTimes(1);
    expect(cartApi.addToCart).toHaveBeenCalledWith({ productId: "p-linked", quantity: 1 });
  });
});
