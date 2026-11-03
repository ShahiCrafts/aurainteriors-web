import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Recommendations section (PDP): server rail in, engine-ranked
// rails out. The hook and ProductCard are stubbed; the REAL
// recommendation engine runs, so these tests also pin the
// similar / complement split end to end.

const h = vi.hoisted(() => ({ pool: undefined, loading: false }));

vi.mock("../../../src/hooks/product/useProductTan", () => ({
  useRelatedProducts: () => ({ data: h.pool, isLoading: h.loading }),
}));

vi.mock("../../../src/components/shop/ProductCard", () => ({
  default: ({ product }) => <div data-testid="card">{product.name}</div>,
}));

import Recommendations from "../../../src/pages/shop/product-details/Recommendations.jsx";

const source = {
  _id: "src",
  name: "Kanso Wardrobe",
  price: 44299,
  category: { _id: "cat-wardrobe", slug: "kids-wardrobes", name: "Kids Wardrobes" },
  style: "industrial",
  roomSlugs: ["kids-room"],
  tags: ["kids", "storage"],
  rating: { average: 4.5, count: 20 },
};

const similar = {
  _id: "sim",
  name: "Aranya Wardrobe",
  price: 46000,
  category: { _id: "cat-wardrobe", slug: "kids-wardrobes", name: "Kids Wardrobes" },
  style: "industrial",
  roomSlugs: ["kids-room"],
  tags: ["kids"],
  rating: { average: 4.8, count: 40 },
  stock: 5,
  status: "active",
};

const complement = {
  _id: "comp",
  name: "Kids Study Desk",
  price: 18000,
  category: { _id: "cat-desk", slug: "kids-desks", name: "Kids Desks" },
  style: "industrial",
  roomSlugs: ["kids-room"],
  tags: ["kids"],
  rating: { average: 4.2, count: 9 },
  stock: 3,
  status: "active",
};

const wrap = (pool) => ({ data: { products: pool } });

function renderSection() {
  return render(
    <MemoryRouter>
      <Recommendations product={source} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  h.pool = undefined;
  h.loading = false;
});

describe("Recommendations section", () => {
  it("renders nothing when the engine has no picks — no filler rail", () => {
    h.pool = wrap([]);
    const { container } = renderSection();
    expect(container.textContent).toBe("");
  });

  it("shows similar picks under You May Also Like, each with its reason", () => {
    h.pool = wrap([similar]);
    renderSection();
    expect(
      screen.getByRole("heading", { name: "You May Also Like" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Aranya Wardrobe")).toBeInTheDocument();
    expect(screen.getByText("Same category")).toBeInTheDocument();
    expect(screen.queryByText("Complete the Look")).not.toBeInTheDocument();
  });

  it("adds a Complete the Look rail for cross-category room/style matches", () => {
    h.pool = wrap([similar, complement]);
    renderSection();
    expect(screen.getByText("Complete the Look")).toBeInTheDocument();
    expect(screen.getByText("Kids Study Desk")).toBeInTheDocument();
  });

  it("never recommends the source product itself or out-of-stock items", () => {
    h.pool = wrap([source, { ...similar, _id: "oos", stock: 0 }]);
    const { container } = renderSection();
    expect(container.textContent).toBe("");
  });

  it("lays out 5 products in a row on wide screens", () => {
    const five = Array.from({ length: 5 }, (_, i) => ({
      ...similar,
      _id: `sim-${i}`,
      name: `Wardrobe ${i + 1}`,
    }));
    h.pool = wrap(five);
    const { container } = renderSection();
    expect(screen.getAllByTestId("card")).toHaveLength(5);
    const grid = container.querySelector(".xl\\:grid-cols-5");
    expect(grid).not.toBeNull();
    expect(grid.className).not.toContain("xl:grid-cols-4");
  });

  it("shows skeletons while the rail loads", () => {
    h.loading = true;
    renderSection();
    expect(
      screen.getByRole("heading", { name: "You May Also Like" }),
    ).toBeInTheDocument();
  });
});
