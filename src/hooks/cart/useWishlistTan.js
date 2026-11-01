import useAuthStore from "../../store/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import wishlistApi from "../../api/wishlistApi";

const WISHLIST_KEYS = {
  all: ["wishlist"],
  list: () => [
    ...WISHLIST_KEYS.all,
    "list",
    useAuthStore.getState().user?._id || "guest",
  ],
  check: (productId) => [
    ...WISHLIST_KEYS.all,
    "check",
    productId,
    useAuthStore.getState().user?._id || "guest",
  ],
};

export const useWishlist = (options = {}) => {
  const userId = useAuthStore((state) => state.user?._id);
  return useQuery({
    queryKey: [...WISHLIST_KEYS.all, "list", userId || "guest"],
    queryFn: () => wishlistApi.getWishlist(),
    staleTime: 5 * 60 * 1000,
    ...options,
    enabled: !!userId && options.enabled !== false,
  });
};

// Check if product is in wishlist
export const useCheckWishlist = (productId, options = {}) => {
  const userId = useAuthStore((state) => state.user?._id);
  return useQuery({
    queryKey: [...WISHLIST_KEYS.all, "check", productId, userId || "guest"],
    queryFn: () => wishlistApi.checkWishlist(productId),
    ...options,
    enabled: !!userId && !!productId && options.enabled !== false,
  });
};

// Capture the account at request start.
//
// Perceived-speed fix: wishlist toggles used to update NOTHING until
// the server responded, so on production (Render + Atlas round-trip)
// the heart/badge lagged noticeably behind the click. The mutations
// now apply an OPTIMISTIC update in onMutate — check queries flip,
// the list item appears/disappears, the count moves — and roll it
// back verbatim if the request fails. onSuccess still reconciles
// with the server's confirmed payload via applyConfirmedChange, so
// the cache ends in exactly the state it had before this change.
const normalizeVariable = (variable) =>
  typeof variable === "string" || typeof variable === "number"
    ? { productId: String(variable), product: undefined }
    : {
        productId: String(variable?.productId ?? variable?.product?._id ?? ""),
        product: variable?.product,
      };

const checkPredicate = (userId, productId, clear) => (query) =>
  query.queryKey[3] === userId &&
  (clear || String(query.queryKey[2]) === String(productId));

const applyOptimisticChange = (
  queryClient,
  { userId, productId, product, inWishlist, clear = false },
) => {
  const listKey = [...WISHLIST_KEYS.all, "list", userId];
  const previousList = queryClient.getQueryData(listKey);
  const previousChecks = queryClient.getQueriesData({
    queryKey: [...WISHLIST_KEYS.all, "check"],
    predicate: checkPredicate(userId, productId, clear),
  });

  queryClient.setQueriesData(
    {
      queryKey: [...WISHLIST_KEYS.all, "check"],
      predicate: checkPredicate(userId, productId, clear),
    },
    (old) =>
      old
        ? {
            ...old,
            data: { ...old.data, inWishlist: clear ? false : inWishlist },
          }
        : old,
  );

  queryClient.setQueryData(listKey, (old) => {
    if (!old?.data?.wishlist) return old;
    const previous = old.data.wishlist.items || [];
    const items = clear
      ? []
      : previous.filter(
          (entry) => String(entry.product?._id) !== String(productId),
        );
    if (inWishlist && !clear) {
      // Prefer the caller's product snapshot (card/PDP have it); the
      // placeholder is replaced by the server item in
      // applyConfirmedChange, which filters on product._id.
      items.push({
        _id: `optimistic-${productId}`,
        product: product || { _id: productId },
        addedAt: new Date().toISOString(),
        optimistic: true,
      });
    }
    return {
      ...old,
      data: {
        ...old.data,
        wishlist: { ...old.data.wishlist, items, itemCount: items.length },
      },
    };
  });

  return { userId, previousList, previousChecks };
};

const rollbackOptimisticChange = (queryClient, context) => {
  if (!context?.userId) return;
  // Never write into a different account's cache after a switch.
  if (context.userId !== (useAuthStore.getState().user?._id || "guest"))
    return;
  if (context.previousList !== undefined) {
    queryClient.setQueryData(
      [...WISHLIST_KEYS.all, "list", context.userId],
      context.previousList,
    );
  }
  for (const [queryKey, data] of context.previousChecks || []) {
    queryClient.setQueryData(queryKey, data);
  }
};

const optimisticContext =
  (queryClient, inWishlist, clear = false) =>
  async (variable) => {
    const userId = useAuthStore.getState().user?._id || "guest";
    await queryClient.cancelQueries({
      queryKey: [...WISHLIST_KEYS.all, "list", userId],
    });
    await queryClient.cancelQueries({
      queryKey: [...WISHLIST_KEYS.all, "check"],
    });
    const { productId, product } = normalizeVariable(variable);
    return applyOptimisticChange(queryClient, {
      userId,
      productId,
      product,
      inWishlist,
      clear,
    });
  };

const applyConfirmedChange = (
  queryClient,
  response,
  productId,
  context,
  clear = false,
) => {
  const userId = context?.userId;
  if (!userId || userId !== (useAuthStore.getState().user?._id || "guest"))
    return;
  const inWishlist = response?.data?.inWishlist === true;
  const item = response?.data?.item;
  // Older servers cannot supply the added item; retain a compatibility refetch.
  if (inWishlist && !item) {
    queryClient.invalidateQueries({
      queryKey: [...WISHLIST_KEYS.all, "list", userId],
    });
  } else {
    queryClient.setQueryData([...WISHLIST_KEYS.all, "list", userId], (old) => {
      if (!old?.data?.wishlist) return old;
      const previous = old.data.wishlist.items || [];
      const items = clear
        ? []
        : previous.filter(
            (entry) => String(entry.product?._id) !== String(productId),
          );
      if (inWishlist) items.push(item);
      return {
        ...old,
        data: {
          ...old.data,
          wishlist: { ...old.data.wishlist, items, itemCount: items.length },
        },
      };
    });
  }
  queryClient.setQueriesData(
    {
      queryKey: [...WISHLIST_KEYS.all, "check"],
      predicate: (query) =>
        query.queryKey[3] === userId &&
        (clear || String(query.queryKey[2]) === String(productId)),
    },
    (old) =>
      old
        ? {
            ...old,
            data: { ...old.data, inWishlist: clear ? false : inWishlist },
          }
        : old,
  );
};

export const useAddToWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variable) =>
      wishlistApi.addToWishlist(normalizeVariable(variable).productId),
    onMutate: optimisticContext(queryClient, true),
    onError: (_error, _variable, context) =>
      rollbackOptimisticChange(queryClient, context),
    onSuccess: (response, variable, context) =>
      applyConfirmedChange(
        queryClient,
        response,
        normalizeVariable(variable).productId,
        context,
      ),
  });
};

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variable) =>
      wishlistApi.removeFromWishlist(normalizeVariable(variable).productId),
    onMutate: optimisticContext(queryClient, false),
    onError: (_error, _variable, context) =>
      rollbackOptimisticChange(queryClient, context),
    onSuccess: (response, variable, context) =>
      applyConfirmedChange(
        queryClient,
        response,
        normalizeVariable(variable).productId,
        context,
      ),
  });
};

export const useClearWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => wishlistApi.clearWishlist(),
    onMutate: optimisticContext(queryClient, false, true),
    onError: (_error, _variable, context) =>
      rollbackOptimisticChange(queryClient, context),
    onSuccess: (response, _, context) =>
      applyConfirmedChange(queryClient, response, null, context, true),
  });
};
