// FE-38: shared revenue-period definitions for the admin dashboard's
// Sales Overview chart. Kept out of RevenueChart.jsx so that file
// exports only its component (react-refresh/only-export-components).
//
// The period genuinely drives the chart data: Dashboard feeds
// useRevenueAnalytics(days) → GET /analytics/revenue?days=N, and the
// server honours `days` (clamped to 1..365, default 30 —
// controllers/analytics.controller.js getRevenueAnalytics).
export const REVENUE_PERIODS = [
  {
    value: "last-30",
    label: "Last 30 Days",
    subtitle: "Revenue trend over the last 30 days",
  },
  {
    value: "this-month",
    label: "This Month",
    subtitle: "Revenue trend for this month to date",
  },
  {
    value: "last-3-months",
    label: "Last 3 Months",
    subtitle: "Revenue trend over the last 3 months",
  },
  {
    value: "this-year",
    label: "This Year",
    subtitle: "Revenue trend for this year to date",
  },
];

export const DEFAULT_REVENUE_PERIOD = "last-30";

// Map a period to the server's `days` parameter. The server counts
// back N days from today, so 'This Month' is the days elapsed this
// month and 'This Year' the days elapsed this year (the server
// clamps to 365; the same cap is applied here).
export function revenuePeriodDays(period, now = new Date()) {
  switch (period) {
    case "this-month":
      return now.getDate();
    case "last-3-months":
      return 90;
    case "this-year": {
      const jan1 = new Date(now.getFullYear(), 0, 1);
      const elapsed = Math.floor((now - jan1) / 86400000) + 1;
      return Math.min(365, Math.max(1, elapsed));
    }
    case "last-30":
    default:
      return 30;
  }
}
