import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";

// FE-37(b): AddEditAddressModal's guest/override path never wired a
// pending flag — its sole override caller (ShippingStep) passed no
// isPendingOverride, and the modal called onSubmitOverride without
// awaiting it — so the guest address submit stayed enabled during the
// async save and a double-submit could fire the save twice.
// The modal must guard the override path itself: disable submit while
// the override result is unsettled, exactly once per submission, and
// re-enable when it settles (resolve or reject).

const h = vi.hoisted(() => ({ createMutate: vi.fn(), updateMutate: vi.fn() }));

vi.mock("../../../src/hooks/profile/useAddressTan", () => ({
  useCreateAddress: () => ({ mutate: h.createMutate, isPending: false }),
  useUpdateAddress: () => ({ mutate: h.updateMutate, isPending: false }),
}));

import AddEditAddressModal from "../../../src/components/modals/AddEditAddressModal.jsx";

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function fillValidGuestForm() {
  fireEvent.change(screen.getByLabelText(/full name/i), {
    target: { value: "Guest User" },
  });
  fireEvent.change(screen.getByLabelText(/phone number/i), {
    target: { value: "9812345678" },
  });
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: "guest@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/address line 1/i), {
    target: { value: "123 Thamel Street" },
  });
  fireEvent.change(screen.getByLabelText(/^city/i), {
    target: { value: "Kathmandu" },
  });
  fireEvent.change(screen.getByLabelText(/postal/i), {
    target: { value: "44600" },
  });
  // country is prefilled with "Nepal".
}

const submitBtn = () => screen.getByRole("button", { name: /add address/i });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AddEditAddressModal guest override double-submit (FE-37)", () => {
  it("double-submit during the async override save fires the override exactly once and disables submit until it settles", async () => {
    const d = deferred();
    const onSubmitOverride = vi.fn(() => d.promise);
    render(
      <AddEditAddressModal
        isOpen
        onClose={vi.fn()}
        isGuest
        onSubmitOverride={onSubmitOverride}
      />,
    );
    await fillValidGuestForm();
    // Hold the reference: while pending the button swaps its label
    // for a spinner, so re-querying by name would fail.
    const btn = submitBtn();

    fireEvent.click(btn);
    await waitFor(() => expect(onSubmitOverride).toHaveBeenCalledTimes(1));
    expect(btn).toBeDisabled();

    fireEvent.click(btn);
    expect(onSubmitOverride).toHaveBeenCalledTimes(1);

    await act(async () => {
      d.resolve();
    });
    await waitFor(() => expect(btn).not.toBeDisabled());
  });

  it("a rejected override save re-enables submit (dialog does not wedge)", async () => {
    const d = deferred();
    const onSubmitOverride = vi.fn(() => d.promise);
    render(
      <AddEditAddressModal
        isOpen
        onClose={vi.fn()}
        isGuest
        onSubmitOverride={onSubmitOverride}
      />,
    );
    await fillValidGuestForm();
    const btn = submitBtn();

    fireEvent.click(btn);
    await waitFor(() => expect(onSubmitOverride).toHaveBeenCalledTimes(1));
    expect(btn).toBeDisabled();

    await act(async () => {
      d.reject(new Error("save failed"));
    });
    await waitFor(() => expect(btn).not.toBeDisabled());
  });
});
