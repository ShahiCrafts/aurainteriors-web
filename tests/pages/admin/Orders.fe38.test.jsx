import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// FE-38 — the admin Orders table's 'View details' eye button rendered
// with no onClick. Disposition: WIRE — an order-detail surface exists
// but was never consumed: orderApi.getOrderAdmin (GET
// /orders/admin/:id → { data: { order } }, server order.controller.js
// getOrderAdmin) and the useOrderAdmin hook in useOrderTan.js, which
// no component imported. The eye button now opens a details dialog
// fed by that hook (falling back to the row's own data while the
// detail loads).

vi.mock("../../../src/hooks/order/useOrderTan.js", () => ({
  useAllOrders: vi.fn(),
  useUpdateOrderStatus: vi.fn(),
  useProcessReturnRequest: vi.fn(),
  useOrderAdmin: vi.fn(),
}));

import {
  useAllOrders,
  useUpdateOrderStatus,
  useProcessReturnRequest,
  useOrderAdmin,
} from "../../../src/hooks/order/useOrderTan.js";
import Orders from "../../../src/pages/admin/Orders.jsx";

const order = {
  _id: "665f1c2ab3d4e5f60718293a",
  orderId: "ORD-2026-1001",
  items: [
    { _id: "i1", name: "Velvet Chair", quantity: 2, price: 1500 },
    { _id: "i2", name: "Oak Table", quantity: 1, price: 4000 },
  ],
  subtotal: 7000,
  discountAmount: 500,
  shippingCost: 200,
  tax: 0,
  total: 6700,
  orderStatus: "pending",
  paymentStatus: "pending",
  paymentMethod: "cod",
  createdAt: "2026-10-20T10:00:00.000Z",
  user: { firstName: "Asha", lastName: "Rai", email: "asha@example.com" },
  shippingAddress: {
    fullName: "Asha Rai",
    phone: "9800000000",
    addressLine1: "Street 1, Thamel",
    city: "Kathmandu",
    postalCode: "44600",
    country: "Nepal",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  useAllOrders.mockReturnValue({
    data: {
      data: {
        orders: [order],
        pagination: { total: 1, pages: 1 },
        stats: { totalRevenue: 6700, paidRevenue: 0, pendingRevenue: 6700 },
      },
    },
    isLoading: false,
    error: null,
  });
  useUpdateOrderStatus.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  useProcessReturnRequest.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  useOrderAdmin.mockReturnValue({ data: { data: { order } }, isLoading: false });
});

describe("Admin Orders 'View details' (FE-38)", () => {
  it("clicking the eye button opens a details dialog with the order's items, totals and address", () => {
    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle("View details"));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/ORD-2026-1001/)).toBeInTheDocument();
    expect(within(dialog).getByText("Velvet Chair")).toBeInTheDocument();
    expect(within(dialog).getByText("Oak Table")).toBeInTheDocument();
    expect(within(dialog).getByText(/Kathmandu/)).toBeInTheDocument();
    expect(within(dialog).getByText(/asha@example\.com/)).toBeInTheDocument();
    // The detail hook was driven with this order's id.
    expect(useOrderAdmin).toHaveBeenCalledWith(order._id, expect.objectContaining({ enabled: true }));
  });

  it("the details dialog closes again", async () => {
    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByTitle("View details"));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /close/i }));
    // The dialog is wrapped in AnimatePresence, so dismissal runs
    // through the exit animation before the node leaves the DOM —
    // await the same assertion instead of weakening it.
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });
});
