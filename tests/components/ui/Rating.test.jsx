// Phase 4 (REUSE-006) — Rating: one display convention (1 star + average
// + count); interactive mode is five labelled buttons.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import Rating from "../../../src/components/ui/Rating.jsx";

describe("Rating display mode", () => {
  it("renders one star, the average at one decimal and the count", () => {
    const { container } = render(<Rating value={4.26} count={128} />);
    expect(screen.getByText("4.3")).toBeInTheDocument();
    expect(screen.getByText("(128)")).toBeInTheDocument();
    // exactly one star icon (the single-star convention)
    expect(container.querySelectorAll("svg.lucide-star")).toHaveLength(1);
    expect(container.querySelector("svg")).toHaveClass("fill-brand");
  });

  it("omits the count when not provided", () => {
    render(<Rating value={5} />);
    expect(screen.getByText("5.0")).toBeInTheDocument();
    expect(screen.queryByText(/\(\d+\)/)).toBeNull();
  });
});

describe("Rating interactive mode", () => {
  it("renders five labelled star buttons and reports clicks", () => {
    const onChange = vi.fn();
    render(<Rating value={2} interactive onChange={onChange} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
    expect(
      screen.getByRole("button", { name: "Rate 1 star" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Rate 4 stars" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Rate 4 stars" }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("marks the current value with aria-pressed", () => {
    render(<Rating value={3} interactive onChange={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Rate 3 stars" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Rate 5 stars" }),
    ).toHaveAttribute("aria-pressed", "false");
  });
});
