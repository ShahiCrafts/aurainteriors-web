import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// FE-38 — CategoryBar's 'Try AR View' opened ARViewModal on a
// FABRICATED demo product ({ slug: 'demo-product', modelUrl:
// 'https://example.com/demo.glb' }) whose flow dead-ends.
// Disposition: WIRE to a real product — the bar now takes the first
// AR-capable product from the existing AR catalog query
// (useArCatalogProducts + hasArModel, the same pattern ARViewPage
// uses) and passes THAT product to the modal; when no AR-capable
// product is available the control is hidden rather than opening
// the dead-end demo. example.com must never appear.

const h = vi.hoisted(() => ({ catalog: undefined }));

vi.mock("../../../src/hooks/product/useCategoryTan.js", () => ({
  useCategoryTree: () => ({
    data: { data: { categories: [] } },
    isLoading: false,
  }),
}));

vi.mock("../../../src/hooks/product/useArCatalogTan.js", () => ({
  useArCatalogProducts: () => ({ data: h.catalog, isLoading: !h.catalog }),
  default: () => ({ data: h.catalog, isLoading: !h.catalog }),
}));

vi.mock("../../../src/components/modals/ARViewModal.jsx", () => ({
  default: ({ product }) => (
    <div data-testid="ar-modal">
      {product.slug}|{product.modelUrl}
    </div>
  ),
}));

import CategoryBar from "../../../src/components/navigation/CategoryBar.jsx";

const arProduct = {
  _id: "p-ar",
  slug: "velvet-chair",
  name: "Velvet Chair",
  modelUrl: "https://cdn.aurainteriors.example/models/velvet.glb",
  modelFiles: [
    {
      format: "glb",
      url: "https://cdn.aurainteriors.example/models/velvet.glb",
    },
  ],
};
const plainProduct = {
  _id: "p-plain",
  slug: "oak-table",
  name: "Oak Table",
  images: [],
};

beforeEach(() => {
  h.catalog = undefined;
});

describe("CategoryBar 'Try AR View' (FE-38)", () => {
  it("is hidden while the catalog has not loaded", () => {
    render(
      <MemoryRouter initialEntries={["/shop"]}>
        <CategoryBar />
      </MemoryRouter>,
    );
    expect(screen.queryByText("Try AR View")).not.toBeInTheDocument();
  });

  it("is hidden when no catalog product has an AR model", () => {
    h.catalog = { data: { products: [plainProduct] } };
    render(
      <MemoryRouter initialEntries={["/shop"]}>
        <CategoryBar />
      </MemoryRouter>,
    );
    expect(screen.queryByText("Try AR View")).not.toBeInTheDocument();
  });

  it("opens the AR modal on the first REAL AR-capable product — never the demo", async () => {
    h.catalog = { data: { products: [plainProduct, arProduct] } };
    render(
      <MemoryRouter initialEntries={["/shop"]}>
        <CategoryBar />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("Try AR View"));
    const modal = await screen.findByTestId("ar-modal");
    expect(modal.textContent).toContain("velvet-chair");
    expect(modal.textContent).not.toContain("demo-product");
    expect(modal.textContent).not.toContain("example.com/demo.glb");
  });
});
