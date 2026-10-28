// FE-64 — Dialog primitive + migrated-modal behaviour.
//
// Failing-first evidence (recorded in audit/fe/remediation/phase3-a11y.md):
// before the primitive existed these tests failed — ConfirmationDialog
// rendered no role="dialog"/"alertdialog", Escape did nothing, focus was
// never moved inside or returned, and body scroll was never locked.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Dialog from "../../../src/components/common/Dialog.jsx";
import ConfirmationDialog from "../../../src/components/modals/ConfirmationDialog.jsx";
import AuthRequiredModal from "../../../src/components/chat/AuthRequiredModal.jsx";

vi.mock("../../../src/hooks/admin/useAdminNotificationSocket.js", () => ({
  default: () => ({
    adminNotifications: [],
    unreadAdminCount: 0,
    getNotificationIcon: () => null,
    dismissNotification: vi.fn(),
  }),
}));
vi.mock("../../../src/components/common/NotificationBell.jsx", () => ({
  default: () => null,
}));

import AdminLayout from "../../../src/layouts/admin/AdminLayout.jsx";
import useAuthStore from "../../../src/store/authStore.js";

function Harness({ onClose = vi.fn(), children }) {
  return (
    <div>
      <button type="button">Trigger</button>
      <Dialog open onClose={onClose} label="Test dialog">
        {children || (
          <>
            <button type="button">First</button>
            <button type="button">Second</button>
          </>
        )}
      </Dialog>
    </div>
  );
}

beforeEach(() => {
  document.body.style.overflow = "";
});

describe("Dialog primitive (FE-64)", () => {
  it("exposes dialog semantics: role, aria-modal and an accessible name", () => {
    render(<Harness />);
    const dialog = screen.getByRole("dialog", { name: "Test dialog" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("moves focus inside on open", () => {
    render(<Harness />);
    expect(screen.getByRole("dialog")).toContainElement(document.activeElement);
  });

  it("Tab cycles within the dialog and wraps from last to first", () => {
    render(<Harness />);
    const first = screen.getByRole("button", { name: "First" });
    const second = screen.getByRole("button", { name: "Second" });
    second.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(first);
  });

  it("Shift+Tab from the first element wraps to the last (pen-test: focus escaping backwards)", () => {
    render(<Harness />);
    const first = screen.getByRole("button", { name: "First" });
    const second = screen.getByRole("button", { name: "Second" });
    first.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(second);
  });

  it("Escape calls onClose", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("returns focus to the previously focused element on close", () => {
    const { rerender } = render(
      <div>
        <button type="button">Trigger</button>
      </div>,
    );
    const trigger = screen.getByRole("button", { name: "Trigger" });
    trigger.focus();
    rerender(
      <div>
        <button type="button">Trigger</button>
        <Dialog open onClose={vi.fn()} label="Test dialog">
          <button type="button">Inside</button>
        </Dialog>
      </div>,
    );
    expect(document.activeElement).not.toBe(trigger);
    rerender(
      <div>
        <button type="button">Trigger</button>
      </div>,
    );
    expect(document.activeElement).toBe(trigger);
  });

  it("locks body scroll while open and restores it on close", () => {
    const { rerender } = render(<Harness />);
    expect(document.body.style.overflow).toBe("hidden");
    rerender(
      <div>
        <button type="button">Trigger</button>
      </div>,
    );
    expect(document.body.style.overflow).toBe("");
  });

  it("pen-test: unmount while open does not leak the scroll lock", () => {
    const { unmount } = render(<Harness />);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("pen-test: nested dialogs — Escape closes only the top one and scroll stays locked until both close", () => {
    const outerClose = vi.fn();
    const innerClose = vi.fn();
    const { rerender } = render(
      <Dialog open onClose={outerClose} label="Outer">
        <button type="button">Outer action</button>
        <Dialog open onClose={innerClose} label="Inner">
          <button type="button">Inner action</button>
        </Dialog>
      </Dialog>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(innerClose).toHaveBeenCalledTimes(1);
    expect(outerClose).not.toHaveBeenCalled();
    rerender(
      <Dialog open onClose={outerClose} label="Outer">
        <button type="button">Outer action</button>
      </Dialog>,
    );
    expect(document.body.style.overflow).toBe("hidden");
    rerender(<div />);
    expect(document.body.style.overflow).toBe("");
  });
});

describe("migrated customer modal — ConfirmationDialog (FE-64)", () => {
  it("is an alertdialog, traps initial focus inside, and Escape cancels", () => {
    const onCancel = vi.fn();
    render(
      <div>
        <button type="button">Delete trigger</button>
        <ConfirmationDialog
          isOpen
          title="Delete item?"
          message="This cannot be undone."
          onConfirm={vi.fn()}
          onCancel={onCancel}
        />
      </div>,
    );
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toContainElement(document.activeElement);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe("migrated customer modal — AuthRequiredModal (FE-64)", () => {
  it("opens as a dialog and closes on Escape end-to-end", () => {
    const onClose = vi.fn();
    render(
      <AuthRequiredModal isOpen onClose={onClose} message="Please sign in." />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("migrated admin modal — AdminLayout Help dialog (FE-64)", () => {
  it("opens from the profile menu as a dialog and closes on Escape", () => {
    useAuthStore.setState({
      user: { firstName: "Ada", lastName: "Admin", role: "admin" },
      token: "test-token",
    });
    render(
      <MemoryRouter>
        <AdminLayout />
      </MemoryRouter>,
    );
    const profileButton = screen
      .getAllByRole("button")
      .find((b) => b.textContent.includes("Ada"));
    fireEvent.click(profileButton);
    fireEvent.click(screen.getByRole("button", { name: /Help & Support/ }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toContainElement(document.activeElement);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
