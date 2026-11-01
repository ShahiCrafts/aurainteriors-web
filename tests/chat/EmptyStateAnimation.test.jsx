// Chat empty-state animation: the owner's Lottie artwork
// (AI_logo_Foriday.lottie) played by the self-hosted lottie-web
// player from a bundled JSON asset — no CDN runtime, no WASM, no
// network fetch (the FE-07 guarantee, kept). It replaced the
// CSS/SVG typing-dots bubble on the owner's request (2026-11-01);
// the player itself is mocked here so the suite stays hermetic —
// what this test pins is the component contract: the labelled
// decorative frame, the bundled animation data handed to the
// player, and no external resource references.

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const loadAnimation = vi.hoisted(() => vi.fn(() => ({ destroy: vi.fn() })));
vi.mock("lottie-web", () => ({
  default: { loadAnimation },
}));

import EmptyStateAnimation from "../../src/components/chat/DotLottieAnimation.jsx";
import animationData from "../../src/assets/chat/ai-logo-foriday.json";

describe("chat empty-state animation (owner Lottie artwork)", () => {
  it("plays the bundled animation in a labelled decorative frame with no external resource", () => {
    const { container } = render(<EmptyStateAnimation />);

    expect(
      screen.getByRole("img", { name: /Aura assistant is ready to chat/i }),
    ).toBeInTheDocument();
    // The player receives the bundled asset (never a URL) and
    // renders it as inline SVG.
    expect(loadAnimation).toHaveBeenCalledTimes(1);
    const options = loadAnimation.mock.calls[0][0];
    expect(options.animationData).toBe(animationData);
    expect(options.path).toBeUndefined();
    expect(options.renderer).toBe("svg");
    expect(options.loop).toBe(true);
    // No resource-loading element or off-origin attribute.
    expect(container.querySelector("img, iframe, script")).toBeNull();
    for (const el of container.querySelectorAll("*")) {
      for (const name of ["src", "href", "poster", "data"]) {
        const value = el.getAttribute(name);
        if (value) expect(value).not.toMatch(/https?:\/\//);
      }
    }
  });

  it("the bundled asset is the supplied 700x700 animation", () => {
    expect(animationData.w).toBe(700);
    expect(animationData.h).toBe(700);
    expect(animationData.layers?.length).toBeGreaterThan(0);
  });
});
