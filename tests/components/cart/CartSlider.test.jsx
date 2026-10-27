import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

// Regression tests for the 2026-10-27 CartSlider crash reported in the
// main chat:
//
//   TypeError: getGuestCartTotals is not a function
//     at CartSlider (CartSlider.jsx:35:23)
//
// The crash site is `const guestTotals = getGuestCartTotals();` — it
// runs on EVERY mount, signed-in or guest, because the totals are
// computed eagerly before the auth branch. So a broken selector here
// breaks the whole drawer, not just the guest path.
//
// Deliberately, the real guestCartStore is used here — NOT mocked.
// Mocking the store (as several neighbouring component tests do for
// other purposes) would replace the very selector under test and
// make this regression pass vacuously. Only the network hooks
// (useCartTan) and the auth store are mocked; the guest totals must
// come from the real store's `getCartTotals` via the component's
// own `useShallow` selector.

const state = vi.hoisted(() => ({
  auth: { isAuthenticated: false },
  cartData: undefined,
  updateMutate: vi.fn(),
  removeMutate: vi.fn(),
}));

vi.mock("../../../src/hooks/cart/useCartTan", () => ({
  useCart: () => ({ data: state.cartData, isLoading: false }),
  useUpdateCartItem: () => ({ mutate: state.updateMutate, isPending: false }),
  useRemoveFromCart: () => ({ mutate: state.removeMutate, isPending: false }),
}));

vi.mock("../../../src/store/authStore", () => ({
  default: () => ({ isAuthenticated: state.auth.isAuthenticated }),
}));

vi.mock("../../../src/lib/toast.js", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

import CartSlider from "../../../src/components/cart/CartSlider.jsx";
import useGuestCartStore from "../../../src/store/guestCartStore.js";
import { formatNPR } from "../../../src/utils/formatCurrency.js";

const sofa = {
  _id: "prod-1",
  name: "Test Sofa",
  slug: "test-sofa",
  price: 100,
  images: [],
  stock: 5,
};
const lamp = {
  _id: "prod-2",
  name: "Test Lamp",
  slug: "test-lamp",
  price: 25,
  images: [],
  stock: 10,
};

function renderSlider() {
  return render(
    <MemoryRouter>
      <CartSlider isOpen onClose={vi.fn()} />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  state.auth.isAuthenticated = false;
  state.cartData = undefined;
  localStorage.clear();
  useGuestCartStore.setState({ items: [] });
});

describe("CartSlider guest totals (reported crash)", () => {
  it("mounts without throwing and shows the real store totals for a guest", () => {
    // The selector itself must be a function — this is the exact
    // value that was reported as `not a function`.
    expect(typeof useGuestCartStore.getState().getCartTotals).toBe("function");

    useGuestCartStore.getState().addItem(sofa, 2); // 2 * 100
    useGuestCartStore.getState().addItem(lamp, 3); // 3 * 25

    // Would throw `getGuestCartTotals is not a function` at
    // CartSlider.jsx:35 before rendering anything if the selector
    // did not resolve to the store function.
    expect(() => renderSlider()).not.toThrow();

    expect(screen.getByText("Test Sofa")).toBeInTheDocument();
    expect(screen.getByText("Test Lamp")).toBeInTheDocument();
    // Badge count + subtotal, from the real store: 5 items, NPR 275.
    expect(screen.getByText("5")).toBeInTheDocument();
    // formatNPR uses a non-breaking space (NPR\u00A0 + amount), which
    // Testing Library's text matcher does not equate with a plain
    // space, so assert on the rendered text content instead.
    expect(document.body.textContent).toContain(formatNPR(275));
  });

  it("renders the empty state for a guest with no items, without throwing", () => {
    expect(() => renderSlider()).not.toThrow();
    expect(screen.getByText("Your Cart is Empty")).toBeInTheDocument();
  });

  it("increasing a guest quantity updates the totals through the store", () => {
    useGuestCartStore.getState().addItem(sofa, 1);

    renderSlider();

    expect(document.body.textContent).toContain(formatNPR(100));
    fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));

    // Store state changed, component re-rendered: 2 x 100.
    expect(document.body.textContent).toContain(formatNPR(200));
    expect(useGuestCartStore.getState().items[0].quantity).toBe(2);
  });

  it("also mounts for a signed-in user — totals are computed before the auth branch", () => {
    state.auth.isAuthenticated = true;
    state.cartData = {
      data: {
        cart: {
          items: [
            {
              _id: "server-item-1",
              quantity: 2,
              product: { ...sofa, slug: "test-sofa" },
            },
          ],
          totalItems: 2,
          subtotal: 200,
        },
      },
    };

    expect(() => renderSlider()).not.toThrow();
    expect(screen.getByText("Test Sofa")).toBeInTheDocument();
    expect(document.body.textContent).toContain(formatNPR(200));
  });
});
