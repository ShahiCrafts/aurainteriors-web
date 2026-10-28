// FE-14 — StatCard renders a trend row only when a real trend value is
// supplied. Pre-fix it always rendered the trend row (icon + spans), so a
// card with no trend still showed a trend arrow. The no-trend case FAILS
// on the pre-fix component.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DollarSign } from "lucide-react";

import StatCard from "../../../../src/components/admin/dashboard/StatCard.jsx";

describe("StatCard (FE-14)", () => {
  it("renders a real trend unchanged when one is provided", () => {
    render(
      <StatCard
        label="Net Revenue"
        value="NRs. 2.5L"
        trend="+3.2%"
        trendUp={true}
        trendLabel="vs last month"
        icon={DollarSign}
      />,
    );

    expect(screen.getByText("Net Revenue")).toBeInTheDocument();
    expect(screen.getByText("NRs. 2.5L")).toBeInTheDocument();
    expect(screen.getByText("+3.2%")).toBeInTheDocument();
    expect(screen.getByText("vs last month")).toBeInTheDocument();
  });

  it("renders no trend indicator at all when no trend is provided", () => {
    const { container } = render(<StatCard label="Total Orders" value="42" />);

    expect(screen.getByText("Total Orders")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    // No icon prop was passed, so any <svg> would be a trend arrow.
    expect(container.querySelectorAll("svg")).toHaveLength(0);
    expect(container.textContent).not.toContain("%");
  });
});
