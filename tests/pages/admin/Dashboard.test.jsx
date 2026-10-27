// FE-14 — the admin Dashboard must not present hardcoded trend percentages
// (+0.4%, +32%, 71%, +11%) or placeholder sparklines as store metrics.
//
// Server evidence (read-only, server tree): GET /analytics/stats returns
// ONLY { totalRevenue, totalOrders, totalProducts, totalUsers }
// (controllers/analytics.controller.js getDashboardStats) — there is no
// trend/growth field for any card. GET /analytics/revenue returns
// chartData[] { date, revenue, orders } — the only real series. So no
// trend indicator may be rendered for any card, and the fabricated-case
// assertions below FAIL on the pre-fix page.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

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

// Page chrome not under test: the recharts panels and unrelated widgets.
// StatCard, SupportOverview and AIInsights stay REAL.
vi.mock("../../../src/components/admin/dashboard/RevenueChart.jsx", () => ({
  default: () => null,
}));
vi.mock("../../../src/components/admin/dashboard/CategorySalesChart.jsx", () => ({
  default: () => null,
}));
vi.mock("../../../src/components/admin/dashboard/RecentOrdersTable.jsx", () => ({
  default: () => null,
}));
vi.mock("../../../src/components/admin/dashboard/QuickActions.jsx", () => ({
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

const chartData = Array.from({ length: 7 }, (_, i) => ({
  date: `2026-10-${String(18 + i).padStart(2, "0")}`,
  revenue: 1000 * (i + 1),
  orders: i + 2,
}));

const loaded = (value) => ({ data: value, isLoading: false });

beforeEach(() => {
  useDashboardStats.mockReturnValue(
    loaded({
      data: { totalRevenue: 250000, totalOrders: 42, totalProducts: 17, totalUsers: 9 },
    })
  );
  useRevenueAnalytics.mockReturnValue(loaded({ data: { chartData } }));
  useCategorySales.mockReturnValue(loaded({ data: { salesByCategory: [] } }));
  useTopProducts.mockReturnValue(loaded({ data: { topProducts: [] } }));
  useAllOrders.mockReturnValue(loaded({ data: { orders: [] } }));
});

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

describe("Dashboard (FE-14)", () => {
  it("renders the real stat values from the analytics API", () => {
    renderDashboard();

    expect(screen.getByText("Net Revenue")).toBeInTheDocument();
    expect(screen.getByText("NPR 2.5L")).toBeInTheDocument();
    expect(screen.getByText("Total Orders")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("17")).toBeInTheDocument();
    expect(screen.getByText("Customers")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("shows none of the hardcoded trend percentages or trend labels", () => {
    const { container } = renderDashboard();

    expect(screen.queryByText("+0.4%")).not.toBeInTheDocument();
    expect(screen.queryByText("+32%")).not.toBeInTheDocument();
    expect(screen.queryByText("71%")).not.toBeInTheDocument();
    expect(screen.queryByText("+11%")).not.toBeInTheDocument();
    expect(screen.queryByText("vs last month")).not.toBeInTheDocument();
    expect(screen.queryByText("vs last quarter")).not.toBeInTheDocument();
    expect(screen.queryByText("Goal: 100")).not.toBeInTheDocument();
    expect(container.textContent).not.toContain("%");
  });

  it("dashboard widgets without API data show honest empty states, not invented numbers", () => {
    renderDashboard();

    // Dashboard renders <SupportOverview /> and <AIInsights /> with no
    // data props; both must be honest about having nothing to show.
    expect(screen.getByText("No support data available")).toBeInTheDocument();
    expect(screen.getByText("No insights available")).toBeInTheDocument();
    expect(screen.queryByText(/Payment Failure/)).not.toBeInTheDocument();
  });
});
