// Hero marketing copy — history: the original hero rendered an
// aggregate rating ("4.9/5 (2k+ Reviews)" with five filled stars), a
// "Starting from" price per slide, and a struck-through sale price
// pair on the Calmora card. The FE-14/FE-63 remediation removed all
// of it as unsourced (static component, no data behind the numbers).
// On 2026-10-26 the owner directed that the original hero copy be
// restored as editorial content, matching the live site — the same
// kind of owner reversal as the TrustBanner sale countdown. This
// test pins the restored state: the rating, the starting price and
// the Calmora prices render again, alongside the genuine content
// (headline, CTAs, shop links) that never changed.
//
// Currency update (2026-10-27): the owner directed the hero prices
// render in NPR instead of INR. The amounts are unchanged; the
// strings now come from formatNPR (utils/formatCurrency), so the
// expectations below pin "NPR 7,499" style output, not "₹7,499".

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Hero from "../../../src/components/sections/Hero.jsx";

describe("Hero: owner-restored rating and pricing render", () => {
  it("renders the aggregate rating and Starting-from price on the main card", () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>,
    );

    expect(screen.getByText(/4\.9\/5 \(2k\+ Reviews\)/)).toBeInTheDocument();
    expect(screen.getByText(/Starting from/)).toBeInTheDocument();
    expect(screen.getByText(/NPR\s7,499/)).toBeInTheDocument();
  });

  it("renders the Calmora card's struck-through and sale prices", () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>,
    );

    expect(screen.getByText("Calmora Bed Frame")).toBeInTheDocument();
    expect(screen.getByText(/NPR\s24,999/)).toBeInTheDocument();
    expect(screen.getByText(/NPR\s19,999/)).toBeInTheDocument();
  });

  it("still renders the genuine hero content and shop links", () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>,
    );

    expect(screen.getByText(/That Fits You/)).toBeInTheDocument();
    expect(screen.getByText("Explore Now")).toBeInTheDocument();
    expect(screen.getByText("Shop Beds")).toBeInTheDocument();
    expect(screen.getByText("Shop Sale")).toBeInTheDocument();
  });
});
