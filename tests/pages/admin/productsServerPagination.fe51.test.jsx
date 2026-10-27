import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// FE-51 regression tests for src/pages/admin/Products.jsx.
//
// Pre-fix: the page fetched useProducts({ status: "all", limit: 1000 })
// and did search/category/status filtering, pagination and all four
// stats counts client-side over that array (the server caps limit at
// 100, so the "1000" was silently truncated too). The products API
// already supports page/limit/search/category/status (verified in the
// server tree: product.controller getAllProducts + catalogSort /
// catalogPagination), so the list must be server-driven: the request
// carries the page, page size, search text, category and status, the
// pager reports the server's totals, and the Total/Active stats come
// from server pagination totals — never from a fetched array's length.

const { calls } = vi.hoisted(() => ({ calls: [] }));

const TOTALS = { all: 57, active: 40, out_of_stock: 4 };

vi.mock("../../../src/hooks/product/useProductTan", () => ({
  useProducts: (params = {}) => {
    calls.push(params);
    if (params.limit === 1) {
      // Stats probes: only the server total matters.
      return {
        data: {
          data: {
            products: [],
            pagination: { total: TOTALS[params.status] ?? 0, pages: 1, page: 1, limit: 1 },
          },
        },
        isLoading: false,
      };
    }
    return {
      data: {
        data: {
          products: [
            {
              _id: "p1",
              name: "Server Page Sofa",
              sku: "SKU-1",
              price: 1000,
              originalPrice: null,
              stock: 3,
              status: "active",
              category: { _id: "cat-1", name: "Sofas" },
              images: [{ url: "https://example.com/sofa.jpg" }],
              modelUrl: null,
              modelFiles: [],
            },
          ],
          pagination: {
            total: TOTALS.all,
            pages: Math.ceil(TOTALS.all / (params.limit || 10)),
            page: params.page || 1,
            limit: params.limit || 10,
          },
        },
      },
      isLoading: false,
    };
  },
  useCreateProduct: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateProduct: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteProduct: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../../../src/hooks/product/useCategoryTan", () => ({
  useCategories: () => ({
    data: { data: { categories: [{ _id: "cat-1", name: "Sofas" }] } },
  }),
}));

vi.mock("../../../src/components/fallbacks/ImageWithFallback", () => ({
  default: () => <div>IMG</div>,
}));

vi.mock("../../../src/components/modals/ConfirmationDialog", () => ({
  default: () => null,
}));

vi.mock("../../../src/components/common/Skeleton", () => ({
  default: () => null,
}));

vi.mock("../../../src/lib/toast.js", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

import Products from "../../../src/pages/admin/Products.jsx";

function mainCalls() {
  return calls.filter((c) => c.limit === 10);
}

describe("Admin Products server-side pagination (FE-51)", () => {
  it("requests one server page — never a 1000-product client fetch", () => {
    render(<Products />);

    expect(mainCalls().length).toBeGreaterThan(0);
    expect(mainCalls()[0]).toMatchObject({ page: 1, limit: 10, status: "all" });
    expect(calls.some((c) => c.limit === 1000)).toBe(false);
    expect(screen.getByText("Server Page Sofa")).toBeInTheDocument();
  });

  it("sends the search text to the server and returns to page 1", async () => {
    render(<Products />);

    fireEvent.change(
      screen.getByPlaceholderText(/search products by name/i),
      { target: { value: "Sofa" } }
    );

    await waitFor(() =>
      expect(
        mainCalls().some((c) => c.search === "Sofa" && c.page === 1)
      ).toBe(true)
    );
  });

  it("sends category and status filters to the server", async () => {
    render(<Products />);

    const selects = screen.getAllByRole("combobox");
    // Toolbar order: category, stock, model, status.
    fireEvent.change(selects[0], { target: { value: "cat-1" } });
    await waitFor(() =>
      expect(mainCalls().some((c) => c.category === "cat-1")).toBe(true)
    );

    fireEvent.change(selects[3], { target: { value: "active" } });
    await waitFor(() =>
      expect(
        mainCalls().some((c) => c.category === "cat-1" && c.status === "active")
      ).toBe(true)
    );
  });

  it("reports server totals in the pager and stats, and paginates via the server", async () => {
    render(<Products />);

    // Pager total + Total Catalog / Active Listings come from the
    // server's pagination totals (57 / 40), not from a fetched array.
    expect(screen.getByText(/of 57/)).toBeInTheDocument();
    expect(screen.getByText("57")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "2" }));
    await waitFor(() =>
      expect(mainCalls().some((c) => c.page === 2)).toBe(true)
    );
  });

  it("labels the stock and model filters as page-scoped (no server parameter exists)", () => {
    render(<Products />);

    expect(
      screen.getByRole("option", { name: /in stock \(this page\)/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /has 3d model \(this page\)/i })
    ).toBeInTheDocument();
  });
});
