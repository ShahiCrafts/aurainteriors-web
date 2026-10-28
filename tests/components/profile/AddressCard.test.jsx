// Phase 6 (REUSE-013) — AddressCard extracted verbatim from
// SavedAddresses. Pins the rendered card (label, name, composed
// address line, phone, badges) and the three footer callbacks.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AddressCard from "../../../src/components/profile/AddressCard.jsx";

const address = {
  _id: "addr-1",
  label: "home",
  type: "delivery",
  fullName: "Ada Sharma",
  phone: "9841234567",
  addressLine1: "Durbar Marg 12",
  addressLine2: "Suite 4",
  city: "Kathmandu",
  state: "Bagmati",
  postalCode: "44600",
  country: "Nepal",
  isDefault: false,
};

function renderCard(overrides = {}, props = {}) {
  const handlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onSetDefault: vi.fn(),
    ...props,
  };
  render(<AddressCard address={{ ...address, ...overrides }} {...handlers} />);
  return handlers;
}

describe("AddressCard (Phase 6 extraction)", () => {
  it("renders label, name, composed address and phone", () => {
    renderCard();
    expect(screen.getByText("home")).toBeInTheDocument();
    expect(screen.getByText("· delivery")).toBeInTheDocument();
    expect(screen.getByText("Ada Sharma")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Durbar Marg 12, Suite 4, Kathmandu, 44600, Bagmati, Nepal/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("9841234567")).toBeInTheDocument();
  });

  it("shows the custom label for 'other' addresses", () => {
    renderCard({ label: "other", customLabel: "Villa" });
    expect(screen.getByText("Villa")).toBeInTheDocument();
  });

  it("shows the Default badge and hides Set as Default when default", () => {
    renderCard({ isDefault: true });
    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.queryByText("Set as Default")).not.toBeInTheDocument();
  });

  it("shows the Billing badge for non-default billing addresses", () => {
    renderCard({ type: "billing" });
    expect(screen.getByText("Billing")).toBeInTheDocument();
  });

  it("fires callbacks with the address / id", () => {
    const handlers = renderCard();
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    expect(handlers.onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "addr-1" }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Delete/ }));
    expect(handlers.onDelete).toHaveBeenCalledWith("addr-1");
    fireEvent.click(screen.getByRole("button", { name: "Set as Default" }));
    expect(handlers.onSetDefault).toHaveBeenCalledWith("addr-1");
  });
});
