// FE-07 fallback: the chat empty-state animation is a self-contained
// CSS/SVG component (src/components/chat/DotLottieAnimation.jsx,
// default export) — no canvas, no WASM, no network fetch.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EmptyStateAnimation from "../../src/components/chat/DotLottieAnimation.jsx";

describe("chat empty-state animation (FE-07 fallback)", () => {
  it("renders a labelled decorative animation with no canvas and no external resource", () => {
    const { container } = render(<EmptyStateAnimation />);

    expect(
      screen.getByRole("img", { name: /Aura assistant is ready to chat/i }),
    ).toBeInTheDocument();
    // The three typing dots are the animated motif.
    expect(container.querySelectorAll(".animate-bounce")).toHaveLength(3);
    // No player machinery: no canvas (dotlottie renders to canvas),
    // no img/iframe/script, and no resource-loading attribute
    // pointing off-origin. (The lucide SVG's xmlns namespace
    // identifier is not a fetch and is deliberately not checked.)
    expect(container.querySelector("canvas")).toBeNull();
    expect(container.querySelector("img, iframe, script")).toBeNull();
    for (const el of container.querySelectorAll("*")) {
      for (const name of ["src", "href", "poster", "data"]) {
        const value = el.getAttribute(name);
        if (value) expect(value).not.toMatch(/https?:\/\//);
      }
    }
  });
});
