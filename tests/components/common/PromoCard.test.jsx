// PromoCard — layout and safety pins for the current design: a
// full-bleed background image (absolute inset-0 layer) under a
// gradient, with the text block overlaid (relative z-10). The old
// flex-row layout contract (flex-col / md:flex-row, and the
// imagePosition prop that flipped the row) was replaced by this
// overlay design — those two cases were rewritten to pin the new
// contract (variant-driven image placement) instead. The CTA runs
// through safeActionUrl, so an unsafe href renders inert text
// instead of a link.

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import PromoCard from "../../../src/components/common/PromoCard.jsx";

const image = {
  src: "/promo-1200.webp",
  srcSet: "/promo-600.webp 600w, /promo-1200.webp 1200w",
  sizes: "(max-width: 767px) 100vw, 60vw",
  width: 1200,
  height: 800,
  alt: "Walnut coffee table in a sunlit living room",
};

function renderCard(props = {}) {
  return render(
    <MemoryRouter>
      <PromoCard
        eyebrow="The Table Edit"
        title="Tables That Anchor the Room"
        description="Solid-wood tables for every room."
        ctaLabel="Shop Tables"
        ctaHref="/shop?categories=coffee-tables"
        image={image}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("PromoCard", () => {
  it("renders a full-bleed background image with the text overlaid", () => {
    const { container } = renderCard();
    const card = container.querySelector("article");
    // Overlay design: the card is a positioned, clipped surface —
    // there is no flex row to flip any more.
    expect(card.className).toContain("relative");
    expect(card.className).toContain("overflow-hidden");
    expect(card.className).not.toContain("md:flex-row");
    // The image sits in an absolutely-positioned full-bleed layer…
    const img = screen.getByAltText(image.alt);
    const imageLayer = img.closest("div");
    expect(imageLayer.className).toContain("absolute");
    expect(imageLayer.className).toContain("inset-0");
    // …and the text block paints above it (relative + z-10).
    const heading = screen.getByRole("heading", {
      name: "Tables That Anchor the Room",
    });
    const textBlock = heading.parentElement;
    expect(textBlock.className).toContain("relative");
    expect(textBlock.className).toContain("z-10");
    // Default (primary) variant gives the text the wide column.
    expect(textBlock.className).toContain("max-w-[520px]");
  });

  it("variant='secondary' confines the image to a right-side panel and narrows the text", () => {
    const { container } = renderCard({ variant: "secondary" });
    const img = screen.getByAltText(image.alt);
    // Secondary: image lives in a right-anchored 85%-width panel
    // instead of the primary full-bleed layer.
    const panel = img.parentElement;
    expect(panel.className).toContain("absolute");
    expect(panel.className).toContain("right-0");
    expect(panel.className).toContain("w-[85%]");
    const heading = screen.getByRole("heading", {
      name: "Tables That Anchor the Room",
    });
    expect(heading.parentElement.className).toContain("max-w-[310px]");
    expect(container.querySelector("article")).not.toBeNull();
  });

  it("renders the image with explicit dimensions, srcSet and lazy loading", () => {
    renderCard();
    const img = screen.getByAltText(image.alt);
    expect(img.getAttribute("width")).toBe("1200");
    expect(img.getAttribute("height")).toBe("800");
    expect(img.getAttribute("srcset")).toContain("600w");
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(img.getAttribute("decoding")).toBe("async");
  });

  it("links the CTA through the safe-URL helper for a good in-app href", () => {
    renderCard();
    const cta = screen.getByRole("link", { name: /Shop Tables/ });
    expect(cta).toHaveAttribute("href", "/shop?categories=coffee-tables");
  });

  it("rejects a bad URL: no link is rendered, the label stays as inert text", () => {
    renderCard({ ctaHref: "javascript:alert(1)" });
    expect(screen.queryByRole("link", { name: /Shop Tables/ })).toBeNull();
    const label = screen.getByText("Shop Tables");
    expect(label.closest("[aria-disabled='true']")).not.toBeNull();
  });
});
