// Phase 6 — ui/Dialog is the ui/ home of the shared Dialog
// primitive (implementation: components/common/Dialog.jsx, FE-64;
// its deep behaviour suite lives in
// tests/components/common/Dialog.test.jsx). These tests pin the
// ui import surface and the consumer shell pattern every migrated
// modal uses: consumer-rendered backdrop whose click calls the
// same onClose as Escape.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Dialog from "../../../src/components/ui/Dialog.jsx";

function Shell({ onClose = vi.fn() }) {
  return (
    <div>
      <button type="button">Trigger</button>
      <button
        type="button"
        aria-label="Backdrop"
        data-testid="backdrop"
        onClick={onClose}
      />
      <Dialog open onClose={onClose} label="Example dialog">
        <button type="button">First action</button>
        <button type="button">Second action</button>
      </Dialog>
    </div>
  );
}

beforeEach(() => {
  document.body.style.overflow = "";
});

describe("ui/Dialog (Phase 6)", () => {
  it("renders dialog semantics with the given accessible name", () => {
    render(<Shell />);
    const dialog = screen.getByRole("dialog", { name: "Example dialog" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("supports labelledBy naming (the migrated-modal pattern)", () => {
    render(
      <Dialog open onClose={vi.fn()} labelledBy="dlg-title">
        <h2 id="dlg-title">Delete address?</h2>
        <button type="button">Cancel</button>
      </Dialog>,
    );
    expect(
      screen.getByRole("dialog", { name: "Delete address?" }),
    ).toBeInTheDocument();
  });

  it("renders nothing when open is false", () => {
    render(
      <Dialog open={false} onClose={vi.fn()} label="Hidden">
        <button type="button">Nope</button>
      </Dialog>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("moves focus inside on open and traps Tab", () => {
    render(<Shell />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toContainElement(document.activeElement);
    const second = screen.getByRole("button", { name: "Second action" });
    const first = screen.getByRole("button", { name: "First action" });
    second.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(first);
  });

  it("Escape closes via onClose", () => {
    const onClose = vi.fn();
    render(<Shell onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("backdrop click closes via the same onClose (consumer shell pattern)", () => {
    const onClose = vi.fn();
    render(<Shell onClose={onClose} />);
    fireEvent.click(screen.getByTestId("backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("locks body scroll while open and restores it on close", () => {
    const { rerender } = render(<Shell />);
    expect(document.body.style.overflow).toBe("hidden");
    rerender(<div />);
    expect(document.body.style.overflow).toBe("");
  });
});
