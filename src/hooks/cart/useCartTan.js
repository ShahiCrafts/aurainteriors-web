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

  return useMutation({
    mutationFn: (data) => cartApi.addToCart(data),
    onSuccess: () => {
      // Refetch to sync with server (ensures accurate prices, images, etc.)
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
    },
    onError: makeCartErrorHandler(queryClient),
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => cartApi.updateCartItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
    },
    onError: makeCartErrorHandler(queryClient),
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId) => cartApi.removeFromCart(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
    },
    onError: makeCartErrorHandler(queryClient),
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cartApi.clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.all });
    },
    onError: makeCartErrorHandler(queryClient),
  });
};
