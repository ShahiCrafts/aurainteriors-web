import { beforeEach, describe, expect, it } from "vitest";

// Characterization tests for src/store/checkoutStore.js — pinning the
// store's CURRENT initial state, setters, step navigation and reset().

import useCheckoutStore from "../../src/store/checkoutStore.js";

const state = () => useCheckoutStore.getState();

const expectedInitial = {
  currentStep: 1,
  guestInfo: { email: "", firstName: "", lastName: "", phone: "" },
  shippingAddress: {
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Nepal",
  },
  shippingAddressId: null,
  useSameAddress: true,
  billingAddress: null,
  billingAddressId: null,
  shippingMethod: "standard",
  paymentMethod: "cod",
  discountCode: "",
  appliedDiscount: null,
  customerNote: "",
};

const snapshot = () => {
  const s = state();
  return {
    currentStep: s.currentStep,
    guestInfo: s.guestInfo,
    shippingAddress: s.shippingAddress,
    shippingAddressId: s.shippingAddressId,
    useSameAddress: s.useSameAddress,
    billingAddress: s.billingAddress,
    billingAddressId: s.billingAddressId,
    shippingMethod: s.shippingMethod,
    paymentMethod: s.paymentMethod,
    discountCode: s.discountCode,
    appliedDiscount: s.appliedDiscount,
    customerNote: s.customerNote,
  };
};

beforeEach(() => {
  state().reset();
});

describe("initial state", () => {
  it("starts at step 1 with empty guest info and a Nepal shipping address", () => {
    expect(snapshot()).toEqual(expectedInitial);
  });
});

describe("step navigation", () => {
  it("setStep jumps to an arbitrary step", () => {
    state().setStep(3);
    expect(state().currentStep).toBe(3);
    state().setStep(2);
    expect(state().currentStep).toBe(2);
  });

  it("nextStep advances and clamps at step 3", () => {
    state().nextStep();
    expect(state().currentStep).toBe(2);
    state().nextStep();
    expect(state().currentStep).toBe(3);
    state().nextStep();
    expect(state().currentStep).toBe(3);
  });

  it("prevStep goes back and clamps at step 1", () => {
    state().setStep(3);
    state().prevStep();
    expect(state().currentStep).toBe(2);
    state().prevStep();
    expect(state().currentStep).toBe(1);
    state().prevStep();
    expect(state().currentStep).toBe(1);
  });
});

describe("setters", () => {
  it("setGuestInfo merges partial updates", () => {
    state().setGuestInfo({ email: "a@example.com", firstName: "Asha" });
    expect(state().guestInfo).toEqual({
      email: "a@example.com",
      firstName: "Asha",
      lastName: "",
      phone: "",
    });
    state().setGuestInfo({ phone: "9800000000" });
    expect(state().guestInfo.email).toBe("a@example.com");
    expect(state().guestInfo.phone).toBe("9800000000");
  });

  it("setShippingAddress replaces the whole address object (no merge)", () => {
    const address = { fullName: "Asha Rai", city: "Kathmandu", country: "Nepal" };
    state().setShippingAddress(address);
    expect(state().shippingAddress).toEqual(address);
  });

  it("updateShippingField changes one field and keeps the rest", () => {
    state().updateShippingField("city", "Pokhara");
    expect(state().shippingAddress.city).toBe("Pokhara");
    expect(state().shippingAddress.country).toBe("Nepal");
    expect(state().shippingAddress.addressLine1).toBe("");
  });

  it("setShippingAddressId stores the saved-address id", () => {
    state().setShippingAddressId("addr-1");
    expect(state().shippingAddressId).toBe("addr-1");
    state().setShippingAddressId(null);
    expect(state().shippingAddressId).toBeNull();
  });

  it("billing setters: useSameAddress flag, address and address id", () => {
    const billing = { fullName: "Bill Me", city: "Lalitpur" };
    state().setUseSameAddress(false);
    state().setBillingAddress(billing);
    state().setBillingAddressId("bill-1");

    expect(state().useSameAddress).toBe(false);
    expect(state().billingAddress).toEqual(billing);
    expect(state().billingAddressId).toBe("bill-1");
  });

  it("shipping and payment method setters", () => {
    state().setShippingMethod("express");
    state().setPaymentMethod("esewa");

    expect(state().shippingMethod).toBe("express");
    expect(state().paymentMethod).toBe("esewa");
  });

  it("discount setters and clearDiscount", () => {
    const discount = { code: "SAVE10", amount: 10 };
    state().setDiscountCode("SAVE10");
    state().setAppliedDiscount(discount);
    expect(state().discountCode).toBe("SAVE10");
    expect(state().appliedDiscount).toEqual(discount);

    state().clearDiscount();
    expect(state().discountCode).toBe("");
    expect(state().appliedDiscount).toBeNull();
  });

  it("setCustomerNote stores the note", () => {
    state().setCustomerNote("Leave at the gate");
    expect(state().customerNote).toBe("Leave at the gate");
  });
});

describe("reset", () => {
  it("restores the full initial state after mutations", () => {
    state().setStep(3);
    state().setGuestInfo({ email: "a@example.com", firstName: "Asha" });
    state().updateShippingField("city", "Pokhara");
    state().setShippingAddressId("addr-1");
    state().setUseSameAddress(false);
    state().setBillingAddress({ fullName: "Bill" });
    state().setShippingMethod("express");
    state().setPaymentMethod("esewa");
    state().setDiscountCode("SAVE10");
    state().setAppliedDiscount({ code: "SAVE10" });
    state().setCustomerNote("note");

    state().reset();

    expect(snapshot()).toEqual(expectedInitial);
  });
});

describe("isShippingValid", () => {
  it("is false for the untouched initial state", () => {
    expect(state().isShippingValid()).toBe(false);
  });

  it("is true once guest info and the required address fields are filled", () => {
    state().setGuestInfo({ email: "a@example.com", firstName: "Asha", lastName: "Rai" });
    state().setShippingAddress({
      fullName: "Asha Rai",
      phone: "9800000000",
      addressLine1: "Thamel",
      addressLine2: "",
      city: "Kathmandu",
      state: "",
      postalCode: "44600",
      country: "Nepal",
    });

    expect(state().isShippingValid()).toBeTruthy();
  });

  it("is true with a saved address id even if the typed address is incomplete", () => {
    state().setGuestInfo({ email: "a@example.com", firstName: "Asha", lastName: "Rai" });
    state().setShippingAddressId("addr-1");

    expect(state().isShippingValid()).toBe(true);
  });
});
