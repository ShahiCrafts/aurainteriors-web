// Catalog Phase 8 (VOCABULARY §4) — footer "Popular Categories"
// links must target categories that exist in the canonical seed
// taxonomy. The old hard-coded slugs (sofas / beds / wardrobes /
// tv-units) exist nowhere in the seed, so those listings were
// always empty. Mapping: sofas -> upholstered-sofas, beds ->
// bed-frames, wardrobes -> bedroom-storage; "TV Units" is hidden
// (FE-16 rule) because no TV-unit category or product exists yet.

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

describe("Phase 8 — footer category links point at canonical seed categories", () => {
  it("maps the merchandising labels onto real seed category slugs", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    expect(hrefOf("Sofas & Couches")).toBe(
      "/shop?categories=upholstered-sofas",
    );
    expect(hrefOf("King Size Beds")).toBe("/shop?categories=bed-frames");
    expect(hrefOf("Dining Table Sets")).toBe("/shop?categories=dining");
    expect(hrefOf("Wardrobes")).toBe("/shop?categories=bedroom-storage");
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
