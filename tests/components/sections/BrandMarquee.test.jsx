// FE-06 — BrandMarquee must not hot-link press logos.
//
// The 5 press logos were hot-linked from the publishers' own CDNs:
// every storefront visit disclosed the visitor's IP/Referer to those
// hosts and the marquee broke whenever a publisher moved a file.
// Post-fix the logos are self-hosted under public/brands/ and the
// component renders ONLY local /brands/… srcs (or a styled text
// wordmark for any brand whose logo could not be fetched) — never an
// http(s) img src.

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

import BrandMarquee from "../../../src/components/sections/BrandMarquee.jsx";

describe("BrandMarquee (FE-06)", () => {
  it("renders only local /brands/ img srcs — no http(s) src anywhere", () => {
    const { container } = render(<BrandMarquee />);
    const imgs = [...container.querySelectorAll("img")];
    expect(imgs.length).toBeGreaterThan(0);
    for (const img of imgs) {
      const src = img.getAttribute("src");
      expect(src).not.toMatch(/^https?:\/\//);
      expect(src.startsWith("/brands/")).toBe(true);
    }
    expect(container.innerHTML).not.toContain("ekantipur.com");
    expect(container.innerHTML).not.toContain("onlinekhabar.com");
    expect(container.innerHTML).not.toContain("prixacdn.net");
    expect(container.innerHTML).not.toContain("codavatar.com");
    expect(container.innerHTML).not.toContain("setopati.com");
  });

  it("covers all five brands (logo img or wordmark) in the marquee", () => {
    const { container } = render(<BrandMarquee />);
    const alts = new Set(
      [...container.querySelectorAll("img")].map((img) => img.getAttribute("alt"))
    );
    const text = container.textContent;
    for (const brand of ["Kantipur", "Onlinekhabar", "Techpana", "Codavatar", "Setopati"]) {
      expect(alts.has(brand) || text.includes(brand)).toBe(true);
    }
  });
});
