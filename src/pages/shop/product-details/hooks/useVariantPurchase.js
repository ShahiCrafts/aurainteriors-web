import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  findVariantBySelection,
  defaultVariantSelection,
  variantAvailableCount,
  isVariantPurchasable,
  variantOptionsObject,
} from "../../../../utils/variantSelection";
import { useAddToCart } from "../../../../hooks/cart/useCartTan";
import useAuthStore from "../../../../store/authStore";
import { useShallow } from "zustand/react/shallow";
import useGuestCartStore from "../../../../store/guestCartStore";
import { toast } from "../../../../lib/toast";

// Phase 7 split (from ProductDetailsPage.jsx) — the purchase state
// machine: variant/colour/quantity selection state, the selected
// variant derivation, stock/price derivation, and the add-to-cart +
// buy-now handlers for both guest and authenticated paths. Extracted
// verbatim; the page's per-product reset of the gallery image stays
// in the page (it owns the gallery state).
export default function useVariantPurchase(product) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore(useShallow((state) => ({ isAuthenticated: state.isAuthenticated })));

  const [selectedColor, setSelectedColor] = useState(null);
  const [variantSelection, setVariantSelection] = useState({});
  const [quantity, setQuantity] = useState(1);

  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();
  const { addItem: addToGuestCart } = useGuestCartStore(useShallow((state) => ({ addItem: state.addItem })));

  // FE-22: stock is nullish-checked, never `|| 10` — a stock of 0 is a
  // real value (out of stock), not a missing one.
  const stock = product?.stock ?? 0;

  // Phase 7 (catalog): variant products are driven by the selected
  // catalog variant — its price, stock, gallery and AR model — and
  // cart lines name it by variantId (+ sku). The catalog schema
  // supplies the option-group + specification labels.
  const isVariantProduct =
    !!product && product.hasVariants === true && (product.catalogVariants?.length ?? 0) > 0;
  const selectedVariant = isVariantProduct
    ? findVariantBySelection(product, variantSelection)
    : null;
  const displayStock = isVariantProduct
    ? selectedVariant
      ? variantAvailableCount(selectedVariant)
      : 0
    : stock;
  const isOutOfStock =
    !!product &&
    (isVariantProduct ? !isVariantPurchasable(selectedVariant) : stock <= 0);
  const displayPrice = selectedVariant?.price ?? product?.price;
  const displayCompareAt = selectedVariant
    ? selectedVariant.compareAtPrice > selectedVariant.price
      ? selectedVariant.compareAtPrice
      : null
    : product?.originalPrice;

  const getDiscount = () => {
    // Phase 7: the discount follows the DISPLAYED price pair —
    // the selected variant's price/compareAt for variant products,
    // the product's price/originalPrice otherwise.
    if (displayCompareAt && displayPrice) {
      const discount = Math.round(((displayCompareAt - displayPrice) / displayCompareAt) * 100);
      return discount > 0 ? discount : null;
    }
    return null;
  };
  const discount = getDiscount();

  const buildVariant = () => {
    const variant = {};
    if (selectedColor) variant.color = typeof selectedColor === "object" ? selectedColor.name : selectedColor;
    return variant;
  };

  // The add payload for the current product state: variant
  // products send variantId + sku (the legacy triple stays empty —
  // the server stores {} for variant lines); legacy products send
  // exactly the payload they always have.
  const buildAddPayload = () => {
    if (isVariantProduct) {
      return {
        auth: {
          productId: product._id,
          quantity,
          variant: {},
          variantId: selectedVariant._id,
          sku: selectedVariant.sku,
        },
        guestMeta: {
          variantId: selectedVariant._id,
          sku: selectedVariant.sku,
          unitPrice: selectedVariant.price,
          options: variantOptionsObject(selectedVariant),
        },
      };
    }
    return { auth: { productId: product._id, quantity, variant: buildVariant() }, guestMeta: null };
  };

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;
    if (isVariantProduct && !selectedVariant) {
      toast.error("Please select all options");
      return;
    }
    const payload = buildAddPayload();

    if (!isAuthenticated) {
      // Legacy guest lines keep the exact 3-argument call (FE-22);
      // the variant meta rides along only for variant products.
      if (payload.guestMeta) {
        addToGuestCart(product, quantity, payload.auth.variant, payload.guestMeta);
      } else {
        addToGuestCart(product, quantity, payload.auth.variant);
      }
      toast.success("Added to cart");
      setQuantity(1);
      return;
    }

    addToCart(payload.auth, {
      onSuccess: () => {
        toast.success("Added to cart");
        setQuantity(1);
      },
      // FE-47: no per-call onError — the cart hook reports errors.
    });
  };

  // FE-22: Buy Now is an express path — add the item, then go straight
  // to checkout. Navigation happens only once the add has succeeded
  // (for signed-in users, in the mutation's onSuccess).
  const handleBuyNow = () => {
    if (!product || isOutOfStock) return;
    if (isVariantProduct && !selectedVariant) {
      toast.error("Please select all options");
      return;
    }
    const payload = buildAddPayload();

    if (!isAuthenticated) {
      if (payload.guestMeta) {
        addToGuestCart(product, quantity, payload.auth.variant, payload.guestMeta);
      } else {
        addToGuestCart(product, quantity, payload.auth.variant);
      }
      navigate("/checkout");
      return;
    }

    addToCart(payload.auth, {
      onSuccess: () => navigate("/checkout"),
      // FE-47: no per-call onError — the cart hook reports errors.
    });
  };

  // FE-22: navigating to another product reuses this component with a
  // new route param — reset every per-product selection so the previous
  // product's colour/image/quantity can never leak into the next
  // product's cart variant. Keyed on the product id, not the product
  // object, so refetches of the SAME product do not wipe a selection.
  // (The page's own effect resets the gallery image on the same key.)
  useEffect(() => {
    if (!product?._id) return;
    setSelectedColor(product.colors?.length > 0 ? product.colors[0] : null);
    // Phase 7: variant products land on a real, purchasable
    // combination (never a partial selection).
    setVariantSelection(
      product.hasVariants === true ? defaultVariantSelection(product) : {}
    );
    setQuantity(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id]);

  return {
    isAuthenticated,
    selectedColor,
    setSelectedColor,
    variantSelection,
    setVariantSelection,
    quantity,
    setQuantity,
    isAddingToCart,
    stock,
    isVariantProduct,
    selectedVariant,
    displayStock,
    isOutOfStock,
    displayPrice,
    displayCompareAt,
    discount,
    handleAddToCart,
    handleBuyNow,
  };
}
