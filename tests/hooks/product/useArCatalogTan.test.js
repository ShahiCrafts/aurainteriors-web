// FE-30 — useArCatalogProducts walks every server page of the
// product list (the server caps limit at 100) instead of silently
// truncating the AR picker catalog at the first page, and a response
// without pagination metadata resolves as a single page.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("../../../src/api/productApi.js", () => ({
  default: { getAll: vi.fn() },
}));

import productApi from "../../../src/api/productApi.js";
import { useArCatalogProducts } from "../../../src/hooks/product/useArCatalogTan.js";

function wrapper({ children }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  productApi.getAll.mockReset();
});

describe("useArCatalogProducts (FE-30)", () => {
  it("walks all pages and merges them in order", async () => {
    productApi.getAll.mockImplementation(({ page }) =>
      Promise.resolve({
        data: {
          products: page === 2 ? [{ _id: "c" }] : [{ _id: "a" }, { _id: "b" }],
          pagination: { page, limit: 100, total: 3, pages: 2 },
        },
      })
    );
    const { result } = renderHook(() => useArCatalogProducts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.data.products.map((p) => p._id)).toEqual(["a", "b", "c"]);
    expect(productApi.getAll).toHaveBeenCalledTimes(2);
    expect(productApi.getAll).toHaveBeenNthCalledWith(1, { limit: 100, status: "active", page: 1 });
    expect(productApi.getAll).toHaveBeenNthCalledWith(2, { limit: 100, status: "active", page: 2 });
  });

  it("a response without pagination metadata is treated as a single page", async () => {
    productApi.getAll.mockResolvedValue({ data: { products: [{ _id: "only" }] } });
    const { result } = renderHook(() => useArCatalogProducts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.data.products).toHaveLength(1);
    expect(productApi.getAll).toHaveBeenCalledTimes(1);
  });

  it("pen: a later page failing fails the catalog query instead of silently truncating it", async () => {
    productApi.getAll.mockImplementation(({ page }) =>
      page === 2
        ? Promise.reject(new Error("page 2 boom"))
        : Promise.resolve({
            data: { products: [{ _id: "a" }], pagination: { page: 1, limit: 100, total: 3, pages: 2 } },
          })
    );
    const { result } = renderHook(() => useArCatalogProducts(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
