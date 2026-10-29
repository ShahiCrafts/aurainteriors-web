import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

// FE-37(a): ConfirmationDialog disabled its buttons ONLY when the
// caller threaded isLoading — safety was opt-in at 10+ call sites and
// callers that forgot let a double-click fire the destructive action
// twice. The dialog must keep its OWN pending state: on confirm click,
// confirm + cancel disable until the onConfirm result settles (sync or
// promise), and re-enable afterwards — including on rejection, so a
// failed action never wedges the dialog.

import ConfirmationDialog from "../../../src/components/modals/ConfirmationDialog.jsx";

function renderDialog(onConfirm, extra = {}) {
  return render(
    <ConfirmationDialog
      isOpen
      title="Delete item?"
      message="This cannot be undone."
      onConfirm={onConfirm}
      onCancel={vi.fn()}
      confirmText="Delete"
      {...extra}
    />,
  );
}

const confirmBtn = () => screen.getByRole("button", { name: /delete/i });
const cancelBtn = () => screen.getByRole("button", { name: /cancel/i });

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("ConfirmationDialog double-submit protection (FE-37)", () => {
  it("promise onConfirm: rapid double-click fires exactly once; buttons disable while pending and re-enable after resolve", async () => {
    const d = deferred();
    const onConfirm = vi.fn(() => d.promise);
    renderDialog(onConfirm);
    // Hold the element references: while busy the confirm button
    // swaps its label for a spinner, so re-querying by name fails.
    const btn = confirmBtn();
    const cancel = cancelBtn();

    fireEvent.click(btn);
    fireEvent.click(btn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(btn).toBeDisabled();
    expect(cancel).toBeDisabled();

    await act(async () => {
      d.resolve();
    });

    expect(btn).not.toBeDisabled();
    expect(cancel).not.toBeDisabled();
    // A caller that keeps the dialog open after success can confirm again.
    fireEvent.click(btn);
    expect(onConfirm).toHaveBeenCalledTimes(2);
    await act(async () => {});
  });

  it("sync onConfirm: rapid double-click fires exactly once, then re-enables after settle", async () => {
    const onConfirm = vi.fn(() => undefined);
    renderDialog(onConfirm);
    const btn = confirmBtn();

    // Two clicks in the same synchronous burst — the second must be
    // swallowed even though a sync result 'settles' immediately.
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await act(async () => {});
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(onConfirm).toHaveBeenCalledTimes(2);
  });

  it("rejected onConfirm: fires once and the dialog re-enables instead of wedging", async () => {
    const d = deferred();
    const onConfirm = vi.fn(() => d.promise);
    renderDialog(onConfirm);
    const btn = confirmBtn();
    const cancel = cancelBtn();

    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(btn).toBeDisabled();

    await act(async () => {
      d.reject(new Error("delete failed"));
    });

    expect(btn).not.toBeDisabled();
    expect(cancel).not.toBeDisabled();
  });

  it("isLoading prop still disables both buttons (existing contract) and blocks confirm", () => {
    const onConfirm = vi.fn();
    renderDialog(onConfirm, { isLoading: true });
    // While loading the confirm button renders only a spinner (no
    // accessible name), so take it positionally: [close, cancel, confirm].
    const buttons = screen.getAllByRole("button");
    const confirm = buttons[buttons.length - 1];
    expect(confirm).toBeDisabled();
    expect(cancelBtn()).toBeDisabled();
    fireEvent.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
