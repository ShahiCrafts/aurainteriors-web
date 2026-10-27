// Phase 4 (REUSE-012) — Tabs: controlled switching, ARIA wiring, arrows.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import Tabs from "../../../src/components/ui/Tabs.jsx";

const TABS = [
  { id: "description", label: "Description" },
  { id: "reviews", label: "Reviews" },
  { id: "delivery", label: "Delivery", disabled: true },
];

function Harness({ activeId = "description", onChange = vi.fn() }) {
  return (
    <Tabs tabs={TABS} activeId={activeId} onChange={onChange} ariaLabel="Product sections">
      {(activeTab) => <p>Panel: {activeTab.id}</p>}
    </Tabs>
  );
}

describe("Tabs", () => {
  it("renders a tablist with aria-selected on the active tab only", () => {
    render(<Harness />);
    expect(screen.getByRole("tablist", { name: "Product sections" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Description" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Reviews" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Panel: description");
  });

  it("calls onChange on click and renders the new panel when controlled state updates", () => {
    const onChange = vi.fn();
    const { rerender } = render(<Harness onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Reviews" }));
    expect(onChange).toHaveBeenCalledWith("reviews");

    rerender(<Harness activeId="reviews" onChange={onChange} />);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Panel: reviews");
    expect(screen.getByRole("tab", { name: "Reviews" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("does not activate a disabled tab", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const disabled = screen.getByRole("tab", { name: "Delivery" });
    expect(disabled).toBeDisabled();
    fireEvent.click(disabled);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("arrow keys move to the next enabled tab (skipping disabled)", () => {
    const onChange = vi.fn();
    render(<Harness activeId="reviews" onChange={onChange} />);
    // Next after "reviews" wraps past disabled "delivery" to "description".
    fireEvent.keyDown(screen.getByRole("tab", { name: "Reviews" }), { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("description");
  });
});
