// Phase 4 (REUSE-009) — EmptyState render contract.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Heart } from "lucide-react";

import EmptyState from "../../../src/components/ui/EmptyState.jsx";

describe("EmptyState", () => {
  it("renders title, description, icon and action", () => {
    const { container } = render(
      <EmptyState
        icon={<Heart size={24} />}
        title="Your wishlist is empty"
        description="Save pieces you love and they will show up here."
        action={<a href="/shop">Browse the shop</a>}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Your wishlist is empty" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Save pieces you love and they will show up here."),
    ).toBeInTheDocument();
    expect(container.querySelector("svg.lucide-heart")).not.toBeNull();
    expect(
      screen.getByRole("link", { name: "Browse the shop" }),
    ).toBeInTheDocument();
  });

  it("renders just the title when optional props are omitted", () => {
    const { container } = render(<EmptyState title="No results" />);
    expect(
      screen.getByRole("heading", { name: "No results" }),
    ).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();
  });
});
