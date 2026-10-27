// FE-65 / FE-66 — keyboard-operable controls, form labelling, live regions.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../../../src/hooks/product/useCategoryTan", () => ({
  useCategoryTree: () => ({
    data: { data: { categories: [{ _id: "c1", name: "Sofas", slug: "sofas" }] } },
    isLoading: false,
  }),
}));
// FE-38: CategoryBar now consumes useArCatalogProducts (a React Query
// hook) to find a real AR-capable product — mock it the same way the
// FE-38 CategoryBar tests do (tests/components/navigation/
// CategoryBar.fe38.test.jsx): a catalog whose first AR-capable
// product carries a .glb model, so 'Try AR View' renders.
vi.mock("../../../src/hooks/product/useArCatalogTan", () => ({
  useArCatalogProducts: () => ({
    data: {
      data: {
        products: [
          {
            _id: "p-ar",
            slug: "velvet-chair",
            name: "Velvet Chair",
            modelUrl: "https://cdn.aurainteriors.example/models/velvet.glb",
            modelFiles: [
              { format: "glb", url: "https://cdn.aurainteriors.example/models/velvet.glb" },
            ],
          },
        ],
      },
    },
    isLoading: false,
  }),
  default: () => ({ data: { data: { products: [] } }, isLoading: false }),
}));
vi.mock("../../../src/hooks/review/useReviewTan", () => ({
  useCreateReview: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateReview: () => ({ mutate: vi.fn(), isPending: false }),
}));

import CategoryBar from "../../../src/components/navigation/CategoryBar.jsx";
import FilterSidebar from "../../../src/components/shop/FilterSidebar.jsx";
import ReviewForm from "../../../src/components/shop/ReviewForm.jsx";
import ToastItem from "../../../src/components/ui/ToastItem.jsx";
import Pagination from "../../../src/components/common/Pagination.jsx";

const filterProps = {
  categories: [{ _id: "c1", slug: "sofas", name: "Sofas", productCount: 3 }],
  selectedCategories: [],
  onCategoryChange: vi.fn(),
  priceRange: { min: 0, max: 500000 },
  selectedPriceRange: { min: 0, max: 500000 },
  onPriceChange: vi.fn(),
  selectedColors: [],
  onColorChange: vi.fn(),
  selectedMaterials: [],
  onMaterialChange: vi.fn(),
  selectedRating: 0,
  onRatingChange: vi.fn(),
  onResetFilters: vi.fn(),
};

describe("FE-65 primary navigation and custom controls", () => {
  it("CategoryBar categories are real links with hrefs, and AR is a button", () => {
    // The app always mounts CategoryBar under a QueryClientProvider;
    // mirror that here (FE-38 made CategoryBar a React Query consumer).
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CategoryBar />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByRole("link", { name: /Sofas/ })).toHaveAttribute("href", "/shop?categories=sofas");
    // The owner-requested "All" item is a real link too (an earlier
    // pin asserted its absence; the design decision was reversed).
    expect(screen.getByRole("link", { name: /^All$/ })).toHaveAttribute("href", "/shop");
    expect(screen.getByRole("button", { name: /Try AR View/ })).toBeInTheDocument();
  });

  it("FilterSidebar filters are real checkboxes that toggle via change", () => {
    const onCategoryChange = vi.fn();
    render(<FilterSidebar {...filterProps} onCategoryChange={onCategoryChange} />);
    const box = screen.getByRole("checkbox", { name: /Sofas/ });
    fireEvent.click(box);
    expect(onCategoryChange).toHaveBeenCalledWith(["sofas"]);
  });

  it("FilterSidebar price inputs are labelled", () => {
    render(<FilterSidebar {...filterProps} />);
    expect(screen.getByLabelText("Min")).toBeInTheDocument();
    expect(screen.getByLabelText("Max")).toBeInTheDocument();
  });

  it("star rating is a radiogroup: aria-checked follows selection and arrows change it", () => {
    render(<ReviewForm productId="p1" />);
    expect(screen.getByRole("radiogroup", { name: "Rating" })).toBeInTheDocument();
    const three = screen.getByRole("radio", { name: "3 stars" });
    fireEvent.click(three);
    expect(three).toHaveAttribute("aria-checked", "true");
    fireEvent.keyDown(three, { key: "ArrowRight" });
    expect(screen.getByRole("radio", { name: "4 stars" })).toHaveAttribute("aria-checked", "true");
  });
});

describe("FE-66 live regions and icon-button names", () => {
  it("a success toast is a polite status, not an assertive alert", () => {
    render(<ToastItem id={1} type="success" message="Added to cart" onDismiss={vi.fn()} />);
    const toast = screen.getByText("Added to cart").closest("div[role]");
    expect(toast).toHaveAttribute("role", "status");
    expect(toast).toHaveAttribute("aria-live", "polite");
  });

  it("an error toast stays assertive", () => {
    render(<ToastItem id={2} type="error" message="Payment failed" onDismiss={vi.fn()} />);
    const toast = screen.getByText("Payment failed").closest("div[role]");
    expect(toast).toHaveAttribute("role", "alert");
    expect(toast).toHaveAttribute("aria-live", "assertive");
  });

  it("Pagination prev/next buttons have accessible names", () => {
    render(<Pagination page={2} totalPages={5} pageSize={10} totalItems={50} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Previous page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("aria-current", "page");
  });
});
