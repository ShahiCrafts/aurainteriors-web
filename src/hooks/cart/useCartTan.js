import useAuthStore from "../../store/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "../../lib/toast";
import cartApi from "../../api/cartApi";
import formatError from "../../utils/errorHandler";
import { cartKeys } from "../queryKeys";

const CART_KEYS = cartKeys;

const makeCartErrorHandler = (queryClient) => (error) => {
  if (error?.response?.status === 409) {
    const code = error?.response?.data?.code;
    const message = error?.response?.data?.message || "";
    const isVariantError =
      (typeof code === "string" && code.startsWith("VARIANT_")) ||
      /variant/i.test(message);
    if (!isVariantError) {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
      toast.error("cart changed, refreshed");
      return;
    }
  }
  toast.error(formatError(error));
};

// Perceived-speed fix (same pattern as the wishlist): cart mutations
// used to change NOTHING on screen until the server responded AND a
// second GET /cart refetch completed, so add/remove/quantity lagged
// a full two round-trips behind the click on production. Now:
//  - onMutate applies the change to the cached cart immediately
//    (badge, drawer lines, totals move with the click) and snapshots
//    the cache for rollback;
//  - onSuccess writes the server's response straight into the cache —
//    every cart endpoint already returns the full updated cart, so
//    the old invalidate-and-refetch round-trip is gone entirely;
//  - onError restores the snapshot verbatim, then runs the existing
//    error handling (409 conflict refresh / toast).
const variantKey = (variant) =>
  JSON.stringify(
    ["color", "size", "material"].map((key) => variant?.[key] || ""),
  );

// Mirror of the server's serializeCart totals: a variant line bills
// at its variantDetails price, every other line at product.price.
const withTotals = (cart) => {
  const items = cart.items || [];
  let subtotal = 0;
  let totalItems = 0;
  for (const item of items) {
    totalItems += item.quantity || 0;
    subtotal +=
      (item.variantDetails?.price ?? item.product?.price ?? 0) *
      (item.quantity || 0);
  }
  return { ...cart, items, totalItems, subtotal };
};

// Server-shaped variantDetails for an optimistic variant line, built
// from the caller's product snapshot when it carries the catalog.
const optimisticVariantDetails = (product, variantId) => {
  const variant = (product?.catalogVariants || []).find(
    (entry) => String(entry._id) === String(variantId),
  );
  if (!variant) return undefined;
  const options =
    variant.options instanceof Map
      ? Object.fromEntries(variant.options)
      : { ...(variant.options || {}) };
  return {
    sku: variant.sku,
    options,
    price: variant.price,
    ...(variant.compareAtPrice !== undefined &&
    variant.compareAtPrice !== null
      ? { compareAtPrice: variant.compareAtPrice }
      : {}),
    stock: variant.stock || 0,
    available:
      variant.enabled !== false &&
      (variant.stock || 0) - (variant.reservedStock || 0) > 0,
  };
};

// The server's line-matching rule (cart.controller addToCart): a
// variant line merges by variantId; a legacy line merges when it has
// no variantId and the {color,size,material} triple matches.
const sameLine = (item, { productId, variantId, variant }) => {
  if (String(item.product?._id ?? item.product) !== String(productId))
    return false;
  if (variantId) return String(item.variantId || "") === String(variantId);
  return !item.variantId && variantKey(item.variant) === variantKey(variant);
};

const applyOptimisticCartChange = (cart, change) => {
  if (!cart) return cart;
  const items = [...(cart.items || [])];
  if (change.type === "clear") {
    return withTotals({ ...cart, items: [] });
  }
  if (change.type === "remove") {
    return withTotals({
      ...cart,
      items: items.filter((item) => String(item._id) !== String(change.itemId)),
    });
  }
  if (change.type === "update") {
    return withTotals({
      ...cart,
      items: items.map((item) =>
        String(item._id) === String(change.itemId)
          ? { ...item, quantity: change.quantity }
          : item,
      ),
    });
  }
  // add: merge into the matching line, or append a new one when the
  // caller supplied a product snapshot to render it with. Without a
  // snapshot a brand-new line cannot be drawn yet — it appears when
  // the server cart lands in onSuccess (still one round-trip faster
  // than the old invalidate + refetch).
  const index = items.findIndex((item) => sameLine(item, change));
  if (index > -1) {
    items[index] = {
      ...items[index],
      quantity: items[index].quantity + change.quantity,
    };
  } else if (change.product) {
    const details = change.variantId
      ? optimisticVariantDetails(change.product, change.variantId)
      : undefined;
    items.push({
      _id: `optimistic-${change.productId}-${change.variantId || variantKey(change.variant)}`,
      product: change.product,
      quantity: change.quantity,
      variant: change.variantId ? {} : change.variant || {},
      ...(change.variantId
        ? { variantId: change.variantId, sku: change.sku }
        : {}),
      ...(details ? { variantDetails: details } : {}),
      addedAt: new Date().toISOString(),
      optimistic: true,
    });
  }
  return withTotals({ ...cart, items });
};

const cartMutation = (queryClient, mutationFn, toChange) => ({
  mutationFn,
  onMutate: async (variable) => {
    const userId = useAuthStore.getState().user?._id;
    if (!userId) return { userId };
    const listKey = CART_KEYS.list(userId);
    await queryClient.cancelQueries({ queryKey: listKey });
    const previous = queryClient.getQueryData(listKey);
    const change = toChange(variable);
    if (change && previous?.data?.cart) {
      queryClient.setQueryData(listKey, {
        ...previous,
        data: {
          ...previous.data,
          cart: applyOptimisticCartChange(previous.data.cart, change),
        },
      });
    }
    return { userId, previous };
  },
  onSuccess: (response, _variable, context) => {
    // Never write into a different account's cache after a switch.
    const currentUserId = useAuthStore.getState().user?._id;
    if (context?.userId && context.userId !== currentUserId) return;
    const targetUserId = context?.userId || currentUserId;
    if (targetUserId && response?.data?.cart) {
      // The endpoints return the full updated cart — write it
      // straight into the cache instead of refetching it.
      queryClient.setQueryData(CART_KEYS.list(targetUserId), response);
    } else {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
    }
  },
  onError: (error, _variable, context) => {
    if (context?.userId && context.previous !== undefined) {
      if (context.userId === useAuthStore.getState().user?._id) {
        queryClient.setQueryData(
          CART_KEYS.list(context.userId),
          context.previous,
        );
      }
    }
    makeCartErrorHandler(queryClient)(error);
  },
});

export const useCart = (options = {}) => {
  const userId = useAuthStore((state) => state.user?._id);
  return useQuery({
    queryKey: CART_KEYS.list(userId),
    queryFn: () => cartApi.getCart(),
    ...options,
    enabled: !!userId && options.enabled !== false,
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation(
    cartMutation(
      queryClient,
      // `product` is a caller-side snapshot for the optimistic line
      // only; cartApi picks the fields it sends to the server.
      (variable) => cartApi.addToCart(variable),
      (variable) => ({
        type: "add",
        productId: variable?.productId ?? variable?.product?._id,
        quantity: variable?.quantity ?? 1,
        variant: variable?.variant ?? {},
        variantId: variable?.variantId,
        sku: variable?.sku,
        product: variable?.product,
      }),
    ),
  );
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation(
    cartMutation(
      queryClient,
      (variable) => cartApi.updateCartItem(variable),
      (variable) => ({
        type: "update",
        itemId: variable?.itemId,
        quantity: variable?.quantity,
      }),
    ),
  );
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation(
    cartMutation(
      queryClient,
      (variable) => cartApi.removeFromCart(variable),
      (variable) => ({ type: "remove", itemId: variable }),
    ),
  );
};

export const useClearCart = () => {
  const queryClient = useQueryClient();

  return useMutation(
    cartMutation(queryClient, () => cartApi.clearCart(), () => ({
      type: "clear",
    })),
  );
};
