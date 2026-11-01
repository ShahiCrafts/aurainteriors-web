// Cart perceived-speed fix: mutations update the cached cart in
// onMutate (badge/drawer/totals move with the click), write the
// server's full-cart response into the cache on success WITHOUT a
// refetch, and roll the cache back verbatim on error.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const toastMock = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("../../src/lib/toast.js", () => ({ toast: toastMock }));

vi.mock("../../src/api/cartApi.js", () => ({
  default: {
    getCart: vi.fn(),
    addToCart: vi.fn(),
    updateCartItem: vi.fn(),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
  },
}));

import cartApi from "../../src/api/cartApi.js";
import {
  useAddToCart,
  useRemoveFromCart,
} from "../../src/hooks/cart/useCartTan.js";
import useAuthStore from "../../src/store/authStore.js";
import { cartKeys } from "../../src/hooks/queryKeys.js";

const USER_ID = "user-1";
const product = { _id: "p1", name: "Sofa", price: 1000, images: [] };
const line = {
  _id: "line-1",
  product,
  quantity: 2,
  variant: {},
  addedAt: "2026-01-01T00:00:00.000Z",
};
const cartResponse = (items) => ({
  success: true,
  data: {
    cart: {
      _id: "cart-1",
      items,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      ),
    },
  },
});

let queryClient;
function wrapper({ children }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const cachedCart = () =>
  queryClient.getQueryData(cartKeys.list(USER_ID))?.data?.cart;

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  useAuthStore.setState({ user: { _id: USER_ID }, isAuthenticated: true });
  queryClient.setQueryData(cartKeys.list(USER_ID), cartResponse([line]));
});

describe("cart optimistic mutations", () => {
  it("add merges into the existing line instantly, then the server cart replaces the cache without a refetch", async () => {
    let resolveAdd;
    cartApi.addToCart.mockImplementation(
      () => new Promise((resolve) => (resolveAdd = resolve)),
    );
    const { result } = renderHook(() => useAddToCart(), { wrapper });
    let mutation;
    await act(async () => {
      mutation = result.current.mutateAsync({
        productId: "p1",
        quantity: 1,
        variant: {},
        product,
      });
    });
    // Optimistic: quantity and totals already moved before the
    // server answered.
    expect(cachedCart().items[0].quantity).toBe(3);
    expect(cachedCart().totalItems).toBe(3);
    expect(cachedCart().subtotal).toBe(3000);
    const serverCart = cartResponse([{ ...line, quantity: 3 }]);
    await act(async () => {
      resolveAdd(serverCart);
      await mutation;
    });
    expect(cachedCart()).toEqual(serverCart.data.cart);
    expect(cartApi.getCart).not.toHaveBeenCalled();
  });

  it("add appends a new optimistic line from the product snapshot", async () => {
    cartApi.addToCart.mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useAddToCart(), { wrapper });
    await act(async () => {
      result.current.mutate({
        productId: "p2",
        quantity: 1,
        variant: {},
        product: { _id: "p2", name: "Lamp", price: 500, images: [] },
      });
    });
    expect(cachedCart().items).toHaveLength(2);
    expect(cachedCart().items[1].product.name).toBe("Lamp");
    expect(cachedCart().items[1].optimistic).toBe(true);
    expect(cachedCart().totalItems).toBe(3);
    expect(cachedCart().subtotal).toBe(2500);
  });

  it("remove drops the line instantly and restores it verbatim on error", async () => {
    cartApi.removeFromCart.mockRejectedValue({
      response: { status: 500, data: { message: "boom" } },
    });
    const { result } = renderHook(() => useRemoveFromCart(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync("line-1").catch(() => {});
    });
    expect(cachedCart().items).toEqual([line]);
    expect(cachedCart().totalItems).toBe(2);
    expect(toastMock.error).toHaveBeenCalled();
  });
});
