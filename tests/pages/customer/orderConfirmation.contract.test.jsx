// FE-39 SIBLING CONTRACT TEST — src/pages/customer/OrderConfirmationPage.jsx
// is the SECOND consumer of the same FA-45 trimmed tracking view as
// TrackOrderPage (useTrackOrder -> POST /orders/track). The FE-39 worker's
// sibling sweep found it still reading orderedAt (with a `new Date()`
// fallback), shippingAddress and guestInfo — none of which the server's
// tracking view returns (see trackOrder.contract.test.jsx header for the
// verified field list). This file pins the honest behavior:
//   - "Date Issued" is the order's createdAt, never today.
//   - "Est. Delivery" is createdAt + 10 days, or "N/A" — never today + 10.
//   - "Billed To" shows the email the customer actually tracked with
//     (query param) and the honest generic name label; legacy payload
//     fields (orderedAt / shippingAddress / guestInfo / user) are ignored.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../../../src/api/index.js", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
    post: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
    patch: vi.fn(() =>
      Promise.reject(new Error("mocked: no network in tests")),
    ),
    delete: vi.fn(() =>
      Promise.reject(new Error("mocked: no network in tests")),
    ),
  },
}));

vi.mock("../../../src/api/orderApi.js", () => ({
  default: {
    trackOrder: vi.fn(),
  },
}));

vi.mock("../../../src/layouts/customer/Navbar.jsx", () => ({
  default: () => null,
}));
vi.mock("../../../src/layouts/customer/Footer.jsx", () => ({
  default: () => null,
}));

import orderApi from "../../../src/api/orderApi.js";
import OrderConfirmationPage from "../../../src/pages/customer/OrderConfirmationPage.jsx";

const DAY_MS = 24 * 60 * 60 * 1000;

// Same formatting OrderConfirmationPage.formatDate uses ("short" month).
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Faithful fixture of the REAL current server tracking response (FA-45
// trimmed shape) — identical field set to the TrackOrder contract fixture.
function buildServerOrder() {
  const createdAt = new Date(Date.now() - 10 * DAY_MS);
  const createdAtIso = createdAt.toISOString();
  return {
    orderId: "AU1234567890",
    orderStatus: "confirmed",
    paymentStatus: "paid",
    paymentMethod: "cod",
    items: [
      { name: "Test Sofa", quantity: 2, price: 15000 },
      { name: "Oak Coffee Table", quantity: 1, price: 8000 },
    ],
    subtotal: 38000,
    discountAmount: 0,
    shippingCost: 0,
    tax: 0,
    total: 38000,
    createdAt: createdAtIso,
    updatedAt: createdAtIso,
    confirmedAt: createdAtIso,
    shippedAt: null,
    deliveredAt: null,
    // Deliberately ABSENT (server FA-45 trimmed shape):
    // orderedAt, shippingAddress, discountCode, guestInfo, user
  };
}

async function renderConfirmation(order) {
  orderApi.trackOrder.mockResolvedValue({
    success: true,
    data: { order },
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[
          "/order-confirmation/AU1234567890?email=guest%40example.com",
        ]}
      >
        <Routes>
          <Route
            path="/order-confirmation/:orderId"
            element={<OrderConfirmationPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  // The invoice block renders only after the tracking mutation succeeds.
  await screen.findByText("Date Issued");
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FE-39 sibling: OrderConfirmationPage vs the trimmed tracking view", () => {
  it("issues the invoice on createdAt and estimates delivery from createdAt (+10 days)", async () => {
    const order = buildServerOrder();
    await renderConfirmation(order);

    expect(screen.getByText(formatDate(order.createdAt))).toBeInTheDocument();
    const expectedEta = formatDate(
      new Date(new Date(order.createdAt).getTime() + 10 * DAY_MS),
    );
    expect(screen.getByText(expectedEta)).toBeInTheDocument();
    // Real in-shape data still renders.
    expect(screen.getByText("Test Sofa")).toBeInTheDocument();
    // The identity shown is the email the customer tracked with.
    expect(
      screen.getAllByText("guest@example.com").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Guest Customer")).toBeInTheDocument();
  });

  it("createdAt missing → 'N/A' issue date and estimate, never today-derived dates", async () => {
    const order = buildServerOrder();
    delete order.createdAt;
    await renderConfirmation(order);

    // Both Date Issued and Est. Delivery fall back to the honest "N/A".
    expect(screen.getAllByText("N/A").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(formatDate(Date.now()))).toBeNull();
    expect(screen.queryByText(formatDate(Date.now() + 10 * DAY_MS))).toBeNull();
  });

  it("PEN-TEST: legacy fields (orderedAt / shippingAddress / guestInfo / user) are ignored", async () => {
    const order = buildServerOrder();
    delete order.createdAt;
    order.orderedAt = "2001-02-03T00:00:00.000Z";
    order.shippingAddress = { fullName: "Legacy Person" };
    order.guestInfo = {
      email: "legacy@example.com",
      firstName: "Legacy",
      lastName: "Person",
    };
    order.user = { fullName: "Legacy User" };
    await renderConfirmation(order);

    expect(screen.getAllByText("N/A").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(formatDate(order.orderedAt))).toBeNull();
    expect(screen.queryByText("Legacy Person")).toBeNull();
    expect(screen.queryByText("Legacy User")).toBeNull();
    expect(screen.queryByText("legacy@example.com")).toBeNull();
    // Identity remains the real tracking email + honest generic label.
    expect(
      screen.getAllByText("guest@example.com").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Guest Customer")).toBeInTheDocument();
  });
});
