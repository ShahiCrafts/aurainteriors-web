import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

// FE-28 regression tests for src/components/profile/OrdersSection.jsx +
// OrderStatsCards.jsx.
//
// Server contract (verified in the server tree): GET /orders/my-orders
// accepts ONLY status/page/limit and always sorts newest-first — there
// is no search or sort parameter to send. The honest client behaviour
// is therefore to scope the UI copy to the loaded page: the placeholder
// and an explicit note say search/sort are page-local, the in-page
// search really does match product names (its placeholder promised
// product search while only order IDs were checked), and the stats
// cards label their page-derived counts as page counts while the total
// keeps coming from the server pagination.

const { orderState } = vi.hoisted(() => ({ orderState: { data: null, params: null } }));

vi.mock("../../../src/hooks/order/useOrderTan", () => ({
  useMyOrders: (params) => {
    orderState.params = params;
    return { data: orderState.data, isLoading: false, isError: false, refetch: vi.fn() };
  },
}));

vi.mock("../../../src/components/profile/OrderCard", () => ({
  default: ({ order }) => (
    <div>
      {order.orderId} {(order.items || []).map((i) => i.name).join(", ")}
    </div>
  ),
}));

vi.mock("../../../src/components/common/Skeleton", () => ({
  default: () => null,
  OrderItemSkeleton: () => null,
}));

import OrdersSection from "../../../src/components/profile/OrdersSection.jsx";

const orders = [
  {
    _id: "o1",
    orderId: "ORD-001",
    orderStatus: "pending",
    total: 5000,
    createdAt: "2026-01-02T00:00:00.000Z",
    items: [{ name: "Walnut Chair" }],
  },
  {
    _id: "o2",
    orderId: "ORD-002",
    orderStatus: "delivered",
    total: 9000,
    createdAt: "2026-01-01T00:00:00.000Z",
    items: [{ name: "Linen Sofa" }],
  },
];

function renderSection() {
  orderState.data = {
    data: { orders, pagination: { total: 12, pages: 3, page: 1, limit: 5 } },
  };
  return render(
    <MemoryRouter>
      <OrdersSection />
    </MemoryRouter>
  );
}

describe("OrdersSection search/sort scope (FE-28)", () => {
  it("scopes the search placeholder and shows the page-scope note", () => {
    renderSection();

    expect(
      screen.getByPlaceholderText(/search this page by order id or product/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/search and sort apply only to the orders loaded on this page/i)
    ).toBeInTheDocument();
  });

  it("labels the page-derived stats as page counts while the total stays the server's", () => {
    renderSection();

    // 12 is the server total from pagination, not the 2 loaded rows.
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText(/pending \(this page\)/i)).toBeInTheDocument();
    expect(screen.getByText(/delivered \(this page\)/i)).toBeInTheDocument();
  });

  it("finds an order on this page by product name, as the placeholder promises", () => {
    renderSection();

    fireEvent.change(
      screen.getByPlaceholderText(/search this page by order id or product/i),
      { target: { value: "Walnut" } }
    );

    expect(screen.getByText(/ORD-001/)).toBeInTheDocument();
    expect(screen.queryByText(/ORD-002/)).not.toBeInTheDocument();
  });

  it("still finds an order on this page by order ID", () => {
    renderSection();

    fireEvent.change(
      screen.getByPlaceholderText(/search this page by order id or product/i),
      { target: { value: "ORD-002" } }
    );

    expect(screen.getByText(/ORD-002/)).toBeInTheDocument();
    expect(screen.queryByText(/ORD-001/)).not.toBeInTheDocument();
  });

  it("scopes the empty-result copy to this page", () => {
    renderSection();

    fireEvent.change(
      screen.getByPlaceholderText(/search this page by order id or product/i),
      { target: { value: "no-such-thing" } }
    );

    expect(screen.getByText(/no orders match on this page/i)).toBeInTheDocument();
  });
});
