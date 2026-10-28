// FE-14 — AIInsights must not substitute hardcoded "insights" when no data
// is provided. Pre-fix, a falsy `insights` prop was replaced by invented
// numbers (paymentIssueChange 23, topIssue "Payment Failure" x23,
// resolutionRate 88%). Those fabricated-case assertions FAIL on the
// pre-fix component.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import AIInsights from "../../../../src/components/admin/dashboard/AIInsights.jsx";

const renderInsights = (props) =>
  render(
    <MemoryRouter>
      <AIInsights {...props} />
    </MemoryRouter>,
  );

describe("AIInsights (FE-14)", () => {
  it("shows an honest empty state when no insights are provided", () => {
    renderInsights({});

    expect(screen.getByText("No insights available")).toBeInTheDocument();
    // None of the previously fabricated values may appear.
    expect(
      screen.queryByText(/Payment issues increased by 23%/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Payment Failure/)).not.toBeInTheDocument();
    expect(screen.queryByText(/23 conversations/)).not.toBeInTheDocument();
    expect(screen.queryByText("88%")).not.toBeInTheDocument();
  });

  it("shows an honest empty state when insights is explicitly null", () => {
    renderInsights({ insights: null });

    expect(screen.getByText("No insights available")).toBeInTheDocument();
    expect(screen.queryByText(/Payment Failure/)).not.toBeInTheDocument();
    expect(screen.queryByText("88%")).not.toBeInTheDocument();
  });

  it("renders real insights unchanged when data is provided", () => {
    renderInsights({
      insights: {
        paymentIssueChange: 7,
        topIssue: "Delivery Delay",
        topIssueCount: 4,
        resolutionRate: 91,
        resolutionRateChange: 2,
      },
    });

    expect(
      screen.getByText(/Payment issues increased by 7%/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Top issue: Delivery Delay/)).toBeInTheDocument();
    expect(screen.getByText(/4 conversations/)).toBeInTheDocument();
    expect(screen.getByText("91%")).toBeInTheDocument();
    expect(screen.getByText(/2% vs last week/)).toBeInTheDocument();
    expect(screen.queryByText("No insights available")).not.toBeInTheDocument();
  });
});
