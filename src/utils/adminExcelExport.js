// SEC-003 (remediation): admin Excel exports, migrated from the
// unmaintained SheetJS `xlsx` CDN tarball (GHSA-4r6h-8v6p-xvw6,
// GHSA-5pgg-2g8v-p4x9, no fixed release) to `exceljs`.
// The library is WRITE-ONLY here — nothing in this module reads or
// parses a spreadsheet — and it is loaded with a dynamic import() so
// it stays in its own async chunk, out of the admin entry graph.

/**
 * Pure data-shaping for the Dashboard report (kept identical to the
 * former SheetJS version: same columns, same order).
 */
export function dashboardReportData({
  stats,
  topProducts = [],
  recentOrders = [],
  formatDate,
}) {
  const overviewData = [
    { Metric: "Net Revenue", Value: stats.totalRevenue },
    { Metric: "Total Orders", Value: stats.totalOrders },
    { Metric: "Total Products", Value: stats.totalProducts },
    { Metric: "Total Customers", Value: stats.totalUsers },
  ];
  const productsData = topProducts.map((p) => ({
    Name: p.name,
    Deals: p.sales,
    "Total Value": p.revenue,
  }));
  const ordersData = recentOrders.map((o) => ({
    "Order ID": o.orderId,
    Customer: o.user?.fullName || o.guestInfo?.firstName || "Guest",
    Status: o.orderStatus,
    Total: o.total,
    Date: formatDate(o.createdAt),
  }));
  return [
    { name: "Overview", rows: overviewData },
    { name: "Top Products", rows: productsData },
    { name: "Recent Orders", rows: ordersData },
  ];
}

/** Pure data-shaping for the Sales Reports export. */
export function salesReportData(chartData = []) {
  return [
    {
      name: "Sales Report",
      rows: chartData.map((item) => ({
        Date: item._id,
        Revenue: item.revenue,
        Orders: item.orders,
        ItemsSold: item.items,
      })),
    },
  ];
}

/**
 * Build a workbook from [{ name, rows }] and return it as a Buffer /
 * Uint8Array. Column order follows the first row's key order.
 */
export async function createExcelBuffer(sheets) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  for (const { name, rows } of sheets) {
    const ws = wb.addWorksheet(name);
    if (rows.length) {
      ws.columns = Object.keys(rows[0]).map((key) => ({ header: key, key }));
      ws.addRows(rows);
    }
  }
  return wb.xlsx.writeBuffer();
}

/** Build the workbook and trigger a browser download of `fileName`. */
export async function downloadExcel(sheets, fileName) {
  const buffer = await createExcelBuffer(sheets);
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
