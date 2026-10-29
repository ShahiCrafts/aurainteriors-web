// FE-45 — client/server validation drift, converged.
//
// Server evidence (read-only, ~/workspace/aura-audit/work):
//   validators/order.validator.js — checkout/address phone:
//     pattern /^[0-9+\-\s]{7,15}$/ (hyphens ARE legal at checkout);
//     address fullName max 100, addressLine1 max 200, city max 100,
//     postalCode max 20, country max 100; guest first/last name max 50.
//   models/user.model.js — profile: firstName/lastName maxlength 50,
//     phone digits 7..15, gender enum includes "prefer_not_to_say".
//   validators/review.validator.js — rating integer 1..5,
//     title max 100, comment 10..1000.
//
// The client now uses ONE shared phone validator for shipping,
// address and personal-info forms (mirroring the server checkout
// pattern, plus a digit-count guard so "+++++++" — which the raw
// pattern admits — is rejected), a rating maximum/integer rule, and
// client maximums mirroring the server schemas.
import { describe, it, expect } from "vitest";
import {
  shippingSchema,
  addressSchema,
  personalInfoSchema,
  reviewSchema,
  isValidPhoneNumber,
} from "../../src/utils/validationSchemas.js";

const SHIPPING = {
  firstName: "Jane",
  lastName: "Customer",
  email: "jane@example.com",
  phone: "9841234567",
  addressLine1: "123 Main Street",
  city: "Lalitpur",
  postalCode: "44700",
  country: "Nepal",
};

const ADDRESS = {
  fullName: "Jane Customer",
  phone: "9841234567",
  addressLine1: "123 Main Street",
  addressLine2: "",
  city: "Lalitpur",
  state: "",
  postalCode: "44700",
  country: "Nepal",
  label: "home",
  type: "delivery",
};

const PERSONAL = {
  firstName: "Jane",
  lastName: "Customer",
  phone: "9841234567",
  gender: "female",
  dateOfBirth: null,
};

describe("FE-45 shared phone validator (one rule for every form)", () => {
  const forms = [
    ["shipping", shippingSchema, SHIPPING],
    ["address", addressSchema, ADDRESS],
    ["personalInfo", personalInfoSchema, PERSONAL],
  ];

  it("the exported helper implements the server checkout pattern + digit guard", () => {
    expect(isValidPhoneNumber("9841234567")).toBe(true);
    expect(isValidPhoneNumber("+977-9841234567")).toBe(true); // hyphen: legal server-side
    expect(isValidPhoneNumber("+977 9841234567")).toBe(true);
    expect(isValidPhoneNumber("+++++++")).toBe(false); // raw pattern admits it; digit guard rejects
    expect(isValidPhoneNumber("-------")).toBe(false);
    expect(isValidPhoneNumber("123")).toBe(false);
    expect(isValidPhoneNumber("1234567890123456")).toBe(false); // 16 digits
    expect(isValidPhoneNumber("98abc45678")).toBe(false);
    expect(isValidPhoneNumber("984+123456")).toBe(false); // '+' only leading
  });

  for (const [name, schema, base] of forms) {
    it(`${name}: hyphenated server-legal number passes`, async () => {
      await expect(
        schema.isValid({ ...base, phone: "+977-9841234567" }),
      ).resolves.toBe(true);
    });
    it(`${name}: '+++++++' is rejected`, async () => {
      await expect(schema.isValid({ ...base, phone: "+++++++" })).resolves.toBe(
        false,
      );
    });
    it(`${name}: too-short and too-long numbers are rejected`, async () => {
      await expect(schema.isValid({ ...base, phone: "123" })).resolves.toBe(
        false,
      );
      await expect(
        schema.isValid({ ...base, phone: "1234567890123456" }),
      ).resolves.toBe(false);
    });
  }
});

describe("FE-45 review rating maximum + integer (server: integer 1..5)", () => {
  const base = { rating: 5, title: "Great", comment: "Really great sofa." };
  it("rating 1 and 5 pass; 0, 5.5, 42 and 999 fail", async () => {
    await expect(reviewSchema.isValid({ ...base, rating: 1 })).resolves.toBe(
      true,
    );
    await expect(reviewSchema.isValid({ ...base, rating: 5 })).resolves.toBe(
      true,
    );
    await expect(reviewSchema.isValid({ ...base, rating: 0 })).resolves.toBe(
      false,
    );
    await expect(reviewSchema.isValid({ ...base, rating: 5.5 })).resolves.toBe(
      false,
    );
    await expect(reviewSchema.isValid({ ...base, rating: 42 })).resolves.toBe(
      false,
    );
    await expect(reviewSchema.isValid({ ...base, rating: 999 })).resolves.toBe(
      false,
    );
  });
  it("comment max mirrors the server cap of 1000 (at-limit passes, +1 fails)", async () => {
    await expect(
      reviewSchema.isValid({ ...base, comment: "c".repeat(1000) }),
    ).resolves.toBe(true);
    await expect(
      reviewSchema.isValid({ ...base, comment: "c".repeat(1001) }),
    ).resolves.toBe(false);
  });
});

describe("FE-45 client maximums mirror the server schemas", () => {
  it("shipping: firstName 50, addressLine1 200, city 100, postalCode 20, country 100", async () => {
    await expect(
      shippingSchema.isValid({ ...SHIPPING, firstName: "f".repeat(50) }),
    ).resolves.toBe(true);
    await expect(
      shippingSchema.isValid({ ...SHIPPING, firstName: "f".repeat(51) }),
    ).resolves.toBe(false);
    await expect(
      shippingSchema.isValid({ ...SHIPPING, addressLine1: "a".repeat(201) }),
    ).resolves.toBe(false);
    await expect(
      shippingSchema.isValid({ ...SHIPPING, city: "c".repeat(101) }),
    ).resolves.toBe(false);
    await expect(
      shippingSchema.isValid({ ...SHIPPING, postalCode: "p".repeat(21) }),
    ).resolves.toBe(false);
    await expect(
      shippingSchema.isValid({ ...SHIPPING, country: "c".repeat(101) }),
    ).resolves.toBe(false);
  });

  it("address: fullName 100, addressLine1/2 200, city/state 100, postalCode 20, country 100", async () => {
    await expect(
      addressSchema.isValid({ ...ADDRESS, fullName: "f".repeat(100) }),
    ).resolves.toBe(true);
    await expect(
      addressSchema.isValid({ ...ADDRESS, fullName: "f".repeat(101) }),
    ).resolves.toBe(false);
    await expect(
      addressSchema.isValid({ ...ADDRESS, addressLine1: "a".repeat(201) }),
    ).resolves.toBe(false);
    await expect(
      addressSchema.isValid({ ...ADDRESS, addressLine2: "a".repeat(201) }),
    ).resolves.toBe(false);
    await expect(
      addressSchema.isValid({ ...ADDRESS, state: "s".repeat(101) }),
    ).resolves.toBe(false);
  });

  it("personalInfo: first/last name max 50 (user model)", async () => {
    await expect(
      personalInfoSchema.isValid({ ...PERSONAL, firstName: "f".repeat(51) }),
    ).resolves.toBe(false);
    await expect(
      personalInfoSchema.isValid({ ...PERSONAL, lastName: "l".repeat(51) }),
    ).resolves.toBe(false);
  });

  it("personalInfo: gender enum includes the server's prefer_not_to_say", async () => {
    await expect(
      personalInfoSchema.isValid({ ...PERSONAL, gender: "prefer_not_to_say" }),
    ).resolves.toBe(true);
    await expect(
      personalInfoSchema.isValid({ ...PERSONAL, gender: "bogus" }),
    ).resolves.toBe(false);
  });

  it("personalInfo: a future dateOfBirth is rejected (evaluated per-validation, not at import)", async () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await expect(
      personalInfoSchema.isValid({ ...PERSONAL, dateOfBirth: future }),
    ).resolves.toBe(false);
    const past = new Date("1990-01-01");
    await expect(
      personalInfoSchema.isValid({ ...PERSONAL, dateOfBirth: past }),
    ).resolves.toBe(true);
  });
});
