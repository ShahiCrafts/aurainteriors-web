import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// FE-38 — RevenueChart's period <select> had no value/onChange/state:
// an admin could pick 'This Year' and nothing changed, while the
// subtitle permanently claimed 'last 30 days'. Disposition: WIRE —
// the period genuinely can drive the data: Dashboard's
// useRevenueAnalytics(days) → GET /analytics/revenue?days=N, and the
// server (read-only, controllers/analytics.controller.js
// getRevenueAnalytics) honours days, clamped to 1..365 with a 30-day
// default. The select is now controlled by Dashboard state and the
// subtitle states the selected window.

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: ({ children }) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

import RevenueChart from "../../../../src/components/admin/dashboard/RevenueChart.jsx";
import { revenuePeriodDays } from "../../../../src/utils/revenuePeriod.js";

const data = [
  { date: "2026-10-20", revenue: 1200, orders: 3 },
  { date: "2026-10-21", revenue: 2400, orders: 5 },
];

describe("RevenueChart period control (FE-38)", () => {
  it("the select is controlled by the period prop and the subtitle states that window", () => {
    render(
      <RevenueChart data={data} period="this-year" onPeriodChange={vi.fn()} />,
    );
    expect(screen.getByLabelText(/revenue period/i)).toHaveValue("this-year");
    expect(
      screen.getByText(/revenue trend for this year/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/revenue trend over the last 30 days/i),
    ).not.toBeInTheDocument();
  });

  it("the default period is last-30 and its subtitle says so", () => {
    render(
      <RevenueChart data={data} period="last-30" onPeriodChange={vi.fn()} />,
    );
    expect(screen.getByLabelText(/revenue period/i)).toHaveValue("last-30");
    expect(
      screen.getByText(/revenue trend over the last 30 days/i),
    ).toBeInTheDocument();
  });

  it("changing the select reports the new period to the owner of the query", () => {
    const onPeriodChange = vi.fn();
    render(
      <RevenueChart
        data={data}
        period="last-30"
        onPeriodChange={onPeriodChange}
      />,
    );
    fireEvent.change(screen.getByLabelText(/revenue period/i), {
      target: { value: "last-3-months" },
    });
    expect(onPeriodChange).toHaveBeenCalledTimes(1);
    expect(onPeriodChange).toHaveBeenCalledWith("last-3-months");
  });

  it("offers exactly the four periods the audit found rendered-but-dead", () => {
    render(
      <RevenueChart data={data} period="last-30" onPeriodChange={vi.fn()} />,
    );
    const options = [
      ...screen.getByLabelText(/revenue period/i).querySelectorAll("option"),
    ].map((o) => o.textContent);
    expect(options).toEqual([
      "Last 30 Days",
      "This Month",
      "Last 3 Months",
      "This Year",
    ]);
  });
});

describe("revenuePeriodDays — period → server days parameter (FE-38)", () => {
  const oct24 = new Date(2026, 9, 24); // 2026-10-24 local
  it("maps the fixed windows", () => {
    expect(revenuePeriodDays("last-30", oct24)).toBe(30);
    expect(revenuePeriodDays("last-3-months", oct24)).toBe(90);
  });
  it("'this month' is the days elapsed this month (server counts back N days)", () => {
    expect(revenuePeriodDays("this-month", oct24)).toBe(24);
    expect(revenuePeriodDays("this-month", new Date(2026, 0, 1))).toBe(1);
  });
  it("'this year' is the days elapsed this year, within the server's 1..365 clamp", () => {
    expect(revenuePeriodDays("this-year", oct24)).toBe(297); // Jan 1..Oct 24 2026 inclusive
    expect(revenuePeriodDays("this-year", new Date(2026, 0, 1))).toBe(1);
    expect(revenuePeriodDays("this-year", new Date(2026, 11, 31))).toBe(365);
  });
  it("an unknown period falls back to the server's own default of 30", () => {
    expect(revenuePeriodDays("nonsense", oct24)).toBe(30);
    expect(revenuePeriodDays(undefined, oct24)).toBe(30);
  });
});
