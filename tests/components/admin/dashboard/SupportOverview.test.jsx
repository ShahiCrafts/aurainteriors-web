// FE-14 — SupportOverview must not substitute hardcoded queue numbers when
// no data is provided. Pre-fix, a falsy `stats` prop was replaced by
// invented counts (open 18, waiting 5, urgent 2, AI resolved 23). Those
// fabricated-case assertions FAIL on the pre-fix component.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import SupportOverview from "../../../../src/components/admin/dashboard/SupportOverview.jsx";

const renderOverview = (props) =>
  render(
    <MemoryRouter>
      <SupportOverview {...props} />
    </MemoryRouter>,
  );

describe("SupportOverview (FE-14)", () => {
  it("shows an honest empty state when no stats are provided", () => {
    renderOverview({});

    expect(screen.getByText("No support data available")).toBeInTheDocument();
    // None of the previously fabricated queue numbers may appear.
    expect(screen.queryByText("18")).not.toBeInTheDocument();
    expect(screen.queryByText("5")).not.toBeInTheDocument();
    expect(screen.queryByText("2")).not.toBeInTheDocument();
    expect(screen.queryByText("23")).not.toBeInTheDocument();
    expect(screen.queryByText("Open Conversations")).not.toBeInTheDocument();
  });

  it("shows an honest empty state when stats is explicitly null", () => {
    renderOverview({ stats: null });

    expect(screen.getByText("No support data available")).toBeInTheDocument();
    expect(screen.queryByText("18")).not.toBeInTheDocument();
    expect(screen.queryByText("23")).not.toBeInTheDocument();
  });

  it("renders real stats unchanged when data is provided", () => {
    renderOverview({
      stats: {
        openConversations: 3,
        waitingForHuman: 1,
        urgent: 0,
        aiResolved: 9,
      },
    });

    expect(screen.getByText("Open Conversations")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Waiting for Human")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Urgent")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("AI Resolved")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(
      screen.queryByText("No support data available"),
    ).not.toBeInTheDocument();
  });
});
