// Phase 7 (catalog) — the shared listing engine: requests carry
// the Phase 5 contract (facets=1 + attr.* verbatim from the URL),
// facet toggles write the URL grammar exactly, chips remove one
// filter at a time, and the category context renders the record's
// intro + full-ancestor breadcrumbs.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
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

vi.mock("../../../src/components/shop/ProductCard.jsx", () => ({
  default: ({ product }) => <div>{product.name}</div>,
}));

import productApi from "../../../src/api/productApi.js";
import categoryApi from "../../../src/api/categoryApi.js";
import CatalogListing from "../../../src/components/shop/CatalogListing.jsx";

const TREE = [
  {
    _id: "c-living",
    name: "Living Room",
    slug: "living-room",
    productCount: 9,
    subcategories: [
      {
        _id: "c-sofas",
        name: "Sofas",
        slug: "sofas",
        description: "Sofas and couches for every living room.",
        productCount: 5,
        subcategories: [
          { _id: "c-corner", name: "Corner Sofas", slug: "corner-sofas", productCount: 3, subcategories: [] },
        ],
      },
    ],
  },
];

const FACETS = {
  category: {
    key: "category",
    label: "Category",
    type: "category",
    options: [
      { value: "sofas", id: "c-sofas", name: "Sofas", count: 5, selected: true },
      { value: "corner-sofas", id: "c-corner", name: "Corner Sofas", count: 3, selected: false },
    ],
  },
  room: {
    key: "room",
    label: "Room",
    type: "enum",
    options: [{ value: "living-room", label: "Living Room", count: 4, selected: false }],
  },
  price: { key: "price", label: "Price", type: "money", min: 5000, max: 200000, selected: { min: null, max: null } },
  availability: {
    key: "availability",
    label: "Availability",
    type: "boolean",
    options: [{ value: "inStock", count: 4, selected: false }],
  },
  rating: { key: "rating", label: "Rating", type: "rating", options: [{ value: 4, count: 2, selected: false }] },
  attributes: [
    {
      key: "frameMaterial",
      label: "Frame Material",
      type: "enum",
      options: [
        { value: "oak", count: 2, selected: false },
        { value: "walnut", count: 1, selected: false },
      ],
    },
    {
      key: "color",
      label: "Color",
      type: "multi-enum",
      options: [{ value: "red", count: 2, selected: true }],
    },
  ],
};

function LocationProbe({ onChange }) {
  const location = useLocation();
  onChange(location.search);
  return null;
}

function renderListing(initialEntry, probe) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="/shop"
            element={
              <>
                <CatalogListing crumbPrefix={[{ name: "Shop", path: "/shop" }]} />
                <LocationProbe onChange={probe} />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  categoryApi.getTree.mockResolvedValue({ data: { categories: TREE } });
  productApi.getAll.mockResolvedValue({
    data: {
      products: [{ _id: "p1", name: "Facet Sofa" }],
      pagination: { page: 1, limit: 12, total: 1, pages: 1 },
      facets: FACETS,
    },
  });
});

describe("CatalogListing facet engine (Phase 7)", () => {
  it("requests facets=1 and passes attr.* params through verbatim", async () => {
    renderListing("/shop?categories=sofas&attr.color=red", () => {});
    await waitFor(() =>
      expect(productApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          facets: "1",
          categories: "sofas",
          "attr.color": "red",
          page: 1,
          status: "active",
        })
      )
    );
    expect(await screen.findByText("Facet Sofa")).toBeInTheDocument();
  });

  it("category context: intro description and ancestor breadcrumbs, no subcategory pills", async () => {
    renderListing("/shop?categories=sofas", () => {});
    expect(await screen.findByText("Sofas and couches for every living room.")).toBeInTheDocument();
    // No subcategory tag pills under the intro — the filter sidebar
    // already carries the subcategory navigation.
    expect(screen.queryByRole("link", { name: /Corner Sofas/ })).not.toBeInTheDocument();
    // Breadcrumbs: Home / Shop / Living Room / Sofas.
    expect(screen.getAllByRole("link", { name: "Living Room" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Sofas" }).length).toBeGreaterThan(0);
  });

  it("toggling a facet checkbox writes the attr grammar into the URL", async () => {
    let search = "";
    renderListing("/shop?categories=sofas", (value) => { search = value; });
    const oak = await screen.findByRole("checkbox", { name: /oak/ });
    fireEvent.click(oak);
    await waitFor(() =>
      expect(new URLSearchParams(search).get("attr.frameMaterial")).toBe("oak")
    );
    // …and the next request carries it.
    await waitFor(() =>
      expect(productApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ "attr.frameMaterial": "oak" })
      )
    );
  });

  it("chips: removing the color chip clears only attr.color; clear-all resets filters", async () => {
    let search = "";
    renderListing("/shop?categories=sofas&attr.color=red&attr.frameMaterial=oak", (value) => { search = value; });
    const remove = await screen.findByRole("button", { name: "Remove filter Color: red" });
    fireEvent.click(remove);
    await waitFor(() => {
      const params = new URLSearchParams(search);
      expect(params.get("attr.color")).toBeNull();
      expect(params.get("attr.frameMaterial")).toBe("oak");
      expect(params.get("categories")).toBe("sofas");
    });
    fireEvent.click(screen.getByRole("button", { name: "Clear all filters" }));
    await waitFor(() => {
      const params = new URLSearchParams(search);
      expect(params.get("attr.frameMaterial")).toBeNull();
      expect(params.get("categories")).toBeNull();
    });
  });

  it("page lives in the URL and pagination preserves filters", async () => {
    productApi.getAll.mockResolvedValue({
      data: {
        products: [{ _id: "p1", name: "Facet Sofa" }],
        pagination: { page: 1, limit: 12, total: 30, pages: 3 },
        facets: FACETS,
      },
    });
    let search = "";
    renderListing("/shop?attr.frameMaterial=oak", (value) => { search = value; });
    const next = await screen.findByRole("button", { name: "Next page" });
    fireEvent.click(next);
    await waitFor(() => {
      const params = new URLSearchParams(search);
      expect(params.get("page")).toBe("2");
      expect(params.get("attr.frameMaterial")).toBe("oak");
    });
  });

  it("categories group is scoped to the current department (post-delivery fix)", async () => {
    categoryApi.getTree.mockResolvedValue({
      data: {
        categories: [
          {
            _id: "c-living",
            name: "Living Room",
            slug: "living-room",
            productCount: 35,
            subcategories: [
              { _id: "c-usofas", name: "Upholstered Sofas", slug: "upholstered-sofas", productCount: 11, subcategories: [] },
              { _id: "c-accent", name: "Accent Seating", slug: "accent-seating", productCount: 12, subcategories: [] },
              { _id: "c-lrtables", name: "Living Room Tables", slug: "living-room-tables", productCount: 12, subcategories: [] },
            ],
          },
          {
            _id: "c-bedroom",
            name: "Bedroom",
            slug: "bedroom",
            productCount: 36,
            subcategories: [
              { _id: "c-frames", name: "Bed Frames", slug: "bed-frames", productCount: 12, subcategories: [] },
            ],
          },
        ],
      },
    });
    renderListing("/shop?categories=living-room", () => {});
    // Only Living Room's children are offered as category filters…
    expect(
      await screen.findByRole("checkbox", { name: /Upholstered Sofas/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Accent Seating/ })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Living Room Tables/ })).toBeInTheDocument();
    // …not the other department, its children, or the whole tree.
    expect(screen.queryByRole("checkbox", { name: /Bed Frames/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /^Bedroom/ })).not.toBeInTheDocument();
  });

  it("honest empty state offers a filter reset", async () => {
    productApi.getAll.mockResolvedValue({
      data: {
        products: [],
        pagination: { page: 1, limit: 12, total: 0, pages: 1 },
        facets: FACETS,
      },
    });
    renderListing("/shop?attr.frameMaterial=oak", () => {});
    expect(await screen.findByText("No products found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset Filters" })).toBeInTheDocument();
  });
});
