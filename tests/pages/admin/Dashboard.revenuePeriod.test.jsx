import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// FE-38 — Dashboard wiring for the RevenueChart period control: the
// page owns the period state, derives the server's `days` parameter
// from it, and feeds useRevenueAnalytics(days) — so picking a period
// visibly re-queries with the new window. RevenueChart itself is
// stubbed here to a control that surfaces the props it receives (its
// own rendering is pinned in RevenueChart.periodControl.test.jsx).

vi.mock("../../../src/hooks/admin/useAnalyticsTan.js", () => ({
  useDashboardStats: vi.fn(),
  useRevenueAnalytics: vi.fn(),
  useCategorySales: vi.fn(),
  useTopProducts: vi.fn(),
}));

vi.mock("../../../src/hooks/order/useOrderTan.js", () => ({
  useAllOrders: vi.fn(),
}));

vi.mock("../../../src/store/authStore.js", () => ({
  default: () => ({ user: { firstName: "Test" } }),
}));

vi.mock("../../../src/components/admin/dashboard/RevenueChart.jsx", () => ({
  default: ({ period, onPeriodChange }) => (
    <div>
      <span data-testid="period">{period}</span>
      <button onClick={() => onPeriodChange("this-year")}>
        pick this year
      </button>
      <button onClick={() => onPeriodChange("last-3-months")}>
        pick 3 months
      </button>
    </div>
  ),
}));
vi.mock(
  "../../../src/components/admin/dashboard/CategorySalesChart.jsx",
  () => ({ default: () => null }),
);
vi.mock(
  "../../../src/components/admin/dashboard/RecentOrdersTable.jsx",
  () => ({ default: () => null }),
);
vi.mock("../../../src/components/admin/dashboard/QuickActions.jsx", () => ({
  default: () => null,
}));
vi.mock("../../../src/components/admin/dashboard/SupportOverview.jsx", () => ({
  default: () => null,
}));
vi.mock("../../../src/components/admin/dashboard/AIInsights.jsx", () => ({
  default: () => null,
}));
vi.mock("../../../src/components/admin/dashboard/StatCard.jsx", () => ({
  default: () => null,
}));

import {
  useDashboardStats,
  useRevenueAnalytics,
  useCategorySales,
  useTopProducts,
} from "../../../src/hooks/admin/useAnalyticsTan.js";
import { useAllOrders } from "../../../src/hooks/order/useOrderTan.js";
import Dashboard from "../../../src/pages/admin/Dashboard.jsx";

const loaded = (value) => ({ data: value, isLoading: false });

beforeEach(() => {
  vi.clearAllMocks();
  useDashboardStats.mockReturnValue(
    loaded({
      data: {
        totalRevenue: 1,
        totalOrders: 1,
        totalProducts: 1,
        totalUsers: 1,
      },
    }),
  );
  useRevenueAnalytics.mockReturnValue(loaded({ data: { chartData: [] } }));
  useCategorySales.mockReturnValue(loaded({ data: { salesByCategory: [] } }));
  useTopProducts.mockReturnValue(loaded({ data: { topProducts: [] } }));
  useAllOrders.mockReturnValue(loaded({ data: { orders: [] } }));
});

describe("Dashboard revenue period wiring (FE-38)", () => {
  it("queries revenue with the default 30-day window and period 'last-30'", async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );
    // PERF-021: RevenueChart is React.lazy — await its (mocked) chunk.
    expect(await screen.findByTestId("period")).toHaveTextContent("last-30");
    expect(useRevenueAnalytics).toHaveBeenCalledWith(30);
  });

  it("clicking a different period re-queries with that period's day count", () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /pick 3 months/i }));
    expect(screen.getByTestId("period")).toHaveTextContent("last-3-months");
    expect(useRevenueAnalytics).toHaveBeenCalledWith(90);

    fireEvent.click(screen.getByRole("button", { name: /pick this year/i }));
    const now = new Date();
    const jan1 = new Date(now.getFullYear(), 0, 1);
    const expectedDays = Math.min(365, Math.floor((now - jan1) / 86400000) + 1);
    expect(useRevenueAnalytics).toHaveBeenCalledWith(expectedDays);
    expect(screen.getByTestId("period")).toHaveTextContent("this-year");
  });
});
