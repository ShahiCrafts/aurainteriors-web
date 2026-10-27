// Category filters are URL-owned and all listing requests use productApi.getAll.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../../../src/api/index.js", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
    post: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
    patch: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
    delete: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
  },
}));

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

vi.mock("../../../src/layouts/customer/Navbar.jsx", () => ({
  default: () => null,
}));
vi.mock("../../../src/layouts/customer/Footer.jsx", () => ({
  default: () => null,
}));
vi.mock("../../../src/components/navigation/CategoryBar.jsx", () => ({
  default: () => null,
}));
vi.mock("../../../src/components/shop/ProductCard.jsx", () => ({
  default: ({ product }) => <div>{product.name}</div>,
}));
vi.mock("../../../src/components/shop/FilterSidebar.jsx", () => ({
  default: ({ selectedCategories, onCategoryChange, onResetFilters }) => (
    <div>
      {["living-room", "bedroom"].map((slug) => <label key={slug}>
        <input type="checkbox" aria-label={`Filter ${slug}`} checked={selectedCategories.includes(slug)} onChange={() => onCategoryChange(selectedCategories.includes(slug) ? selectedCategories.filter((value) => value !== slug) : [...selectedCategories, slug])} />{slug}
      </label>)}
      <button onClick={onResetFilters}>reset-sidebar</button>
    </div>
  ),
}));
vi.mock("../../../src/components/shop/FilterSidebarSkeleton.jsx", () => ({
  default: () => null,
}));
vi.mock("../../../src/components/shop/ProductLoadingSkeletons.jsx", () => ({
  ListingCardSkeleton: () => null,
}));

import productApi from "../../../src/api/productApi.js";
import categoryApi from "../../../src/api/categoryApi.js";
import ShopPage from "../../../src/pages/shop/ShopPage.jsx";
import LegacyShopCategoryRedirect from "../../../src/components/navigation/LegacyShopCategoryRedirect";

const ALL_PRODUCTS = [
  { _id: "all-1", name: "All Products Chair" },
  { _id: "all-2", name: "All Products Table" },
];
const CATEGORY_PRODUCTS = [{ _id: "cat-1", name: "Sofa Category Product" }];

function body(products) {
  return {
    data: {
      products,
      pagination: { page: 1, limit: 12, total: products.length, pages: 1 },
    },
  };
}

function NavHarness() {
  const navigate = useNavigate();
  return (
    <div>
      <button onClick={() => navigate("/shop?categories=sofas")}>go-sofas</button>
      <button onClick={() => navigate("/shop?categories=living-room")}>go-living</button>
      <button onClick={() => navigate("/shop?categories=bedroom")}>go-bedroom</button>
      <button onClick={() => navigate(-1)}>go-back</button>
      <button onClick={() => navigate(1)}>go-forward</button>
      <button onClick={() => navigate("/shop")}>go-shop</button>
      <button onClick={() => navigate("/shop?search=oak%20table")}>navbar-search</button>
    </div>
  );
}

// FE-62: exposes the live URL query string so tests can assert the
// ?search= param appears/disappears with the page's search state.
function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-search">{location.search}</div>;
}

// Mirrors src/App.jsx: both shop routes render the same ShopPage
// component (without the CustomerRoute/Suspense wrappers, which do not
// affect hook identity in the page itself). QueryClient defaults mirror
// src/main.jsx (5-minute staleTime).
let activeQueryClient;

function renderShop(initialPath = "/shop") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 5 * 60 * 1000 },
      mutations: { retry: false },
    },
  });
  activeQueryClient = queryClient;
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <NavHarness />
        <LocationProbe />
        <Routes>
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/:categorySlug" element={<LegacyShopCategoryRedirect />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

let consoleErrorSpy;

beforeEach(() => {
  productApi.getAll.mockImplementation((params) => Promise.resolve(body(params.categories ? CATEGORY_PRODUCTS : ALL_PRODUCTS)));
  categoryApi.getProducts.mockResolvedValue(body(CATEGORY_PRODUCTS));
  categoryApi.getTree.mockResolvedValue({ data: { categories: [{name:"Living Room",slug:"living-room"},{name:"Bedroom",slug:"bedroom"}] } });
  categoryApi.getAll.mockResolvedValue({ data: { categories: [] } });
  categoryApi.getById.mockResolvedValue({
    data: { category: { name: "Sofas", slug: "sofas", parent: null } },
  });
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe("Canonical query category filtering", () => {
  it("uses the public products listing without a category endpoint", async () => {
    renderShop("/shop?categories=living-room");
    expect(await screen.findByText("Sofa Category Product")).toBeInTheDocument();
    expect(productApi.getAll).toHaveBeenCalledWith(expect.objectContaining({categories:"living-room"}));
    expect(categoryApi.getProducts).not.toHaveBeenCalled();
    expect(categoryApi.getById).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Filter living-room")).toBeChecked();
  });
  it("redirects legacy category paths while preserving the other query filters", async () => {
    renderShop("/shop/living-room?search=sofa&sort=price_low&categories=bedroom");
    expect(await screen.findByText("Sofa Category Product")).toBeInTheDocument();
    expect(productApi.getAll).toHaveBeenCalledWith(expect.objectContaining({categories:"living-room", search:"sofa", sort:"price"}));
    expect(screen.getByTestId("location-search")).toHaveTextContent("categories=living-room");
    expect(categoryApi.getProducts).not.toHaveBeenCalled();
  });
  it("updates the same mounted page when query navigation selects another category", async () => {
    renderShop("/shop?categories=living-room");
    expect(await screen.findByText("Sofa Category Product")).toBeInTheDocument();
    fireEvent.click(screen.getByText("go-bedroom"));
    await waitFor(()=>expect(productApi.getAll).toHaveBeenCalledWith(expect.objectContaining({categories:"bedroom"})));
    expect(await screen.findByLabelText("Filter bedroom")).toBeChecked();
    expect(screen.getByLabelText("Filter living-room")).not.toBeChecked();
  });
  it("back and forward restore category selections from the URL", async () => {
    renderShop("/shop?categories=living-room");
    expect(await screen.findByText("Sofa Category Product")).toBeInTheDocument();
    fireEvent.click(screen.getByText("go-bedroom"));
    await waitFor(()=>expect(screen.getByLabelText("Filter bedroom")).toBeChecked());
    fireEvent.click(screen.getByText("go-back"));
    await waitFor(()=>expect(screen.getByLabelText("Filter living-room")).toBeChecked());
    expect(screen.getByLabelText("Filter bedroom")).not.toBeChecked();
    fireEvent.click(screen.getByText("go-forward"));
    await waitFor(()=>expect(screen.getByLabelText("Filter bedroom")).toBeChecked());
  });
  it("checkboxes support multiple query categories and reset in one update", async () => {
    renderShop("/shop?categories=living-room&search=sofa");
    expect(await screen.findByText("Sofa Category Product")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Filter bedroom"));
    await waitFor(()=>expect(productApi.getAll).toHaveBeenCalledWith(expect.objectContaining({categories:"living-room,bedroom",search:"sofa"})));
    fireEvent.click(await screen.findByText("reset-sidebar"));
    await waitFor(()=>expect(screen.getByTestId("location-search")).toHaveTextContent(/^$/));
    expect(await screen.findByText("All Products Chair")).toBeInTheDocument();
  });
  it("switching back to the unfiltered collection clears category state", async () => {
    renderShop("/shop?categories=living-room");
    expect(await screen.findByText("Sofa Category Product")).toBeInTheDocument();
    fireEvent.click(screen.getByText("go-shop"));
    expect(await screen.findByText("All Products Chair")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter living-room")).not.toBeChecked();
    const last=productApi.getAll.mock.calls.at(-1)[0];
    expect(last).not.toHaveProperty("categories");
  });
});

describe("FE-62: ShopPage search state is visible and clearable", () => {
  it("arriving with ?search= shows a results label without a duplicate search input", async () => {
    renderShop("/shop?search=velvet%20sofa");
    expect(await screen.findByText("All Products Chair")).toBeInTheDocument();

    // The term that arrived via the URL (e.g. from the navbar search)
    // is visible in the results label without duplicating the navbar input.
    expect(screen.queryByLabelText("Search products")).not.toBeInTheDocument();
    expect(screen.getByText("“velvet sofa”")).toBeInTheDocument();
    expect(screen.getByTestId("location-search")).toHaveTextContent(
      "search=velvet"
    );

    // …and it is the term the products query actually filtered by.
    expect(productApi.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ search: "velvet sofa" })
    );
  });

  it("clearing the search removes the ?search= param and the filtering", async () => {
    renderShop("/shop?search=velvet%20sofa");
    expect(await screen.findByText("All Products Chair")).toBeInTheDocument();
    expect(productApi.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ search: "velvet sofa" })
    );
    const callsBefore = productApi.getAll.mock.calls.length;

    fireEvent.click(screen.getByLabelText("Clear search"));

    // The duplicate input stays absent and the param is removed.
    expect(screen.queryByLabelText("Search products")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId("location-search")).not.toHaveTextContent(
        "search="
      )
    );

    // A fresh products query runs WITHOUT any search term.
    await waitFor(() =>
      expect(productApi.getAll.mock.calls.length).toBeGreaterThan(callsBefore)
    );
    const lastParams =
      productApi.getAll.mock.calls[productApi.getAll.mock.calls.length - 1][0];
    expect(lastParams).not.toHaveProperty("search");
  });

  it("navbar search navigation updates the existing listing query", async () => {
    renderShop("/shop");
    expect(await screen.findByText("All Products Chair")).toBeInTheDocument();

    fireEvent.click(screen.getByText("navbar-search"));

    await waitFor(() =>
      expect(screen.getByTestId("location-search")).toHaveTextContent(
        "search=oak"
      )
    );
    await waitFor(() =>
      expect(productApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: "oak table" })
      )
    );
  });
});
