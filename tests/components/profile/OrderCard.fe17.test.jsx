// FE-17 — OrderCard expanded view: item.price.toLocaleString() unguarded.
// An item missing price must render instead of throwing. Fails pre-fix.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// FE-38: OrderCard now uses the cart/auth/return hooks for its wired
// action row — mock those surfaces (this file's subject is the FE-17
// price guard, not the actions).
vi.mock("../../../src/store/authStore", () => ({
  default: () => ({ isAuthenticated: true }),
}));
vi.mock("../../../src/hooks/cart/useCartTan", () => ({
  useAddToCart: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("../../../src/store/guestCartStore", () => ({
  default: () => ({ addItem: vi.fn() }),
}));
vi.mock("../../../src/hooks/order/useOrderTan", () => ({
  useRequestReturn: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("../../../src/lib/toast.js", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import OrderCard from "../../../src/components/profile/OrderCard.jsx";

describe("OrderCard FE-17 guard", () => {
  it("renders an expanded order whose item is missing price", () => {
    const order = {
      orderId: "ORD-1",
      orderedAt: "2026-01-01T00:00:00.000Z",
      orderStatus: "delivered",
      total: 1000,
      items: [{ name: "Chair" }],
    };
    render(
      <MemoryRouter>
        <OrderCard order={order} defaultExpanded />
      </MemoryRouter>
    );
    expect(screen.getAllByText("Chair").length).toBeGreaterThan(0);
    // Missing price renders as the guarded 0 instead of throwing.
    // (FE-63: rendered through the shared formatNPR helper now.)
    expect(screen.getByText(/NPR\s0/)).toBeInTheDocument();
  });
});
