// 404 page — the hand-rolled animated SVG "404" text was replaced
// (2026-11-03, owner-supplied artwork) with the owner's Lottie file
// Market_research.lottie, played by the self-hosted lottie-web
// player from the JSON bundled at src/assets/not-found/.
// lottie-web is mocked: jsdom has no real animation engine, and the
// contract under test is that the page mounts the animation with
// the bundled data — not the player's internals.

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const loadAnimation = vi.fn(() => ({ destroy: vi.fn() }));
vi.mock("lottie-web", () => ({ default: { loadAnimation } }));

vi.mock("../../../src/layouts/customer/Navbar", () => ({
  default: () => null,
}));
vi.mock("../../../src/layouts/customer/Footer", () => ({
  default: () => null,
}));
vi.mock("../../../src/components/common/Seo.jsx", () => ({
  default: () => null,
}));

import NotFoundPage from "../../../src/pages/info/NotFoundPage";

describe("NotFoundPage — Lottie 404 animation", () => {
  it("plays the bundled Market Research animation, looping", async () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("img", { name: /magnifying glass/i }),
    ).toBeInTheDocument();
    expect(loadAnimation).toHaveBeenCalledTimes(1);
    const config = loadAnimation.mock.calls[0][0];
    expect(config.loop).toBe(true);
    expect(config.autoplay).toBe(true);
    expect(config.animationData?.nm).toBe("Market research");
    // The old hand-rolled animated text is gone.
    expect(screen.queryByText("404")).not.toBeInTheDocument();
    // Heading and escape hatch are unchanged.
    expect(
      screen.getByRole("heading", { name: "Page Not Found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Go Back Home/i }),
    ).toHaveAttribute("href", "/");
  });
});
