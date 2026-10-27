// FE-38 (OrderCard controls) — Invoice / Write Review / Request
// Return rendered with no onClick at OrderCard.jsx:215-238 (audit
// lines), and "Buy Again" was a bare link to /shop.
//
// Dispositions (each verified against the backing surface):
//  - Invoice: REMOVED. No invoice/document endpoint exists in the
//    client API surface (src/api/*) and no invoice route exists on
//    the server; OrderConfirmationPage's invoice-looking view is a
//    guest tracking page keyed by orderId+email, not a per-order
//    download a signed-in card can link to.
//  - Write Review: WIRED to the first item's product page — the
//    review form/modal lives on ProductDetailsPage (canReview is
//    purchase-gated server-side). Delivered orders only, as before.
//  - Request Return: WIRED, but moved to delivered orders only —
//    orderApi.requestReturn + useRequestReturn exist, and the server
//    accepts returns only for delivered orders with a reason (the
//    old pending/confirmed placement could only ever 400). Clicking
//    opens an inline reason form; submit calls the mutation.
//  - Buy Again: WIRED to actually re-add the order's items via the
//    existing cart surfaces (useAddToCart for signed-in users,
//    guestCartStore.addItem for guests). When no item carries a
//    product id, it falls back to the old /shop link.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mocks = vi.hoisted(() => ({
  isAuthenticated: true,
  addToCart: vi.fn(),
  guestAddItem: vi.fn(),
  requestReturn: vi.fn(),
}));

vi.mock("../../../src/store/authStore", () => ({
  default: () => ({ isAuthenticated: mocks.isAuthenticated }),
}));
vi.mock("../../../src/hooks/cart/useCartTan", () => ({
  useAddToCart: () => ({ mutate: mocks.addToCart, isPending: false }),
}));
vi.mock("../../../src/store/guestCartStore", () => ({
  default: () => ({ addItem: mocks.guestAddItem }),
}));
vi.mock("../../../src/hooks/order/useOrderTan", () => ({
  useRequestReturn: () => ({ mutate: mocks.requestReturn, isPending: false }),
}));
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import OrderCard from "../../../src/components/profile/OrderCard.jsx";

const deliveredOrder = {
  _id: "mongo-1",
  orderId: "ORD-9",
  orderedAt: "2026-01-01T00:00:00.000Z",
  orderStatus: "delivered",
  total: 38000,
  items: [
    { name: "Sofa", price: 15000, quantity: 2, product: "prod-1", variant: { color: "Red" } },
    { name: "Oak Table", price: 8000, quantity: 1, product: { _id: "prod-2", slug: "oak-table" } },
  ],
};

const pendingOrder = {
  ...deliveredOrder,
  _id: "mongo-2",
  orderId: "ORD-10",
  orderStatus: "pending",
};

function renderCard(order) {
  return render(
    <MemoryRouter>
      <OrderCard order={order} defaultExpanded />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mocks.isAuthenticated = true;
});

describe("OrderCard controls (FE-38)", () => {
  it("Invoice is gone — there is no backing invoice feature", () => {
    renderCard(deliveredOrder);
    expect(screen.queryByRole("button", { name: /invoice/i })).toBeNull();
    expect(screen.queryByText("Invoice")).toBeNull();
  });

  it("Buy Again re-adds every item through the auth cart mutation", () => {
    renderCard(deliveredOrder);
    fireEvent.click(screen.getByRole("button", { name: /buy again/i }));
    expect(mocks.addToCart).toHaveBeenCalledTimes(2);
    expect(mocks.addToCart).toHaveBeenCalledWith(
      { productId: "prod-1", quantity: 2, variant: { color: "Red" } },
      expect.anything()
    );
    expect(mocks.addToCart).toHaveBeenCalledWith(
      { productId: "prod-2", quantity: 1, variant: {} },
      expect.anything()
    );
    expect(mocks.guestAddItem).not.toHaveBeenCalled();
  });

  it("Buy Again re-adds through the guest cart when signed out", () => {
    mocks.isAuthenticated = false;
    renderCard(deliveredOrder);
    fireEvent.click(screen.getByRole("button", { name: /buy again/i }));
    expect(mocks.guestAddItem).toHaveBeenCalledTimes(2);
    expect(mocks.guestAddItem).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "prod-1", name: "Sofa", price: 15000 }),
      2,
      { color: "Red" }
    );
    expect(mocks.addToCart).not.toHaveBeenCalled();
  });

  it("Buy Again falls back to a /shop link when no item has a product id", () => {
    renderCard({
      ...deliveredOrder,
      items: [{ name: "Legacy Item", price: 100, quantity: 1 }],
    });
    expect(screen.queryByRole("button", { name: /buy again/i })).toBeNull();
    const link = screen.getByRole("link", { name: /buy again/i });
    expect(link).toHaveAttribute("href", "/shop");
  });

  it("Write Review links to the first item's product page (delivered only)", () => {
    const { unmount } = renderCard(deliveredOrder);
    const link = screen.getByRole("link", { name: /write review/i });
    expect(link).toHaveAttribute("href", "/product/prod-1");
    unmount();

    renderCard(pendingOrder);
    expect(screen.queryByText(/write review/i)).toBeNull();
  });

  it("Request Return is NOT offered for pending/confirmed orders (the server would reject it)", () => {
    renderCard(pendingOrder);
    expect(screen.queryByText(/request return/i)).toBeNull();

    renderCard({ ...pendingOrder, orderStatus: "confirmed" });
    expect(screen.queryByText(/request return/i)).toBeNull();
  });

  it("Request Return (delivered) opens a reason form and submits through the mutation", () => {
    renderCard(deliveredOrder);
    fireEvent.click(screen.getByRole("button", { name: /request return/i }));

    const reasonBox = screen.getByLabelText(/reason for return/i);
    const submit = screen.getByRole("button", {
      name: /submit return request/i,
    });
    // No reason yet: submit cannot fire the mutation.
    fireEvent.click(submit);
    expect(mocks.requestReturn).not.toHaveBeenCalled();

    fireEvent.change(reasonBox, { target: { value: "Damaged on arrival" } });
    fireEvent.click(submit);
    expect(mocks.requestReturn).toHaveBeenCalledWith(
      { id: "mongo-1", data: { reason: "Damaged on arrival" } },
      expect.anything()
    );
  });

  it("Request Return is not offered when a return is already requested", () => {
    renderCard({
      ...deliveredOrder,
      returnRequest: { status: "requested" },
    });
    expect(screen.queryByText(/request return/i)).toBeNull();
  });
});
