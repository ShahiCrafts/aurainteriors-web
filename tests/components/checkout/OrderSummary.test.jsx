// Phase 6 (REUSE-010) — OrderSummary extracted verbatim from
// CheckoutPage's right rail. These tests pin the rendered panel:
// header count (singular/plural), the totals rows, the Discount row
// appearing only when promoDiscount > 0, "Free" shipping at 0, and
// children rendered after the totals (the page's promo/CTA slot).
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import OrderSummary from "../../../src/components/checkout/OrderSummary.jsx";

const base = {
  itemCount: 2,
  subtotal: 2450,
  promoDiscount: 0,
  shippingCost: 0,
  taxAmount: 0,
  total: 2450,
};

describe("OrderSummary (Phase 6 extraction)", () => {
  it("renders header count, totals rows and Free shipping", () => {
    render(<OrderSummary {...base} />);
    expect(screen.getByText("Order Summary")).toBeInTheDocument();
    expect(screen.getByText("(2 items)")).toBeInTheDocument();
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("Tax")).toBeInTheDocument();
    expect(screen.getByText("Shipping")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("VAT included")).toBeInTheDocument();
    // No discount row without a promo discount.
    expect(screen.queryByText("Discount")).not.toBeInTheDocument();
  });

  it("uses the singular 'item' for a count of 1", () => {
    render(<OrderSummary {...base} itemCount={1} />);
    expect(screen.getByText("(1 item)")).toBeInTheDocument();
  });

  it("shows the Discount row only when promoDiscount > 0", () => {
    render(<OrderSummary {...base} promoDiscount={150} total={2300} />);
    expect(screen.getByText("Discount")).toBeInTheDocument();
  });

  it("renders children after the totals block", () => {
    render(
      <OrderSummary {...base}>
        <button type="button">Place Order</button>
      </OrderSummary>
    );
    const total = screen.getByText("Total");
    const cta = screen.getByRole("button", { name: "Place Order" });
    expect(
      total.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
