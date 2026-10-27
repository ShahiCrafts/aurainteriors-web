// PromoCard (Part 2 of the components program) — layout and
// safety pins: the text block is first in the DOM and the card is
// a column on small screens (text first, image below) and a row
// from md up, with imagePosition flipping the row direction only;
// the CTA runs through safeActionUrl, so an unsafe href renders
// inert text instead of a link.

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
    </MemoryRouter>
  );
}

describe("PromoCard", () => {
  it("renders text left / image right by default and stacks on small screens", () => {
    const { container } = renderCard();
    const card = container.querySelector("article");
    // Column (stacked) by default, row from md up.
    expect(card.className).toContain("flex-col");
    expect(card.className).toContain("md:flex-row");
    expect(card.className).not.toContain("md:flex-row-reverse");
    // Text block precedes the image in the DOM, so the mobile
    // stack reads text first and the desktop row starts with it.
    const text = screen.getByText("Tables That Anchor the Room");
    const img = screen.getByAltText(image.alt);
    expect(
      text.compareDocumentPosition(img) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("imagePosition='left' flips the desktop row but keeps the DOM order", () => {
    const { container } = renderCard({ imagePosition: "left" });
    const card = container.querySelector("article");
    expect(card.className).toContain("md:flex-row-reverse");
    const text = screen.getByText("Tables That Anchor the Room");
    const img = screen.getByAltText(image.alt);
    expect(
      text.compareDocumentPosition(img) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
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
