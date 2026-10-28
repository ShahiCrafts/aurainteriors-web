import { create } from "zustand";

// One order line in the direct-items payload shape the checkout
// APIs accept ({ productId, quantity, variant, variantId?, sku? }).
// Accepts both a cart/buy-now line (product embedded) and an
// already-formatted item (productId set). The variant identity
// rides along whenever the line names a catalog variant — without
// it the server can only resolve the product's default variant.
const toDirectItem = (item) => ({
  productId: item.product?._id || item.productId,
  quantity: item.quantity,
  variant: item.variant || {},
  ...(item.variantId ? { variantId: item.variantId, sku: item.sku } : {}),
});

const initialState = {
  // Current step: 1 = shipping, 2 = payment, 3 = review
  currentStep: 1,

  // Guest info
  guestInfo: {
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  },

  // Shipping address
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

  // Use saved address ID (for authenticated users)
  shippingAddressId: null,

  // Billing
  useSameAddress: true,
  billingAddress: null,
  billingAddressId: null,

  // Shipping method
  shippingMethod: "standard", // 'standard' or 'express'

  // Payment
  paymentMethod: "cod", // 'cod' or 'esewa'

  // Discount
  discountCode: "",
  appliedDiscount: null,

  // Customer note
  customerNote: "",
};

const useCheckoutStore = create((set, get) => ({
  ...initialState,

  // Step navigation
  setStep: (step) => set({ currentStep: step }),
  nextStep: () =>
    set((state) => ({ currentStep: Math.min(state.currentStep + 1, 3) })),
  prevStep: () =>
    set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

  // Guest info
  setGuestInfo: (info) =>
    set((state) => ({
      guestInfo: { ...state.guestInfo, ...info },
    })),

  // Shipping address
  setShippingAddress: (address) => set({ shippingAddress: address }),
  setShippingAddressId: (id) => set({ shippingAddressId: id }),
  updateShippingField: (field, value) =>
    set((state) => ({
      shippingAddress: { ...state.shippingAddress, [field]: value },
    })),

  // Billing
  setUseSameAddress: (value) => set({ useSameAddress: value }),
  setBillingAddress: (address) => set({ billingAddress: address }),
  setBillingAddressId: (id) => set({ billingAddressId: id }),

  // Shipping method
  setShippingMethod: (method) => set({ shippingMethod: method }),

  // Payment
  setPaymentMethod: (method) => set({ paymentMethod: method }),

  // Discount
  setDiscountCode: (code) => set({ discountCode: code }),
  setAppliedDiscount: (discount) => set({ appliedDiscount: discount }),
  clearDiscount: () => set({ discountCode: "", appliedDiscount: null }),

  // Customer note
  setCustomerNote: (note) => set({ customerNote: note }),

  // Reset checkout state
  reset: () => set(initialState),

  // Validation
  isShippingValid: () => {
    const state = get();
    const { guestInfo, shippingAddress, shippingAddressId } = state;

    // Check guest info
    if (!guestInfo.email || !guestInfo.firstName || !guestInfo.lastName) {
      return false;
    }

    // Check shipping address (either saved or new)
    if (shippingAddressId) return true;

    return (
      shippingAddress.fullName &&
      shippingAddress.phone &&
      shippingAddress.addressLine1 &&
      shippingAddress.city &&
      shippingAddress.postalCode
    );
  },

  // Get checkout data for API
  getGuestCheckoutData: (cartItems) => {
    const state = get();

    // Construct full shipping address with name and phone from guestInfo
    const fullShippingAddress = {
      ...state.shippingAddress,
      fullName:
        state.shippingAddress.fullName ||
        `${state.guestInfo.firstName} ${state.guestInfo.lastName}`.trim(),
      phone: state.shippingAddress.phone || state.guestInfo.phone,
    };

    return {
      email: state.guestInfo.email,
      firstName: state.guestInfo.firstName,
      lastName: state.guestInfo.lastName,
      phone: state.guestInfo.phone,
      items: cartItems.map(toDirectItem),
      shippingAddress: fullShippingAddress,
      billingAddress: state.useSameAddress
        ? fullShippingAddress
        : state.billingAddress,
      useSameAddress: state.useSameAddress,
      paymentMethod: state.paymentMethod,
      discountCode: state.appliedDiscount?.code || "",
      customerNote: state.customerNote,
    };
  },

  // Accepts either the cart flow's selectedItemIds (an array of
  // server cart-line ids — the order is placed from the cart) or a
  // direct checkout's { items } (Buy Now — the order is placed from
  // the items themselves and the cart is never read or cleared).
  getAuthenticatedCheckoutData: (selection) => {
    const state = get();
    const directItems = Array.isArray(selection) ? null : selection?.items;

    // Construct full shipping address with name and phone from guestInfo
    const fullShippingAddress = state.shippingAddressId
      ? undefined
      : {
          ...state.shippingAddress,
          fullName:
            state.shippingAddress.fullName ||
            `${state.guestInfo.firstName} ${state.guestInfo.lastName}`.trim(),
          phone: state.shippingAddress.phone || state.guestInfo.phone,
        };

    // Construct full billing address if needed
    const fullBillingAddress =
      state.useSameAddress || state.billingAddressId
        ? undefined
        : state.billingAddress
          ? {
              ...state.billingAddress,
              fullName:
                state.billingAddress.fullName ||
                `${state.guestInfo.firstName} ${state.guestInfo.lastName}`.trim(),
              phone: state.billingAddress.phone || state.guestInfo.phone,
            }
          : undefined;

    // Build checkout data, only including fields that have values
    const checkoutData = {
      ...(directItems
        ? { items: directItems.map(toDirectItem) }
        : { selectedItemIds: selection }),
      useSameAddress: state.useSameAddress,
      paymentMethod: state.paymentMethod,
      customerNote: state.customerNote,
    };

    // Only include shippingAddressId if it's a valid string
    if (state.shippingAddressId) {
      checkoutData.shippingAddressId = state.shippingAddressId;
    } else {
      checkoutData.shippingAddress = fullShippingAddress;
    }

    // Only include billingAddressId if not using same address and it's valid
    if (!state.useSameAddress && state.billingAddressId) {
      checkoutData.billingAddressId = state.billingAddressId;
    } else if (!state.useSameAddress && fullBillingAddress) {
      checkoutData.billingAddress = fullBillingAddress;
    }

    // Only include discountCode if it exists
    if (state.appliedDiscount?.code) {
      checkoutData.discountCode = state.appliedDiscount.code;
    }

    return checkoutData;
  },
}));

export default useCheckoutStore;
