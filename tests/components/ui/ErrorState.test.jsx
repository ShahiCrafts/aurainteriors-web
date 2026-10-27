// Phase 4 (REUSE-009) — ErrorState render + retry contract.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import ErrorState from "../../../src/components/ui/ErrorState.jsx";

describe("ErrorState", () => {
  it("renders the default title inside an alert region", () => {
    render(<ErrorState message="The catalog could not be loaded." />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("The catalog could not be loaded.")).toBeInTheDocument();
  });

  it("calls onRetry when the retry button is clicked", () => {
    const onRetry = vi.fn();
    render(<ErrorState title="Failed to load orders" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders no retry button without onRetry, and supports a custom label", () => {
    const { rerender } = render(<ErrorState />);
    expect(screen.queryByRole("button")).toBeNull();

    rerender(<ErrorState onRetry={vi.fn()} retryLabel="Reload" />);
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
  });
});
