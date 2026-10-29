// SEC-003 (remediation): the admin Excel export was migrated from the
// unmaintained SheetJS `xlsx` tarball to exceljs. These tests pin the
// data-shaping (columns, sheet names, order) and prove the generated
// workbook round-trips through exceljs's own reader with the same
// sheets/headers/values.
import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import {
  createExcelBuffer,
  dashboardReportData,
  salesReportData,
} from "../../src/utils/adminExcelExport";

const formatDate = (d) => `D:${d}`;

describe("adminExcelExport data shaping", () => {
  it("should shape the dashboard report with the original sheets and columns", () => {
    const sheets = dashboardReportData({
      stats: {
        totalRevenue: 100,
        totalOrders: 3,
        totalProducts: 9,
        totalUsers: 7,
      },
      topProducts: [{ name: "Sofa", sales: 2, revenue: 50 }],
      recentOrders: [
        {
          orderId: "ORD-1",
          user: { fullName: "Asha" },
          orderStatus: "delivered",
          total: 50,
          createdAt: "2026-01-01",
        },
        {
          orderId: "ORD-2",
          guestInfo: { firstName: "Guest" },
          orderStatus: "pending",
          total: 10,
          createdAt: "2026-01-02",
        },
      ],
      formatDate,
    });
    expect(sheets.map((s) => s.name)).toEqual([
      "Overview",
      "Top Products",
      "Recent Orders",
    ]);
    expect(sheets[0].rows).toEqual([
      { Metric: "Net Revenue", Value: 100 },
      { Metric: "Total Orders", Value: 3 },
      { Metric: "Total Products", Value: 9 },
      { Metric: "Total Customers", Value: 7 },
    ]);
    expect(sheets[1].rows).toEqual([
      { Name: "Sofa", Deals: 2, "Total Value": 50 },
    ]);
    expect(sheets[2].rows[0]).toEqual({
      "Order ID": "ORD-1",
      Customer: "Asha",
      Status: "delivered",
      Total: 50,
      Date: "D:2026-01-01",
    });
    expect(sheets[2].rows[1].Customer).toBe("Guest");
  });

  it("should shape the sales report with the original columns", () => {
    const sheets = salesReportData([
      { _id: "2026-01-01", revenue: 10, orders: 2, items: 3 },
    ]);
    expect(sheets).toEqual([
      {
        name: "Sales Report",
        rows: [{ Date: "2026-01-01", Revenue: 10, Orders: 2, ItemsSold: 3 }],
      },
    ]);
  });

  it("should generate a workbook that reads back with the same sheets and headers", async () => {
    const buffer = await createExcelBuffer(
      dashboardReportData({
        stats: {
          totalRevenue: 100,
          totalOrders: 3,
          totalProducts: 9,
          totalUsers: 7,
        },
        topProducts: [],
        recentOrders: [],
        formatDate,
      }),
    );
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);
    expect(wb.worksheets.map((w) => w.name)).toEqual([
      "Overview",
      "Top Products",
      "Recent Orders",
    ]);
    const overview = wb.getWorksheet("Overview");
    const rowValues = (row) =>
      row.values.filter((v) => v !== undefined && v !== null);
    expect(rowValues(overview.getRow(1))).toEqual(["Metric", "Value"]);
    expect(rowValues(overview.getRow(2))).toEqual(["Net Revenue", 100]);
  });
});
