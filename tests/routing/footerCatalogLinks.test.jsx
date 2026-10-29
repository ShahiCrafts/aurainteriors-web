// Footer shop links — the footer was redesigned from the Phase-8
// "Popular Categories" merchandising labels (Sofas & Couches /
// King Size Beds / Dining Table Sets / Wardrobes) to a "Shop" column
// of ROOM links built with shopCategoryUrl(). The merchandising-
// label case below was rewritten to pin the current room-link
// contract: every label renders a link to /shop, and the hrefs of
// the slugs corroborated by in-repo canonical fixtures (seeded-
// taxonomy mirrors: living-room, bedroom; the Phase-8 contract
// itself: dining; admin category fixtures + live use: lighting)
// are pinned exactly. The remaining slugs (home-office, kids-room,
// decor, outdoor) have NO canonical evidence anywhere in this repo
// (home-office/kids-room occur only in Footer.jsx) — their exact
// hrefs are deliberately NOT blessed here; they must be verified
// against the server seed taxonomy by the owner, and if they are
// not seed categories the Footer links (not this test) are wrong.
// The Phase-8 guard that no dead hard-coded slug (sofas / beds /
// wardrobes / tv-units) is emitted still stands in the second case.

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Footer's BrandMarquee is a pure logo strip with no navigation;
// stub it so this test is about the category links (same stub as
// tests/routing/linkIntegrity.test.jsx).
vi.mock("../../src/components/sections/BrandMarquee.jsx", () => ({
  default: () => null,
}));

import Footer from "../../src/layouts/customer/Footer";

const hrefOf = (name) =>
  screen.getByRole("link", { name }).getAttribute("href");

describe("footer Shop column — room links", () => {
  it("maps each room label onto its shop categories URL", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    // Corroborated slugs: hrefs pinned exactly.
    expect(hrefOf("Living Room")).toBe("/shop?categories=living-room");
    expect(hrefOf("Bedroom")).toBe("/shop?categories=bedroom");
    expect(hrefOf("Dining")).toBe("/shop?categories=dining");
    expect(hrefOf("Lighting")).toBe("/shop?categories=lighting");
    expect(hrefOf("All Products")).toBe("/shop");
    // Unverified slugs (see header): the labels must render shop
    // links, but their category values are not blessed until the
    // owner verifies them against the server seed taxonomy.
    for (const label of ["Home Office", "Outdoor", "Decor", "Kids Room"]) {
      expect(hrefOf(label)).toMatch(/^\/shop\?categories=.+/);
    }
  });

  it("renders no link with a non-existent seed slug, and no TV Units link", () => {
    const { container } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    const hrefs = [...container.querySelectorAll("a")].map((a) =>
      a.getAttribute("href"),
    );
    for (const dead of [
      "/shop?categories=sofas",
      "/shop?categories=beds",
      "/shop?categories=wardrobes",
      "/shop?categories=tv-units",
    ]) {
      expect(hrefs).not.toContain(dead);
    }
    expect(screen.queryByRole("link", { name: "TV Units" })).toBeNull();
  });
});
