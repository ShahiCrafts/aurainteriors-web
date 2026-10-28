// Phase 6 (REUSE-013) — the guest address email rule now lives in
// utils/validationSchemas as guestAddressSchema (it used to be a
// local .shape() extension inside AddEditAddressModal). The shared
// house email rule won: email + required + max 254 — the same rule
// shippingSchema and contactSchema carry (FE-45: maximums mirror
// the server, whose email cap is 254). BEHAVIOUR NOTE: the modal's
// old local rule had NO max, so a >254-char guest email previously
// passed client validation; it now fails with "Maximum 254
// characters" (the server would have rejected it anyway).
import { describe, it, expect } from "vitest";
import {
  addressSchema,
  guestAddressSchema,
} from "../../src/utils/validationSchemas.js";

const validAddress = {
  label: "home",
  customLabel: "",
  type: "delivery",
  fullName: "Ada Sharma",
  phone: "9841234567",
  addressLine1: "Durbar Marg 12",
  addressLine2: "",
  city: "Kathmandu",
  state: "Bagmati",
  postalCode: "44600",
  country: "Nepal",
  isDefault: false,
};

describe("guestAddressSchema (Phase 6 consolidation)", () => {
  it("accepts a valid guest address with a valid email", async () => {
    await expect(
      guestAddressSchema.validate({
        ...validAddress,
        email: "ada@example.com",
      }),
    ).resolves.toBeTruthy();
  });

  it("requires the email for guests", async () => {
    await expect(
      guestAddressSchema.validate({ ...validAddress, email: "" }),
    ).rejects.toThrow("Email is required");
  });

  it("rejects a malformed email", async () => {
    await expect(
      guestAddressSchema.validate({ ...validAddress, email: "not-an-email" }),
    ).rejects.toThrow("Invalid email");
  });

  it("caps the email at 254 chars (the shared house rule)", async () => {
    const longEmail = `${"a".repeat(245)}@example.com`; // 257 chars
    await expect(
      guestAddressSchema.validate({ ...validAddress, email: longEmail }),
    ).rejects.toThrow("Maximum 254 characters");
  });

  it("the base addressSchema still has no email requirement", async () => {
    await expect(addressSchema.validate(validAddress)).resolves.toBeTruthy();
  });
});
