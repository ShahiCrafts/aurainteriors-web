// Regression — product details page: the main gallery image rendered
// as a broken-image icon while the magnifier lens (same photo) worked.
//
// Root cause: ImageMagnifier.sanitizeSrcSet split the srcset on ",",
// but Cloudinary candidate URLs contain commas themselves
// (transformation segments like "w_600,q_auto,f_webp"). Every
// candidate was shredded into invalid fragments, and because a
// present srcset overrides `src`, the browser loaded only the broken
// candidates. The lens uses `src` alone, so it kept working.
//
// Contract pinned here: a srcset whose URLs contain commas passes
// through the sanitizer byte-identical (every URL is allowlisted),
// and candidates that fail media validation are still dropped.
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ImageMagnifier from "../../../src/components/shop/ImageMagnifier.jsx";

const SRC =
  "https://res.cloudinary.com/dcdvtwcce/image/upload/v1793249952/aura-interiors/seed/seed-luxury-living-room.webp";
const SRCSET = [600, 1200, 1920]
  .map(
    (w) =>
      `https://res.cloudinary.com/dcdvtwcce/image/upload/w_${w},q_auto,f_webp/v1793249952/aura-interiors/seed/seed-luxury-living-room.webp ${w}w`,
  )
  .join(", ");

describe("ImageMagnifier srcset sanitising (comma-in-URL regression)", () => {
  it("keeps Cloudinary transformation candidates intact", () => {
    const { container } = render(
      <ImageMagnifier src={SRC} srcSet={SRCSET} alt="Sofa" />,
    );
    const img = container.querySelector("img");
    expect(img.getAttribute("src")).toBe(SRC);
    expect(img.getAttribute("srcset")).toBe(SRCSET);
  });

  it("still drops candidates that fail media validation", () => {
    const mixed = `${SRCSET}, https://evil.example.com/x.jpg 2400w`;
    const { container } = render(
      <ImageMagnifier src={SRC} srcSet={mixed} alt="Sofa" />,
    );
    const img = container.querySelector("img");
    expect(img.getAttribute("srcset")).toBe(SRCSET);
  });
});
