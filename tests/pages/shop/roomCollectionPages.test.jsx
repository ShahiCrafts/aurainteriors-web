// Phase 7 (catalog) — Room and Collection landing pages: the
// shared listing with the dimension pinned (never in the URL),
// a hero from the registry record, and an honest not-found state
// for unknown slugs.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
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

vi.mock("../../../src/layouts/customer/Navbar.jsx", () => ({ default: () => null }));
vi.mock("../../../src/layouts/customer/Footer.jsx", () => ({ default: () => null }));
vi.mock("../../../src/components/navigation/CategoryBar.jsx", () => ({ default: () => null }));
vi.mock("../../../src/components/shop/ProductCard.jsx", () => ({
  default: ({ product }) => <div>{product.name}</div>,
}));

const catalogState = vi.hoisted(() => ({ rooms: [], collections: [] }));
vi.mock("../../../src/hooks/catalog/useCatalogTan.js", () => ({
  useRooms: () => ({ data: { data: { rooms: catalogState.rooms } }, isLoading: false }),
  useCollections: () => ({
    data: { data: { collections: catalogState.collections } },
    isLoading: false,
  }),
  useCatalogSchema: () => ({ data: undefined, isLoading: false }),
}));

import productApi from "../../../src/api/productApi.js";
import categoryApi from "../../../src/api/categoryApi.js";
import RoomPage from "../../../src/pages/shop/RoomPage.jsx";
import CollectionPage from "../../../src/pages/shop/CollectionPage.jsx";

function renderAt(path, element) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/rooms/:slug" element={element} />
          <Route path="/collections/:slug" element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  catalogState.rooms = [
    { slug: "living-room", label: "Living Room", description: "Pieces for the living room." },
  ];
  catalogState.collections = [
    { slug: "new-arrivals", label: "New Arrivals", description: "Fresh in the studio." },
  ];
  categoryApi.getTree.mockResolvedValue({ data: { categories: [] } });
  productApi.getAll.mockResolvedValue({
    data: {
      products: [{ _id: "p1", name: "Scoped Product" }],
      pagination: { page: 1, limit: 12, total: 1, pages: 1 },
      facets: null,
    },
  });
});

describe("RoomPage (Phase 7)", () => {
  it("pins the room dimension and renders the registry hero", async () => {
    renderAt("/rooms/living-room", <RoomPage />);
    expect(await screen.findByText("Pieces for the living room.")).toBeInTheDocument();
    expect(await screen.findByText("Scoped Product")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Living Room/ })).toBeInTheDocument();
    await waitFor(() =>
      expect(productApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ room: "living-room", facets: "1" })
      )
    );
  });

  it("unknown room renders an honest not-found state and no listing", async () => {
    renderAt("/rooms/attic", <RoomPage />);
    expect(await screen.findByText("Room not found")).toBeInTheDocument();
    expect(productApi.getAll).not.toHaveBeenCalled();
  });
});

describe("CollectionPage (Phase 7)", () => {
  it("pins the collection dimension and renders the registry hero", async () => {
    renderAt("/collections/new-arrivals", <CollectionPage />);
    expect(await screen.findByText("Fresh in the studio.")).toBeInTheDocument();
    expect(await screen.findByText("Scoped Product")).toBeInTheDocument();
    await waitFor(() =>
      expect(productApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ collection: "new-arrivals", facets: "1" })
      )
    );
  });

  it("unknown collection renders an honest not-found state", async () => {
    renderAt("/collections/gone", <CollectionPage />);
    expect(await screen.findByText("Collection not found")).toBeInTheDocument();
    expect(productApi.getAll).not.toHaveBeenCalled();
  });
});
