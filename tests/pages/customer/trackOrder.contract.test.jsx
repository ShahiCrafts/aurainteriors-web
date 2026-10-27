// FE-39 CONTRACT TEST — src/pages/customer/TrackOrderPage.jsx vs the REAL
// current server tracking response.
//
// Server fixture verified READ-ONLY against the server tree
// (~/workspace/aura-audit/work/controllers/order.controller.js, trackOrder
// handler, lines 603-651; the FA-45 "STATUS-LEVEL view" construction at
// lines 620-645). The server's tracking object contains exactly:
//   orderId, orderStatus, paymentStatus, paymentMethod,
//   items[] { name, quantity, price },
//   subtotal, discountAmount, shippingCost, tax, total,
//   createdAt, updatedAt, confirmedAt, shippedAt, deliveredAt
// It contains NO orderedAt, NO shippingAddress and NO discountCode.
// (Field NAMES only are recorded here; the values below are invented
// test data.)
//
// The client seam the page actually consumes is mocked:
// TrackOrderPage -> useTrackOrder (src/hooks/order/useOrderTan.js)
//   -> orderApi.trackOrder (src/api/orderApi.js), which POSTs
//   /orders/track and returns the response body. The page's onSuccess
//   reads data.data.order, so the mock resolves the body shape
//   { success: true, data: { order: <fixture> } }.
//
// Navbar / Footer are stubbed to inert components: they are page chrome
// with their own cart/wishlist queries and are not part of the FE-39
// contract. OrderTrackingTimeline stays REAL.
//
// Expected outcome TODAY: the "renders the trimmed server shape" describe
// PASSES, and the "FE-39 contract" describe FAILS on the two date
// assertions — the page formats order.orderedAt (TrackOrderPage.jsx,
// "Placed on {formatDate(order.orderedAt)}") which the server no longer
// sends, and getEstimatedDelivery() (TrackOrderPage.jsx:115) falls back
// to `new Date()` when orderedAt is missing. Those two failures are
// Phase 1's ready-made reproduction. Do not weaken them.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../../../src/api/index.js", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
    post: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
    patch: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
    delete: vi.fn(() => Promise.reject(new Error("mocked: no network in tests"))),
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
import TrackOrderPage from "../../../src/pages/customer/TrackOrderPage.jsx";

const DAY_MS = 24 * 60 * 60 * 1000;

// Same formatting TrackOrderPage.formatDate uses.
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Faithful fixture of the REAL current server tracking response (FA-45
// trimmed shape). createdAt is 10 days before the test run, computed
// relative to Date.now() so the fixture never goes stale and the
// createdAt-based ETA (createdAt + 7d = 3 days ago) is always
// distinguishable from the buggy today-based ETA (today + 7d).
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
    // orderedAt, shippingAddress, discountCode
  };
}

async function renderTrackedOrder(order) {
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
          "/track-order?orderId=AU1234567890&email=guest%40example.com",
        ]}
      >
        <TrackOrderPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
  // The page auto-tracks when orderId/email arrive via search params
  // (useEffect in TrackOrderPage.jsx); wait for the order header, which
  // only renders after the mutation succeeds.
  await screen.findByText("Order #AU1234567890");
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("renders the trimmed server shape", () => {
  it("shows the order status from the fixture", async () => {
    const order = buildServerOrder();
    await renderTrackedOrder(order);
    // "Confirmed" is the STATUS_LABELS rendering of orderStatus in the
    // order header badge (it also appears in the tracking timeline).
    expect(screen.getAllByText("Confirmed").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Order #AU1234567890")).toBeInTheDocument();
  });

  it("shows the line items from the fixture", async () => {
    const order = buildServerOrder();
    await renderTrackedOrder(order);
    expect(screen.getByText("Test Sofa")).toBeInTheDocument();
    expect(screen.getByText("Oak Coffee Table")).toBeInTheDocument();
    expect(screen.getByText("Qty: 2")).toBeInTheDocument();
    expect(screen.getByText("Qty: 1")).toBeInTheDocument();
    // Subtotal and Total both render the fixture total (NPR 38,000,
    // via the FE-63 formatNPR helper — NPR code + fixed en-NP grouping).
    expect(screen.getAllByText("NPR 38,000").length).toBeGreaterThanOrEqual(1);
  });
});

describe("FE-39 contract: dates derive from createdAt", () => {
  it('(a) the "Placed on" date equals the fixture\'s createdAt date', async () => {
    const order = buildServerOrder();
    await renderTrackedOrder(order);
    // Today the page formats order.orderedAt, which the server does not
    // send, so this renders "Placed on N/A" and this assertion fails.
    expect(
      screen.getByText(`Placed on ${formatDate(order.createdAt)}`)
    ).toBeInTheDocument();
  });

  it("(b) the estimated-delivery date is computed from createdAt (+7 days)", async () => {
    const order = buildServerOrder();
    await renderTrackedOrder(order);
    const expectedEta = formatDate(
      new Date(new Date(order.createdAt).getTime() + 7 * DAY_MS)
    );
    // Today getEstimatedDelivery() falls back to `new Date()` when
    // orderedAt is missing (TrackOrderPage.jsx:115), so the rendered ETA
    // is today + 7 days — 10 days later than expectedEta — and this
    // assertion fails.
    expect(screen.getByText(expectedEta)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// FE-39 fix regression cases (appended in Phase 1 with the fix).
// ---------------------------------------------------------------------------

describe("FE-39 fix: no createdAt means no fabricated dates", () => {
  it("(a) createdAt missing → 'Placed on N/A' and an 'N/A' estimate, never today-derived dates", async () => {
    const order = buildServerOrder();
    delete order.createdAt;
    await renderTrackedOrder(order);
    // The honest empty state the page already had for a missing date.
    expect(screen.getByText("Placed on N/A")).toBeInTheDocument();
    expect(screen.getByText("Est. Delivery")).toBeInTheDocument();
    expect(screen.getByText("N/A")).toBeInTheDocument();
    // No date may be fabricated from today: neither today itself nor
    // the old buggy today + 7 days estimate may appear anywhere.
    expect(screen.queryByText(formatDate(Date.now()))).toBeNull();
    expect(
      screen.queryByText(formatDate(Date.now() + 7 * DAY_MS))
    ).toBeNull();
  });
});

describe("FE-39 fix: every status in the server shape renders correctly", () => {
  const STATUS_CASES = [
    ["pending", "Pending"],
    ["confirmed", "Confirmed"],
    ["processing", "Processing"],
    ["shipped", "Shipped"],
    ["delivered", "Delivered"],
    ["cancelled", "Cancelled"],
  ];

  for (const [status, label] of STATUS_CASES) {
    it(`(b) status "${status}" renders its badge and correct dates`, async () => {
      const order = buildServerOrder();
      order.orderStatus = status;
      if (status === "delivered") {
        // Delivered 5 days after creation: the delivery info must show
        // the actual deliveredAt under "Delivered On", not an estimate.
        order.deliveredAt = new Date(
          new Date(order.createdAt).getTime() + 5 * DAY_MS
        ).toISOString();
      }
      await renderTrackedOrder(order);

      // Status badge (label also appears in the timeline for
      // non-cancelled orders, hence >= 1).
      expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1);
      // Placed-on is anchored to createdAt for every status.
      expect(
        screen.getByText(`Placed on ${formatDate(order.createdAt)}`)
      ).toBeInTheDocument();

      if (status === "cancelled") {
        // The page suppresses the tracking timeline for cancelled orders.
        expect(screen.queryByText("Order Tracking")).toBeNull();
      } else if (status === "delivered") {
        expect(screen.getByText("Delivered On")).toBeInTheDocument();
        expect(
          screen.getByText(formatDate(order.deliveredAt))
        ).toBeInTheDocument();
      } else {
        expect(screen.getByText("Est. Delivery")).toBeInTheDocument();
        const expectedEta = formatDate(
          new Date(new Date(order.createdAt).getTime() + 7 * DAY_MS)
        );
        expect(screen.getByText(expectedEta)).toBeInTheDocument();
      }
    });
  }
});

describe("FE-39 PEN-TEST: legacy fields in the response are ignored", () => {
  it("(c) a response with ONLY legacy fields renders no address block, no discount label, and no legacy date", async () => {
    const order = buildServerOrder();
    delete order.createdAt;
    // Legacy-only payload: a distinctive past order date, a populated
    // address and a discount code — and NO createdAt. A page that still
    // read any of these fields would surface the distinctive values.
    order.orderedAt = "2001-02-03T00:00:00.000Z";
    order.discountAmount = 5000;
    order.discountCode = { code: "LEGACYCODE99" };
    order.shippingAddress = {
      fullName: "Legacy Person",
      addressLine1: "999 Legacy Lane",
      addressLine2: "Suite 9",
      city: "Legacyville",
      state: "LG",
      postalCode: "99999",
      country: "Legacyland",
      phone: "9800000000",
    };
    await renderTrackedOrder(order);

    // The order itself still renders (the pen-test payload is otherwise
    // a valid tracking response).
    expect(screen.getByText("Order #AU1234567890")).toBeInTheDocument();

    // No address block: neither its heading nor any distinctive value.
    expect(screen.queryByText("Shipping Address")).toBeNull();
    expect(screen.queryByText("Legacy Person")).toBeNull();
    expect(screen.queryByText("999 Legacy Lane")).toBeNull();
    expect(screen.queryByText(/Legacyville/)).toBeNull();
    expect(screen.queryByText("Legacyland")).toBeNull();
    expect(screen.queryByText(/9800000000/)).toBeNull();

    // The discount row still renders (discountAmount IS in the server
    // shape) but with no discount-code label.
    expect(screen.getByText("Discount")).toBeInTheDocument();
    expect(screen.getByText("-NPR 5,000")).toBeInTheDocument();
    expect(screen.queryByText(/LEGACYCODE99/)).toBeNull();

    // The legacy order date must NOT be presented as the placed-on
    // date, nor drive the estimate (legacy date + 7 days).
    expect(screen.getByText("Placed on N/A")).toBeInTheDocument();
    expect(screen.queryByText(formatDate(order.orderedAt))).toBeNull();
    expect(
      screen.queryByText(
        formatDate(new Date(order.orderedAt).getTime() + 7 * DAY_MS)
      )
    ).toBeNull();
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });
});
