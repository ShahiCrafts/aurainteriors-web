// FE-29 — ImageWithFallback must follow src changes (reused table rows),
// must fall back when NO fallback prop is supplied (both real call
// sites pass none), and must not loop when the fallback itself fails.

import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import ImageWithFallback from "../../../src/components/fallbacks/ImageWithFallback";
import { FALLBACK_IMAGES } from "../../../src/utils/imageUrl";

describe("FE-29 ImageWithFallback", () => {
  it("shows the current src when the prop changes (row reuse across pages)", () => {
    const { rerender, container } = render(
      <ImageWithFallback src="https://cdn.example/product-a.jpg" alt="A" />
    );
    const img = container.querySelector("img");
    expect(img.getAttribute("src")).toBe("https://cdn.example/product-a.jpg");

    // Same component instance, new row data (pagination/sort/filter reuse)
    rerender(<ImageWithFallback src="https://cdn.example/product-b.jpg" alt="B" />);
    expect(img.getAttribute("src")).toBe("https://cdn.example/product-b.jpg");
    expect(img.getAttribute("alt")).toBe("B");
  });

  it("falls back to the default placeholder when no fallback prop is passed and the image errors", () => {
    const { container } = render(
      <ImageWithFallback src="https://cdn.example/broken.jpg" alt="broken" />
    );
    const img = container.querySelector("img");
    fireEvent.error(img);
    expect(img.getAttribute("src")).toBe(FALLBACK_IMAGES.product);
  });

  it("uses an explicitly supplied fallback when one is passed", () => {
    const { container } = render(
      <ImageWithFallback
        src="https://cdn.example/broken.jpg"
        fallback="https://cdn.example/custom-fallback.jpg"
        alt="broken"
      />
    );
    const img = container.querySelector("img");
    fireEvent.error(img);
    expect(img.getAttribute("src")).toBe("https://cdn.example/custom-fallback.jpg");
  });

  it("PEN: a failing fallback does not loop — src stays on the fallback after repeated errors", () => {
    const { container } = render(
      <ImageWithFallback src="https://cdn.example/broken.jpg" alt="broken" />
    );
    const img = container.querySelector("img");
    fireEvent.error(img); // primary fails -> fallback
    expect(img.getAttribute("src")).toBe(FALLBACK_IMAGES.product);
    fireEvent.error(img); // fallback fails too -> must not thrash/reset
    fireEvent.error(img);
    expect(img.getAttribute("src")).toBe(FALLBACK_IMAGES.product);
  });

  it("PEN: after an error+fallback, a NEW src is shown again (error state does not stick to the row)", () => {
    const { rerender, container } = render(
      <ImageWithFallback src="https://cdn.example/broken.jpg" alt="x" />
    );
    const img = container.querySelector("img");
    fireEvent.error(img);
    expect(img.getAttribute("src")).toBe(FALLBACK_IMAGES.product);

    rerender(<ImageWithFallback src="https://cdn.example/good.jpg" alt="y" />);
    expect(img.getAttribute("src")).toBe("https://cdn.example/good.jpg");
  });
});
