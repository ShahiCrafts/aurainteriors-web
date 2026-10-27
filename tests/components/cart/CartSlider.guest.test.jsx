// Regression tests for the CartSlider guest path — REAL stores edition.
//
// Bug (reported from a live run, 2026-10-27): CartSlider crashed with
// "TypeError: getGuestCartTotals is not a function" and the error
// boundary caught it. Root cause: the Phase 3 Zustand-selector
// conversion double-renamed the guest-cart destructure — the
// useShallow selector already returns { guestCartItems,
// updateGuestCartQuantity, removeGuestCartItem, getGuestCartTotals },
// but the destructure still asked for the store's raw key names
// (items / updateItemQuantity / removeItem / getCartTotals), so all
// four bindings were undefined. The same defect existed in
// CheckoutPage (guest items) and PersonalInformation (authUser,
// unused there, so inert).
//
// Why the existing suite missed it: every other component test mocks
// the stores with selector-ignoring mocks, so destructuring "worked"
// against the mock's shape, and there was no CartSlider component
// test at all. These tests therefore use the REAL guestCartStore and
// REAL authStore; only the server-cart React Query hooks and the
// toast module are mocked. If the wiring breaks again, this file
// fails with the original crash.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../src/hooks/cart/useCartTan", () => ({
  useCart: () => ({ data: undefined, isLoading: false }),
  useUpdateCartItem: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveFromCart: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../../../src/lib/toast.js", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import CartSlider from "../../../src/components/cart/CartSlider.jsx";
import useGuestCartStore from "../../../src/store/guestCartStore.js";
import useAuthStore from "../../../src/store/authStore.js";

const sofa = {
  _id: "prod-1",
  name: "Sofa",
  slug: "sofa",
  price: 100,
  images: [{ url: "sofa.jpg" }],
  stock: 5,
};
const lamp = {
  _id: "prod-2",
  name: "Lamp",
  slug: "lamp",
  price: 25,
  images: [],
  stock: 10,
};

const guestState = () => useGuestCartStore.getState();

function renderSlider() {
  return render(
    <MemoryRouter>
      <CartSlider isOpen onClose={() => {}} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  useGuestCartStore.setState({ items: [] });
  useAuthStore.setState({ isAuthenticated: false, user: null, token: null });
});

describe("CartSlider — guest cart (real stores)", () => {
  it("renders guest items and totals instead of crashing (the reported bug)", () => {
    guestState().addItem(sofa, 2); // 2 * 100 = 200
    guestState().addItem(lamp, 1); // 1 * 25  = 25

    renderSlider();

    expect(screen.getByText("Sofa")).toBeInTheDocument();
    expect(screen.getByText("Lamp")).toBeInTheDocument();
    // Line total for the sofa, and the subtotal from getCartTotals().
    expect(screen.getByText(/NPR\s200/)).toBeInTheDocument();
    expect(screen.getByText(/NPR\s225/)).toBeInTheDocument();
    expect(guestState().getCartTotals()).toEqual({
      itemCount: 3,
      subtotal: 225,
    });
  });

  it("quantity changes flow through the real guest store and re-render totals", () => {
    guestState().addItem(sofa, 2);
    guestState().addItem(lamp, 1);

    renderSlider();

    fireEvent.click(screen.getAllByLabelText("Increase quantity")[0]);

    const sofaLine = guestState().items.find((i) => i.product._id === "prod-1");
    expect(sofaLine.quantity).toBe(3);
    expect(screen.getByText(/NPR\s325/)).toBeInTheDocument();
  });

  it("remove flows through the real guest store", () => {
    guestState().addItem(sofa, 1);
    guestState().addItem(lamp, 1);

    renderSlider();

    // The row's first button is the trash/remove control (icon-only).
    const sofaCard = screen.getByText("Sofa").closest("div[class*='bg-white']");
    fireEvent.click(within(sofaCard).getAllByRole("button")[0]);

    expect(guestState().items).toHaveLength(1);
    expect(guestState().items[0].product._id).toBe("prod-2");
    expect(screen.queryByText("Sofa")).not.toBeInTheDocument();
    // "NPR 25" now appears exactly twice: the lamp's line total and
    // the subtotal — proof the totals recomputed after the removal.
    expect(screen.getAllByText(/NPR\s25/)).toHaveLength(2);
  });

  it("empty guest cart renders the empty state (totals of zero, no crash)", () => {
    renderSlider();

    expect(screen.getByText("Your Cart is Empty")).toBeInTheDocument();
    expect(guestState().getCartTotals()).toEqual({
      itemCount: 0,
      subtotal: 0,
    });
  });
});
