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

// Capture the account at request start; only update data after server success.
const mutationContext = (queryClient) => async () => {
  const userId = useAuthStore.getState().user?._id || "guest";
  await queryClient.cancelQueries({
    queryKey: [...WISHLIST_KEYS.all, "list", userId],
  });
  await queryClient.cancelQueries({
    queryKey: [...WISHLIST_KEYS.all, "check"],
  });
  return { userId };
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
    mutationFn: (productId) => wishlistApi.addToWishlist(productId),
    onMutate: mutationContext(queryClient),
    onSuccess: (response, productId, context) =>
      applyConfirmedChange(queryClient, response, productId, context),
  });
};

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId) => wishlistApi.removeFromWishlist(productId),
    onMutate: mutationContext(queryClient),
    onSuccess: (response, productId, context) =>
      applyConfirmedChange(queryClient, response, productId, context),
  });
};

export const useClearWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => wishlistApi.clearWishlist(),
    onMutate: mutationContext(queryClient),
    onSuccess: (response, _, context) =>
      applyConfirmedChange(queryClient, response, null, context, true),
  });
};
