// Phase 6 (REUSE-013) — addressMapper pins the field mappings that
// used to be written out in AddEditAddressModal (edit reset / new
// reset / submit payload) and CheckoutPage's default-address
// effect. Expected objects are those mappings, verbatim.
import { describe, it, expect } from "vitest";
import {
  emptyAddressFormValues,
  addressToFormValues,
  formValuesToAddressPayload,
  addressToShippingAddress,
} from "../../src/utils/addressMapper.js";

const apiAddress = {
  _id: "addr-1",
  label: "office",
  customLabel: "",
  type: "billing",
  fullName: "Ada Sharma",
  email: "ada@example.com",
  phone: "9841234567",
  addressLine1: "Durbar Marg 12",
  addressLine2: "Suite 4",
  city: "Kathmandu",
  state: "Bagmati",
  postalCode: "44600",
  country: "Nepal",
  isDefault: true,
};

describe("addressMapper (Phase 6)", () => {
  it("emptyAddressFormValues is the modal's blank form", () => {
    expect(emptyAddressFormValues()).toEqual({
      label: "home",
      customLabel: "",
      type: "delivery",
      fullName: "",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Nepal",
      isDefault: false,
    });
  });

  it("addressToFormValues maps a full API address (dropping _id)", () => {
    expect(addressToFormValues(apiAddress)).toEqual({
      label: "office",
      customLabel: "",
      type: "billing",
      fullName: "Ada Sharma",
      email: "ada@example.com",
      phone: "9841234567",
      addressLine1: "Durbar Marg 12",
      addressLine2: "Suite 4",
      city: "Kathmandu",
      state: "Bagmati",
      postalCode: "44600",
      country: "Nepal",
      isDefault: true,
    });
  });

  it("addressToFormValues applies the modal's fallbacks for sparse addresses", () => {
    expect(addressToFormValues({ fullName: "Bo" })).toEqual({
      label: "home",
      customLabel: "",
      type: "delivery",
      fullName: "Bo",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Nepal",
      isDefault: false,
    });
  });

  it("addressToFormValues(null) is the blank form", () => {
    expect(addressToFormValues(null)).toEqual(emptyAddressFormValues());
    expect(addressToFormValues(undefined)).toEqual(emptyAddressFormValues());
  });

  it("formValuesToAddressPayload clears customLabel unless label is 'other'", () => {
    expect(
      formValuesToAddressPayload({ label: "home", customLabel: "Villa" })
    ).toEqual({ label: "home", customLabel: "" });
    expect(
      formValuesToAddressPayload({ label: "other", customLabel: "Villa" })
    ).toEqual({ label: "other", customLabel: "Villa" });
  });

  it("formValuesToAddressPayload does not mutate its input", () => {
    const input = { label: "home", customLabel: "Villa" };
    formValuesToAddressPayload(input);
    expect(input.customLabel).toBe("Villa");
  });

  it("addressToShippingAddress matches CheckoutPage's default-address shape", () => {
    expect(addressToShippingAddress(apiAddress, "9800000000")).toEqual({
      phone: "9841234567",
      addressLine1: "Durbar Marg 12",
      addressLine2: "Suite 4",
      city: "Kathmandu",
      state: "Bagmati",
      postalCode: "44600",
      country: "Nepal",
    });
  });

  it("addressToShippingAddress falls back to the account phone, then ''", () => {
    expect(
      addressToShippingAddress({ addressLine1: "X" }, "9800000000").phone
    ).toBe("9800000000");
    expect(addressToShippingAddress({}).phone).toBe("");
    expect(addressToShippingAddress({}).country).toBe("Nepal");
  });
});
