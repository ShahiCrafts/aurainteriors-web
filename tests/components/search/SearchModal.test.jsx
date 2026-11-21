import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SearchModal from "../../../src/components/search/SearchModal";

const sofaProduct = {
  _id: "p1",
  slug: "aranya-textured-sofa-throw-in-rust",
  name: "Aranya Textured Sofa Throw in Rust",
  price: 5799,
  category: { name: "Textured Sofa Throws" },
  rating: { average: 4.8, count: 124 },
  images: [],
};

const categories = [
  {
    _id: "c1",
    slug: "sofas-seating",
    name: "Sofas & Seating",
    productCount: 42,
    subcategories: [],
  },
  {
    _id: "c2",
    slug: "beds",
    name: "Beds",
    productCount: 30,
    subcategories: [],
  },
];

vi.mock("../../../src/hooks/product/useProductTan", () => ({
  useProducts: (params) => {
    if (params && typeof params.search === "string" && params.search) {
      return { data: { data: { products: [sofaProduct] } }, isLoading: false };
    }
    return { data: { data: { products: [sofaProduct] } }, isLoading: false };
  },
}));

vi.mock("../../../src/hooks/product/useCategoryTan", () => ({
  useCategoryTree: () => ({ data: { data: { categories } } }),
}));

const renderModal = (onClose = vi.fn()) => {
  render(
    <MemoryRouter>
      <SearchModal onClose={onClose} />
    </MemoryRouter>,
  );
  return onClose;
};

describe("SearchModal", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("opens with featured products, category suggestions and an empty recent history", () => {
    renderModal();
    expect(
      screen.getByPlaceholderText(/Search furniture/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Featured Products")).toBeInTheDocument();
    expect(
      screen.getByText("Aranya Textured Sofa Throw in Rust"),
    ).toBeInTheDocument();
    expect(screen.getByText("NPR 5,799")).toBeInTheDocument();
    expect(screen.getByText("4.8")).toBeInTheDocument();
    expect(screen.getByText("(124 Reviews)")).toBeInTheDocument();
    expect(screen.getAllByText("Sofas & Seating").length).toBeGreaterThan(0);
    expect(screen.getByText("No recent searches yet")).toBeInTheDocument();
  });

  it("searches live as you type and shows product and category tabs with counts", async () => {
    renderModal();
    fireEvent.change(screen.getByPlaceholderText(/Search furniture/i), {
      target: { value: "sofa" },
    });
    await waitFor(
      () => expect(screen.getByText("Products (1)")).toBeInTheDocument(),
      { timeout: 2000 },
    );
    expect(screen.getByText("Categories (1)")).toBeInTheDocument();
    expect(screen.getByText(/See all results for/)).toBeInTheDocument();
  });

  it("clicking a result navigates away, closes and saves the search to history", async () => {
    const onClose = renderModal();
    fireEvent.change(screen.getByPlaceholderText(/Search furniture/i), {
      target: { value: "sofa" },
    });
    await waitFor(
      () => expect(screen.getByText("Products (1)")).toBeInTheDocument(),
      { timeout: 2000 },
    );
    const row = await screen.findByText(
      "Aranya Textured Sofa Throw in Rust",
      {},
      { timeout: 2000 },
    );
    fireEvent.click(row.closest("button"));
    expect(onClose).toHaveBeenCalled();
    expect(window.localStorage.getItem("aura.recentSearches")).toContain(
      "sofa",
    );
  });

  it("clear history empties saved searches", async () => {
    window.localStorage.setItem(
      "aura.recentSearches",
      JSON.stringify(["Dining Table"]),
    );
    renderModal();
    expect(screen.getByText("Dining Table")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Clear History"));
    expect(screen.queryByText("Dining Table")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("aura.recentSearches")).toBeNull();
  });
});
