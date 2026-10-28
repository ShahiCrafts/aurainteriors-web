import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useCheckoutStore from "../../store/checkoutStore";
import { useShallow } from "zustand/react/shallow";
import useAuthStore from "../../store/authStore";
import useGuestCartStore from "../../store/guestCartStore";
import useBuyNowStore from "../../store/buyNowStore";
import { useDefaultAddress } from "../../hooks/profile/useAddressTan";
import {
  useCart,
  useUpdateCartItem,
  useRemoveFromCart,
} from "../../hooks/cart/useCartTan";
import { usePreviewDiscount } from "../../hooks/admin/useDiscountTan";
import { useGuestCheckout, useCheckout } from "../../hooks/order/useOrderTan";
import { useCheckoutTotals } from "../../hooks/useCheckoutTotals";
import { useShippingFormSync } from "../../hooks/useShippingFormSync";
import Navbar from "../../layouts/customer/Navbar";
import Footer from "../../layouts/customer/Footer";
import ShippingStep from "../../components/checkout/ShippingStep";
import OrderSummary from "../../components/checkout/OrderSummary";
import QuantitySelector from "../../components/ui/QuantitySelector";
import PaymentStep from "../../components/checkout/PaymentStep";
import { toast } from "../../lib/toast";
import {
  ChevronLeft,
  Minus,
  Trash2,
  Tag,
  Check,
  ChevronRight,
} from "lucide-react";
import Skeleton from "../../components/common/Skeleton";
import { getProductImageUrl } from "../../utils/imageUrl";
import ImageWithFallback from "../../components/fallbacks/ImageWithFallback";
import VariantLineSummary from "../../components/cart/VariantLineSummary";
import { variantSummaryProps, lineUnitPrice } from "../../utils/cartLine";
import formatError from "../../utils/errorHandler";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { shippingSchema } from "../../utils/validationSchemas";
import { formatNPR } from "../../utils/formatCurrency";

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
  const { isAuthenticated, user } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      user: state.user,
    })),
  );
  const {
    guestInfo,
    setGuestInfo,
    shippingAddress,
    shippingAddressId,
    setShippingAddress,
    setShippingAddressId,
    appliedDiscount,
    setAppliedDiscount,
    clearDiscount,
    paymentMethod,
    setPaymentMethod,
    currentStep,
    nextStep,
    prevStep,
    setStep,
    getGuestCheckoutData,
    getAuthenticatedCheckoutData,
    reset,
  } = useCheckoutStore(
    useShallow((state) => ({
      guestInfo: state.guestInfo,
      setGuestInfo: state.setGuestInfo,
      shippingAddress: state.shippingAddress,
      shippingAddressId: state.shippingAddressId,
      setShippingAddress: state.setShippingAddress,
      setShippingAddressId: state.setShippingAddressId,
      appliedDiscount: state.appliedDiscount,
      setAppliedDiscount: state.setAppliedDiscount,
      clearDiscount: state.clearDiscount,
      paymentMethod: state.paymentMethod,
      setPaymentMethod: state.setPaymentMethod,
      currentStep: state.currentStep,
      nextStep: state.nextStep,
      prevStep: state.prevStep,
      setStep: state.setStep,
      getGuestCheckoutData: state.getGuestCheckoutData,
      getAuthenticatedCheckoutData: state.getAuthenticatedCheckoutData,
      reset: state.reset,
    })),
  );

  // Buy-now mode: a direct checkout for the buy-now line only. The
  // cart is not even fetched in this mode — nothing in it is listed,
  // ordered or removed by a buy-now checkout.
  const { buyNowItem, updateBuyNowQuantity, clearBuyNowItem } = useBuyNowStore(
    useShallow((state) => ({
      buyNowItem: state.item,
      updateBuyNowQuantity: state.updateQuantity,
      clearBuyNowItem: state.clearItem,
    })),
  );
  const isBuyNow = !!buyNowItem;

  const { data: cartData, isLoading: isCartLoading } = useCart({
    enabled: isAuthenticated && !isBuyNow,
  });

  const { guestCartItems, updateGuestCartQuantity, removeGuestCartItem } =
    useGuestCartStore(
      useShallow((state) => ({
        guestCartItems: state.items,
        updateGuestCartQuantity: state.updateItemQuantity,
        removeGuestCartItem: state.removeItem,
      })),
    );

  const { mutate: updateCartItem, isPending: isUpdating } = useUpdateCartItem();
  const { mutate: removeFromCart, isPending: isRemoving } = useRemoveFromCart();
  const applyDiscountMutation = usePreviewDiscount();
  const guestCheckoutMutation = useGuestCheckout();
  const authenticatedCheckoutMutation = useCheckout();
  const { defaultAddress } = useDefaultAddress();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [promoCode, setPromoCode] = useState("");
  const appliedPromo = appliedDiscount ? { discount: appliedDiscount } : null;
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

  const {
    reset: resetForm,
    handleSubmit: handleFormSubmit,
    watch,
    setValue,
  } = methods;

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
  // Memoized: the selection effect below keys off this array's
  // identity — a fresh [buyNowItem] literal every render would
  // re-run it (and its setState) forever.
  const cartItems = useMemo(
    () =>
      isBuyNow
        ? [buyNowItem]
        : isAuthenticated
          ? cart?.items || []
          : guestCartItems,
    [isBuyNow, buyNowItem, isAuthenticated, cart, guestCartItems],
  );

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

  const allSelected =
    cartItems.length > 0 && selectedCartItems.length === cartItems.length;
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
    setSelectedItemIds(
      allSelected ? new Set() : new Set(cartItems.map((item) => item._id)),
    );
  };

  // Phase 6 (REUSE-010): the totals arithmetic lives in
  // hooks/useCheckoutTotals — characterization-tested bit-for-bit
  // (a variant line prices at its variant, never the product scalar).
  const { subtotal, promoDiscount, shippingCost, taxAmount, total } =
    useCheckoutTotals(selectedCartItems, appliedDiscount);

  const getImageUrl = (product) => getProductImageUrl(product);

  useEffect(() => {
    reset(); // Reset checkout state when entering checkout page to pull latest defaults
    setStep(1);
    setPaymentMethod("cod");
  }, []);

  // Phase 6 (REUSE-013): account/default-address -> form sync
  // lives in hooks/useShippingFormSync (effects moved verbatim).
  useShippingFormSync({
    isAuthenticated,
    user,
    defaultAddress,
    shippingAddress,
    shippingAddressId,
    setGuestInfo,
    setShippingAddress,
    setShippingAddressId,
    resetForm,
    setValue,
  });

  // Set when the shopper removes the buy-now line: that exit goes
  // back to the product, not through the empty-cart redirect below.
  const buyNowExitRef = useRef(false);

  useEffect(() => {
    if (isSubmitting) return;
    if (buyNowExitRef.current) return;
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
    if (isBuyNow) {
      updateBuyNowQuantity(newQuantity);
      return;
    }
    if (!isAuthenticated) {
      updateGuestCartQuantity(itemId, newQuantity);
      return;
    }
    // FE-47: cart errors are reported by the cart hook itself.
    updateCartItem({ itemId, quantity: newQuantity });
  };

  const handleRemoveItem = (itemId) => {
    if (isBuyNow) {
      // Removing the only line ends the direct checkout — back to
      // the product page. The cart (if any) is untouched.
      buyNowExitRef.current = true;
      const slug = buyNowItem.product?.slug;
      clearBuyNowItem();
      toast.success("Item removed");
      navigate(slug ? `/product/${encodeURIComponent(slug)}` : "/shop");
      return;
    }
    if (!isAuthenticated) {
      removeGuestCartItem(itemId);
      toast.success("Item removed");
      return;
    }
    removeFromCart(itemId, {
      onSuccess: () => toast.success("Item removed"),
      // FE-47: no per-call onError — the cart hook reports errors.
    });
  };

  // The selected lines as a direct-items payload ({ productId,
  // quantity, variant, variantId?, sku? }): what guest checkout has
  // always sent, what buy-now checkout sends for signed-in users
  // too, and what promo preview accepts when there is no cart line
  // to reference. Variant lines name their exact variant so the
  // server revalidates and prices that variant.
  const directItemsPayload = () =>
    selectedCartItems.map((item) => ({
      productId: item.product._id,
      quantity: item.quantity,
      variant: item.variant || {},
      ...(item.variantId ? { variantId: item.variantId, sku: item.sku } : {}),
    }));

  const promoSelectionKey = JSON.stringify(
    selectedCartItems.map((item) => [
      item._id,
      item.quantity,
      item.product?.price,
      item.variant,
    ]),
  );
  const promoRequestRef = useRef(0);
  const promoSelectionRef = useRef(promoSelectionKey);
  promoSelectionRef.current = promoSelectionKey;
  const previousPromoSelectionRef = useRef(promoSelectionKey);
  useEffect(() => {
    if (previousPromoSelectionRef.current !== promoSelectionKey) {
      promoRequestRef.current += 1;
      clearDiscount();
    }
    previousPromoSelectionRef.current = promoSelectionKey;
  }, [promoSelectionKey, clearDiscount]);

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promo code");
      return;
    }
    if (!selectedCartItems.length) {
      toast.error("Select items before applying a promo");
      return;
    }
    const selectionKey = promoSelectionKey;
    const requestId = ++promoRequestRef.current;
    // Cart checkout (signed-in) previews by cart-line id; guest and
    // buy-now checkouts preview by the items themselves — a buy-now
    // line has no cart line to reference.
    const preview =
      isAuthenticated && !isBuyNow
        ? {
            code: promoCode,
            selectedItemIds: selectedCartItems.map((item) => item._id),
          }
        : { code: promoCode, items: directItemsPayload() };
    applyDiscountMutation.mutate(preview, {
      onSuccess: (data) => {
        if (
          promoRequestRef.current !== requestId ||
          promoSelectionRef.current !== selectionKey
        )
          return;
        setAppliedDiscount(data.data.discount);
        setPromoCode("");
        setShowPromoInput(false);
        toast.success("Promo code applied!");
      },
      onError: (err) => {
        if (
          promoRequestRef.current === requestId &&
          promoSelectionRef.current === selectionKey
        )
          toast.error(formatError(err, "Invalid promo code"));
      },
    });
  };

  const handleRemovePromo = () => {
    promoRequestRef.current += 1;
    clearDiscount();
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

    const currentShippingAddressId =
      useCheckoutStore.getState().shippingAddressId;
    if (currentShippingAddressId) {
      nextStep();
      return;
    }

    toast.error("Please select a shipping address to proceed.");
  };

  const checkoutAttempt = useRef(null);
  const keyedCheckout = (payload) => {
    const fingerprint = JSON.stringify(payload);
    if (checkoutAttempt.current?.fingerprint !== fingerprint) {
      checkoutAttempt.current = { fingerprint, key: crypto.randomUUID() };
    }
    return { ...payload, idempotencyKey: checkoutAttempt.current.key };
  };
  const handlePlaceOrder = async () => {
    if (submittingRef.current) return;
    if (!ensureItemsSelected()) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      let result;
      if (isAuthenticated) {
        result = await authenticatedCheckoutMutation.mutateAsync(
          keyedCheckout(
            isBuyNow
              ? // Buy Now: order this line directly from its items —
                // the server cart is neither read nor cleared.
                getAuthenticatedCheckoutData({ items: directItemsPayload() })
              : getAuthenticatedCheckoutData(
                  selectedCartItems.map((item) => item._id),
                ),
          ),
        );
      } else {
        result = await guestCheckoutMutation.mutateAsync(
          keyedCheckout(getGuestCheckoutData(directItemsPayload())),
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
      if (isBuyNow) {
        // The ordered line was never in a cart — just end the
        // direct checkout. Any real cart items stay exactly as
        // they were.
        clearBuyNowItem();
      } else if (!isAuthenticated) {
        selectedCartItems.forEach((item) => removeGuestCartItem(item._id));
      }
      reset();
      navigate(
        `/order-confirmation/${encodeURIComponent(order.orderId)}?email=${encodeURIComponent(
          order.email || guestInfo.email,
        )}&emailSent=${encodeURIComponent(result.data?.emailSent ? "true" : "false")}`,
      );
    } catch (error) {
      toast.error(formatError(error, "Failed to place order"));
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated && !isBuyNow && isCartLoading) {
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
                          currentStep === n
                            ? "text-[#1A1714]"
                            : "text-neutral-500"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {i === 0 && (
                      <div
                        className={`h-px w-10 ${currentStep > 1 ? "bg-[#F27318]/40" : "bg-neutral-200"}`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                {/* Item Review Section */}
                <div>
                  <div className="flex justify-between items-end mb-5">
                    <div className="flex items-center gap-3">
                      <h2 className="text-[20px] font-semibold text-[#1A1714] font-dm-sans">
                        Review your items
                      </h2>
                      {isBuyNow && (
                        <span className="bg-[#F27318]/[0.08] text-[#F27318] px-2.5 py-1 rounded text-[12px] font-bold uppercase tracking-wide">
                          Buy Now · this item only
                        </span>
                      )}
                    </div>
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
                                <ImageWithFallback
                                  src={getImageUrl(item.product)}
                                  alt={item.product?.name}
                                  loading="lazy"
                                  width={64}
                                  height={64}
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
                                {variantSummaryProps(item) && (
                                  <VariantLineSummary
                                    {...variantSummaryProps(item)}
                                    className="text-[13px] text-neutral-400 mt-0.5"
                                  />
                                )}
                              </div>
                            </div>

                            {/* Qty — Phase 6 (REUSE-010): shared
                                QuantitySelector; same per-click update
                                path and the same clamps (min 1, disabled
                                while an update is pending). */}
                            <div className="flex justify-center">
                              <QuantitySelector
                                size="sm"
                                value={item.quantity}
                                onChange={(next) =>
                                  handleUpdateQuantity(item._id, next)
                                }
                                disabled={isUpdating}
                              />
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <p className="text-[16px] font-bold text-[#1A1714]">
                                {formatNPR(lineUnitPrice(item) * item.quantity)}
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

          {/* Right Side: Order Summary (Sidepanel) — Phase 6
              (REUSE-010): the panel is components/checkout/
              OrderSummary; the promo block and CTA stay here as its
              children so their order in the panel is unchanged. */}
          <OrderSummary
            itemCount={selectedCartItems.length}
            subtotal={subtotal}
            promoDiscount={promoDiscount}
            shippingCost={shippingCost}
            taxAmount={taxAmount}
            total={total}
          >
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
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleApplyPromo()
                        }
                        placeholder="Enter code"
                        className="flex-1 px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-[14px] focus:outline-none focus:border-[#F27318] transition-all"
                        autoFocus
                      />
                      <button
                        onClick={handleApplyPromo}
                        disabled={applyDiscountMutation.isPending}
                        className="px-4 py-2.5 bg-[#F27318] hover:bg-[#cd5704] text-white rounded-md text-[13px] font-bold transition-all disabled:opacity-50 shrink-0"
                      >
                        {"Apply"}
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
                  <span>Processing...</span>
                ) : (
                  <>
                    {currentStep === 1 ? "Next: Payment" : "Place Order"}
                    <ChevronRight
                      size={18}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </>
                )}
              </button>
            </div>
          </OrderSummary>
        </div>
      </main>
      <Footer />
    </>
  );
}
