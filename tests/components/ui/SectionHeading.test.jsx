// Phase 4 (REUSE-012) — SectionHeading render contract.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import SectionHeading from "../../../src/components/ui/SectionHeading.jsx";

describe("SectionHeading", () => {
  it("renders eyebrow, title as h2, and subtitle", () => {
    render(
      <SectionHeading
        eyebrow="Featured Products"
        title="Handpicked for Your Home"
        subtitle="Explore our most loved pieces."
      />,
    );
    expect(screen.getByText("Featured Products")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Handpicked for Your Home" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Explore our most loved pieces.")).toBeInTheDocument();
  });

  it("renders the optional trailing action", () => {
    render(<SectionHeading title="Blog" action={<a href="/blog">View all</a>} />);
    expect(screen.getByRole("link", { name: "View all" })).toHaveAttribute("href", "/blog");
  });

  it("centres the text block when align=center and no action", () => {
    const { container } = render(<SectionHeading title="Hello" align="center" />);
    expect(container.querySelector(".text-center")).not.toBeNull();
  });
});
