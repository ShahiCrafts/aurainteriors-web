import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// TrustBanner sale countdown — history: the original card was
// removed under FE-14 because it restarted from a hardcoded start
// value on every page load with no promotion source behind it.
// The owner has since asked for the component back as the visual
// placeholder for a sale feature to be implemented later, so the
// card is restored — but the timer now counts against a REAL
// target instant (the saleEndsAt prop; end of day by default)
// instead of decrementing from invented numbers.

import TrustBanner from "../../../src/components/sections/TrustBanner.jsx";

describe("TrustBanner sale countdown (restored, owner request)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the SALE card with the four countdown units", () => {
    render(<TrustBanner />);
    expect(screen.getByText("SALE")).toBeInTheDocument();
    expect(screen.getByText("Ends In")).toBeInTheDocument();
    for (const unit of ["Days", "Hrs", "Mins", "Secs"]) {
      expect(screen.getByText(unit)).toBeInTheDocument();
    }
  });

  it("counts down to the given saleEndsAt instant, not a hardcoded start", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-26T00:00:00.000Z"));
    const endsAt = new Date("2026-10-27T02:05:07.000Z"); // +1d 2h 5m 7s
    render(<TrustBanner saleEndsAt={endsAt} />);
    expect(screen.getByText("01")).toBeInTheDocument(); // days
    expect(screen.getByText("02")).toBeInTheDocument(); // hours
    expect(screen.getByText("05")).toBeInTheDocument(); // minutes
    expect(screen.getByText("07")).toBeInTheDocument(); // seconds
  });

  it("keeps the genuine trust content", () => {
    render(<TrustBanner />);

    expect(screen.getByText("5000+ Homes")).toBeInTheDocument();
    expect(screen.getByText("Free Delivery")).toBeInTheDocument();
    expect(screen.getByText("10 Year Warranty")).toBeInTheDocument();
  });
});
