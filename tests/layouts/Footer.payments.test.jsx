// Footer "We Accept" — the four payment marks are the brands'
// official logos bundled locally (src/assets/images/payments/),
// NOT fetched from third-party URLs at runtime (the old favpng
// eSewa JPG showed a fake-transparency checkerboard and the
// khaltibyime blog PNG now 404s). Visa was previously a styled
// text span; it is a real logo image now like the others.

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../src/components/sections/BrandMarquee.jsx", () => ({
  default: () => null,
}));

import Footer from "../../src/layouts/customer/Footer";

describe("footer We Accept — locally bundled official logos", () => {
  it("renders all four payment logos as local images", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    for (const brand of ["eSewa", "Khalti", "Mastercard", "Visa"]) {
      const img = screen.getByRole("img", { name: brand });
      const src = img.getAttribute("src") || "";
      expect(src, `${brand} must not be hot-linked`).not.toMatch(
        /^https?:\/\//,
      );
      expect(src.length).toBeGreaterThan(0);
    }
    // No remote payment-logo hosts remain anywhere in the footer.
    const remoteLogos = screen
      .getAllByRole("img")
      .map((img) => img.getAttribute("src") || "")
      .filter((src) =>
        /favpng\.com|khaltibyime|upload\.wikimedia\.org/.test(src),
      );
    expect(remoteLogos).toEqual([]);
  });

  it("fits all four logos in one full-width row, ends flush", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    // Width-share sizing, computed for equal artwork area:
    // w ∝ √(aspect ÷ (contentW × contentH)) from measuring each
    // file's content occupancy (Khalti's canvas is 30% whitespace;
    // the earlier eyeballed 29/19/15/15 shares left Visa's artwork
    // at ~1/3 of eSewa's area).
    const widths = {
      eSewa: "w-[24.5%]",
      Khalti: "w-[22.1%]",
      Mastercard: "w-[13.9%]",
      Visa: "w-[21.5%]",
    };
    for (const [brand, cls] of Object.entries(widths)) {
      expect(screen.getByRole("img", { name: brand }).className).toContain(
        cls,
      );
    }
    // One nowrap row spanning the column, first logo flush left and
    // last logo flush right — its end aligns with the App Store
    // badge's end in the row above.
    const row = screen.getByRole("img", { name: "eSewa" }).parentElement;
    expect(row.className).toContain("flex-nowrap");
    expect(row.className).toContain("justify-between");
    expect(row.className).toContain("w-full");
    expect(row.className).not.toContain("flex-wrap");
  });
});
