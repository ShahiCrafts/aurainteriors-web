// FE-47 — mutation error policy.
//
// Before: no QueryClient default mutation onError existed and almost
// no hook defined onError, so a failed mutation (including the cart
// 409 the server's AR-26 can return) presented as "nothing happened".
//
// Now (src/lib/queryClient.js): a default mutation onError toasts
// formatError(error) — the server's message when present, a mapped /
// generic message otherwise. Opt-out convention: a mutation that
// handles its own error sets meta: { suppressGlobalErrorToast: true }
// (hook-level onError also overrides the default, per React Query's
// option merging). Cart mutations own their errors in the hook: a 409
// invalidates the cart queries and toasts exactly
// "cart changed, refreshed".
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from "@tanstack/react-query";

// One shared toast mock registered for both module ids that resolve
// to the app's toast singleton: src/lib/toast.js (imported directly by
// queryClient.js) and "../../src/lib/toast.js" (the Vite alias used by hooks).
const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
}));
vi.mock("../../src/lib/toast.js", () => ({ toast: toastMock }));
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

import { queryClient as sharedQueryClient } from "../../src/lib/queryClient.js";
import cartApi from "../../src/api/cartApi.js";
import {
  useAddToCart,
  useUpdateCartItem,
} from "../../src/hooks/cart/useCartTan.js";

const toast = { error: toastMock.error, success: toastMock.success };
const allErrorCalls = () => toastMock.error.mock.calls;

function sharedWrapper({ children }) {
  return (
    <QueryClientProvider client={sharedQueryClient}>
      {children}
    </QueryClientProvider>
  );
}

function freshWrapper(client) {
  return function Wrapper({ children }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

const serverError = (status, message) => ({
  response: { status, data: message ? { message } : {} },
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FE-47 global mutation onError (shared QueryClient defaults)", () => {
  it("a mutation with no local handler toasts the server's message", async () => {
    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn: () =>
            Promise.reject(serverError(500, "Boom from server")),
        }),
      { wrapper: sharedWrapper },
    );
    await act(async () => {
      await result.current.mutateAsync({}).catch(() => {});
    });
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("Boom from server");
  });

  it("with no server message it toasts a generic mapped message, not silence", async () => {
    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn: () => Promise.reject(serverError(500)),
        }),
      { wrapper: sharedWrapper },
    );
    await act(async () => {
      await result.current.mutateAsync({}).catch(() => {});
    });
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error.mock.calls[0][0]).toMatch(/trouble|try again/i);
  });

  it("meta { suppressGlobalErrorToast: true } opts out of the global toast", async () => {
    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn: () =>
            Promise.reject(serverError(500, "Boom from server")),
          meta: { suppressGlobalErrorToast: true },
        }),
      { wrapper: sharedWrapper },
    );
    await act(async () => {
      await result.current.mutateAsync({}).catch(() => {});
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("a hook-level onError is not double-toasted by the global default", async () => {
    const localOnError = vi.fn();
    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn: () =>
            Promise.reject(serverError(500, "Boom from server")),
          onError: localOnError,
        }),
      { wrapper: sharedWrapper },
    );
    await act(async () => {
      await result.current.mutateAsync({}).catch(() => {});
    });
    expect(localOnError).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe("FE-47 cart mutations", () => {
  function makeClient() {
    return new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  }

  it("409 → cart queries invalidated + toast exactly 'cart changed, refreshed'", async () => {
    cartApi.addToCart.mockRejectedValue(serverError(409, "Cart conflict"));
    const client = makeClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useAddToCart(), {
      wrapper: freshWrapper(client),
    });
    await act(async () => {
      await result.current
        .mutateAsync({ productId: "p1", quantity: 1 })
        .catch(() => {});
    });
    await waitFor(() => expect(allErrorCalls().length).toBeGreaterThan(0));
    const messages = allErrorCalls().map((c) => c[0]);
    expect(messages).toEqual(["cart changed, refreshed"]);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["cart"] });
  });

  it("409 on update behaves the same", async () => {
    cartApi.updateCartItem.mockRejectedValue(serverError(409, "Cart conflict"));
    const client = makeClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useUpdateCartItem(), {
      wrapper: freshWrapper(client),
    });
    await act(async () => {
      await result.current
        .mutateAsync({ itemId: "i1", quantity: 2 })
        .catch(() => {});
    });
    await waitFor(() => expect(allErrorCalls().length).toBeGreaterThan(0));
    expect(allErrorCalls().map((c) => c[0])).toEqual([
      "cart changed, refreshed",
    ]);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["cart"] });
  });

  it("success → no error toast (invalidation still happens via onSuccess)", async () => {
    cartApi.addToCart.mockResolvedValue({ success: true });
    const client = makeClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useAddToCart(), {
      wrapper: freshWrapper(client),
    });
    await act(async () => {
      await result.current.mutateAsync({ productId: "p1", quantity: 1 });
    });
    expect(allErrorCalls()).toEqual([]);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["cart"] });
  });

  it("non-409 failure → one honest toast with the server message", async () => {
    cartApi.addToCart.mockRejectedValue(serverError(500, "Cart service down"));
    const client = makeClient();
    const { result } = renderHook(() => useAddToCart(), {
      wrapper: freshWrapper(client),
    });
    await act(async () => {
      await result.current
        .mutateAsync({ productId: "p1", quantity: 1 })
        .catch(() => {});
    });
    await waitFor(() => expect(allErrorCalls().length).toBeGreaterThan(0));
    expect(allErrorCalls().map((c) => c[0])).toEqual(["Cart service down"]);
  });
});
