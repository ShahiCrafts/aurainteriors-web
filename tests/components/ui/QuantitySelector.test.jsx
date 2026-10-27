// Phase 4 (REUSE-010) — QuantitySelector steppers, bounds and typed input.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import QuantitySelector from "../../../src/components/ui/QuantitySelector.jsx";

describe("QuantitySelector", () => {
  it("increments and decrements through onChange", () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={2} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(onChange).toHaveBeenCalledWith(3);
    fireEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("disables decrement at min and clamps at max (stock cap)", () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={1} min={1} max={4} onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "99" } });
    fireEvent.blur(screen.getByLabelText("Quantity"));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("disables increment at max", () => {
    render(<QuantitySelector value={4} max={4} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Increase quantity" })).toBeDisabled();
  });

  it("commits a typed value on Enter and ignores an emptied draft", () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={2} onChange={onChange} />);
    const input = screen.getByLabelText("Quantity");
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(5);

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue("2");
  });

  it("disabled disables both steppers and the input", () => {
    render(<QuantitySelector value={2} onChange={vi.fn()} disabled />);
    expect(screen.getByRole("button", { name: "Increase quantity" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeDisabled();
    expect(screen.getByLabelText("Quantity")).toBeDisabled();
  });
});
