/**
 * Phase 6 (REUSE-013) — the ONE address field mapper. Before this,
 * the same API <-> form field mapping was written out in
 * AddEditAddressModal (edit reset, new reset, submit payload) and
 * again in CheckoutPage's default-address effect. Every function
 * below reproduces one of those mappings exactly — same fields,
 * same fallbacks — so adopting the mapper changes no behaviour.
 *
 * API address shape (addressApi / useAddressTan):
 *   { _id, label, customLabel, type, fullName, email, phone,
 *     addressLine1, addressLine2, city, state, postalCode, country,
 *     isDefault }
 * The address FORM (AddEditAddressModal) uses the same field names;
 * the mapping is about defaults, not renames.
 */

/** The modal's blank-form values (its "new address" reset). */
export function emptyAddressFormValues() {
  return {
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
  };
}

/**
 * API address -> form values (the modal's "edit" reset). A nullish
 * address yields the blank form, matching the modal's two reset
 * branches.
 */
export function addressToFormValues(address) {
  if (!address) return emptyAddressFormValues();
  return {
    label: address.label || "home",
    customLabel: address.customLabel || "",
    type: address.type || "delivery",
    fullName: address.fullName || "",
    email: address.email || "",
    phone: address.phone || "",
    addressLine1: address.addressLine1 || "",
    addressLine2: address.addressLine2 || "",
    city: address.city || "",
    state: address.state || "",
    postalCode: address.postalCode || "",
    country: address.country || "Nepal",
    isDefault: address.isDefault || false,
  };
}

/**
 * Form values -> API payload (the modal's submit transform): a
 * custom label only survives when the label is literally "other".
 */
export function formValuesToAddressPayload(values) {
  const payload = { ...values };
  if (payload.label !== "other") {
    payload.customLabel = "";
  }
  return payload;
}

/**
 * API address -> the checkout store's shippingAddress shape
 * (CheckoutPage's default-address effect). The phone falls back to
 * the account phone when the address carries none.
 */
export function addressToShippingAddress(address, fallbackPhone = "") {
  return {
    phone: address?.phone || fallbackPhone || "",
    addressLine1: address?.addressLine1 || "",
    addressLine2: address?.addressLine2 || "",
    city: address?.city || "",
    state: address?.state || "",
    postalCode: address?.postalCode || "",
    country: address?.country || "Nepal",
  };
}
