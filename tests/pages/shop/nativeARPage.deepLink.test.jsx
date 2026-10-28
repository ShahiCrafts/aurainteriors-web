// FE-30 — NativeARPage deep links.
//
// Before the fix, the selection effect depended on `allArProducts`,
// an array rebuilt on every render, and it ran BEFORE the product
// query resolved: with only the synthetic intro product present it
// selected the intro, and the `!selectedProduct` guard then blocked
// the real ?select= target forever. The page also blocked AR on a
// limit:100 product fetch (the server caps limit at 100, so the
// catalog picker silently truncated) plus the category tree, guests
// tapping add-to-cart were silently bounced to /shop, and the
// synthetic intro product could be submitted to the cart API.
//
// These tests mock at the API layer only; the real hooks, the real
// auth/guest-cart stores and the real page execute. NativeARView is
// stubbed (capacitor-arcore cannot run in jsdom) and captures props.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const hoisted = vi.hoisted(() => ({ arProps: null }));

vi.mock("../../../src/api/productApi.js", () => ({
  default: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getFeatured: vi.fn(),
    getNewArrivals: vi.fn(),
    getRelated: vi.fn(),
  },
}));
vi.mock("../../../src/api/categoryApi.js", () => ({
  default: {
    getAll: vi.fn(),
    getTree: vi.fn(),
    getById: vi.fn(),
    getProducts: vi.fn(),
  },
}));
vi.mock("../../../src/api/cartApi.js", () => ({
  default: {
    addToCart: vi.fn(),
    getCart: vi.fn(),
    updateCartItem: vi.fn(),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
  },
}));
vi.mock("../../../src/components/ar/NativeARView.jsx", () => ({
  default: (props) => {
    hoisted.arProps = props;
    return (
      <div data-testid="ar-view">{props.selectedProduct?.slug || "none"}</div>
    );
  },
}));

import productApi from "../../../src/api/productApi.js";
import categoryApi from "../../../src/api/categoryApi.js";
import cartApi from "../../../src/api/cartApi.js";
import NativeARPage from "../../../src/pages/shop/NativeARPage.jsx";
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
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/native-ar" element={<NativeARPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  hoisted.arProps = null;
  useAuthStore.setState({ isAuthenticated: false, user: null });
  useGuestCartStore.setState({ items: [] });
  categoryApi.getAll.mockResolvedValue({ data: { categories: [] } });
  productApi.getAll.mockResolvedValue({
    data: {
      products: [other],
      pagination: { page: 1, limit: 100, total: 1, pages: 1 },
    },
  });
  productApi.getById.mockResolvedValue({ data: { product: linked } });
  cartApi.addToCart.mockResolvedValue({ data: {} });
});

describe("NativeARPage deep links (FE-30)", () => {
  it("?select=<slug> selects the linked product, not the intro sofa", async () => {
    renderPage("/native-ar?select=linked-chair");
    await waitFor(() =>
      expect(screen.getByTestId("ar-view")).toHaveTextContent("linked-chair"),
    );
    expect(hoisted.arProps.selectedProduct._id).toBe("p-linked");
  });

  it("the linked product is selected even while the catalog fetch is still pending", async () => {
    productApi.getAll.mockReturnValue(new Promise(() => {}));
    renderPage("/native-ar?select=linked-chair");
    await waitFor(() =>
      expect(screen.getByTestId("ar-view")).toHaveTextContent("linked-chair"),
    );
    expect(hoisted.arProps.isLoading).toBe(false);
  });

  it("with no ?select=, the intro product is selected immediately without waiting for the catalog", async () => {
    productApi.getAll.mockReturnValue(new Promise(() => {}));
    renderPage("/native-ar");
    await waitFor(() =>
      expect(screen.getByTestId("ar-view")).toHaveTextContent("intro"),
    );
    expect(hoisted.arProps.isLoading).toBe(false);
  });

  it("an unknown ?select= falls back to the intro product once the lookup settles", async () => {
    productApi.getById.mockRejectedValue(new Error("404"));
    renderPage("/native-ar?select=does-not-exist");
    await waitFor(() =>
      expect(screen.getByTestId("ar-view")).toHaveTextContent("intro"),
    );
  });

  it("pen: a linked product with no AR model is not selected (falls back to intro)", async () => {
    productApi.getById.mockResolvedValue({
      data: {
        product: {
          ...linked,
          _id: "p-nomodel",
          slug: "linked-chair",
          modelUrl: null,
          modelFiles: [],
        },
      },
    });
    renderPage("/native-ar?select=linked-chair");
    await waitFor(() =>
      expect(screen.getByTestId("ar-view")).toHaveTextContent("intro"),
    );
  });

  it("the picker catalog walks past the server's 100-item page cap (150 products reachable)", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({
      _id: `bulk-${i}`,
      slug: `bulk-${i}`,
      name: `Bulk ${i}`,
      price: 1000,
      modelUrl: `/models/bulk-${i}.glb`,
      images: [],
    }));
    const page2 = Array.from({ length: 50 }, (_, i) => ({
      _id: `bulk-${100 + i}`,
      slug: `bulk-${100 + i}`,
      name: `Bulk ${100 + i}`,
      price: 1000,
      modelUrl: `/models/bulk-${100 + i}.glb`,
      images: [],
    }));
    productApi.getAll.mockImplementation(({ page }) =>
      Promise.resolve({
        data: {
          products: page === 2 ? page2 : page1,
          pagination: { page: page || 1, limit: 100, total: 150, pages: 2 },
        },
      }),
    );
    renderPage("/native-ar");
    await waitFor(() => expect(hoisted.arProps.products).toHaveLength(151)); // intro + 150
    expect(productApi.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 100 }),
    );
  });
});

describe("NativeARPage add-to-cart (FE-30)", () => {
  it("a guest adds via the guest cart instead of being silently bounced to /shop", async () => {
    renderPage("/native-ar?select=linked-chair");
    await waitFor(() =>
      expect(hoisted.arProps.selectedProduct?._id).toBe("p-linked"),
    );
    act(() => {
      hoisted.arProps.onAddToCart(linked);
    });
    expect(useGuestCartStore.getState().items).toHaveLength(1);
    expect(useGuestCartStore.getState().items[0].product._id).toBe("p-linked");
    expect(cartApi.addToCart).not.toHaveBeenCalled();
  });

  it("pen: the synthetic intro product can never be submitted to either cart", async () => {
    useAuthStore.setState({ isAuthenticated: true, user: { _id: "u-1" } });
    renderPage("/native-ar");
    await waitFor(() =>
      expect(hoisted.arProps.selectedProduct?.slug).toBe("intro"),
    );
    const intro = hoisted.arProps.products[0];
    act(() => {
      hoisted.arProps.onAddToCart(intro);
    });
    expect(useGuestCartStore.getState().items).toHaveLength(0);
    expect(cartApi.addToCart).not.toHaveBeenCalled();
  });

  it("pen: an authenticated double-tap submits exactly one cart mutation", async () => {
    useAuthStore.setState({ isAuthenticated: true, user: { _id: "u-1" } });
    cartApi.addToCart.mockReturnValue(new Promise(() => {}));
    renderPage("/native-ar?select=linked-chair");
    await waitFor(() =>
      expect(hoisted.arProps.selectedProduct?._id).toBe("p-linked"),
    );
    act(() => {
      hoisted.arProps.onAddToCart(linked);
      hoisted.arProps.onAddToCart(linked);
      hoisted.arProps.onAddToCart(linked);
    });
    await waitFor(() => expect(cartApi.addToCart).toHaveBeenCalled());
    // Let any duplicate mutations dispatch, then assert exactly one went out.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(cartApi.addToCart).toHaveBeenCalledTimes(1);
    expect(cartApi.addToCart).toHaveBeenCalledWith({
      productId: "p-linked",
      quantity: 1,
    });
  });
});
