// FE-43 — src/pages/checkout/PaymentFailedPage.jsx vs the REAL server
// eSewa failure redirects.
//
// Server facts verified READ-ONLY against the server tree
// (~/workspace/aura-audit/work/controllers/order.controller.js:913-970):
// EVERY eSewa failure redirect goes to
//   /checkout/payment-failed?error=<code>
// with exactly these 8 codes and NOTHING else — no redirect ever sends
// orderId or any other param:
//   missing_data (:913), invalid_response (:924),
//   signature_mismatch (:931), order_not_found (:943),
//   payment_incomplete (:949), invalid_transaction (:952),
//   payment_verification_failed (:958),
//   payment_reconciliation_required (:967, :970)
//
// The `error` param is used ONLY as a switch key and must never be
// rendered (no reflected XSS via ?error=). The old page rendered an
// "Order Reference" block when ?orderId= was present — dead UI, since
// the server never sends it; FE-43 removes the block entirely.
//
// Navbar / Footer are stubbed to inert components: page chrome with
// their own queries, not part of the FE-43 contract.

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../src/layouts/customer/Navbar.jsx", () => ({
  default: () => null,
}));
vi.mock("../../../src/layouts/customer/Footer.jsx", () => ({
  default: () => null,
}));

import PaymentFailedPage from "../../../src/pages/checkout/PaymentFailedPage.jsx";

const GENERIC = "Something went wrong with your payment.";

function renderPage(entry) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <PaymentFailedPage />
    </MemoryRouter>
  );
}

function renderCode(code) {
  return renderPage(`/checkout/payment-failed?error=${code}`);
}

// ---------------------------------------------------------------------------
// (a) Each of the 8 server codes renders its own specific message.
// ---------------------------------------------------------------------------

describe("FE-43: all 8 server error codes render a specific message", () => {
  const CASES = [
    ["missing_data", "Payment data was not received properly."],
    ["invalid_response", "Invalid response from payment gateway."],
    [
      "signature_mismatch",
      "Payment verification failed. Please contact support.",
    ],
    ["order_not_found", "Order not found. Please try again."],
    ["payment_incomplete", "Payment was not completed."],
    [
      "invalid_transaction",
      "The payment transaction was invalid and was rejected by the payment gateway.",
    ],
    [
      "payment_verification_failed",
      "We could not verify this payment with eSewa. Please check your eSewa statement before trying again.",
    ],
  ];

  for (const [code, message] of CASES) {
    it(`error=${code} renders its specific message, not the generic one`, () => {
      renderCode(code);
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(screen.queryByText(GENERIC)).toBeNull();
    });
  }

  it("error=payment_reconciliation_required renders the verification-pending message, not the generic one", () => {
    renderCode("payment_reconciliation_required");
    expect(
      screen.getByText(/still being verified/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(GENERIC)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// (b) payment_reconciliation_required: unresolved state — the payment may
// have succeeded, so there must be NO pay-again CTA at all.
// ---------------------------------------------------------------------------

describe("FE-43: payment_reconciliation_required never offers a retry payment", () => {
  it("tells the customer not to pay again and that verification is pending", () => {
    renderCode("payment_reconciliation_required");
    expect(screen.getByText(/do not pay again/i)).toBeInTheDocument();
    expect(screen.getByText(/still being verified/i)).toBeInTheDocument();
  });

  it("renders NO Try Again control and NO link to /checkout", () => {
    const { container } = renderCode("payment_reconciliation_required");
    expect(screen.queryByText("Try Again")).toBeNull();
    expect(
      screen.queryByRole("link", { name: /try again/i })
    ).toBeNull();
    expect(container.querySelector('a[href="/checkout"]')).toBeNull();
    // Non-payment actions remain available.
    expect(
      screen.getByRole("link", { name: /contact support/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /go home/i })
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// (c) Every other code (and unknown/missing) keeps the Try Again link.
// ---------------------------------------------------------------------------

describe("FE-43: Try Again to /checkout is present for non-reconciliation states", () => {
  const RETRY_CODES = [
    "missing_data",
    "invalid_response",
    "signature_mismatch",
    "order_not_found",
    "payment_incomplete",
    "invalid_transaction",
    "payment_verification_failed",
  ];

  for (const code of RETRY_CODES) {
    it(`error=${code} shows the Try Again link to /checkout`, () => {
      renderCode(code);
      const link = screen.getByRole("link", { name: /try again/i });
      expect(link).toHaveAttribute("href", "/checkout");
    });
  }

  it("an unknown error code keeps the generic message WITH Try Again", () => {
    renderCode("some_future_code");
    expect(screen.getByText(GENERIC)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /try again/i })
    ).toHaveAttribute("href", "/checkout");
  });

  it("a missing error param keeps the generic message WITH Try Again", () => {
    renderPage("/checkout/payment-failed");
    expect(screen.getByText(GENERIC)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /try again/i })
    ).toHaveAttribute("href", "/checkout");
  });
});

// ---------------------------------------------------------------------------
// (d) PEN-TEST: ?orderId= stays dead — no Order Reference block, and the
// param value is never rendered (the server never sends it).
// ---------------------------------------------------------------------------

describe("FE-43 PEN-TEST: the orderId param is never rendered", () => {
  it("no 'Order Reference' renders even when ?orderId=XYZ is supplied", () => {
    renderPage("/checkout/payment-failed?error=missing_data&orderId=XYZ");
    expect(screen.getByText("Payment data was not received properly.")).toBeInTheDocument();
    expect(screen.queryByText(/Order Reference/)).toBeNull();
    expect(screen.queryByText(/XYZ/)).toBeNull();
  });

  it("no 'Order Reference' renders for the reconciliation state either", () => {
    renderPage(
      "/checkout/payment-failed?error=payment_reconciliation_required&orderId=XYZ"
    );
    expect(screen.queryByText(/Order Reference/)).toBeNull();
    expect(screen.queryByText(/XYZ/)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// (e) PEN-TEST: a hostile ?error= value falls back to the generic message
// and is never rendered as markup; near-miss codes do NOT trigger the
// reconciliation state.
// ---------------------------------------------------------------------------

describe("FE-43 PEN-TEST: hostile and near-miss error values stay inert", () => {
  it("a script payload in ?error= falls back to the generic message and injects no markup", () => {
    const payload = '<script>alert(1)</script>';
    const { container } = renderPage(
      `/checkout/payment-failed?error=${encodeURIComponent(payload)}`
    );
    expect(screen.getByText(GENERIC)).toBeInTheDocument();
    expect(container.innerHTML).not.toContain(payload);
    expect(container.innerHTML).not.toContain("alert(1)");
    expect(container.querySelector("script")).toBeNull();
    // Generic state keeps Try Again (it is NOT the reconciliation state).
    expect(
      screen.getByRole("link", { name: /try again/i })
    ).toHaveAttribute("href", "/checkout");
  });

  it("a trailing-space near-miss does NOT trigger the reconciliation state", () => {
    renderPage(
      `/checkout/payment-failed?error=${encodeURIComponent(
        "payment_reconciliation_required "
      )}`
    );
    expect(screen.getByText(GENERIC)).toBeInTheDocument();
    expect(screen.queryByText(/do not pay again/i)).toBeNull();
    expect(
      screen.getByRole("link", { name: /try again/i })
    ).toHaveAttribute("href", "/checkout");
  });

  it("an uppercase near-miss does NOT trigger the reconciliation state", () => {
    renderCode("PAYMENT_RECONCILIATION_REQUIRED");
    expect(screen.getByText(GENERIC)).toBeInTheDocument();
    expect(screen.queryByText(/do not pay again/i)).toBeNull();
    expect(
      screen.getByRole("link", { name: /try again/i })
    ).toHaveAttribute("href", "/checkout");
  });
});
