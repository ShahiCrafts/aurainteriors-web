// FE-17 — unguarded dereferences of server fields in admin dashboard
// widgets. Each test feeds undefined / missing-field data and expects an
// empty/placeholder render instead of a throw. All fail pre-fix.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CategorySalesChart from "../../../../src/components/admin/dashboard/CategorySalesChart.jsx";
import TopProductsTable from "../../../../src/components/admin/dashboard/TopProductsTable.jsx";
import RecentOrdersTable from "../../../../src/components/admin/dashboard/RecentOrdersTable.jsx";

describe("FE-17 dashboard guards", () => {
  it("CategorySalesChart renders with undefined data", () => {
    render(<CategorySalesChart data={undefined} />);
    expect(screen.getByText("Sales by Category")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("CategorySalesChart renders rows with a missing value", () => {
    render(<CategorySalesChart data={[{ name: "Chairs" }]} />);
    expect(screen.getByText("Chairs")).toBeInTheDocument();
  });

  it("TopProductsTable renders the empty state with undefined products", () => {
    render(
      <MemoryRouter>
        <TopProductsTable products={undefined} />
      </MemoryRouter>
    );
    expect(screen.getByText("No sales data yet")).toBeInTheDocument();
  });

  it("TopProductsTable renders a product missing sales/revenue", () => {
    render(
      <MemoryRouter>
        <TopProductsTable products={[{ _id: "p1", name: "Sofa" }]} />
      </MemoryRouter>
    );
    expect(screen.getByText("Sofa")).toBeInTheDocument();
  });

  it("RecentOrdersTable renders an order missing orderId/total", () => {
    render(
      <MemoryRouter>
        <RecentOrdersTable orders={[{ _id: "o1", orderStatus: "pending", createdAt: "2026-01-01T00:00:00.000Z" }]} />
      </MemoryRouter>
    );
    expect(screen.getByText("Recent Orders")).toBeInTheDocument();
    expect(screen.queryByText("No orders yet")).not.toBeInTheDocument();
  });
});
