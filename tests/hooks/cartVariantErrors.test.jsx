// Phase 7 (catalog) — cart error surfacing: a variant conflict
// (409 with a VARIANT_* code / variant message) must reach the
// shopper as the server's specific message, NOT the AR-26
// "cart changed, refreshed" handling; a non-variant 409 keeps
// the AR-26 behaviour exactly (pinned by
// tests/hooks/mutationErrorPolicy.fe47.test.jsx for the generic
// case — this file pins the variant carve-out).
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
import { useAddToCart } from "../../src/hooks/cart/useCartTan.js";

function wrapper({ children }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const serverError = (status, data) => ({ response: { status, data } });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("cart variant error surfacing (Phase 7)", () => {
  it("a 409 with a VARIANT_ code surfaces the server's message", async () => {
    cartApi.addToCart.mockRejectedValue(
      serverError(409, {
        code: "VARIANT_UNAVAILABLE",
        message: "This variant is unavailable",
      }),
    );
    const { result } = renderHook(() => useAddToCart(), { wrapper });
    await act(async () => {
      await result.current
        .mutateAsync({
          productId: "p1",
          quantity: 1,
          variant: {},
          variantId: "v1",
        })
        .catch(() => {});
    });
    expect(toastMock.error).toHaveBeenCalledWith("This variant is unavailable");
    expect(toastMock.error).not.toHaveBeenCalledWith("cart changed, refreshed");
  });

  it("a 409 variant message without a code (production body) still surfaces specifically", async () => {
    cartApi.addToCart.mockRejectedValue(
      serverError(409, { message: "This variant is out of stock" }),
    );
    const { result } = renderHook(() => useAddToCart(), { wrapper });
    await act(async () => {
      await result.current
        .mutateAsync({
          productId: "p1",
          quantity: 1,
          variant: {},
          variantId: "v1",
        })
        .catch(() => {});
    });
    expect(toastMock.error).toHaveBeenCalledWith(
      "This variant is out of stock",
    );
    expect(toastMock.error).not.toHaveBeenCalledWith("cart changed, refreshed");
  });

  it("a non-variant 409 keeps the AR-26 refreshed handling", async () => {
    cartApi.addToCart.mockRejectedValue(
      serverError(409, { message: "Cart conflict" }),
    );
    const { result } = renderHook(() => useAddToCart(), { wrapper });
    await act(async () => {
      await result.current
        .mutateAsync({ productId: "p1", quantity: 1, variant: {} })
        .catch(() => {});
    });
    expect(toastMock.error).toHaveBeenCalledWith("cart changed, refreshed");
  });

  it("a 400 VARIANT_REQUIRED surfaces its message, not a generic toast", async () => {
    cartApi.addToCart.mockRejectedValue(
      serverError(400, {
        code: "VARIANT_REQUIRED",
        message: "Please choose a variant",
      }),
    );
    const { result } = renderHook(() => useAddToCart(), { wrapper });
    await act(async () => {
      await result.current
        .mutateAsync({ productId: "p1", quantity: 1, variant: {} })
        .catch(() => {});
    });
    expect(toastMock.error).toHaveBeenCalledWith("Please choose a variant");
  });
});
