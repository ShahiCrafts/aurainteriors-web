// Phase 6 (REUSE-013) — useShippingFormSync: the two effects moved
// verbatim out of CheckoutPage. These tests pin their behaviour:
// account -> store/form mirroring, and default-address adoption
// (with the mapper's phone fallback) only when the checkout holds
// no shipping data yet.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useShippingFormSync } from "../../src/hooks/useShippingFormSync.js";
import useCheckoutStore from "../../src/store/checkoutStore.js";

const user = {
  email: "ada@example.com",
  firstName: "Ada",
  lastName: "Sharma",
  phone: "9800000000",
};

function makeProps(overrides = {}) {
  return {
    isAuthenticated: true,
    user,
    defaultAddress: null,
    shippingAddress: {},
    shippingAddressId: null,
    setGuestInfo: vi.fn(),
    setShippingAddress: vi.fn(),
    setShippingAddressId: vi.fn(),
    resetForm: vi.fn(),
    setValue: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  useCheckoutStore.setState({
    guestInfo: { email: "", firstName: "", lastName: "", phone: "" },
    shippingAddress: {},
  });
});

describe("useShippingFormSync (Phase 6)", () => {
  it("mirrors the account into guestInfo + form when it changed", () => {
    const props = makeProps();
    renderHook(() => useShippingFormSync(props));
    expect(props.setGuestInfo).toHaveBeenCalledWith({
      email: "ada@example.com",
      firstName: "Ada",
      lastName: "Sharma",
      phone: "9800000000",
    });
    expect(props.resetForm).toHaveBeenCalledWith({
      firstName: "Ada",
      lastName: "Sharma",
      email: "ada@example.com",
      phone: "9800000000",
      addressLine1: "",
      city: "",
      postalCode: "",
      country: "Nepal",
      state: "",
    });
  });

  it("does not re-set guestInfo when the store already matches", () => {
    useCheckoutStore.setState({
      guestInfo: { ...user },
      shippingAddress: {},
    });
    const props = makeProps();
    renderHook(() => useShippingFormSync(props));
    expect(props.setGuestInfo).not.toHaveBeenCalled();
    // The form reset still runs (verbatim effect behaviour).
    expect(props.resetForm).toHaveBeenCalledTimes(1);
  });

  it("adopts the default address when no shipping data exists yet", () => {
    const defaultAddress = {
      _id: "addr-1",
      addressLine1: "Durbar Marg 12",
      addressLine2: "",
      city: "Kathmandu",
      state: "Bagmati",
      postalCode: "44600",
      country: "Nepal",
      // no phone on the address -> falls back to the account phone
    };
    const props = makeProps({ defaultAddress });
    renderHook(() => useShippingFormSync(props));
    expect(props.setShippingAddress).toHaveBeenCalledWith({
      phone: "9800000000",
      addressLine1: "Durbar Marg 12",
      addressLine2: "",
      city: "Kathmandu",
      state: "Bagmati",
      postalCode: "44600",
      country: "Nepal",
    });
    expect(props.setShippingAddressId).toHaveBeenCalledWith("addr-1");
    expect(props.setValue).toHaveBeenCalledWith("phone", "9800000000", {
      shouldDirty: false,
    });
    expect(props.setValue).toHaveBeenCalledWith("city", "Kathmandu", {
      shouldDirty: false,
    });
  });

  it("does not adopt when shipping data is already present", () => {
    const props = makeProps({
      defaultAddress: { _id: "addr-1", addressLine1: "Elsewhere" },
      shippingAddress: { addressLine1: "Existing 1" },
    });
    renderHook(() => useShippingFormSync(props));
    expect(props.setShippingAddress).not.toHaveBeenCalled();
    expect(props.setShippingAddressId).not.toHaveBeenCalled();
  });

  it("does not adopt when an address id is already selected", () => {
    const props = makeProps({
      defaultAddress: { _id: "addr-1", addressLine1: "Elsewhere" },
      shippingAddressId: "addr-9",
    });
    renderHook(() => useShippingFormSync(props));
    expect(props.setShippingAddress).not.toHaveBeenCalled();
  });

  it("does nothing for guests", () => {
    const props = makeProps({ isAuthenticated: false, user: null });
    renderHook(() => useShippingFormSync(props));
    expect(props.setGuestInfo).not.toHaveBeenCalled();
    expect(props.resetForm).not.toHaveBeenCalled();
    expect(props.setShippingAddress).not.toHaveBeenCalled();
  });
});
