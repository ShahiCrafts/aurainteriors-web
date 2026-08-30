import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useCheckoutStore from "../../store/checkoutStore";
import useAuthStore from "../../store/authStore";
import useGuestCartStore from "../../store/guestCartStore";
import { useDefaultAddress } from "../../hooks/profile/useAddressTan";
import {
  useCart,
  useUpdateCartItem,
  useRemoveFromCart,
} from "../../hooks/cart/useCartTan";
import { useApplyDiscount } from "../../hooks/admin/useDiscountTan";
import { useGuestCheckout, useCheckout } from "../../hooks/order/useOrderTan";
import Navbar from "../../layouts/customer/Navbar";
import Footer from "../../layouts/customer/Footer";
import ShippingStep from "../../components/checkout/ShippingStep";
import PaymentStep from "../../components/checkout/PaymentStep";
import { toast } from "react-toastify";
import {
  ChevronLeft,
  Plus,
  Minus,
  Trash2,
  Tag,
  Check,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Skeleton from "../../components/common/Skeleton";
import { getProductImageUrl } from "../../utils/imageUrl";
import formatError from "../../utils/errorHandler";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { shippingSchema } from "../../utils/validationSchemas";

// Custom checkbox: native checkboxes can't guarantee a white tick across
// browsers (accent-color styling of the check glyph itself isn't
// controllable), so this renders the tick as an actual white SVG icon.
function SelectionCheckbox({ checked, indeterminate, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`w-[18px] h-[18px] rounded-[5px] flex items-center justify-center border transition-colors shrink-0 ${
        checked || indeterminate
          ? "bg-[#F27318] border-[#F27318]"
          : "bg-white border-neutral-300 hover:border-neutral-400"
      }`}
    >
      {indeterminate ? (
        <Minus size={12} strokeWidth={3} className="text-white" />
      ) : checked ? (
        <Check size={12} strokeWidth={3} className="text-white" />
      ) : null}
    </button>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const {
    guestInfo,
    setGuestInfo,
    shippingAddress,
    shippingAddressId,
    setShippingAddress,
    setShippingAddressId,
    shippingMethod,
    paymentMethod,
    setPaymentMethod,
    currentStep,
    nextStep,
    prevStep,
    setStep,
    getGuestCheckoutData,
    getAuthenticatedCheckoutData,
    reset,
  } = useCheckoutStore();

  const { data: cartData, isLoading: isCartLoading } = useCart({
    enabled: isAuthenticated,
  });

  const {
    items: guestCartItems,
    clearCart: clearGuestCart,
    updateItemQuantity: updateGuestCartQuantity,
    removeItem: removeGuestCartItem,
  } = useGuestCartStore();

  const { mutate: updateCartItem, isPending: isUpdating } = useUpdateCartItem();
  const { mutate: removeFromCart, isPending: isRemoving } = useRemoveFromCart();
  const applyDiscountMutation = useApplyDiscount();
  const guestCheckoutMutation = useGuestCheckout();
  const authenticatedCheckoutMutation = useCheckout();
  const { defaultAddress } = useDefaultAddress();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [showPromoInput, setShowPromoInput] = useState(false);

  const methods = useForm({
    resolver: yupResolver(shippingSchema),
    defaultValues: {
      firstName: guestInfo.firstName || "",
      lastName: guestInfo.lastName || "",
      email: guestInfo.email || "",
      phone: guestInfo.phone || "",
      addressLine1: shippingAddress.addressLine1 || "",
      city: shippingAddress.city || "",
      postalCode: shippingAddress.postalCode || "",
      country: shippingAddress.country || "",
    },
    mode: "onTouched",
  });

  const { reset: resetForm, handleSubmit: handleFormSubmit, watch, setValue } = methods;

  const watchedGuestInfo = watch(["firstName", "lastName", "email", "phone"]);
  const watchedShippingFields = watch([
    "addressLine1",
    "city",
    "postalCode",
    "country",
    "state",
  ]);
  const [fName, lName, mail, ph] = watchedGuestInfo;
  const [addr1, cty, zip, cntry, st] = watchedShippingFields;



  const cart = cartData?.data?.cart;
  const cartItems = isAuthenticated ? cart?.items || [] : guestCartItems;

  // ---- Item selection (checkbox) state ----
  // Everything starts checked by default. Once initialized, any item id
  // that's newly seen (e.g. added later) also defaults to checked; ids no
  // longer present in the cart are dropped from the selection.
  const [selectedItemIds, setSelectedItemIds] = useState(() => new Set());
  const initializedSelectionRef = useRef(false);
  const seenItemIdsRef = useRef(new Set());

  useEffect(() => {
    const currentIds = cartItems.map((item) => item._id);
    if (currentIds.length === 0) return;

    if (!initializedSelectionRef.current) {
      setSelectedItemIds(new Set(currentIds));
      initializedSelectionRef.current = true;
      seenItemIdsRef.current = new Set(currentIds);
      return;
    }

    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      currentIds.forEach((id) => {
        if (!seenItemIdsRef.current.has(id)) {
          next.add(id); // newly added item -> default checked
        }
      });
      [...next].forEach((id) => {
        if (!currentIds.includes(id)) next.delete(id); // item removed from cart
      });
      return next;
    });
    seenItemIdsRef.current = new Set(currentIds);
  }, [cartItems]);

  const selectedCartItems = useMemo(
    () => cartItems.filter((item) => selectedItemIds.has(item._id)),
    [cartItems, selectedItemIds],
  );

  const allSelected = cartItems.length > 0 && selectedCartItems.length === cartItems.length;
  const someSelected = selectedCartItems.length > 0 && !allSelected;

  const toggleSelectItem = (itemId) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedItemIds(allSelected ? new Set() : new Set(cartItems.map((item) => item._id)));
  };

  const subtotal = selectedCartItems.reduce(
    (sum, item) =>
      sum + (item.product?.salePrice || item.product?.price || 0) * item.quantity,
    0,
  );
  const promoDiscount = appliedPromo?.discount?.discountAmount || 0;
  const shippingCost = shippingMethod === "express" ? 100 : 0;
  const taxRate = 0.13;
  const taxAmount = Math.round((subtotal - promoDiscount) * taxRate);
  const total = subtotal - promoDiscount + shippingCost + taxAmount;

  const getImageUrl = (product) => getProductImageUrl(product);

  useEffect(() => {
    reset(); // Reset checkout state when entering checkout page to pull latest defaults
    setStep(1);
    setPaymentMethod("cod");
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      const userData = {
        email: user.email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
      };
      const state = useCheckoutStore.getState();
      const guestInfoChanged =
        state.guestInfo.email !== userData.email ||
        state.guestInfo.firstName !== userData.firstName ||
        state.guestInfo.lastName !== userData.lastName ||
        state.guestInfo.phone !== userData.phone;

      if (guestInfoChanged) {
        setGuestInfo(userData);
      }

      resetForm({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        addressLine1: state.shippingAddress.addressLine1 || "",
        city: state.shippingAddress.city || "",
        postalCode: state.shippingAddress.postalCode || "",
        country: state.shippingAddress.country || "Nepal",
        state: state.shippingAddress.state || "",
      });
    }
  }, [isAuthenticated, user, setGuestInfo, resetForm]);

  useEffect(() => {
    if (!isAuthenticated || !user || !defaultAddress || shippingAddressId) {
      return;
    }

    const hasSavedShippingData = Boolean(
      shippingAddress.addressLine1 ||
        shippingAddress.city ||
        shippingAddress.postalCode ||
        shippingAddress.state ||
        shippingAddress.phone,
    );

    if (hasSavedShippingData) {
      return;
    }

    const defaultShippingAddress = {
      phone: defaultAddress.phone || user.phone || "",
      addressLine1: defaultAddress.addressLine1 || "",
      addressLine2: defaultAddress.addressLine2 || "",
      city: defaultAddress.city || "",
      state: defaultAddress.state || "",
      postalCode: defaultAddress.postalCode || "",
      country: defaultAddress.country || "Nepal",
    };

    setShippingAddress(defaultShippingAddress);
    setShippingAddressId(defaultAddress._id);
    setValue("phone", defaultShippingAddress.phone, { shouldDirty: false });
    setValue("addressLine1", defaultShippingAddress.addressLine1, {
      shouldDirty: false,
    });
    setValue("city", defaultShippingAddress.city, { shouldDirty: false });
    setValue("state", defaultShippingAddress.state, { shouldDirty: false });
    setValue("postalCode", defaultShippingAddress.postalCode, {
      shouldDirty: false,
    });
    setValue("country", defaultShippingAddress.country, { shouldDirty: false });
  }, [
    defaultAddress,
    isAuthenticated,
    shippingAddress,
    shippingAddressId,
    setShippingAddress,
    setShippingAddressId,
    setValue,
    user,
  ]);

  

  useEffect(() => {
    if (isSubmitting) return;
    if (!isCartLoading && cartItems.length === 0) {
      toast.error("Your cart is empty");
      navigate("/");
    }
  }, [
    isCartLoading,
    isAuthenticated,
    cartItems.length,
    navigate,
    isSubmitting,
  ]);

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    if (!isAuthenticated) {
      updateGuestCartQuantity(itemId, newQuantity);
      return;
    }
    updateCartItem(
      { itemId, quantity: newQuantity },
      {
        onError: (err) =>
          toast.error(formatError(err, "Failed to update quantity")),
      },
    );
  };

  const handleRemoveItem = (itemId) => {
    if (!isAuthenticated) {
      removeGuestCartItem(itemId);
      toast.success("Item removed");
      return;
    }
    removeFromCart(itemId, {
      onSuccess: () => toast.success("Item removed"),
      onError: (err) => toast.error(formatError(err, "Failed to remove item")),
    });
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promo code");
      return;
    }
    applyDiscountMutation.mutate(promoCode, {
      onSuccess: (data) => {
        setAppliedPromo(data.data);
        setPromoCode("");
        setShowPromoInput(false);
        toast.success("Promo code applied!");
      },
      onError: (err) => toast.error(formatError(err, "Invalid promo code")),
    });
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    toast.success("Promo code removed");
  };

  const ensureItemsSelected = () => {
    if (selectedCartItems.length === 0) {
      toast.error("Select at least one item to checkout");
      return false;
    }
    return true;
  };

  const handleGoToPayment = () => {
    if (!ensureItemsSelected()) return;

    const currentShippingAddressId = useCheckoutStore.getState().shippingAddressId;
    if (currentShippingAddressId) {
      nextStep();
      return;
    }

    toast.error("Please select a shipping address to proceed.");
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;
    if (!ensureItemsSelected()) return;
    setIsSubmitting(true);
    try {
      let result;
      if (isAuthenticated) {
        result = await authenticatedCheckoutMutation.mutateAsync(
          getAuthenticatedCheckoutData(
            selectedCartItems.map((item) => item._id),
          ),
        );
      } else {
        const formattedItems = selectedCartItems.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
          variant: item.variant || {},
        }));
        result = await guestCheckoutMutation.mutateAsync(
          getGuestCheckoutData(formattedItems),
        );
      }
      const order = result.data?.order;
      if (paymentMethod === "esewa" && result.data?.esewa) {
        const esewaData = result.data.esewa;
        const form = document.createElement("form");
        form.method = "POST";
        form.action = esewaData.payment_url;
        Object.entries(esewaData).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }
      if (!isAuthenticated) clearGuestCart();
      reset();
      navigate(
        `/order-confirmation/${order.orderId}?email=${encodeURIComponent(
          order.email || guestInfo.email,
        )}&emailSent=${result.data?.emailSent ? "true" : "false"}`,
      );
    } catch (error) {
      toast.error(formatError(error, "Failed to place order"));
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated && isCartLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-white font-dm-sans">
          <div className="flex flex-col lg:flex-row items-stretch">
            <div className="flex-1 p-6 lg:p-12 space-y-6">
              <Skeleton className="w-48 h-8 rounded-lg" />
              <div className="space-y-4">
                <Skeleton className="w-full h-16 rounded-xl" />
                <Skeleton className="w-full h-16 rounded-xl" />
                <Skeleton className="w-full h-16 rounded-xl" />
              </div>
            </div>
            <div className="w-full lg:w-[380px] xl:w-[512px] p-6 lg:p-12 bg-gray-100 space-y-6">
              <Skeleton className="w-40 h-7 rounded-lg" />
              <Skeleton className="w-full h-64 rounded-xl" />
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white font-dm-sans">
        <div className="flex flex-col lg:flex-row items-stretch">
          {/* Left Side: Content & Steps */}
          <div className="flex-1 bg-white">
            <div className="w-full px-4 sm:px-6 lg:px-12 py-12 lg:py-12">

              <div className="flex items-center gap-3 mb-10">
                {[
                  { n: 1, label: "Shipping" },
                  { n: 2, label: "Payment" },
                ].map(({ n, label }, i) => (
                  <div key={n} className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[14px] font-bold transition-all ${
                          currentStep === n
                            ? "bg-[#F27318] text-white"
                            : currentStep > n
                            ? "bg-[#F27318]/20 text-[#F27318]"
                            : "bg-gray-100 text-neutral-500"
                        }`}
                      >
                        {currentStep > n ? "✓" : n}
                      </div>
                      <span
                        className={`text-[16px] font-semibold ${
                          currentStep === n ? "text-[#1A1714]" : "text-neutral-500"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {i === 0 && (
                      <div className={`h-px w-10 ${currentStep > 1 ? "bg-[#F27318]/40" : "bg-neutral-200"}`} />
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                {/* Item Review Section */}
                <div>
                  <div className="flex justify-between items-end mb-5">
                    <h2 className="text-[20px] font-semibold text-[#1A1714] font-dm-sans">
                      Review your items
                    </h2>
                    <span className="text-[15px] font-medium text-neutral-500">
                      {selectedCartItems.length} of {cartItems.length} selected
                    </span>
                  </div>

                  <section className="bg-white overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[40px_1fr_120px_120px_64px] gap-4 items-center bg-gray-100 px-6 py-5">
                      <div className="flex justify-center">
                        <SelectionCheckbox
                          checked={allSelected}
                          indeterminate={someSelected}
                          onChange={toggleSelectAll}
                          ariaLabel="Select all items"
                        />
                      </div>
                      <div className="text-[16px] font-medium text-neutral-600">
                        Items
                      </div>
                      <div className="text-[16px] font-medium text-neutral-600 text-center">
                        Qty
                      </div>
                      <div className="text-[16px] font-medium text-neutral-600 text-right">
                        Price
                      </div>
                      <div className="text-[16px] font-medium text-neutral-600 text-center">
                        Action
                      </div>
                    </div>

                    {/* Table rows */}
                    <div className="divide-y divide-neutral-100">
                      {cartItems.map((item) => {
                        const isChecked = selectedItemIds.has(item._id);
                        return (
                          <div
                            key={item._id}
                            className="grid grid-cols-[40px_1fr_120px_120px_64px] gap-4 items-center px-6 py-4 hover:bg-neutral-50/80 transition-colors group"
                          >
                            {/* Checkbox */}
                            <div className="flex justify-center">
                              <SelectionCheckbox
                                checked={isChecked}
                                onChange={() => toggleSelectItem(item._id)}
                                ariaLabel={`Select ${item.product?.name}`}
                              />
                            </div>

                            {/* Item */}
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#FCFBFA] border border-neutral-100 shrink-0">
                                <img
                                  src={getImageUrl(item.product)}
                                  alt={item.product?.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-[16px] font-semibold text-[#1A1714] truncate">
                                  {item.product?.name}
                                </h4>
                                <p className="text-[15px] text-neutral-400 truncate mt-1">
                                  {item.variant?.color &&
                                    `Color: ${item.variant.color}`}
                                  {item.variant?.size &&
                                    ` • Size: ${item.variant.size}`}
                                </p>
                              </div>
                            </div>

                            {/* Qty */}
                            <div className="flex justify-center">
                              <div className="flex items-center border border-neutral-200 rounded-lg px-1 py-1 bg-white">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateQuantity(item._id, item.quantity - 1)
                                  }
                                  disabled={item.quantity <= 1 || isUpdating}
                                  className="p-1 hover:text-[#F27318] transition-colors disabled:opacity-30 disabled:hover:text-inherit disabled:cursor-not-allowed"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-8 text-center text-[14px] font-bold">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateQuantity(item._id, item.quantity + 1)
                                  }
                                  disabled={isUpdating}
                                  className="p-1 hover:text-[#F27318] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <p className="text-[16px] font-bold text-[#1A1714]">
                                NRs.{" "}
                                {(
                                  (item.product?.salePrice ||
                                    item.product?.price ||
                                    0) * item.quantity
                                ).toLocaleString()}
                              </p>
                            </div>

                            {/* Action */}
                            <div className="flex justify-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item._id)}
                                disabled={isRemoving}
                                className="p-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label="Remove item"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>

                {/* Main Steps Content */}
                <div className="bg-white">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      currentStep === 1
                        ? handleGoToPayment()
                        : handlePlaceOrder();
                    }}
                  >
                    <div className="space-y-6">
                      <h2 className="text-[20px] font-semibold text-[#1A1714] font-dm-sans mt-12">
                        Shipping Information
                      </h2>

                      <div className="bg-white">
                        <ShippingStep />
                      </div>
                    </div>

                    {/* Back Navigation — "Return to Shipping" only. */}
                    {currentStep === 2 && (
                      <div className="pt-12 flex items-center">
                        <button
                          type="button"
                          onClick={prevStep}
                          className="text-[16px] font-medium text-neutral-500 hover:text-[#1A1714] transition-colors flex items-center gap-2"
                        >
                          <ChevronLeft size={18} />
                          Return to Shipping
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Order Summary (Sidepanel) */}
          <div className="w-full lg:w-[380px] xl:w-[512px] shrink-0 bg-gray-100">
            <div className="lg:sticky lg:top-20 px-4 sm:px-6 lg:px-12 py-12">
              <div className="bg-white rounded-xl overflow-hidden">

                {/* Header */}
                <div className="px-6 py-5">
                  <h2 className="text-[20px] font-semibold text-[#1A1714]">
                    Order Summary
                    <span className="ml-2 text-[15px] font-medium text-neutral-500">
                      ({selectedCartItems.length} {selectedCartItems.length === 1 ? "item" : "items"})
                    </span>
                  </h2>
                </div>

                <div className="px-6 pb-6 space-y-5">
                  {/* Line items */}
                  <div className="space-y-5">
                    <div className="flex justify-between items-center text-[16px]">
                      <span className="text-neutral-500">Subtotal</span>
                      <span className="font-semibold text-[#1A1714]">
                        NRs. {subtotal.toLocaleString()}
                      </span>
                    </div>

                    {promoDiscount > 0 && (
                      <div className="flex justify-between items-center text-[16px]">
                        <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                          <Tag size={13} />
                          Discount
                        </span>
                        <span className="font-semibold text-emerald-600">
                          − NRs. {promoDiscount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[16px]">
                      <span className="text-neutral-500">VAT (13%)</span>
                      <span className="font-semibold text-[#1A1714]">
                        NRs. {taxAmount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[16px]">
                      <span className="text-neutral-500">Shipping</span>
                      <span className={`font-medium ${shippingCost === 0 ? "text-emerald-600" : "text-[#1A1714]"}`}>
                        {shippingCost === 0 ? "Free" : `NRs. ${shippingCost.toLocaleString()}`}
                      </span>
                    </div>
                  </div>

                  <div className="h-px w-full bg-[repeating-linear-gradient(to_right,#d4d4d4_0_10px,transparent_10px_18px)]" />
                  <div className="flex justify-between items-center">
                    <span className="text-[20px] font-semibold text-[#1A1714]">Total</span>
                    <div className="text-right">
                      <p className="text-[24px] font-semibold text-[#1A1714] leading-none">
                        NRs. {total.toLocaleString()}
                      </p>
                      <p className="text-[13px] text-neutral-500 mt-3">VAT included</p>
                    </div>
                  </div>

                  <div className="h-px w-full bg-[repeating-linear-gradient(to_right,#d4d4d4_0_10px,transparent_10px_18px)]" />
                  {/* Promo code */}
                  <div>
                    {appliedPromo ? (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Tag size={14} className="text-emerald-600" />
                          <span className="text-[13px] font-bold text-emerald-700 uppercase tracking-wider">
                            {appliedPromo.discount.code}
                          </span>
                        </div>
                        <button
                          onClick={handleRemovePromo}
                          className="text-[12px] font-semibold text-emerald-600 hover:text-red-500 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        {!showPromoInput ? (
                          <button
                            onClick={() => setShowPromoInput(true)}
                            className="flex items-center gap-2 text-[15px] text-neutral-400 hover:text-[#F27318] transition-colors w-full py-2"
                          >
                            <Tag size={14} />
                            Have a promo code?
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                              placeholder="Enter code"
                              className="flex-1 px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-[14px] focus:outline-none focus:border-[#F27318] transition-all"
                              autoFocus
                            />
                            <button
                              onClick={handleApplyPromo}
                              disabled={applyDiscountMutation.isPending}
                              className="px-4 py-2.5 bg-[#F27318] hover:bg-[#cd5704] text-white rounded-md text-[13px] font-bold transition-all disabled:opacity-50 shrink-0"
                            >
                              {applyDiscountMutation.isPending ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                "Apply"
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Back button — hidden on ShippingStep (step 1), visible on PaymentStep (step 2) */}
                  <div className="flex items-center gap-3">
                    {currentStep === 2 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="h-12 px-4 shrink-0 rounded-xl border border-neutral-200 text-[15px] font-medium text-neutral-600 hover:bg-neutral-50 hover:text-[#1A1714] transition-colors flex items-center gap-1.5"
                      >
                        <ChevronLeft size={16} />
                        Back
                      </button>
                    )}
                    <button
                      onClick={() => {
                        currentStep === 1 ? handleGoToPayment() : handlePlaceOrder();
                      }}
                      disabled={isSubmitting || selectedCartItems.length === 0}
                      className="flex-1 bg-[#F27318] hover:bg-[#cd5704] text-white h-12 rounded-xl font-medium text-[15px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 group"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <Loader2 size={18} className="animate-spin" />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <>
                          {currentStep === 1 ? "Next: Payment" : "Place Order"}
                          <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}